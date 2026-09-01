import Link from "next/link";
import { GameBadge } from "@/components/GameBadge";
import { formatDateTime, formatRub, statusLabel } from "@/lib/format";
import { GAMES } from "@/lib/games";
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB } from "@/lib/constants";
import { poolSummary } from "@/lib/prize-pool";
import type { Tournament } from "@/lib/types";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const game = GAMES[tournament.game];
  const summary = poolSummary(tournament.registeredCount, tournament.maxPlayers);

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12161f] p-5 transition hover:border-white/20 hover:shadow-[0_0_40px_-12px_var(--glow)]"
      style={{ ["--glow" as string]: game.glow }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-40"
        style={{ background: game.accent }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <GameBadge game={tournament.game} />
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
          {statusLabel(tournament.status)}
        </span>
      </div>
      <h3 className="relative mt-3 text-lg font-semibold text-white group-hover:text-cyan-200">
        {tournament.title}
      </h3>
      <p className="relative mt-1 text-sm text-zinc-500">{tournament.format}</p>
      <p className="relative mt-4 text-sm text-zinc-400">
        Старт: {formatDateTime(tournament.startsAt)}
      </p>
      <div className="relative mt-4">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>
            {tournament.registeredCount} / {tournament.maxPlayers} игроков
          </span>
          <span>{summary.fillPercent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${summary.fillPercent}%`,
              background: `linear-gradient(90deg, ${game.accent}, #22d3ee)`,
            }}
          />
        </div>
      </div>
      <div className="relative mt-4 flex items-end justify-between border-t border-white/5 pt-4">
        <div>
          <p className="text-xs text-zinc-500">Призовой фонд</p>
          <p className="text-xl font-bold text-amber-200/90">{formatRub(TOTAL_PRIZES_RUB)}</p>
        </div>
        <span className="text-sm font-medium text-cyan-400">Взнос {formatRub(ENTRY_FEE_RUB)} →</span>
      </div>
    </Link>
  );
}
