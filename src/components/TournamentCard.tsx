import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameBadge } from '@/components/GameBadge';
import { formatDateTime, formatRub, statusLabel } from '@/lib/format';
import { GAMES } from '@/lib/games';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB } from '@/lib/constants';
import { Tournament } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';

export const TournamentCard: React.FC<{
  tournament: Tournament;
  onPubgModeChange?: (mode: 'standard' | 'premium') => void;
}> = ({ tournament: propTournament, onPubgModeChange }) => {
  const { tournaments } = useTournaments();
  const [pubgMode, setPubgMode] = useState<'standard' | 'premium'>(
    propTournament.isPremium ? 'premium' : 'standard'
  );

  useEffect(() => {
    if (propTournament.isPremium) {
      setPubgMode('premium');
    } else if (propTournament.game === 'pubg') {
      setPubgMode('standard');
    }
  }, [propTournament.id, propTournament.isPremium, propTournament.game]);

  const tournament = useMemo(() => {
    if (propTournament.game !== 'pubg') return propTournament;
    if (pubgMode === 'premium') {
      return (
        tournaments.find((t) => t.game === 'pubg' && (t.isPremium || t.id === 'pubg-premium-001')) ||
        propTournament
      );
    } else {
      return (
        tournaments.find((t) => t.game === 'pubg' && !t.isPremium && t.id !== 'pubg-premium-001') ||
        propTournament
      );
    }
  }, [propTournament, pubgMode, tournaments]);

  const game = GAMES[tournament.game];
  const isSoon = tournament.status === 'soon';
  const isPremium = tournament.isPremium || tournament.id === 'pubg-premium-001';
  const entryFee = tournament.entryFeeRub ?? ENTRY_FEE_RUB;
  const prizePool = tournament.prizePoolRub ?? TOTAL_PRIZES_RUB;
  const fillPercent = Math.min(100, Math.round((tournament.registeredCount / tournament.maxPlayers) * 100));

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 sm:p-5 transition hover:border-white/25 active:scale-[0.99] ${
        isPremium
          ? 'border-amber-500/40 bg-gradient-to-b from-[#191512] via-[#12161f] to-[#12161f] shadow-lg shadow-amber-500/10 hover:border-amber-400/60'
          : 'border-white/10 bg-[#12161f]'
      }`}
      style={{ ['--glow' as string]: isPremium ? 'rgba(250, 204, 21, 0.4)' : game.glow }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-40"
        style={{ background: isPremium ? '#f59e0b' : game.accent }}
      />
      
      <div>
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GameBadge game={tournament.game} />
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 shadow-sm shadow-amber-500/20">
                ⭐ Премиум
              </span>
            )}
          </div>

          {tournament.game === 'pubg' ? (
            <div
              className="flex items-center rounded-lg bg-black/70 p-0.5 border border-white/10 text-[10px] font-bold shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPubgMode('standard');
                  onPubgModeChange?.('standard');
                }}
                className={`rounded-md px-2 py-0.5 transition-all ${
                  pubgMode === 'standard'
                    ? 'bg-cyan-400 text-black shadow-sm font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Обычный матч (100 ₽)"
              >
                100 ₽
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPubgMode('premium');
                  onPubgModeChange?.('premium');
                }}
                className={`rounded-md px-2 py-0.5 flex items-center gap-0.5 transition-all ${
                  pubgMode === 'premium'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black shadow-sm shadow-amber-400/30 font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Премиум матч (1 000 ₽)"
              >
                <span>⭐ 1 000 ₽</span>
              </button>
            </div>
          ) : isSoon ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 animate-pulse">
              Скоро
            </span>
          ) : (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-400">
              {statusLabel(tournament.status)}
            </span>
          )}
        </div>

        <h3 className="relative mt-3 text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition">
          {tournament.title}
        </h3>
        <p className="relative mt-1 text-xs text-zinc-400 line-clamp-1">{tournament.format}</p>

        {tournament.winnerPerPlayerRub ? (
          <div className="relative mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
            <span>🏆 Победитель: {formatRub(prizePool)}</span>
            <span className="text-zinc-400 font-normal">({formatRub(tournament.winnerPerPlayerRub)} / игроку)</span>
          </div>
        ) : isPremium ? (
          <div className="relative mt-2.5 grid grid-cols-3 gap-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-1.5 text-center text-[10px]">
            <div>
              <div className="text-zinc-400 text-[9px] uppercase font-semibold">1 место</div>
              <div className="font-extrabold text-amber-300 font-mono">15 000 ₽</div>
            </div>
            <div>
              <div className="text-zinc-400 text-[9px] uppercase font-semibold">2 место</div>
              <div className="font-bold text-zinc-200 font-mono">8 000 ₽</div>
            </div>
            <div>
              <div className="text-zinc-400 text-[9px] uppercase font-semibold">3 место</div>
              <div className="font-bold text-zinc-400 font-mono">5 000 ₽</div>
            </div>
          </div>
        ) : null}
        
        <p className="relative mt-3 text-xs text-zinc-400">
          Старт: <span className="text-zinc-300 font-medium">{formatDateTime(tournament.startsAt)}</span>
        </p>

        {!isSoon && (
          <div className="relative mt-4">
            <div className="mb-1.5 flex justify-between text-[11px] text-zinc-400">
              <span>
                {tournament.registeredCount} / {tournament.maxPlayers} игроков
              </span>
              <span className="font-mono">{fillPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${fillPercent}%`,
                  background: isPremium
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : `linear-gradient(90deg, ${game.accent}, #22d3ee)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/5 pt-3.5">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Наградной фонд</p>
          <p className="text-lg font-extrabold text-amber-300">
            {isSoon ? 'Анонс скоро' : formatRub(prizePool)}
          </p>
        </div>
        {isSoon ? (
          <div className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3.5 py-1.5 text-xs font-bold text-amber-300">
            <span>Скоро</span>
            <span>⏳</span>
          </div>
        ) : isPremium ? (
          <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 px-3.5 py-1.5 text-xs font-extrabold text-black shadow-md shadow-amber-400/20 group-hover:from-amber-300 group-hover:to-yellow-200 transition">
            <span>⭐ Участие {formatRub(entryFee)}</span>
            <span>→</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition">
            <span>Участие {formatRub(entryFee)}</span>
            <span>→</span>
          </div>
        )}
      </div>
    </Link>
  );
};
