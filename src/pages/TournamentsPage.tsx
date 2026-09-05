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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-12 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Список турниров</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Оргсбор 100 ₽ · Награды за 1–3 призовые места · Выплаты до суток
        </p>
      </div>

      {/* Horizontal smooth scrollable chips */}
      <div className="mt-5 flex overflow-x-auto pb-2 gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <button
          onClick={() => setSelectedGame('all')}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
            selectedGame === 'all'
              ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/20'
              : 'border border-white/10 bg-[#12161f] text-zinc-400 hover:text-white'
          }`}
        >
          Все игры
        </button>
        {(Object.keys(GAMES) as GameId[]).map((game) => {
          const info = GAMES[game];
          const isSelected = selectedGame === game;
          return (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                isSelected
                  ? 'text-black shadow-md'
                  : 'border border-white/10 bg-[#12161f] text-zinc-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isSelected ? info.accent : undefined,
                boxShadow: isSelected ? `0 4px 15px -3px ${info.glow}` : undefined,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isSelected ? '#000' : info.accent }}
              />
              {info.short}
            </button>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>
    </div>
  );
};
