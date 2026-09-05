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
    id: "pubg-quick-001",
    title: "PUBG Quick Lobby Test",
    game: "pubg",
    maxPlayers: 2,
    startsAt: "2026-08-16T20:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 матч — для проверки лобби",
    description:
      "Тестовый турнир на 2 игрока. После оплаты взноса данные матча появятся в кабинете.",
  },
  {
    id: "pubg-solo-001",
    title: "PUBG Solo Showdown",
    game: "pubg",
    maxPlayers: 100,
    startsAt: "2026-08-11T19:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 катка (быстрые призовые)",
    description: "1 катка на 100 игроков — топ-3 выживших сразу получают призовые выплаты.",
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
