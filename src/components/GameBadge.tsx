import { GAMES } from "@/lib/games";
import type { GameId } from "@/lib/types";

export function GameBadge({ game }: { game: GameId }) {
  const meta = GAMES[game];
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{
        borderColor: `${meta.accent}55`,
        color: meta.accent,
        backgroundColor: `${meta.accent}12`,
      }}
    >
      {meta.short}
    </span>
  );
}
