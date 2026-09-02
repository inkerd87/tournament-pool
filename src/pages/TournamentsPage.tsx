import React, { useState } from 'react';
import { GameId } from '@/lib/types';
import { GAMES } from '@/lib/games';
import { useTournaments } from '@/context/TournamentContext';
import { TournamentCard } from '@/components/TournamentCard';

export const TournamentsPage: React.FC = () => {
  const { tournaments } = useTournaments();
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>('all');

  const filtered = selectedGame === 'all'
    ? tournaments
    : tournaments.filter((t) => t.game === selectedGame);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Список турниров</h1>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
          Выберите турнир, оплатите фиксированный взнос 100 ₽ и покажите свой скилл.
        </p>
      </div>

      {/* Horizontal scrollable pills on mobile */}
      <div className="mt-6 flex overflow-x-auto pb-2 gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <button
          onClick={() => setSelectedGame('all')}
          className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            selectedGame === 'all'
              ? 'bg-white text-black'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Все игры
        </button>
        {(Object.keys(GAMES) as GameId[]).map((game) => (
          <button
            key={game}
            onClick={() => setSelectedGame(game)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              selectedGame === game
                ? 'bg-cyan-400 text-black shadow-sm shadow-cyan-400/20'
                : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            {GAMES[game].short}
          </button>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>
    </div>
  );
};
