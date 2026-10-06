import React, { useState, useEffect } from 'react';
import { Tournament, TournamentMatchAccess, TournamentStatus } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';
import { formatDateTime, statusLabel, formatRub } from '@/lib/format';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB, PRIZE_BY_PLACE } from '@/lib/constants';
import { GameIcon } from '@/components/GameIcons';
import { compressGameIconFile, compressGameWallpaperFile } from '@/lib/games';

type Props = {
  tournament: Tournament;
  initialMatch?: TournamentMatchAccess | null;
  initiallyExpanded?: boolean;
};

function toDateTimeLocal(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getInitialWinningPlacesCount(t: Tournament): number {
  if (typeof t.winningPlacesCount === 'number' && t.winningPlacesCount >= 1) {
    return t.winningPlacesCount;
  }
  const prizesObj = t.prizes || PRIZE_BY_PLACE;
  const nonZero = Object.keys(prizesObj)
    .map(Number)
    .filter((k) => !isNaN(k) && ((prizesObj as Record<number, number>)[k] ?? 0) > 0);
  if (nonZero.length > 0) {
    return Math.max(...nonZero);
  }
  return t.winnerPerPlayerRub ? 1 : 3;
}

export const AdminMatchForm: React.FC<Props> = ({
  tournament,
  initialMatch,
  initiallyExpanded = false,
}) => {
  const {
    updateMatch,
    updateTournament,
    updateTournamentStartsAt,
    deleteTournament,
    allGames,
    registrations,
  } = useTournaments();

  // Состояние развернутости формы
  const [isExpanded, setIsExpanded] = useState<boolean>(initiallyExpanded);
  const [activeTab, setActiveTab] = useState<'general' | 'prizes' | 'lobby' | 'media'>('general');

  // Основные параметры матча
  const [game, setGame] = useState(tournament.game);
  const [title, setTitle] = useState(tournament.title);
  const [format, setFormat] = useState(tournament.format);
  const [description, setDescription] = useState(tournament.description || '');
  const [startsAtLocal, setStartsAtLocal] = useState(() => toDateTimeLocal(tournament.startsAt));
  const [status, setStatus] = useState<TournamentStatus>(tournament.status);

  // Участники
  const [registeredCount, setRegisteredCount] = useState<number>(tournament.registeredCount || 0);
  const [maxPlayers, setMaxPlayers] = useState<number>(tournament.maxPlayers || 100);
  const [minPlayers, setMinPlayers] = useState<number>(tournament.minPlayers ?? 50);

  // Финансы и призовые места
  const [entryFeeRub, setEntryFeeRub] = useState<number>(tournament.entryFeeRub ?? ENTRY_FEE_RUB);
  const [prizePoolRub, setPrizePoolRub] = useState<number>(tournament.prizePoolRub ?? TOTAL_PRIZES_RUB);
  const [winningPlacesCount, setWinningPlacesCount] = useState<number>(() =>
    getInitialWinningPlacesCount(tournament)
  );
  const [prizesByPlace, setPrizesByPlace] = useState<Record<number, number>>(() => ({
    ...(tournament.prizes || PRIZE_BY_PLACE),
  }));

  // Дополнительные параметры
  const [isPremium, setIsPremium] = useState<boolean>(Boolean(tournament.isPremium));
  const [winner, setWinner] = useState<string>(tournament.winner || '');
  const [customIconUrl, setCustomIconUrl] = useState<string>(tournament.customIconUrl || '');
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(tournament.wallpaperUrl || '');

  // Данные лобби и трансляции
  const [roomId, setRoomId] = useState(initialMatch?.roomId || `NB_${tournament.game.toUpperCase()}_01`);
  const [password, setPassword] = useState(
    initialMatch?.password || 'NB' + Math.floor(1000 + Math.random() * 9000)
  );
  const [joinUrl, setJoinUrl] = useState(initialMatch?.joinUrl || '');
  const [streamUrl, setStreamUrl] = useState(tournament.streamUrl || initialMatch?.streamUrl || '');

  // Статусы сохранения
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [timeSaveSuccess, setTimeSaveSuccess] = useState(false);
  const [savedTime, setSavedTime] = useState(false);
  const [savedLobby, setSavedLobby] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quickSavedStatus, setQuickSavedStatus] = useState(false);

  // Список зарегистрированных участников этого матча
  const tournamentRegs = registrations.filter((r) => r.tournamentId === tournament.id);

  // Синхронизация при смене ID турнира (не сбрасывать данные во время редактирования каждые 4 секунды)
  useEffect(() => {
    setGame(tournament.game);
    setTitle(tournament.title);
    setFormat(tournament.format);
    setDescription(tournament.description || '');
    setStartsAtLocal(toDateTimeLocal(tournament.startsAt));
    setStatus(tournament.status);
    setRegisteredCount(tournament.registeredCount || 0);
    setMaxPlayers(tournament.maxPlayers || 100);
    setMinPlayers(tournament.minPlayers ?? 50);
    setEntryFeeRub(tournament.entryFeeRub ?? ENTRY_FEE_RUB);
    setPrizePoolRub(tournament.prizePoolRub ?? TOTAL_PRIZES_RUB);
    setWinningPlacesCount(getInitialWinningPlacesCount(tournament));
    setPrizesByPlace({ ...(tournament.prizes || PRIZE_BY_PLACE) });
    setIsPremium(Boolean(tournament.isPremium));
    setWinner(tournament.winner || '');
    setCustomIconUrl(tournament.customIconUrl || '');
    setWallpaperUrl(tournament.wallpaperUrl || '');
    setStreamUrl(tournament.streamUrl || initialMatch?.streamUrl || '');
  }, [tournament.id]);

  // Синхронизация времени старта, если оно обновилось из базы/контекста
  useEffect(() => {
    if (tournament.startsAt) {
      setStartsAtLocal(toDateTimeLocal(tournament.startsAt));
    }
  }, [tournament.startsAt]);

  useEffect(() => {
    if (initialMatch) {
      setRoomId(initialMatch.roomId);
      setPassword(initialMatch.password);
      setJoinUrl(initialMatch.joinUrl || '');
      if (initialMatch.streamUrl) setStreamUrl(initialMatch.streamUrl);
    }
  }, [initialMatch]);

  // Быстрое изменение статуса в 1 клик
  const handleQuickStatusChange = async (newStatus: TournamentStatus) => {
    setStatus(newStatus);
    setQuickSavedStatus(true);
    await updateTournament(tournament.id, { status: newStatus });
    setTimeout(() => setQuickSavedStatus(false), 2500);
  };

  // Быстрое сохранение победителя
  const handleQuickSaveWinner = async (newWinner: string) => {
    setWinner(newWinner);
    await updateTournament(tournament.id, { winner: newWinner.trim() });
    setSavedTime(true);
    setTimeout(() => setSavedTime(false), 2500);
  };

  // Изменение количества призовых мест
  const handleWinningPlacesCountChange = (newCountRaw: number) => {
    const newCount = Math.max(1, Math.min(20, newCountRaw || 1));
    setWinningPlacesCount(newCount);
    setPrizesByPlace((prev) => {
      const next: Record<number, number> = {};
      for (let i = 1; i <= newCount; i++) {
        next[i] = prev[i] ?? 0;
      }
      const sum = Object.values(next).reduce((acc, v) => acc + (Number(v) || 0), 0);
      if (sum > 0) {
        setPrizePoolRub(sum);
      }
      return next;
    });
  };

  // Изменение приза за конкретное место
  const handlePlacePrizeChange = (place: number, amount: number) => {
    const cleanVal = Math.max(0, Number(amount) || 0);
    setPrizesByPlace((prev) => {
      const next: Record<number, number> = { ...prev, [place]: cleanVal };
      let sum = 0;
      for (let i = 1; i <= winningPlacesCount; i++) {
        sum += Number(next[i]) || 0;
      }
      setPrizePoolRub(sum);
      return next;
    });
  };

  // Авто-распределение призового фонда
  const handleDistributePool = (totalPool: number, count = winningPlacesCount) => {
    const cleanTotal = Math.max(0, Number(totalPool) || 0);
    setPrizePoolRub(cleanTotal);
    if (count === 1) {
      setPrizesByPlace({ 1: cleanTotal });
      return;
    }
    if (count === 2) {
      const p1 = Math.round(cleanTotal * 0.65);
      setPrizesByPlace({ 1: p1, 2: cleanTotal - p1 });
      return;
    }
    if (count === 3) {
      const p1 = Math.round(cleanTotal * 0.5);
      const p2 = Math.round(cleanTotal * 0.3);
      setPrizesByPlace({ 1: p1, 2: p2, 3: cleanTotal - p1 - p2 });
      return;
    }
    const weights = Array.from({ length: count }, (_, i) => count - i);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const next: Record<number, number> = {};
    let allocated = 0;
    for (let i = 1; i <= count; i++) {
      if (i === count) {
        next[i] = Math.max(0, cleanTotal - allocated);
      } else {
        const share = Math.round((cleanTotal * weights[i - 1]) / totalWeight / 50) * 50;
        next[i] = share;
        allocated += share;
      }
    }
    setPrizesByPlace(next);
  };

  // Сохранение всех параметров матча
  const handleSaveMatchDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAtLocal) return;
    const isoStartsAt = new Date(startsAtLocal).toISOString();

    const cleanPrizes: Record<number, number> = {};
    for (let i = 1; i <= winningPlacesCount; i++) {
      cleanPrizes[i] = Number(prizesByPlace[i]) || 0;
    }

    const isTeam5v5 = (game === 'cs2' || game === 'dota2') && winningPlacesCount === 1;
    const winnerPerPlayer = isTeam5v5 ? Math.round((Number(prizePoolRub) || 0) / 5) : 0;

    setIsSaving(true);
    const ok = await updateTournament(tournament.id, {
      game,
      title: title.trim() || tournament.title,
      format: format.trim() || tournament.format,
      description: description.trim(),
      startsAt: isoStartsAt,
      status: status,
      maxPlayers: Math.max(2, Number(maxPlayers) || 10),
      minPlayers: Math.max(0, Number(minPlayers) || 0),
      registeredCount: Math.max(0, Number(registeredCount) || 0),
      entryFeeRub: Math.max(0, Number(entryFeeRub) || 0),
      prizePoolRub: Math.max(0, Number(prizePoolRub) || 0),
      winningPlacesCount: winningPlacesCount,
      prizes: cleanPrizes,
      winnerPerPlayerRub: winnerPerPlayer || undefined,
      streamUrl: streamUrl.trim() || undefined,
      winner: winner.trim() || undefined,
      customIconUrl: customIconUrl.trim() || undefined,
      wallpaperUrl: wallpaperUrl.trim() || undefined,
      isPremium: Boolean(isPremium),
    });
    setIsSaving(false);

    if (ok) {
      setSavedTime(true);
      setTimeout(() => setSavedTime(false), 3000);
    } else {
      alert('Ошибка при сохранении в базу данных. Попробуйте еще раз.');
    }
  };

  // Немедленное сохранение времени матча
  const handleApplyStartsAt = async (customIso?: string) => {
    const targetIso = customIso || (startsAtLocal ? new Date(startsAtLocal).toISOString() : null);
    if (!targetIso || isNaN(new Date(targetIso).getTime())) {
      alert('Укажите корректные дату и время');
      return;
    }
    setIsSavingTime(true);
    setStartsAtLocal(toDateTimeLocal(targetIso));
    const ok = await updateTournamentStartsAt(tournament.id, targetIso);
    setIsSavingTime(false);
    if (ok) {
      setTimeSaveSuccess(true);
      setTimeout(() => setTimeSaveSuccess(false), 3000);
    }
  };

  // Быстрые кнопки времени со мгновенным сохранением
  const handleAddHours = async (hoursToAdd: number) => {
    const base = startsAtLocal ? new Date(startsAtLocal) : new Date(tournament.startsAt || Date.now());
    const d = isNaN(base.getTime()) ? new Date() : new Date(base.getTime());
    d.setHours(d.getHours() + hoursToAdd);
    const iso = d.toISOString();
    await handleApplyStartsAt(iso);
  };

  const handleSetTimeTodayTomorrow = async (isTomorrow = false) => {
    const d = new Date();
    if (isTomorrow) d.setDate(d.getDate() + 1);
    d.setHours(20, 0, 0, 0);
    const iso = d.toISOString();
    await handleApplyStartsAt(iso);
  };

  // Сохранение доступов к лобби
  const handleSaveLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMatch(tournament.id, roomId, password, joinUrl, streamUrl);
    setSavedLobby(true);
    setTimeout(() => setSavedLobby(false), 3000);
  };

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить матч «${tournament.title}»?`)) {
      setIsDeleting(true);
      await deleteTournament(tournament.id);
    }
  };

  const generateRandomPassword = () => {
    const code = 'NB' + Math.floor(1000 + Math.random() * 9000);
    setPassword(code);
  };

  const fillPercent = Math.min(100, Math.round(((tournament.registeredCount || 0) / (tournament.maxPlayers || 100)) * 100));

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? 'border-cyan-500/50 bg-[#0c1018] shadow-2xl shadow-cyan-500/10'
          : status === 'finished'
          ? 'border-purple-500/30 bg-[#0e0c14] hover:border-purple-500/60'
          : status === 'live'
          ? 'border-red-500/40 bg-[#140b0d] hover:border-red-500/70'
          : 'border-white/10 bg-[#0b0e14] hover:border-cyan-500/30'
      }`}
    >
      {/* ===================== КОМПАКТНАЯ ШАПКА КАРТОЧКИ (ВСЕГДА ВИДНА) ===================== */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Левый блок: Иконка игры, название, дисциплина, дата */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-xl border border-white/15 bg-black/60 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              <GameIcon game={game} customIconUrl={customIconUrl} className="h-full w-full object-contain" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-400 font-mono tracking-wider">
                  {game}
                </span>

                {/* Статус матча */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold flex items-center gap-1.5 ${
                    status === 'live'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : status === 'finished'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : status === 'full'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : status === 'soon'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === 'live'
                        ? 'bg-red-400 animate-pulse'
                        : status === 'finished'
                        ? 'bg-purple-400'
                        : status === 'full'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  {statusLabel(status)}
                </span>

                {isPremium && (
                  <span className="rounded-md bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black text-amber-300">
                    ★ ПРЕМИУМ
                  </span>
                )}

                <span className="text-[11px] text-zinc-400 font-medium">
                  🕒 {formatDateTime(tournament.startsAt)}
                </span>
              </div>

              <h3 className="mt-1 font-black text-white text-base sm:text-lg truncate group-hover:text-cyan-300">
                {tournament.title}
              </h3>
            </div>
          </div>

          {/* Центральный блок: ПОБЕДИТЕЛЬ МАТЧА (ЕСЛИ ЕСТЬ ИЛИ МАТЧ ЗАВЕРШЕН) */}
          <div className="flex flex-wrap items-center gap-3">
            {winner ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-transparent px-3 py-1.5 shadow-md shadow-amber-500/15">
                <span className="text-base">🏆</span>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block leading-tight">
                    Победитель:
                  </span>
                  <span className="text-xs font-black text-white font-mono">
                    {winner}
                  </span>
                </div>
              </div>
            ) : status === 'finished' ? (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(true);
                  setActiveTab('prizes');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 transition"
              >
                <span>⚠️</span>
                <span>Указать победителя</span>
              </button>
            ) : null}

            {/* Метрики матча: Слоты и призовые */}
            <div className="hidden sm:flex items-center gap-3 text-xs bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
              <div>
                <span className="text-zinc-500 text-[10px] block">Слоты:</span>
                <span className="font-mono font-bold text-zinc-200">
                  {tournament.registeredCount} / {tournament.maxPlayers}
                </span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <span className="text-zinc-500 text-[10px] block">Призовой:</span>
                <span className="font-mono font-extrabold text-amber-300">
                  {formatRub(prizePoolRub)}
                </span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <span className="text-zinc-500 text-[10px] block">Взнос:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {formatRub(entryFeeRub)}
                </span>
              </div>
            </div>

            {/* Быстрый выбор статуса */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleQuickStatusChange('recruiting')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                  status === 'recruiting'
                    ? 'bg-emerald-500 text-black shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Перевести в статус 'Набор игроков'"
              >
                Набор
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatusChange('live')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                  status === 'live'
                    ? 'bg-red-500 text-white shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Перевести в статус 'Идет матч'"
              >
                В эфире
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatusChange('finished')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                  status === 'finished'
                    ? 'bg-purple-500 text-white shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Перевести в статус 'Завершено'"
              >
                Завершён
              </button>
            </div>

            {/* Кнопка раскрытия / сворачивания формы */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5 transition ${
                isExpanded
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              <span>⚙️</span>
              <span>{isExpanded ? 'Свернуть' : 'Настроить'}</span>
              <span>{isExpanded ? '▲' : '▼'}</span>
            </button>

            {/* Кнопка удаления */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 p-2 text-red-400 transition"
              title="Удалить турнир"
            >
              <span>🗑️</span>
            </button>
          </div>
        </div>

        {quickSavedStatus && (
          <div className="mt-2 text-right">
            <span className="text-[11px] font-bold text-emerald-400 animate-pulse">
              ✓ Статус моментально сохранён и отправлен игрокам!
            </span>
          </div>
        )}
      </div>

      {/* ===================== ПОЛНЫЙ РЕДАКТОР МАТЧА (КОГДА РАСКРЫТ) ===================== */}
      {isExpanded && (
        <div className="border-t border-white/10 bg-black/40 p-5 sm:p-6 space-y-6">
          
          {/* Навигационные табы редактора */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'general'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <span>⚙️</span>
              <span>Параметры и слоты</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prizes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'prizes'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <span>🏆</span>
              <span>Призовые и победитель</span>
              {winner && (
                <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[9px]">✓</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lobby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'lobby'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <span>🔑</span>
              <span>Доступы в лобби и стрим</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'media'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <span>🎨</span>
              <span>Иконка и обои матча</span>
            </button>
          </div>

          {/* ТАБ 1: ОСНОВНЫЕ ПАРАМЕТРЫ И СЛОТЫ */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveMatchDetails} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
                    Дисциплина / Игра:
                  </label>
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="input-field text-xs bg-zinc-900 border-white/15 text-white w-full font-bold"
                  >
                    {allGames.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.short})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
                    Название турнира:
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field text-xs font-bold text-white w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
                    Формат соревнования:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="5v5 BO1, Solo Hunger Games..."
                    className="input-field text-xs text-white w-full"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
                    Статус соревнования:
                  </label>
                  <select
                    className="input-field text-xs bg-zinc-900 border-white/10 text-white w-full font-bold"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                  >
                    <option value="recruiting">🟢 Набор игроков (recruiting)</option>
                    <option value="full">🟡 Заполнен (full)</option>
                    <option value="live">🔴 Идет матч (live)</option>
                    <option value="soon">⏳ Скоро (soon)</option>
                    <option value="finished">🏁 Завершено (finished)</option>
                  </select>
                </div>
              </div>

              {/* Время старта и быстрые пресеты */}
              <div className="bg-black/40 p-4 rounded-xl border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-amber-300 font-extrabold flex items-center gap-1.5">
                    <span>📅</span>
                    <span>Дата и время начала матча:</span>
                  </label>
                  {timeSaveSuccess && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md animate-fade-in">
                      ✓ Время сохранено!
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="datetime-local"
                    required
                    className="input-field text-xs font-mono font-bold text-white bg-black/70 border-amber-500/40 focus:border-amber-400 flex-1 py-2.5"
                    value={startsAtLocal}
                    onChange={(e) => setStartsAtLocal(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={isSavingTime}
                    onClick={() => handleApplyStartsAt()}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black shadow-md transition active:scale-95 whitespace-nowrap shrink-0 ${
                      timeSaveSuccess
                        ? 'bg-emerald-500 text-black shadow-emerald-500/25'
                        : 'bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black shadow-amber-400/25'
                    }`}
                  >
                    {isSavingTime ? 'Сохранение...' : timeSaveSuccess ? '✓ Сохранено!' : '💾 Сохранить время'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-zinc-400 font-bold">Быстро сдвинуть и сохранить:</span>
                  <button
                    type="button"
                    disabled={isSavingTime}
                    onClick={() => handleAddHours(1)}
                    className="rounded-lg bg-white/5 hover:bg-white/15 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:text-white border border-white/10 active:scale-95 transition"
                  >
                    +1 час
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTime}
                    onClick={() => handleAddHours(2)}
                    className="rounded-lg bg-white/5 hover:bg-white/15 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:text-white border border-white/10 active:scale-95 transition"
                  >
                    +2 часа
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTime}
                    onClick={() => handleAddHours(24)}
                    className="rounded-lg bg-white/5 hover:bg-white/15 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:text-white border border-white/10 active:scale-95 transition"
                  >
                    +1 день
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTime}
                    onClick={() => handleSetTimeTodayTomorrow(false)}
                    className="rounded-lg bg-amber-400/10 hover:bg-amber-400/25 px-2.5 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30 active:scale-95 transition"
                  >
                    Сегодня 20:00
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTime}
                    onClick={() => handleSetTimeTodayTomorrow(true)}
                    className="rounded-lg bg-amber-400/10 hover:bg-amber-400/25 px-2.5 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30 active:scale-95 transition"
                  >
                    Завтра 20:00
                  </button>
                </div>
              </div>

              {/* Слоты и игроки */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-[11px] text-emerald-400 font-semibold mb-1">
                    👤 Записано игроков:
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="input-field text-xs font-mono font-bold text-emerald-400 border-emerald-500/30 w-full"
                    value={registeredCount}
                    onChange={(e) => setRegisteredCount(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                    👥 Макс. мест (слотов):
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={500}
                    className="input-field text-xs font-mono font-bold text-white w-full"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-red-300 font-semibold mb-1">
                    🎯 Мин. игроков для старта:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    className="input-field text-xs font-mono font-bold text-red-300 border-red-500/30 w-full"
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Описание */}
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
                  Описание и регламент турнира:
                </label>
                <textarea
                  rows={4}
                  placeholder="Подробный регламент матча, правила лобби, условия участия и победы..."
                  className="input-field text-xs text-zinc-200 w-full resize-y font-sans leading-relaxed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs px-5 py-2.5 font-black transition shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSaving ? '⏳ Сохранение...' : '💾 Сохранить параметры матча'}
                </button>
                {savedTime && (
                  <span className="text-xs text-emerald-400 font-bold animate-pulse">
                    ✓ Изменения применены у всех пользователей!
                  </span>
                )}
              </div>
            </form>
          )}

          {/* ТАБ 2: ПРИЗОВЫЕ И ПОБЕДИТЕЛЬ МАТЧА */}
          {activeTab === 'prizes' && (
            <form onSubmit={handleSaveMatchDetails} className="space-y-4">
              
              {/* ВИДНЫЙ БЛОК: ПОБЕДИТЕЛЬ МАТЧА */}
              <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                        Итог матча и Победитель
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Укажите никнейм победителя или счет. Отображается на сайте в карточке матча.
                      </p>
                    </div>
                  </div>
                  {winner && (
                    <button
                      type="button"
                      onClick={() => handleQuickSaveWinner('')}
                      className="text-[11px] text-zinc-400 hover:text-red-400 transition"
                    >
                      Сбросить
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Например: s1mple, Team Spirit, xXx_Destroyer_xXx (15:8)"
                    className="input-field text-sm font-mono font-bold text-white bg-black/60 border-amber-400/50 focus:border-amber-400 flex-1"
                    value={winner}
                    onChange={(e) => setWinner(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickSaveWinner(winner)}
                    className="rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs px-4 py-2.5 font-black whitespace-nowrap shadow-md shadow-amber-400/20"
                  >
                    Сохранить победителя
                  </button>
                </div>

                {/* Быстрая подстановка из зарегистрированных участников */}
                {tournamentRegs.length > 0 && (
                  <div className="pt-2 border-t border-amber-500/20">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Кликните на никнейм участника для быстрой установки:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {tournamentRegs.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleQuickSaveWinner(r.nickname)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition ${
                            winner.toLowerCase() === r.nickname.toLowerCase()
                              ? 'bg-amber-400 text-black font-black'
                              : 'bg-white/10 hover:bg-white/20 text-zinc-300'
                          }`}
                        >
                          {r.nickname}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Финансы: Взнос и призовой фонд */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[11px] text-cyan-300 font-bold mb-1">
                    💳 Оргвзнос (₽):
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="input-field text-xs font-mono font-bold text-cyan-300 border-cyan-500/30 w-full"
                    value={entryFeeRub}
                    onChange={(e) => setEntryFeeRub(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-amber-300 font-bold mb-1">
                    🏆 Призовой фонд (₽):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="input-field text-xs font-mono font-extrabold text-amber-300 border-amber-500/40 flex-1 min-w-0"
                      value={prizePoolRub}
                      onChange={(e) => setPrizePoolRub(Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => handleDistributePool(prizePoolRub, winningPlacesCount)}
                      className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-2 text-[10px] font-bold text-amber-300 hover:bg-amber-500 hover:text-black transition"
                    >
                      Авто
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-300 font-bold mb-1">
                    🥇 Призовых мест:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleWinningPlacesCountChange(winningPlacesCount - 1)}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-extrabold text-zinc-300 hover:bg-white/15 shrink-0"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input-field text-center text-xs font-mono font-extrabold text-white flex-1 min-w-0"
                      value={winningPlacesCount}
                      onChange={(e) => handleWinningPlacesCountChange(Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => handleWinningPlacesCountChange(winningPlacesCount + 1)}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-extrabold text-zinc-300 hover:bg-white/15 shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Призы по местам */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                  Сумма призовых по местам (₽):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Array.from({ length: winningPlacesCount }, (_, idx) => idx + 1).map((place) => (
                    <div key={place} className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <label className="block text-[10px] font-bold text-zinc-300 mb-1">
                        {place === 1 ? '🥇 1 место' : place === 2 ? '🥈 2 место' : place === 3 ? '🥉 3 место' : `🏅 ${place} место`}
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-md border border-white/15 bg-black/60 px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                        value={prizesByPlace[place] ?? 0}
                        onChange={(e) => handlePlacePrizeChange(place, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Премиум чекбокс */}
              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black text-amber-400 accent-amber-400"
                  />
                  <span className="font-semibold text-amber-300">⭐ Премиум-соревнование (отдельный режим)</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs px-5 py-2.5 font-black transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSaving ? '⏳ Сохранение...' : '💾 Сохранить призовые и победителя'}
                </button>
                {savedTime && (
                  <span className="text-xs text-amber-400 font-bold animate-pulse">
                    ✓ Обновлено у всех!
                  </span>
                )}
              </div>
            </form>
          )}

          {/* ТАБ 3: ДОСТУПЫ К ЛОББИ И СТРИМ */}
          {activeTab === 'lobby' && (
            <form onSubmit={handleSaveLobby} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <span>🔑</span>
                  <span>Параметры закрытого игрового лобби:</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] text-cyan-400 hover:underline font-semibold"
                >
                  🎲 Сгенерировать пароль
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Room ID / Имя лобби</label>
                  <input
                    type="text"
                    required
                    className="input-field text-xs font-mono w-full"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Пароль лобби</label>
                  <input
                    type="text"
                    required
                    className="input-field text-xs font-mono w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Ссылка на лобби / сервер / Discord</label>
                  <input
                    type="url"
                    className="input-field text-xs w-full"
                    placeholder="steam://connect/... или https://..."
                    value={joinUrl}
                    onChange={(e) => setJoinUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Прямая трансляция (Twitch / YouTube / VK Play)</label>
                  <input
                    type="url"
                    className="input-field text-xs w-full"
                    placeholder="https://twitch.tv/... или https://youtube.com/live/..."
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="submit" className="btn-primary text-xs px-5 py-2.5 font-bold">
                  {savedLobby ? '✓ Данные лобби сохранены!' : 'Опубликовать доступы в ЛК игроков'}
                </button>
                {initialMatch && !savedLobby && (
                  <span className="text-xs text-emerald-400 font-semibold">✓ Доступы активны</span>
                )}
              </div>
            </form>
          )}

          {/* ТАБ 4: ИКОНКА И ОБОИ МАТЧА */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Блок иконки матча */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                  <label className="block text-xs text-zinc-300 font-bold">
                    Логотип / Иконка матча:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-xl border border-white/20 bg-black/60 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                      <GameIcon game={game} customIconUrl={customIconUrl} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 px-3 py-2 text-xs font-bold text-cyan-300 transition w-full">
                        <span>📁 Загрузить иконку с ПК</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await compressGameIconFile(file, 160);
                              setCustomIconUrl(base64);
                            }
                          }}
                        />
                      </label>
                      {customIconUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomIconUrl('')}
                          className="text-[10px] font-semibold text-zinc-400 hover:text-red-400 transition block text-center w-full"
                        >
                          ↩ Сбросить к иконке игры
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Или ссылка на иконку (URL)..."
                    value={customIconUrl}
                    onChange={(e) => setCustomIconUrl(e.target.value)}
                    className="input-field text-xs text-white w-full"
                  />
                </div>

                {/* Блок фонового изображения / баннера матча */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                  <label className="block text-xs text-zinc-300 font-bold">
                    Фоновые обои / арт матча:
                  </label>
                  <div className="space-y-1.5">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-3 py-2 text-xs font-bold text-purple-300 transition w-full">
                      <span>📁 Загрузить фон с ПК</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await compressGameWallpaperFile(file, 1280);
                            setWallpaperUrl(base64);
                          }
                        }}
                      />
                    </label>
                    {wallpaperUrl && (
                      <button
                        type="button"
                        onClick={() => setWallpaperUrl('')}
                        className="text-[10px] font-semibold text-zinc-400 hover:text-red-400 transition block text-center w-full"
                      >
                        ↩ Сбросить фон
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Или ссылка на фон (URL)..."
                    value={wallpaperUrl}
                    onChange={(e) => setWallpaperUrl(e.target.value)}
                    className="input-field text-xs text-white w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSaveMatchDetails}
                  disabled={isSaving}
                  className="rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs px-5 py-2.5 font-black transition shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {isSaving ? '⏳ Сохранение...' : '💾 Сохранить оформление матча'}
                </button>
                {savedTime && (
                  <span className="text-xs text-emerald-400 font-bold animate-pulse">
                    ✓ Оформление сохранено!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
