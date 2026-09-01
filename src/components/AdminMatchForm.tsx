import React, { useState } from 'react';
import { Tournament, TournamentMatchAccess } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';

type Props = {
  tournament: Tournament;
  initialMatch?: TournamentMatchAccess | null;
};

export const AdminMatchForm: React.FC<Props> = ({ tournament, initialMatch }) => {
  const { updateMatch } = useTournaments();
  const [roomId, setRoomId] = useState(initialMatch?.roomId || `NB_${tournament.game.toUpperCase()}_01`);
  const [password, setPassword] = useState(initialMatch?.password || 'NB' + Math.floor(1000 + Math.random() * 9000));
  const [joinUrl, setJoinUrl] = useState(initialMatch?.joinUrl || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMatch(tournament.id, roomId, password, joinUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">{tournament.title}</h3>
        <span className="text-xs text-zinc-500">{tournament.registeredCount} участников</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-zinc-400">Room ID / Имя лобби</label>
          <input
            type="text"
            required
            className="input-field"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400">Пароль лобби</label>
          <input
            type="text"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400">Ссылка на стрим / Discord (опционально)</label>
        <input
          type="url"
          className="input-field"
          placeholder="https://discord.gg/..."
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="submit" className="btn-primary text-xs px-4 py-2">
          {saved ? '✓ Сохранено!' : 'Опубликовать данные матча'}
        </button>
        {initialMatch && (
          <span className="text-xs text-emerald-400">✓ Данные выданы участникам</span>
        )}
      </div>
    </form>
  );
};
