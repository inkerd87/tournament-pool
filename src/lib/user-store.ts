import { promises as fs } from "fs";
import path from "path";
import { ENTRY_FEE_RUB, PRIZE_BY_PLACE, STARTING_BALANCE_RUB } from "./constants";
import type { MatchHistoryEntry, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MATCHES_FILE = path.join(DATA_DIR, "match-history.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readUsers(): Promise<User[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

async function writeUsers(users: User[]) {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

async function readAllMatches(): Promise<MatchHistoryEntry[]> {
  try {
    const raw = await fs.readFile(MATCHES_FILE, "utf8");
    return JSON.parse(raw) as MatchHistoryEntry[];
  } catch {
    return [];
  }
}

async function writeAllMatches(matches: MatchHistoryEntry[]) {
  await ensureDataDir();
  await fs.writeFile(MATCHES_FILE, JSON.stringify(matches, null, 2), "utf8");
}

const DEMO_MATCHES: Omit<MatchHistoryEntry, "id" | "userId">[] = [
  {
    tournamentId: "cs2-weekly-000",
    tournamentTitle: "CS2 Night Rush",
    game: "cs2",
    placement: 1,
    kills: 47,
    deaths: 28,
    assists: 11,
    prizeRub: PRIZE_BY_PLACE[1],
    entryFeeRub: ENTRY_FEE_RUB,
    playedAt: "2026-08-01T21:30:00+03:00",
  },
  {
    tournamentId: "dota2-open-000",
    tournamentTitle: "Dota 2 Friday Stack",
    game: "dota2",
    placement: 3,
    kills: 8,
    deaths: 5,
    assists: 22,
    prizeRub: PRIZE_BY_PLACE[3],
    entryFeeRub: ENTRY_FEE_RUB,
    playedAt: "2026-07-28T20:00:00+03:00",
  },
  {
    tournamentId: "valorant-skirmish-000",
    tournamentTitle: "Valorant Pulse Cup",
    game: "valorant",
    placement: null,
    kills: 14,
    deaths: 18,
    assists: 6,
    prizeRub: 0,
    entryFeeRub: ENTRY_FEE_RUB,
    playedAt: "2026-07-25T19:15:00+03:00",
  },
  {
    tournamentId: "pubg-solo-000",
    tournamentTitle: "PUBG Miramar Masters",
    game: "pubg",
    placement: 2,
    kills: 9,
    deaths: 1,
    assists: 0,
    prizeRub: PRIZE_BY_PLACE[2],
    entryFeeRub: ENTRY_FEE_RUB,
    playedAt: "2026-07-20T18:45:00+03:00",
  },
  {
    tournamentId: "cs2-weekly-099",
    tournamentTitle: "CS2 Open Qualifier",
    game: "cs2",
    placement: null,
    kills: 31,
    deaths: 34,
    assists: 9,
    prizeRub: 0,
    entryFeeRub: ENTRY_FEE_RUB,
    playedAt: "2026-07-12T17:00:00+03:00",
  },
];

async function seedDemoMatchHistory(userId: string): Promise<MatchHistoryEntry[]> {
  const seeded = DEMO_MATCHES.map((m) => ({
    ...m,
    id: crypto.randomUUID(),
    userId,
  }));
  const all = await readAllMatches();
  all.push(...seeded);
  await writeAllMatches(all);
  return seeded.sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
  );
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const users = await readUsers();
  return users.find((u) => u.email === normalized) ?? null;
}

export async function findOrCreateUser(
  email: string,
  nickname: string,
): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const displayNick = nickname.trim();
  const users = await readUsers();
  const existing = users.find((u) => u.email === normalizedEmail);
  if (existing) {
    if (displayNick && existing.nickname !== displayNick) {
      existing.nickname = displayNick;
      await writeUsers(users);
    }
    return existing;
  }

  const user: User = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    nickname: displayNick.length >= 2 ? displayNick : normalizedEmail.split("@")[0],
    balanceRub: STARTING_BALANCE_RUB,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function creditBalance(userId: string, amountRub: number): Promise<number> {
  const users = await readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("Пользователь не найден");
  }
  user.balanceRub += amountRub;
  await writeUsers(users);
  return user.balanceRub;
}

export async function chargeEntryFee(
  userId: string,
  amount: number,
): Promise<{ ok: true; balanceRub: number } | { ok: false; error: string }> {
  const users = await readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { ok: false, error: "Пользователь не найден." };
  }
  if (user.balanceRub < amount) {
    return {
      ok: false,
      error: `Недостаточно средств. Нужно ${amount} ₽, на балансе ${user.balanceRub} ₽.`,
    };
  }
  user.balanceRub -= amount;
  await writeUsers(users);
  return { ok: true, balanceRub: user.balanceRub };
}

export async function getMatchHistory(userId: string): Promise<MatchHistoryEntry[]> {
  const all = await readAllMatches();
  const userMatches = all
    .filter((m) => m.userId === userId)
    .sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    );
  if (userMatches.length === 0) {
    return seedDemoMatchHistory(userId);
  }
  return userMatches;
}

export type AccountStats = {
  matchesPlayed: number;
  wins: number;
  podiums: number;
  totalPrizeRub: number;
  totalFeesRub: number;
  winRatePercent: number;
};

export function computeAccountStats(matches: MatchHistoryEntry[]): AccountStats {
  const wins = matches.filter((m) => m.placement === 1).length;
  const podiums = matches.filter(
    (m) => m.placement !== null && m.placement <= 3,
  ).length;
  const totalPrizeRub = matches.reduce((s, m) => s + m.prizeRub, 0);
  const totalFeesRub = matches.reduce((s, m) => s + m.entryFeeRub, 0);
  const matchesPlayed = matches.length;
  const winRatePercent =
    matchesPlayed === 0 ? 0 : Math.round((podiums / matchesPlayed) * 100);

  return {
    matchesPlayed,
    wins,
    podiums,
    totalPrizeRub,
    totalFeesRub,
    winRatePercent,
  };
}

export function rankLabel(stats: AccountStats): string {
  if (stats.wins >= 3) return "Champion";
  if (stats.podiums >= 4) return "Elite";
  if (stats.matchesPlayed >= 3) return "Contender";
  return "Rookie";
}

export function rankTierColor(label: string): string {
  const map: Record<string, string> = {
    Champion: "#fbbf24",
    Elite: "#a78bfa",
    Contender: "#22d3ee",
    Rookie: "#94a3b8",
  };
  return map[label] ?? "#94a3b8";
}
