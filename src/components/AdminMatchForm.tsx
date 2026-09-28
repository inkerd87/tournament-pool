import React, { useState, useEffect } from 'react';
import { Tournament, TournamentMatchAccess, TournamentStatus } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';
import { formatDateTime, formatRub, statusLabel } from '@/lib/format';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB, PRIZE_BY_PLACE } from '@/lib/constants';

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
  const { updateMatch, updateTournament, deleteTournament } = useTournaments();

  // Основные параметры матча
  const [startsAtLocal, setStartsAtLocal] = useState(() => toDateTimeLocal(tournament.startsAt));
  const [status, setStatus] = useState<TournamentStatus>(tournament.status);
  const [title, setTitle] = useState(tournament.title);
  const [format, setFormat] = useState(tournament.format);

  // Места (Макс и Мин)
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

  // Синхронизация при обновлении данных из Supabase
  useEffect(() => {
    setStartsAtLocal(toDateTimeLocal(tournament.startsAt));
  }, [tournament.startsAt]);

  useEffect(() => {
    setStatus(tournament.status);
  }, [tournament.status]);

  useEffect(() => {
    setTitle(tournament.title);
    setFormat(tournament.format);
    setMaxPlayers(tournament.maxPlayers || 100);
    setMinPlayers(tournament.minPlayers ?? 50);
    setEntryFeeRub(tournament.entryFeeRub ?? ENTRY_FEE_RUB);
    setPrizePoolRub(tournament.prizePoolRub ?? TOTAL_PRIZES_RUB);
    setWinningPlacesCount(getInitialWinningPlacesCount(tournament));
    setPrizesByPlace({ ...(tournament.prizes || PRIZE_BY_PLACE) });
  }, [
    tournament.title,
    tournament.format,
    tournament.maxPlayers,
    tournament.minPlayers,
    tournament.entryFeeRub,
    tournament.prizePoolRub,
    tournament.winningPlacesCount,
    tournament.prizes,
  ]);

  // Данные лобби
  const [roomId, setRoomId] = useState(initialMatch?.roomId || `NB_${tournament.game.toUpperCase()}_01`);
  const [password, setPassword] = useState(
    initialMatch?.password || 'NB' + Math.floor(1000 + Math.random() * 9000)
  );
  const [joinUrl, setJoinUrl] = useState(initialMatch?.joinUrl || '');

  useEffect(() => {
    if (initialMatch) {
      setRoomId(initialMatch.roomId);
      setPassword(initialMatch.password);
      setJoinUrl(initialMatch.joinUrl || '');
    }
  }, [initialMatch]);

  // Статусы сохранения
  const [isSaving, setIsSaving] = useState(false);
  const [savedTime, setSavedTime] = useState(false);
  const [savedLobby, setSavedLobby] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Авто-распределение общего призового фонда по выбранному числу мест
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
    // Для 4+ мест распределяем убывающими весами
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

  // Сохранение всех параметров матча (время, статус, места, взнос, призовые)
  const handleSaveMatchDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAtLocal) return;
    const isoStartsAt = new Date(startsAtLocal).toISOString();

    const cleanPrizes: Record<number, number> = {};
    for (let i = 1; i <= winningPlacesCount; i++) {
      cleanPrizes[i] = Number(prizesByPlace[i]) || 0;
    }

    const isTeam5v5 = (tournament.game === 'cs2' || tournament.game === 'dota2') && winningPlacesCount === 1;
    const winnerPerPlayer = isTeam5v5 ? Math.round((Number(prizePoolRub) || 0) / 5) : 0;

    setIsSaving(true);
    const ok = await updateTournament(tournament.id, {
      title: title.trim() || tournament.title,
      format: format.trim() || tournament.format,
      startsAt: isoStartsAt,
      status: status,
      maxPlayers: Math.max(2, Number(maxPlayers) || 10),
      minPlayers: Math.max(0, Number(minPlayers) || 0),
      entryFeeRub: Math.max(0, Number(entryFeeRub) || 0),
      prizePoolRub: Math.max(0, Number(prizePoolRub) || 0),
      winningPlacesCount: winningPlacesCount,
      prizes: cleanPrizes,
      winnerPerPlayerRub: winnerPerPlayer || undefined,
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
    await updateMatch(tournament.id, roomId, password, joinUrl);
    setSavedLobby(true);
    setTimeout(() => setSavedLobby(false), 3000);
  };

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить соревнование "${tournament.title}"?`)) {
      setIsDeleting(true);
      await deleteTournament(tournament.id);
    }
  };

  return (
    <div className="surface-card p-6 space-y-6 border border-white/10 relative">
      {/* Шапка карточки со статусом и игрой */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-cyan-400">
              {tournament.game}
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
          </div>
          <h3 className="mt-1 font-bold text-white text-base">{tournament.title}</h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">
            👥 {tournament.registeredCount} / {tournament.maxPlayers} (мин. {tournament.minPlayers ?? 0})
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 transition"
            title="Удалить турнир"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>

      {/* СЕКЦИЯ 1: РЕДАКТИРОВАНИЕ ВСЕХ ПАРАМЕТРОВ МАТЧА, МЕСТ И ПРИЗОВЫХ */}
      <form onSubmit={handleSaveMatchDetails} className="space-y-4 bg-black/30 p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>⚙️</span>
            <span>Настройки матча, мест и призового фонда</span>
          </label>
          <span className="text-[11px] text-zinc-400">
            Старт: <strong>{formatDateTime(tournament.startsAt)}</strong>
          </span>
        </div>

        {/* Название и формат */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Название турнира:</label>
            <input
              type="text"
              required
              className="input-field text-xs font-bold text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Формат соревнования:</label>
            <input
              type="text"
              required
              className="input-field text-xs text-white"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            />
          </div>
        </div>

        {/* Время и статус */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Дата и время начала:</label>
            <input
              type="datetime-local"
              required
              className="input-field text-xs font-mono font-bold text-white bg-black/60 border-amber-500/30 focus:border-amber-400"
              value={startsAtLocal}
              onChange={(e) => setStartsAtLocal(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Статус соревнования:</label>
            <select
              className="input-field text-xs bg-zinc-900 border-white/10 text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as TournamentStatus)}
            >
              <option value="recruiting">🟢 Набор игроков (recruiting)</option>
              <option value="live">🔴 Идет матч (live)</option>
              <option value="soon">⏳ Скоро (soon)</option>
              <option value="finished">🏁 Завершено (finished)</option>
            </select>
          </div>
        </div>

        {/* Быстрые пресеты времени */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-zinc-500">Быстро время:</span>
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

        {/* Количество мест (Макс и Мин) и Взнос */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
          <div>
            <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
              👥 Макс. мест:
            </label>
            <input
              type="number"
              min={2}
              max={500}
              className="input-field text-xs font-mono font-bold text-white"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-[11px] text-red-300 font-semibold mb-1">
              🎯 Мин. мест (старт):
            </label>
            <input
              type="number"
              min={0}
              max={500}
              className="input-field text-xs font-mono font-bold text-red-300 border-red-500/30"
              value={minPlayers}
              onChange={(e) => setMinPlayers(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-[11px] text-cyan-300 font-semibold mb-1">
              💳 Взнос (₽):
            </label>
            <input
              type="number"
              min={0}
              className="input-field text-xs font-mono font-bold text-cyan-300 border-cyan-500/30"
              value={entryFeeRub}
              onChange={(e) => setEntryFeeRub(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Общий призовой фонд и количество призовых мест */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/10 p-3.5 space-y-3">
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[11px] text-amber-300 font-bold mb-1">
                🏆 Общая сумма призовых (₽):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  className="input-field text-xs font-mono font-extrabold text-amber-300 border-amber-500/40"
                  value={prizePoolRub}
                  onChange={(e) => setPrizePoolRub(Number(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => handleDistributePool(prizePoolRub, winningPlacesCount)}
                  title="Автоматически распределить сумму по призовым местам"
                  className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-2 text-[10px] font-bold text-amber-300 hover:bg-amber-500 hover:text-black transition"
                >
                  Распределить
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-300 font-bold mb-1">
                🥇 Кол-во выигрышных мест:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleWinningPlacesCountChange(winningPlacesCount - 1)}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-extrabold text-zinc-300 hover:bg-white/15"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="input-field text-center text-xs font-mono font-extrabold text-white"
                  value={winningPlacesCount}
                  onChange={(e) => handleWinningPlacesCountChange(Number(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => handleWinningPlacesCountChange(winningPlacesCount + 1)}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-extrabold text-zinc-300 hover:bg-white/15"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Выплаты по каждому призовому месту */}
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
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs px-4 py-2 font-extrabold transition shadow-sm shadow-amber-500/20 disabled:opacity-50"
          >
            {isSaving
              ? '⏳ Сохранение в базу...'
              : savedTime
              ? '✓ Все параметры матча сохранены!'
              : '💾 Сохранить параметры матча, места и призовые'}
          </button>
          {savedTime && (
            <span className="text-xs text-amber-400 font-semibold animate-pulse">
              ✓ Обновлено у всех!
            </span>
          )}
        </div>
      </form>

      {/* СЕКЦИЯ 2: ДОСТУП К ЛОББИ */}
      <form onSubmit={handleSaveLobby} className="space-y-3.5">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
          <span>🔑</span>
          <span>Доступ к лобби матча для игроков</span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Room ID / Имя лобби</label>
            <input
              type="text"
              required
              className="input-field text-xs font-mono"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Пароль лобби</label>
            <input
              type="text"
              required
              className="input-field text-xs font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">Ссылка на стрим / Discord (опционально)</label>
          <input
            type="url"
            className="input-field text-xs"
            placeholder="https://discord.gg/..."
            value={joinUrl}
            onChange={(e) => setJoinUrl(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button type="submit" className="btn-primary text-xs px-4 py-2 font-bold">
            {savedLobby ? '✓ Данные лобби сохранены!' : 'Опубликовать доступы в ЛК игроков'}
          </button>
          {initialMatch && !savedLobby && (
            <span className="text-xs text-emerald-400">✓ Доступы активны</span>
          )}
        </div>
      </form>
    </div>
  );
};
