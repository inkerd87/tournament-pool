import { promises as fs } from "fs";
import path from "path";
import type { TournamentMatchAccess } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const MATCH_FILE = path.join(DATA_DIR, "tournament-match.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAll(): Promise<TournamentMatchAccess[]> {
  try {
    const raw = await fs.readFile(MATCH_FILE, "utf8");
    return JSON.parse(raw) as TournamentMatchAccess[];
  } catch {
    return [];
  }
}

async function writeAll(items: TournamentMatchAccess[]) {
  await ensureDataDir();
  await fs.writeFile(MATCH_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function getMatchAccess(
  tournamentId: string,
): Promise<TournamentMatchAccess | null> {
  const all = await readAll();
  return all.find((m) => m.tournamentId === tournamentId) ?? null;
}

export async function getAllMatchAccess(): Promise<TournamentMatchAccess[]> {
  return readAll();
}

export async function saveMatchAccess(input: {
  tournamentId: string;
  roomId: string;
  password: string;
  joinUrl?: string;
}): Promise<TournamentMatchAccess> {
  const roomId = input.roomId.trim();
  const password = input.password.trim();
  const joinUrl = input.joinUrl?.trim() || undefined;

  if (!/^\d+$/.test(roomId)) {
    throw new Error("Room ID должен содержать только цифры.");
  }
  if (!/^\d+$/.test(password)) {
    throw new Error("Пароль должен содержать только цифры.");
  }
  if (joinUrl && !/^https?:\/\//i.test(joinUrl)) {
    throw new Error("Ссылка должна начинаться с http:// или https://");
  }

  const entry: TournamentMatchAccess = {
    tournamentId: input.tournamentId,
    roomId,
    password,
    joinUrl,
    updatedAt: new Date().toISOString(),
  };

  const all = await readAll();
  const index = all.findIndex((m) => m.tournamentId === input.tournamentId);
  if (index >= 0) {
    all[index] = entry;
  } else {
    all.push(entry);
  }
  await writeAll(all);
  return entry;
}
