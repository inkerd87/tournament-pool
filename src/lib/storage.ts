import { Tournament, Registration, User, MatchHistoryEntry, TournamentMatchAccess } from './types';
import { DEFAULT_MAX_PLAYERS, ENTRY_FEE_RUB } from './constants';

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: "cs2-weekly-001",
    title: "CS2 Weekly Cup #1",
    game: "cs2",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    registeredCount: 0,
    startsAt: "2026-09-05T18:00:00+03:00",
    status: "recruiting",
    format: "5v5, single elimination, BO1",
    description: "Открытый кубок для всех рангов. Сетка публикуется после закрытия регистрации.",
  },
  {
    id: "dota2-open-001",
    title: "Dota 2 Open Pool",
    game: "dota2",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    registeredCount: 0,
    startsAt: "2026-09-06T20:00:00+03:00",
    status: "recruiting",
    format: "5v5, double elimination",
    description: "Командный турнир — соберите пятёрку или найдите teammates в лобби.",
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
    description: "Быстрый одиночный матч на 100 игроков: 1 катка — топ-3 выживших сразу получают призовые выплаты.",
  },
  {
    id: "valorant-skirmish-001",
    title: "Valorant Skirmish",
    game: "valorant",
    maxPlayers: 64,
    registeredCount: 0,
    startsAt: "2026-09-08T21:00:00+03:00",
    status: "recruiting",
    format: "5v5, BO3 финал",
    description: "Рейтинговые матчи без ограничений по рангу.",
  },
];

export function getStoredTournaments(): Tournament[] {
  const data = localStorage.getItem('nb_tournaments_v5');
  if (!data) {
    localStorage.setItem('nb_tournaments_v5', JSON.stringify(INITIAL_TOURNAMENTS));
    return INITIAL_TOURNAMENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_TOURNAMENTS;
  }
}

export function saveTournaments(tournaments: Tournament[]) {
  localStorage.setItem('nb_tournaments_v5', JSON.stringify(tournaments));
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
      }
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
