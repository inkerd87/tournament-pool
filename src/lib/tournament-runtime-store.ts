import { promises as fs } from "fs";
import path from "path";
import { createGameLobby } from "./game-launchers";
import type { GameId, Registration, TournamentRuntime } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const RUNTIME_FILE = path.join(DATA_DIR, "tournament-runtime.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAllRuntimes(): Promise<TournamentRuntime[]> {
  try {
    const raw = await fs.readFile(RUNTIME_FILE, "utf8");
    return JSON.parse(raw) as TournamentRuntime[];
  } catch {
    return [];
  }
}

async function writeAllRuntimes(runtimes: TournamentRuntime[]) {
  await ensureDataDir();
  await fs.writeFile(RUNTIME_FILE, JSON.stringify(runtimes, null, 2), "utf8");
}

export async function getTournamentRuntime(
  tournamentId: string,
): Promise<TournamentRuntime | null> {
  const all = await readAllRuntimes();
  return all.find((r) => r.tournamentId === tournamentId) ?? null;
}

export async function launchTournamentIfReady(params: {
  tournamentId: string;
  game: GameId;
  maxPlayers: number;
  registrations: Registration[];
}): Promise<TournamentRuntime | null> {
  const existing = await getTournamentRuntime(params.tournamentId);
  if (existing) return existing;

  if (params.registrations.length < params.maxPlayers) return null;

  const lobby = createGameLobby(params.game, {
    tournamentId: params.tournamentId,
    registrations: params.registrations,
  });

  const runtime: TournamentRuntime = {
    tournamentId: params.tournamentId,
    status: "live",
    startedAt: new Date().toISOString(),
    lobbies: [lobby],
  };

  const all = await readAllRuntimes();
  all.push(runtime);
  await writeAllRuntimes(all);

  return runtime;
}
