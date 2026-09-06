import React, { useState } from 'react';
import { GameId } from '@/lib/types';
import { GAMES } from '@/lib/games';
import { useTournaments } from '@/context/TournamentContext';
import { TournamentCard } from '@/components/TournamentCard';

export const TournamentsPage: React.FC = () => {
  const { tournaments } = useTournaments();
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>('all');
  const [pubgMode, setPubgMode] = useState<'standard' | 'premium'>('standard');

  const filtered = tournaments.filter((t) => {
    if (selectedGame !== 'all' && t.game !== selectedGame) {
      return false;
    }
    if (t.game === 'pubg') {
      if (pubgMode === 'premium') {
        return t.isPremium === true || t.id === 'pubg-premium-001';
      } else {
        return !t.isPremium && t.id !== 'pubg-premium-001';
      }
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-12 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Список турниров</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Разные форматы соревнований · Честное судейство · Приятные призы победителям · Выплаты до суток
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

      {/* Ползунок / Переключатель: Премиум матч (пока что только PUBG) */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#12161f] to-amber-500/5 p-3.5 sm:p-4 shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-extrabold text-base shadow-md shadow-amber-500/20">
            ⭐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white">Режим: Премиум матч</span>
              <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                Пока что только PUBG
              </span>
            </div>
            <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-400">
              {pubgMode === 'premium'
                ? 'Премиум PUBG: орг. сбор 1 000 ₽ · призовой фонд 28 000 ₽ (1-е: 15 000 ₽, 2-е: 8 000 ₽, 3-е: 5 000 ₽)'
                : 'Обычный PUBG: орг. сбор 100 ₽ · призовой фонд 2 200 ₽ (1-е: 1 000 ₽, 2-е: 700 ₽, 3-е: 500 ₽)'}
            </p>
          </div>
        </div>

        {/* Sliding toggle switch (Ползунок) */}
        <div className="relative inline-flex items-center rounded-xl bg-black/60 p-1 border border-white/10 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPubgMode('standard')}
            className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              pubgMode === 'standard'
                ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🎮 Обычный (100 ₽)</span>
          </button>
          <button
            type="button"
            onClick={() => setPubgMode('premium')}
            className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              pubgMode === 'premium'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black shadow-md shadow-amber-400/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>⭐ Премиум (1 000 ₽)</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TournamentCard
            key={t.id}
            tournament={t}
            onPubgModeChange={(mode) => setPubgMode(mode)}
          />
        ))}
      </div>
    </div>
  );
};
