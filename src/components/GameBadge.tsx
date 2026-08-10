import { GAMES } from "@/lib/games";
import type { GameId } from "@/lib/types";

export function GameBadge({ game }: { game: GameId }) {
  const meta = GAMES[game];
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide"
      style={{
        borderColor: `${meta.accent}44`,
        color: meta.accent,
        backgroundColor: `${meta.accent}10`,
      }}
    >
      {meta.short}
    </span>
  );
}
