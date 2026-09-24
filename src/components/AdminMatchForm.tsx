import React, { useState, useEffect } from 'react';
import { Tournament, TournamentMatchAccess, TournamentStatus } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';
import { formatDateTime, statusLabel } from '@/lib/format';

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

export const AdminMatchForm: React.FC<Props> = ({ tournament, initialMatch }) => {
  const { updateMatch, updateTournament, deleteTournament } = useTournaments();

  // Состояние даты и времени начала
  const [startsAtLocal, setStartsAtLocal] = useState(() => toDateTimeLocal(tournament.startsAt));
  const [status, setStatus] = useState<TournamentStatus>(tournament.status);
  const [title, setTitle] = useState(tournament.title);

  // Синхронизация при обновлении данных из Supabase
  useEffect(() => {
    setStartsAtLocal(toDateTimeLocal(tournament.startsAt));
  }, [tournament.startsAt]);

  useEffect(() => {
    setStatus(tournament.status);
  }, [tournament.status]);

  useEffect(() => {
    setTitle(tournament.title);
  }, [tournament.title]);

  // Данные лобби
  const [roomId, setRoomId] = useState(initialMatch?.roomId || `NB_${tournament.game.toUpperCase()}_01`);
  const [password, setPassword] = useState(initialMatch?.password || 'NB' + Math.floor(1000 + Math.random() * 9000));
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

  // Сохранение времени и статуса матча
  const handleSaveMatchDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAtLocal) return;
    const isoStartsAt = new Date(startsAtLocal).toISOString();

    setIsSaving(true);
    const ok = await updateTournament(tournament.id, {
      title: title.trim(),
      startsAt: isoStartsAt,
      status: status,
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
            👥 {tournament.registeredCount} / {tournament.maxPlayers}
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

      {/* СЕКЦИЯ 1: ИЗМЕНЕНИЕ ВРЕМЕНИ НАЧАЛА МАТЧА И СТАТУСА */}
      <form onSubmit={handleSaveMatchDetails} className="space-y-3.5 bg-black/30 p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>🕒</span>
            <span>Время начала матча и статус</span>
          </label>
          <span className="text-[11px] text-zinc-400">
            Текущее: <strong>{formatDateTime(tournament.startsAt)}</strong>
          </span>
        </div>

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
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-zinc-500">Быстро:</span>
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

        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs px-3.5 py-1.5 font-bold transition shadow-sm shadow-amber-500/20 disabled:opacity-50"
          >
            {isSaving ? '⏳ Сохранение в базу...' : savedTime ? '✓ Время и статус сохранены!' : '💾 Сохранить время и статус'}
          </button>
          {savedTime && (
            <span className="text-xs text-amber-400 font-semibold animate-pulse">
              ✓ Обновлено в реальном времени!
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
