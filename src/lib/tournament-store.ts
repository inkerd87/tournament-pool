import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_MAX_PLAYERS, ENTRY_FEE_RUB } from "./constants";
import { chargeEntryFee, findOrCreateUser } from "./user-store";
import type { Registration, Tournament } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

const SEED: Omit<Tournament, "registeredCount">[] = [
  {
    id: "cs2-weekly-001",
    title: "CS2 5v5 Cash Clash #1",
    game: "cs2",
    maxPlayers: 10,
    startsAt: "2026-09-08T20:00:00+03:00",
    status: "recruiting",
    format: "5v5, BO1 — Победитель забирает 12 000 ₽",
    description:
      "Командный матч 5 на 5 (2 команды по 5 игроков). Взнос 1 500 ₽ с игрока. Победившая команда забирает весь банк: 12 000 ₽ (по 2 400 ₽ на каждого игрока)! Проигравшие получают 0 ₽.",
    entryFeeRub: 1500,
    prizePoolRub: 12000,
    prizes: { 1: 12000, 2: 0, 3: 0 },
    winnerPerPlayerRub: 2400,
  },
  {
    id: "dota2-open-001",
    title: "Dota 2 5v5 Battle Cup",
    game: "dota2",
    maxPlayers: 10,
    startsAt: "2026-09-08T21:30:00+03:00",
    status: "recruiting",
    format: "5v5, Captains Mode — Победитель забирает 12 000 ₽",
    description:
      "Командный матч 5 на 5 (2 команды по 5 игроков). Взнос 1 500 ₽ с игрока. Победившая команда забирает весь банк: 12 000 ₽ (по 2 400 ₽ на каждого игрока)! Проигравшие получают 0 ₽.",
    entryFeeRub: 1500,
    prizePoolRub: 12000,
    prizes: { 1: 12000, 2: 0, 3: 0 },
    winnerPerPlayerRub: 2400,
  },
  {
    id: "pubg-solo-001",
    title: "PUBG Solo Showdown",
    game: "pubg",
    maxPlayers: 100,
    startsAt: "2026-09-07T19:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 катка (быстрые призовые)",
    description: "Быстрый одиночный матч на 100 игроков: 1 катка — топ-3 выживших сразу получают призовые выплаты.",
    entryFeeRub: 100,
    prizePoolRub: 2200,
    prizes: { 1: 1000, 2: 700, 3: 500 },
  },
  {
    id: "warzone-solo-001",
    title: "Warzone Battle Royale",
    game: "warzone",
    maxPlayers: 100,
    startsAt: "2026-09-10T19:00:00+03:00",
    status: "soon",
    format: "Solo Resurgence, 1 катка",
    description: "Турнир по Call of Duty: Warzone откроется скоро. Регистрация и призовой фонд станут доступны в ближайшее время.",
    entryFeeRub: 100,
  },
  {
    id: "fortnite-solo-001",
    title: "Fortnite Zero Build Cup",
    game: "fortnite",
    maxPlayers: 100,
    startsAt: "2026-09-11T19:00:00+03:00",
    status: "soon",
    format: "Solo Zero Build, 1 катка",
    description: "Турнир по Fortnite откроется скоро. Регистрация и призовой фонд станут доступны в ближайшее время.",
    entryFeeRub: 100,
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

export async function getRegistrationsForUser(email: string): Promise<Registration[]> {
  const normalized = email.trim().toLowerCase();
  const regs = await readRegistrations();
  return regs.filter((r) => r.email === normalized);
}

export async function isUserRegisteredForTournament(
  email: string,
  tournamentId: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const regs = await readRegistrations();
  return regs.some(
    (r) => r.email === normalized && r.tournamentId === tournamentId,
  );
}

export type RegisterInput = {
  tournamentId: string;
  nickname: string;
  gameAccount: string;
  email: string;
  /** Если пользователь уже в сессии — для привязки платежа */
  sessionUserId?: string;
};

export type RegisterResult =
  | {
      ok: true;
      registrationId: string;
      balanceRub: number;
      user: { id: string; email: string; nickname: string };
    }
  | { ok: false; error: string };

export type ValidatedRegistration = {
  ok: true;
  normalized: {
    tournamentId: string;
    nickname: string;
    gameAccount: string;
    email: string;
    userId?: string;
  };
  tournamentTitle: string;
};

export async function validateRegistrationInput(
  input: RegisterInput,
): Promise<ValidatedRegistration | { ok: false; error: string }> {
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

  return {
    ok: true,
    normalized: {
      tournamentId: input.tournamentId,
      nickname,
      gameAccount,
      email,
      userId: input.sessionUserId,
    },
    tournamentTitle: tournament.title,
  };
}

/** Регистрация после успешной оплаты (без списания с кошелька). */
export async function finalizeTournamentRegistration(
  input: RegisterInput,
): Promise<
  | { ok: true; registrationId: string; user: { id: string; email: string; nickname: string } }
  | { ok: false; error: string }
> {
  const validation = await validateRegistrationInput(input);
  if (!validation.ok) return validation;

  const { nickname, gameAccount, email, tournamentId } = validation.normalized;
  const tournament = await getTournament(tournamentId);
  if (!tournament) return { ok: false, error: "Турнир не найден." };

  const user = await findOrCreateUser(email, nickname);

  const registration: Registration = {
    id: crypto.randomUUID(),
    tournamentId,
    nickname,
    gameAccount,
    email,
    paidAt: new Date().toISOString(),
  };

  const regs = await readRegistrations();
  regs.push(registration);
  await writeRegistrations(regs);

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/account");

  return {
    ok: true,
    registrationId: registration.id,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    },
  };
}

export async function registerForTournament(
  input: RegisterInput,
): Promise<RegisterResult> {
  const validation = await validateRegistrationInput(input);
  if (!validation.ok) return validation;

  const user = await findOrCreateUser(
    validation.normalized.email,
    validation.normalized.nickname,
  );
  const charge = await chargeEntryFee(user.id, ENTRY_FEE_RUB);
  if (!charge.ok) {
    return { ok: false, error: charge.error };
  }

  const finalized = await finalizeTournamentRegistration(input);
  if (!finalized.ok) {
    return finalized;
  }

  return {
    ok: true,
    registrationId: finalized.registrationId,
    balanceRub: charge.balanceRub,
    user: finalized.user,
  };
}
