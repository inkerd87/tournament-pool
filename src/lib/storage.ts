import { Tournament, Registration, User, MatchHistoryEntry, TournamentMatchAccess } from './types';
import { DEFAULT_MAX_PLAYERS, ENTRY_FEE_RUB } from './constants';

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: "cs2-weekly-001",
    title: "CS2 5v5 Cup #1",
    game: "cs2",
    maxPlayers: 10,
    minPlayers: 10,
    registeredCount: 0,
    startsAt: "2026-09-25T22:00:00+03:00",
    status: "recruiting",
    format: "5v5, BO1 — Регламент соревнований",
    description: "Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, минимум 10 участников). Оплата организационных услуг 1 500 ₽ с игрока (судейство, платформа, подбор оппонентов). Фиксированное вознаграждение победившей команде 12 000 ₽ (по 2 400 ₽ каждому игроку) учреждено организатором соревнований за спортивные достижения и не зависит от взносов.",
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
    minPlayers: 10,
    registeredCount: 0,
    startsAt: "2026-09-20T21:30:00+03:00",
    status: "recruiting",
    format: "5v5, Captains Mode — Регламент соревнований",
    description: "Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, минимум 10 участников). Оплата организационных услуг 1 500 ₽ с игрока (судейство, платформа, подбор оппонентов). Фиксированное вознаграждение победившей команде 12 000 ₽ (по 2 400 ₽ каждому игроку) учреждено организатором соревнований за спортивные достижения и не зависит от взносов.",
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
    minPlayers: 50,
    registeredCount: 0,
    startsAt: "2026-09-21T19:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 соревнование",
    description: "Одиночные соревнования до 100 игроков (старт от 50 участников). Оплата организационных услуг 100 ₽ (судейство, платформа, подбор оппонентов). Фиксированное вознаграждение 2 200 ₽ учреждено организатором соревнований (1-е: 1 000 ₽, 2-е: 700 ₽, 3-е: 500 ₽) и не формируется из взносов.",
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
    minPlayers: 50,
    registeredCount: 0,
    startsAt: "2026-10-01T21:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 соревнование",
    description: "Премиум одиночные соревнования до 100 игроков (старт от 50 участников). Оплата организационных услуг 1 000 ₽ (судейство, серверные мощности, модерация лобби). Фиксированное вознаграждение 28 000 ₽ учреждено организатором (1 место: 15 000 ₽, 2 место: 8 000 ₽, 3 место: 5 000 ₽) и не формируется из взносов.",
    entryFeeRub: 1000,
    prizePoolRub: 28000,
    prizes: { 1: 15000, 2: 8000, 3: 5000 },
    isPremium: true,
  },
  {
    id: "pubg-mobile-solo-001",
    title: "PUBG Mobile Solo Showdown",
    game: "pubg_mobile",
    maxPlayers: 100,
    minPlayers: 50,
    registeredCount: 0,
    startsAt: "2026-09-28T19:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 соревнование",
    description: "Одиночные мобильные соревнования по PUBG MOBILE до 100 игроков (старт от 50 участников). Оплата организационных услуг 100 ₽ (судейство, платформа, подбор оппонентов). Фиксированное вознаграждение 2 200 ₽ учреждено организатором соревнований (1-е: 1 000 ₽, 2-е: 700 ₽, 3-е: 500 ₽) и не формируется из взносов.",
    entryFeeRub: 100,
    prizePoolRub: 2200,
    prizes: { 1: 1000, 2: 700, 3: 500 },
    isPremium: false,
  },
  {
    id: "pubg-mobile-premium-001",
    title: "PUBG Mobile Solo Premium Showdown",
    game: "pubg_mobile",
    maxPlayers: 100,
    minPlayers: 50,
    registeredCount: 0,
    startsAt: "2026-10-02T21:00:00+03:00",
    status: "recruiting",
    format: "Solo, 1 соревнование",
    description: "Премиум одиночные мобильные соревнования по PUBG MOBILE до 100 игроков (старт от 50 участников). Оплата организационных услуг 1 000 ₽ (судейство, серверные мощности, модерация лобби). Фиксированное вознаграждение 28 000 ₽ учреждено организатором (1 место: 15 000 ₽, 2 место: 8 000 ₽, 3 место: 5 000 ₽) и не формируется из взносов.",
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
    minPlayers: 50,
    registeredCount: 0,
    startsAt: "2026-12-12T03:00:00+03:00",
    status: "soon",
    format: "Solo Resurgence, 1 катка",
    description: "Соревнования по Call of Duty: Warzone откроются скоро. Регистрация и размер вознаграждения станут доступны в ближайшее время.",
    entryFeeRub: 100,
  },
  {
    id: "fortnite-solo-001",
    title: "Fortnite Zero Build Cup",
    game: "fortnite",
    maxPlayers: 100,
    minPlayers: 50,
    registeredCount: 0,
    startsAt: "2026-12-12T03:00:00+03:00",
    status: "soon",
    format: "Solo Zero Build, 1 катка",
    description: "Соревнования по Fortnite откроются скоро. Регистрация и размер вознаграждения станут доступны в ближайшее время.",
    entryFeeRub: 100,
  },
  {
    id: "minecraft-hg-001",
    title: "Minecraft Hunger Games",
    game: "minecraft",
    maxPlayers: 24,
    minPlayers: 24,
    registeredCount: 0,
    startsAt: "2026-10-05T20:00:00+03:00",
    status: "recruiting",
    format: "Hunger Games, 24 участника, 1 сессия",
    description: "Minecraft: соревнование по режиму Hunger Games. Турнир рассчитан на фиксированное количество участников — ровно 24 человека. Формат проведения предполагает одну игровую сессию, в которой будет определен один победитель. Условия участия: Организационный взнос составляет 500 рублей. Победитель получает денежное вознаграждение в размере 2500 рублей.",
    entryFeeRub: 500,
    prizePoolRub: 2500,
    prizes: { 1: 2500, 2: 0, 3: 0 },
    winnerPerPlayerRub: 2500,
  },
  {
    id: "apex-solo-001",
    title: "Apex Legends Trios Showdown",
    game: "apex",
    maxPlayers: 60,
    minPlayers: 30,
    registeredCount: 0,
    startsAt: "2026-10-06T19:00:00+03:00",
    status: "recruiting",
    format: "Battle Royale, Trios",
    description: "Королевская битва по Apex Legends. Оплата организационных услуг 100 ₽ (судейство, платформа, подбор оппонентов). Фиксированное вознаграждение победителям 2 200 ₽ учреждено организатором соревнований (1-е: 1 000 ₽, 2-е: 700 ₽, 3-е: 500 ₽) и не формируется из взносов.",
    entryFeeRub: 100,
    prizePoolRub: 2200,
    prizes: { 1: 1000, 2: 700, 3: 500 },
  },
];

