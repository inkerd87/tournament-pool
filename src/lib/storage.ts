import { Tournament, Registration, User, MatchHistoryEntry, TournamentMatchAccess } from './types';
import { DEFAULT_MAX_PLAYERS, ENTRY_FEE_RUB } from './constants';

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: "cs2-weekly-001",
    title: "CS2 5v5 Cash Clash #1",
    game: "cs2",
    maxPlayers: 10,
    registeredCount: 0,
    startsAt: "2026-09-08T20:00:00+03:00",
    status: "recruiting",
    format: "5v5, BO1 — Призовой фонд 12 000 ₽",
    description: "Командный матч 5 на 5 (2 команды по 5 игроков). Взнос 1 500 ₽ с игрока. Награда за 1 место: 12 000 ₽ (по 2 400 ₽ на каждого игрока команды)! Проигравшие получают 0 ₽.",
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
    registeredCount: 0,
    startsAt: "2026-09-08T21:30:00+03:00",
    status: "recruiting",
    format: "5v5, Captains Mode — Призовой фонд 12 000 ₽",
    description: "Командный матч 5 на 5 (2 команды по 5 игроков). Взнос 1 500 ₽ с игрока. Награда за 1 место: 12 000 ₽ (по 2 400 ₽ на каждого игрока команды)! Проигравшие получают 0 ₽.",
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
    registeredCount: 0,
    startsAt: "2026-09-07T19:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 катка (быстрые призовые)",
    description: "Быстрый одиночный матч на 100 игроков: 1 катка — топ-3 выживших сразу получают призовые выплаты. Орг. сбор 100 ₽.",
    entryFeeRub: 100,
    prizePoolRub: 2200,
    prizes: { 1: 1000, 2: 700, 3: 500 },
    isPremium: false,
  },
  {
    id: "pubg-premium-001",
    title: "PUBG Solo Premium Showdown",
    game: "pubg",
    maxPlayers: 100,
    registeredCount: 0,
    startsAt: "2026-09-07T21:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 катка (Премиум фонд 28 000 ₽)",
    description: "Премиум одиночный матч на 100 игроков: 1 катка — топ-3 выживших делят наградной фонд 28 000 ₽ (1 место: 15 000 ₽, 2 место: 8 000 ₽, 3 место: 5 000 ₽). Орг. сбор 1 000 ₽.",
    entryFeeRub: 1000,
    prizePoolRub: 28000,
    prizes: { 1: 15000, 2: 8000, 3: 5000 },
    isPremium: true,
  },
  {
    id: "warzone-solo-001",
    title: "Warzone Battle Royale",
    game: "warzone",
    maxPlayers: 100,
    registeredCount: 0,
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
    registeredCount: 0,
    startsAt: "2026-09-11T19:00:00+03:00",
    status: "soon",
    format: "Solo Zero Build, 1 катка",
    description: "Турнир по Fortnite откроется скоро. Регистрация и призовой фонд станут доступны в ближайшее время.",
    entryFeeRub: 100,
  },
];

export function getStoredTournaments(): Tournament[] {
  const data = localStorage.getItem('nb_tournaments_v10');
  if (!data) {
    localStorage.setItem('nb_tournaments_v10', JSON.stringify(INITIAL_TOURNAMENTS));
    return INITIAL_TOURNAMENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_TOURNAMENTS;
  }
}

export function saveTournaments(tournaments: Tournament[]) {
  localStorage.setItem('nb_tournaments_v10', JSON.stringify(tournaments));
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('nb_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem('nb_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('nb_user');
  }
}

export function getStoredRegistrations(): Registration[] {
  const data = localStorage.getItem('nb_registrations_v4');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveRegistrations(regs: Registration[]) {
  localStorage.setItem('nb_registrations_v4', JSON.stringify(regs));
}

export function getStoredMatches(): Record<string, TournamentMatchAccess> {
  const data = localStorage.getItem('nb_matches');
  if (!data) {
    const initial = {
      'pubg-solo-001': {
        tournamentId: 'pubg-solo-001',
        roomId: 'NightByte_PUBG_01',
        password: 'NB' + Math.floor(1000 + Math.random() * 9000),
        updatedAt: new Date().toISOString(),
      },
      'pubg-premium-001': {
        tournamentId: 'pubg-premium-001',
        roomId: 'NightByte_PUBG_VIP01',
        password: 'NB' + Math.floor(1000 + Math.random() * 9000),
        updatedAt: new Date().toISOString(),
      },
    };
    localStorage.setItem('nb_matches', JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function saveMatches(matches: Record<string, TournamentMatchAccess>) {
  localStorage.setItem('nb_matches', JSON.stringify(matches));
}

export function getStoredHistory(email: string): MatchHistoryEntry[] {
  const data = localStorage.getItem(`nb_history_${email}`);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}
