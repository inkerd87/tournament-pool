import React from 'react';
import { Link } from 'react-router-dom';
import { GameBadge } from '@/components/GameBadge';
import { formatDateTime, formatRub, statusLabel } from '@/lib/format';
import { GAMES } from '@/lib/games';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB } from '@/lib/constants';
import { Tournament } from '@/lib/types';

export const TournamentCard: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
  const game = GAMES[tournament.game];
  const fillPercent = Math.min(100, Math.round((tournament.registeredCount / tournament.maxPlayers) * 100));
  const isSoon = tournament.status === 'soon';
  const entryFee = tournament.entryFeeRub ?? ENTRY_FEE_RUB;
  const prizePool = tournament.prizePoolRub ?? TOTAL_PRIZES_RUB;

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#12161f] p-4 sm:p-5 transition hover:border-white/25 active:scale-[0.99]"
      style={{ ['--glow' as string]: game.glow }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-40"
        style={{ background: game.accent }}
      />
      
      <div>
        <div className="relative flex items-center justify-between gap-2">
          <GameBadge game={tournament.game} />
          {isSoon ? (
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

        {tournament.winnerPerPlayerRub && (
          <div className="relative mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
            <span>🏆 Победитель: {formatRub(prizePool)}</span>
            <span className="text-zinc-400 font-normal">({formatRub(tournament.winnerPerPlayerRub)} / игроку)</span>
          </div>
        )}
        
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
                  background: `linear-gradient(90deg, ${game.accent}, #22d3ee)`,
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
