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
  const isPubgFamily = (g: string) => g === 'pubg' || g === 'pubg_mobile';

  const [pubgMode, setPubgMode] = useState<'standard' | 'premium'>(
    propTournament.isPremium ? 'premium' : 'standard'
  );

  useEffect(() => {
    if (propTournament.isPremium) {
      setPubgMode('premium');
    } else if (isPubgFamily(propTournament.game)) {
      setPubgMode('standard');
    }
  }, [propTournament.id, propTournament.isPremium, propTournament.game]);

  const tournament = useMemo(() => {
    if (!isPubgFamily(propTournament.game)) return propTournament;
    const targetGame = propTournament.game;
    if (pubgMode === 'premium') {
      return (
        tournaments.find(
          (t) => t.game === targetGame && (t.isPremium || t.id === 'pubg-premium-001' || t.id === 'pubg-mobile-premium-001')
        ) || propTournament
      );
    } else {
      return (
        tournaments.find(
          (t) => t.game === targetGame && !t.isPremium && t.id !== 'pubg-premium-001' && t.id !== 'pubg-mobile-premium-001'
        ) || propTournament
      );
    }
  }, [propTournament, pubgMode, tournaments]);

  const game = GAMES[tournament.game];
  const isSoon = tournament.status === 'soon';
  const isPremium = Boolean(
    tournament.isPremium || tournament.id === 'pubg-premium-001' || tournament.id === 'pubg-mobile-premium-001'
  );
  const entryFee = tournament.entryFeeRub ?? ENTRY_FEE_RUB;
  const prizePool = tournament.prizePoolRub ?? TOTAL_PRIZES_RUB;
  const fillPercent = Math.min(100, Math.round((tournament.registeredCount / tournament.maxPlayers) * 100));

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 sm:p-5 transition hover:border-white/25 active:scale-[0.99] ${
        isPremium
          ? 'border-amber-500/30 bg-[#141210] hover:border-amber-400/50'
          : 'border-white/[0.08] bg-[#0f141d] hover:border-cyan-500/30'
      }`}
    >
      <div>
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GameBadge game={tournament.game} />
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                ПРЕМИУМ
              </span>
            )}
          </div>

          {isPubgFamily(tournament.game) ? (
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
                    ? 'bg-cyan-400 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Обычные соревнования (100 ₽)"
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
                    ? 'bg-amber-400 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Премиум соревнования (1 000 ₽)"
              >
                <span>1 000 ₽</span>
              </button>
            </div>
          ) : isSoon ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
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
            <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H7M14 14.66V17c0 .55.45 1 1 1h2M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <span>Победитель: {formatRub(prizePool)}</span>
            <span className="text-zinc-400 font-normal">({formatRub(tournament.winnerPerPlayerRub)} / игроку)</span>
          </div>
        ) : isPremium ? (
          <div className="relative mt-2.5 grid grid-cols-3 gap-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-1.5 text-center text-[10px]">
            <div>
              <div className="text-zinc-400 text-[9px] uppercase font-semibold">1 место</div>
              <div className="font-extrabold text-amber-300 font-mono">{formatRub(tournament.prizes?.[1] ?? 15000)}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-[9px] uppercase font-semibold">2 место</div>
              <div className="font-bold text-zinc-200 font-mono">{formatRub(tournament.prizes?.[2] ?? 8000)}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-[9px] uppercase font-semibold">3 место</div>
              <div className="font-bold text-zinc-400 font-mono">{formatRub(tournament.prizes?.[3] ?? 5000)}</div>
            </div>
          </div>
        ) : null}
        
        {!isSoon && (
          <p className="relative mt-3 text-xs text-zinc-400">
            Старт: <span className="text-zinc-300 font-medium">{formatDateTime(tournament.startsAt)}</span>
          </p>
        )}

        {!isSoon && (
          <div className="relative mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center flex-wrap gap-1">
                <span>{tournament.registeredCount} / {tournament.maxPlayers} игроков</span>
                {Boolean(tournament.minPlayers && tournament.minPlayers > 0) && (
                  <span className="inline-flex items-center rounded border border-red-900/60 bg-red-950/70 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                    старт от {tournament.minPlayers}
                  </span>
                )}
              </span>
              <span className="font-mono">{fillPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${fillPercent}%`,
                  background: isPremium
                    ? '#f59e0b'
                    : game.accent,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/5 pt-3.5">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Вознаграждение</p>
          <p className="text-lg font-extrabold text-amber-300 font-mono">
            {isSoon ? 'Анонс скоро' : formatRub(prizePool)}
          </p>
        </div>
        {isSoon ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Скоро</span>
          </div>
        ) : isPremium ? (
          <div className="flex items-center gap-1 rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-black shadow-sm group-hover:bg-amber-300 transition">
            <span>Орг. тариф {formatRub(entryFee)}</span>
            <span>→</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition">
            <span>Орг. тариф {formatRub(entryFee)}</span>
            <span>→</span>
          </div>
        )}
      </div>
    </Link>
  );
};
