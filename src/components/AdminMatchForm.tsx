import React, { useState, useEffect } from 'react';
import { Tournament, TournamentMatchAccess, TournamentStatus } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';
import { formatDateTime, statusLabel } from '@/lib/format';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB, PRIZE_BY_PLACE } from '@/lib/constants';
import { GameIcon } from '@/components/GameIcons';

type Props = {
  tournament: Tournament;
  initialMatch?: TournamentMatchAccess | null;
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
    .filter((k) => !isNaN(k) && (prizesObj[k] ?? 0) > 0);
  if (nonZero.length > 0) {
    return Math.max(...nonZero);
  }
  return t.winnerPerPlayerRub ? 1 : 3;
}

export const AdminMatchForm: React.FC<Props> = ({ tournament, initialMatch }) => {
  const { updateMatch, updateTournament, deleteTournament, allGames } = useTournaments();

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

  // Данные лобби и трансляции
  const [roomId, setRoomId] = useState(initialMatch?.roomId || `NB_${tournament.game.toUpperCase()}_01`);
  const [password, setPassword] = useState(
    initialMatch?.password || 'NB' + Math.floor(1000 + Math.random() * 9000)
  );
  const [joinUrl, setJoinUrl] = useState(initialMatch?.joinUrl || '');
  const [streamUrl, setStreamUrl] = useState(tournament.streamUrl || initialMatch?.streamUrl || '');

  // Статусы сохранения
  const [isSaving, setIsSaving] = useState(false);
  const [savedTime, setSavedTime] = useState(false);
  const [savedLobby, setSavedLobby] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Синхронизация при обновлении данных
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
    setStreamUrl(tournament.streamUrl || initialMatch?.streamUrl || '');
  }, [tournament, initialMatch]);

  useEffect(() => {
    if (initialMatch) {
      setRoomId(initialMatch.roomId);
      setPassword(initialMatch.password);
      setJoinUrl(initialMatch.joinUrl || '');
      if (initialMatch.streamUrl) setStreamUrl(initialMatch.streamUrl);
    }
  }, [initialMatch]);

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

  // Быстрые кнопки времени
  const handleAddHours = (hoursToAdd: number) => {
    const current = startsAtLocal ? new Date(startsAtLocal) : new Date();
    current.setHours(current.getHours() + hoursToAdd);
    setStartsAtLocal(toDateTimeLocal(current.toISOString()));
  };

  const handleSetTimeTodayTomorrow = (isTomorrow = false) => {
    const d = new Date();
    if (isTomorrow) d.setDate(d.getDate() + 1);
    d.setHours(20, 0, 0, 0);
    setStartsAtLocal(toDateTimeLocal(d.toISOString()));
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

  return (
    <div className="surface-card p-5 sm:p-6 space-y-6 border border-white/10 relative">
      {/* Шапка карточки со статусом и игрой */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-white/15 bg-black/60 p-1 flex items-center justify-center overflow-hidden shrink-0">
            <GameIcon game={game} className="h-full w-full object-cover rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-cyan-400">
                {game}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  status === 'live'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : status === 'full'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {statusLabel(status)}
              </span>
              {isPremium && (
                <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  ★ Премиум
                </span>
              )}
            </div>
            <h3 className="mt-0.5 font-bold text-white text-base">{tournament.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-zinc-400 font-medium">
            👥 {tournament.registeredCount} / {tournament.maxPlayers}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-500/15 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition flex items-center gap-1.5 shrink-0"
            title="Удалить турнир"
          >
            <span>🗑️</span>
            <span>{isDeleting ? 'Удаление...' : 'Удалить'}</span>
          </button>
        </div>
      </div>

      {/* СЕКЦИЯ 1: ПОЛНОЕ РЕДАКТИРОВАНИЕ ВСЕХ ПАРАМЕТРОВ МАТЧА */}
      <form onSubmit={handleSaveMatchDetails} className="space-y-4 bg-black/30 p-4 rounded-xl border border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>⚙️</span>
            <span>Параметры матча, регламент и призовые</span>
          </label>
          <span className="text-[11px] text-zinc-400">
            Старт: <strong>{formatDateTime(tournament.startsAt)}</strong>
          </span>
        </div>

        {/* Выбор игры и название */}
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

        {/* Формат и статус */}
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

        {/* Описание и правила турнира */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
            Описание и регламент турнира (отображается на странице деталей):
          </label>
          <textarea
            rows={4}
            placeholder="Подробный регламент матча, правила лобби, условия участия и победы..."
            className="input-field text-xs text-zinc-200 w-full resize-y font-sans leading-relaxed"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Время и быстрые пресеты */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
            Дата и время начала:
          </label>
          <input
            type="datetime-local"
            required
            className="input-field text-xs font-mono font-bold text-white bg-black/60 border-amber-500/30 focus:border-amber-400 w-full"
            value={startsAtLocal}
            onChange={(e) => setStartsAtLocal(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] text-zinc-500">Пресеты:</span>
            <button
              type="button"
              onClick={() => handleAddHours(1)}
              className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white border border-white/5"
            >
              +1 час
            </button>
            <button
              type="button"
              onClick={() => handleAddHours(2)}
              className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white border border-white/5"
            >
              +2 часа
            </button>
            <button
              type="button"
              onClick={() => handleAddHours(24)}
              className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white border border-white/5"
            >
              +1 день
            </button>
            <button
              type="button"
              onClick={() => handleSetTimeTodayTomorrow(false)}
              className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/20"
            >
              Сегодня 20:00
            </button>
            <button
              type="button"
              onClick={() => handleSetTimeTodayTomorrow(true)}
              className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/20"
            >
              Завтра 20:00
            </button>
          </div>
        </div>

        {/* Количество мест и участников */}
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
              👥 Макс. мест:
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
              🎯 Мин. для старта:
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

        {/* Взнос, призовой фонд и премиум */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/10 p-3.5 space-y-3">
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
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
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

          {/* Премиум режим и победитель */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                🏆 Победитель / Итог матча:
              </label>
              <input
                type="text"
                placeholder="Никнейм победителя или счет..."
                className="input-field text-xs text-white w-full"
                value={winner}
                onChange={(e) => setWinner(e.target.value)}
              />
            </div>

            <div className="flex items-center pt-5">
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
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs px-5 py-2.5 font-extrabold transition shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {isSaving ? '⏳ Сохранение...' : '💾 Сохранить все параметры матча'}
          </button>
          {savedTime && (
            <span className="text-xs text-amber-400 font-semibold animate-pulse">
              ✓ Обновлено у всех!
            </span>
          )}
        </div>
      </form>

      {/* СЕКЦИЯ 2: ДОСТУП К ЛОББИ И ТРАНСЛЯЦИИ */}
      <form onSubmit={handleSaveLobby} className="space-y-3.5 bg-black/20 p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <span>🔑</span>
            <span>Доступ к лобби и прямая трансляция</span>
          </label>
          <button
            type="button"
            onClick={generateRandomPassword}
            className="text-[10px] text-cyan-400 hover:underline"
          >
            Случайный пароль
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

        <div className="flex items-center justify-between pt-1">
          <button type="submit" className="btn-primary text-xs px-4 py-2 font-bold">
            {savedLobby ? '✓ Данные лобби сохранены!' : 'Опубликовать доступы в ЛК игроков'}
          </button>
          {initialMatch && !savedLobby && (
            <span className="text-xs text-emerald-400 font-semibold">✓ Доступы активны</span>
          )}
        </div>
      </form>
    </div>
  );
};