const DELETED_TOURNAMENTS_KEY = 'nb_deleted_tournaments_v1';

export function getDeletedTournamentIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_TOURNAMENTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markTournamentAsDeleted(tournamentId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedTournamentIds();
    set.add(tournamentId);
    localStorage.setItem(DELETED_TOURNAMENTS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to mark tournament as deleted:', e);
  }
}

export function unmarkTournamentAsDeleted(tournamentId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedTournamentIds();
    set.delete(tournamentId);
    localStorage.setItem(DELETED_TOURNAMENTS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to unmark tournament as deleted:', e);
  }
}

export function getStoredTournaments(): Tournament[] {
  const deletedIds = getDeletedTournamentIds();
  const data = localStorage.getItem('nb_tournaments_v19');
  if (!data) {
    const initial = INITIAL_TOURNAMENTS.filter((t) => !deletedIds.has(t.id));
    localStorage.setItem('nb_tournaments_v19', JSON.stringify(initial));
    return initial;
  }
  try {
    let list: Tournament[] = JSON.parse(data);
    // Remove any deleted tournaments or old custom duplicates
    list = list.filter((t) => {
      if (!t || !t.id) return false;
      if (deletedIds.has(t.id)) return false;
      if (t.id.startsWith('custom_apex') || t.id.startsWith('custom_mine')) return false;
      return true;
    });

    const existingIds = new Set(list.map((t) => t.id));
    for (const initT of INITIAL_TOURNAMENTS) {
      if (!existingIds.has(initT.id) && !deletedIds.has(initT.id)) {
        list.push(initT);
        existingIds.add(initT.id);
      }
    }

    // Deduplicate by ID
    const uniqueMap = new Map<string, Tournament>();
    list.forEach((t) => {
      if (!uniqueMap.has(t.id)) {
        uniqueMap.set(t.id, t);
      }
    });

    const cleaned = Array.from(uniqueMap.values()).map((t) => {
      const isCsOrDota = t.game === 'cs2' || t.game === 'dota2';
      const minPlayers =
        t.minPlayers ||
        (isCsOrDota ? 10 : t.game === 'minecraft' ? 24 : 50);
      return { ...t, minPlayers };
    });

    if (cleaned.length !== list.length) {
      localStorage.setItem('nb_tournaments_v19', JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return INITIAL_TOURNAMENTS.filter((t) => !deletedIds.has(t.id));
  }
}

export function saveTournaments(tournaments: Tournament[]) {
  const deletedIds = getDeletedTournamentIds();
  const clean = tournaments.filter((t) => {
    if (!t || !t.id) return false;
    if (deletedIds.has(t.id)) return false;
    if (t.id.startsWith('custom_apex') || t.id.startsWith('custom_mine')) return false;
    return true;
  });
  localStorage.setItem('nb_tournaments_v19', JSON.stringify(clean));
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
