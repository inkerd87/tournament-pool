import React, { useState } from 'react';
import { GameId, TournamentStatus } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GAME_OPTIONS: { id: GameId; name: string; defaultMax: number; defaultFee: number; defaultPrize: number; defaultFormat: string; defaultDesc: string }[] = [
  {
    id: 'cs2',
    name: 'Counter-Strike 2 (5v5)',
    defaultMax: 10,
    defaultFee: 1500,
    defaultPrize: 12000,
    defaultFormat: '5v5, BO1 — Регламент соревнований',
    defaultDesc: 'Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, 10 участников). Оплата орг. услуг 1 500 ₽ с игрока. Фиксированное вознаграждение 12 000 ₽ учреждено организатором за спортивные достижения!',
  },
  {
    id: 'dota2',
    name: 'Dota 2 (5v5)',
    defaultMax: 10,
    defaultFee: 1500,
    defaultPrize: 12000,
    defaultFormat: '5v5, Captains Mode — Регламент соревнований',
    defaultDesc: 'Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, 10 участников). Оплата орг. услуг 1 500 ₽ с игрока. Фиксированное вознаграждение 12 000 ₽ учреждено организатором за спортивные достижения!',
  },
  {
    id: 'pubg',
    name: 'PUBG: BATTLEGROUNDS',
    defaultMax: 100,
    defaultFee: 100,
    defaultPrize: 2200,
    defaultFormat: 'Solo, 1 соревнование',
    defaultDesc: 'Одиночные соревнования до 100 игроков (старт от 50 участников). Оплата организационных услуг 100 ₽. Фиксированное вознаграждение 2 200 ₽ учреждено организатором (1-е: 1 000 ₽, 2-е: 700 ₽, 3-е: 500 ₽).',
  },
  {
    id: 'warzone',
    name: 'Call of Duty: Warzone',
    defaultMax: 100,
    defaultFee: 100,
    defaultPrize: 2200,
    defaultFormat: 'Solo Resurgence, 1 катка',
    defaultDesc: 'Соревнования по Call of Duty: Warzone. Оплата организационных услуг 100 ₽. Фиксированное вознаграждение победителям.',
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    defaultMax: 100,
    defaultFee: 100,
    defaultPrize: 2200,
    defaultFormat: 'Solo Zero Build, 1 катка',
    defaultDesc: 'Соревнования по Fortnite Zero Build. Оплата организационных услуг 100 ₽. Фиксированное вознаграждение победителям.',
  },
];

function getDefaultStartsAt(): string {
  const d = new Date();
  // By default set to today at 20:00 or tomorrow if past 20:00
  if (d.getHours() >= 20) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(20, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const AdminCreateTournamentModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createTournament } = useTournaments();
  const [selectedGame, setSelectedGame] = useState<GameId>('cs2');
  const [title, setTitle] = useState('CS2 5v5 Night Cup');
  const [startsAtLocal, setStartsAtLocal] = useState(getDefaultStartsAt);
  const [format, setFormat] = useState('5v5, BO1 — Регламент соревнований');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [entryFeeRub, setEntryFeeRub] = useState(1500);
  const [prizePoolRub, setPrizePoolRub] = useState(12000);
  const [status, setStatus] = useState<TournamentStatus>('recruiting');
  const [description, setDescription] = useState(
    'Командные киберспортивные соревнования 5 на 5. Оплата организационных услуг с игрока. Фиксированное вознаграждение за спортивные достижения!'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGameChange = (gameId: GameId) => {
    setSelectedGame(gameId);
    const opt = GAME_OPTIONS.find((g) => g.id === gameId);
    if (opt) {
      setTitle(`${opt.name} Match`);
      setFormat(opt.defaultFormat);
      setMaxPlayers(opt.defaultMax);
      setEntryFeeRub(opt.defaultFee);
      setPrizePoolRub(opt.defaultPrize);
      setDescription(opt.defaultDesc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название матча / турнира');
      return;
    }
    if (!startsAtLocal) {
      setError('Укажите дату и время начала матча');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const startsAtIso = new Date(startsAtLocal).toISOString();
      const newId = `${selectedGame}-${Date.now().toString(36)}`;

      const success = await createTournament({
        id: newId,
        title: title.trim(),
        game: selectedGame,
        maxPlayers: Number(maxPlayers) || 10,
        minPlayers: selectedGame === 'cs2' || selectedGame === 'dota2' ? 10 : 50,
        startsAt: startsAtIso,
        status,
        format: format.trim() || 'Регламент соревнований',
        description: description.trim(),
        entryFeeRub: Number(entryFeeRub) || 0,
        prizePoolRub: Number(prizePoolRub) || 0,
        prizes: selectedGame === 'cs2' || selectedGame === 'dota2'
          ? { 1: Number(prizePoolRub) || 12000, 2: 0, 3: 0 }
          : { 1: Math.round(prizePoolRub * 0.5), 2: Math.round(prizePoolRub * 0.3), 3: Math.round(prizePoolRub * 0.2) },
      });

      if (!success) {
        throw new Error('Не удалось сохранить соревнование в базу данных Supabase. Проверьте соединение.');
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка создания турнира. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-7 shadow-2xl text-left my-8 max-h-[90vh] overflow-y-auto">
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
        >
          ✕
        </button>

        <h2 className="text-xl font-extrabold text-white">Создание нового матча / турнира</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Заполните параметры матча. Он мгновенно появится в сетке сайта и станет доступен для регистрации.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Выбор дисциплины */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Дисциплина / Игра:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GAME_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGameChange(g.id)}
                  className={`rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                    selectedGame === g.id
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50'
                      : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Название */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Название матча / турнира
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: CS2 5v5 Night Cup #2"
            />
          </div>

          {/* Дата и время старта */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                🕒 Дата и время начала матча
              </label>
              <input
                type="datetime-local"
                required
                className="input-field font-mono font-bold text-white bg-black/50 border-amber-500/40 focus:border-amber-400"
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Статус матча
              </label>
              <select
                className="input-field bg-zinc-900"
                value={status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
              >
                <option value="recruiting">🟢 Набор игроков (recruiting)</option>
                <option value="live">🔴 Идет соревнование (live)</option>
                <option value="soon">⏳ Скоро (soon)</option>
                <option value="finished">🏁 Завершено (finished)</option>
              </select>
            </div>
          </div>

          {/* Формат и лимит игроков */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Формат
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="5v5, BO1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Макс. игроков
              </label>
              <input
                type="number"
                required
                min={2}
                max={200}
                className="input-field font-mono"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Взнос с игрока (₽)
              </label>
              <input
                type="number"
                min={0}
                className="input-field font-mono"
                value={entryFeeRub}
                onChange={(e) => setEntryFeeRub(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Призовой фонд */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Вознаграждение / Призовой фонд (₽)
            </label>
            <input
              type="number"
              min={0}
              className="input-field font-mono"
              value={prizePoolRub}
              onChange={(e) => setPrizePoolRub(Number(e.target.value))}
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Описание и регламент
            </label>
            <textarea
              rows={2}
              className="input-field text-xs resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition"
            >
              {isSubmitting ? 'Создание...' : '✓ Создать соревнование'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
