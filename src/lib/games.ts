import type { GameId } from "./types";

export const GAMES: Record<
  GameId,
  { name: string; short: string; accent: string; glow: string }
> = {
  cs2: {
    name: "Counter-Strike 2",
    short: "CS2",
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.35)",
  },
  dota2: {
    name: "Dota 2",
    short: "Dota 2",
    accent: "#ef4444",
    glow: "rgba(239, 68, 68, 0.35)",
  },
  pubg: {
    name: "PUBG: BATTLEGROUNDS",
    short: "PUBG",
    accent: "#facc15",
    glow: "rgba(250, 204, 21, 0.3)",
  },
  warzone: {
    name: "Call of Duty: Warzone",
    short: "Warzone",
    accent: "#22c55e",
    glow: "rgba(34, 197, 94, 0.35)",
  },
  fortnite: {
    name: "Fortnite",
    short: "Fortnite",
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
  },
};
