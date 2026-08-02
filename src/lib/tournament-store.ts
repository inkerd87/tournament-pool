import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_MAX_PLAYERS } from "./constants";
import type { Registration, Tournament } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

const SEED: Omit<Tournament, "registeredCount">[] = [
  {
    id: "cs2-weekly-001",
    title: "CS2 Weekly Cup #1",
    game: "cs2",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    startsAt: "2026-08-09T18:00:00+03:00",
    status: "recruiting",
    format: "5v5, single elimination, BO1",
    description:
      "Открытый кубок для всех рангов. Сетка публикуется после закрытия регистрации.",
  },
  {
    id: "dota2-open-001",
    title: "Dota 2 Open Pool",
    game: "dota2",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    startsAt: "2026-08-10T20:00:00+03:00",
    status: "recruiting",
    format: "5v5, double elimination",
    description: "Командный турнир — соберите пятёрку или найдите teammates в лобби.",
  },
  {
    id: "pubg-solo-001",
    title: "PUBG Solo Showdown",
    game: "pubg",
    maxPlayers: 100,
    startsAt: "2026-08-11T19:00:00+03:00",
    status: "recruiting",
    format: "Solo, 3 матча, сумма очков",
    description: "Три катки на одной карте — побеждает лучшая суммарная статистика.",
  },
  {
    id: "valorant-skirmish-001",
    title: "Valorant Skirmish",
    game: "valorant",
    maxPlayers: 64,
    startsAt: "2026-08-12T21:00:00+03:00",
    status: "recruiting",
    format: "5v5, BO3",
    description: "Быстрый вечерний турнир для стеков и соло через in-house draft.",
  },
];

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readRegistrations(): Promise<Registration[]> {
  try {
    const raw = await fs.readFile(REGISTRATIONS_FILE, "utf8");
    return JSON.parse(raw) as Registration[];
  } catch {
    return [];
  }
}

async function writeRegistrations(regs: Registration[]) {
  await ensureDataDir();
  await fs.writeFile(REGISTRATIONS_FILE, JSON.stringify(regs, null, 2), "utf8");
}

function deriveStatus(
  base: Tournament["status"],
  registered: number,
  max: number,
): Tournament["status"] {
  if (base === "finished" || base === "live") return base;
  if (registered >= max) return "full";
  return "recruiting";
}

export async function getTournaments(): Promise<Tournament[]> {
  const regs = await readRegistrations();
  return SEED.map((t) => {
    const registeredCount = regs.filter((r) => r.tournamentId === t.id).length;
    return {
      ...t,
      registeredCount,
      status: deriveStatus(t.status, registeredCount, t.maxPlayers),
    };
  });
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const all = await getTournaments();
  return all.find((t) => t.id === id) ?? null;
}

export async function getRegistrationsForTournament(
  tournamentId: string,
): Promise<Registration[]> {
  const regs = await readRegistrations();
  return regs.filter((r) => r.tournamentId === tournamentId);
}

export type RegisterInput = {
  tournamentId: string;
  nickname: string;
  gameAccount: string;
  email: string;
};

export type RegisterResult =
  | { ok: true; registrationId: string }
  | { ok: false; error: string };

export async function registerForTournament(
  input: RegisterInput,
): Promise<RegisterResult> {
  const tournament = await getTournament(input.tournamentId);
  if (!tournament) {
    return { ok: false, error: "Турнир не найден." };
  }
  if (tournament.status === "full" || tournament.status === "live") {
    return { ok: false, error: "Регистрация на этот турнир закрыта." };
  }
  if (tournament.status === "finished") {
    return { ok: false, error: "Турнир уже завершён." };
  }

  const nickname = input.nickname.trim();
  const gameAccount = input.gameAccount.trim();
  const email = input.email.trim().toLowerCase();

  if (nickname.length < 2) {
    return { ok: false, error: "Укажите игровой ник (минимум 2 символа)." };
  }
  if (gameAccount.length < 3) {
    return { ok: false, error: "Укажите ID аккаунта (Steam, Riot и т.д.)." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Некорректный email." };
  }

  const regs = await readRegistrations();
  const duplicate = regs.some(
    (r) =>
      r.tournamentId === input.tournamentId &&
      (r.email === email || r.gameAccount.toLowerCase() === gameAccount.toLowerCase()),
  );
  if (duplicate) {
    return {
      ok: false,
      error: "Этот email или игровой аккаунт уже зарегистрирован на турнир.",
    };
  }

  if (regs.filter((r) => r.tournamentId === input.tournamentId).length >= tournament.maxPlayers) {
    return { ok: false, error: "Все места заняты." };
  }

  const registration: Registration = {
    id: crypto.randomUUID(),
    tournamentId: input.tournamentId,
    nickname,
    gameAccount,
    email,
    paidAt: new Date().toISOString(),
  };

  regs.push(registration);
  await writeRegistrations(regs);

  return { ok: true, registrationId: registration.id };
}
