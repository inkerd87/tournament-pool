import { GameBadge } from "@/components/GameBadge";
import {
  formatDateTime,
  formatRub,
  placementLabel,
} from "@/lib/format";
import { GAMES } from "@/lib/games";
import type { MatchHistoryEntry } from "@/lib/types";

export function MatchHistoryList({ matches }: { matches: MatchHistoryEntry[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--border-strong)] p-10 text-center text-sm text-zinc-500">
        Пока нет завершённых матчей — сыграйте первый турнир.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {matches.map((m) => {
        const game = GAMES[m.game];
        const podium = m.placement !== null && m.placement <= 3;
        return (
          <li
            key={m.id}
            className="group surface-card relative overflow-hidden p-4 sm:p-5 hover:border-lime-500/15"
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-0.5"
              style={{ background: game.accent }}
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 pl-2">
                <div className="flex flex-wrap items-center gap-2">
                  <GameBadge game={m.game} />
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      podium
                        ? "bg-lime-400/15 text-lime-300"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {placementLabel(m.placement)}
                  </span>
                </div>
                <h3 className="mt-2 truncate text-base font-bold text-white">
                  {m.tournamentTitle}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(m.playedAt)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-6 sm:justify-end">
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    K / D / A
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-zinc-200">
                    {m.kills}
                    <span className="text-zinc-600"> / </span>
                    {m.deaths}
                    <span className="text-zinc-600"> / </span>
                    {m.assists}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Приз
                  </p>
                  <p
                    className={`mt-0.5 font-mono text-lg font-bold ${
                      m.prizeRub > 0 ? "text-lime-400" : "text-zinc-600"
                    }`}
                  >
                    {m.prizeRub > 0 ? `+${formatRub(m.prizeRub)}` : "—"}
                  </p>
                  <p className="text-xs text-zinc-600">
                    взнос {formatRub(m.entryFeeRub)}
                  </p>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
