import Link from "next/link";
import { GameBadge } from "@/components/GameBadge";
import { formatDateTime, formatRub, statusLabel } from "@/lib/format";
import { GAMES } from "@/lib/games";
import { poolSummary } from "@/lib/prize-pool";
import type { Tournament } from "@/lib/types";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const game = GAMES[tournament.game];
  const summary = poolSummary(tournament.registeredCount, tournament.maxPlayers);

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group surface-card relative flex flex-col overflow-hidden p-5 hover:border-lime-500/25 hover:shadow-[0_0_0_1px_rgba(190,242,100,0.08)]"
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 opacity-80 transition group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${game.accent}, var(--accent))` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <GameBadge game={tournament.game} />
        <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          {statusLabel(tournament.status)}
        </span>
      </div>
      <h3 className="relative mt-3 text-lg font-bold text-white group-hover:text-lime-100">
        {tournament.title}
      </h3>
      <p className="relative mt-1 text-sm text-zinc-500">{tournament.format}</p>
      <p className="relative mt-3 text-sm text-zinc-400">
        Старт: {formatDateTime(tournament.startsAt)}
      </p>
      <div className="relative mt-4">
        <div className="mb-1.5 flex justify-between font-mono text-[11px] text-zinc-500">
          <span>
            {tournament.registeredCount} / {tournament.maxPlayers}
          </span>
          <span>{summary.fillPercent}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${summary.fillPercent}%`,
              background: `linear-gradient(90deg, ${game.accent}, var(--accent-dim))`,
            }}
          />
        </div>
      </div>
      <div className="relative mt-5 flex items-end justify-between border-t border-[color:var(--border)] pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Банк при полном наборе
          </p>
          <p className="mt-0.5 font-mono text-xl font-bold text-amber-200/95">
            {formatRub(summary.potential)}
          </p>
        </div>
        <span className="text-sm font-semibold text-lime-400 group-hover:text-lime-300">
          100 ₽ →
        </span>
      </div>
    </Link>
  );
}
