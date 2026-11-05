import { Tournament, Registration, User, MatchHistoryEntry, TournamentMatchAccess } from './types';
import { DEFAULT_MAX_PLAYERS, ENTRY_FEE_RUB } from './constants';

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    "id": "pubg_mobile-muu83g2c",
    "title": "PUBG MOBILE",
    "game": "pubg_mobile",
    "maxPlayers": 100,
    "minPlayers": 50,
    "registeredCount": 0,
    "startsAt": "2026-10-20T17:00:00+00:00",
    "status": "recruiting",
    "format": "Solo, 1 соревнование",
    "description": "Одиночные мобильные соревнования по PUBG MOBILE до 100 игроков (старт от 50 участников). Оплата организационных услуг 100 ₽. Фиксированное вознаграждение 3 000 ₽ учреждено организатором (1-е: 1 500 ₽, 2-е: 1000 ₽, 3-е: 500 ₽).",
    "entryFeeRub": 100,
    "prizePoolRub": 3000,
    "winningPlacesCount": 3,
    "prizes": {
      "1": 1500,
      "2": 1000,
      "3": 500
    },
    "isPremium": false
  },
  {
    "id": "pubg-muu82lh2",
    "title": "PUBG: BATTLEGROUNDS",
    "game": "pubg",
    "maxPlayers": 100,
    "minPlayers": 50,
    "registeredCount": 0,
    "startsAt": "2026-10-20T17:00:00+00:00",
    "status": "recruiting",
    "format": "Solo, 1 соревнование",
    "description": "Одиночные соревнования до 100 игроков (старт от 50 участников). Оплата организационных услуг 100 ₽. Фиксированное вознаграждение 3 000 ₽ учреждено организатором (1-е: 1 500 ₽, 2-е: 1000 ₽, 3-е: 500 ₽).",
    "entryFeeRub": 100,
    "prizePoolRub": 3000,
    "winningPlacesCount": 3,
    "prizes": {
      "1": 1500,
      "2": 1000,
      "3": 500
    },
    "isPremium": false
  },
  {
    "id": "pubg-mobile-premium-001",
    "title": "PUBG Mobile Premium",
    "game": "pubg_mobile",
    "maxPlayers": 100,
    "minPlayers": 50,
    "registeredCount": 0,
    "startsAt": "2026-10-20T18:30:00+00:00",
    "status": "recruiting",
    "format": "Solo, 1 соревнование",
    "description": "⭐ ПРЕМИУМ-РЕЖИМ PUBG MOBILE! Повышенные ставки на Эрангеле. Взнос за участие: 1 000 ₽. Набор участников: от 50 до 100 человек. Призовой фонд 28 000 ₽: 1 место — 15 000 ₽, 2 место — 8 000 ₽, 3 место — 5 000 ₽.",
    "entryFeeRub": 1000,
    "prizePoolRub": 30000,
    "winningPlacesCount": 3,
    "prizes": {
      "1": 15000,
      "2": 10000,
      "3": 5000
    },
    "isPremium": true
  },
  {
    "id": "pubg-premium-001",
    "title": "PUBG  Premium",
    "game": "pubg",
    "maxPlayers": 100,
    "minPlayers": 50,
    "registeredCount": 0,
    "startsAt": "2026-10-20T18:30:00+00:00",
    "status": "recruiting",
    "format": "Solo, 1 соревнование",
    "description": "Премиум одиночные соревнования до 100 игроков (старт от 50 участников). Оплата организационных услуг 1 000 ₽ (судейство, серверные мощности, модерация лобби). Фиксированное вознаграждение 28 000 ₽ учреждено организатором (1 место: 15 000 ₽, 2 место: 8 000 ₽, 3 место: 5 000 ₽) и не формируется из взносов.",
    "entryFeeRub": 1000,
    "prizePoolRub": 30000,
    "winningPlacesCount": 3,
    "prizes": {
      "1": 15000,
      "2": 10000,
      "3": 5000
    },
    "isPremium": true
  },
  {
    "id": "dota2-open-001",
    "title": "Dota 2 5v5 Battle",
    "game": "dota2",
    "maxPlayers": 10,
    "minPlayers": 10,
    "registeredCount": 0,
    "startsAt": "2026-10-21T17:00:00+00:00",
    "status": "recruiting",
    "format": "5v5, Captains Mode — Регламент соревнований",
    "description": "Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, минимум 10 участников). Оплата организационных услуг 1 500 ₽ с игрока (судейство, платформа, подбор оппонентов). Фиксированное вознаграждение победившей команде 12 000 ₽ (по 2 400 ₽ каждому игроку) учреждено организатором соревнований за спортивные достижения и не зависит от взносов.",
    "entryFeeRub": 1500,
    "prizePoolRub": 12000,
    "winningPlacesCount": 1,
    "prizes": {
      "1": 12000
    },
    "winnerPerPlayerRub": 2400,
    "isPremium": false
  },
  {
    "id": "apex-mv0vem7l",
    "title": "Apex Legends Premium",
    "game": "apex",
    "maxPlayers": 60,
    "minPlayers": 60,
    "registeredCount": 0,
    "startsAt": "2026-10-21T19:30:00+00:00",
    "status": "recruiting",
    "format": "Battle Royale, Trios",
    "description": "Королевская битва в Apex Legends. Оплата организационных услуг 1000 ₽. Фиксированное вознаграждение 30 000₽ учреждено организатором (1-е: 15 000 ₽, 2-е: 10 000 ₽, 3-е: 5 000 ₽). Сумма вознаграждения в каждой команде делится на 3.",
    "entryFeeRub": 1000,
    "prizePoolRub": 30000,
    "winningPlacesCount": 3,
    "prizes": {
      "1": 15000,
      "2": 10000,
      "3": 5000
    },
    "isPremium": true
  },
  {
    "id": "apex-mv0vcntc",
    "title": "Apex Legends",
    "game": "apex",
    "maxPlayers": 60,
    "minPlayers": 60,
    "registeredCount": 0,
    "startsAt": "2026-10-21T19:30:00+00:00",
    "status": "recruiting",
    "format": "Battle Royale, Trios",
    "description": "Королевская битва в Apex Legends. Оплата организационных услуг 200 ₽. Фиксированное вознаграждение 6 600 ₽ учреждено организатором (1-е: 6 600 ₽)\nПо 2 200 на человека.",
    "entryFeeRub": 200,
    "prizePoolRub": 6600,
    "winningPlacesCount": 1,
    "prizes": {
      "1": 6600
    },
    "isPremium": false
  },
  {
    "id": "minecraft-mv8knuh3",
    "title": "Minecraft",
    "game": "minecraft",
    "maxPlayers": 24,
    "minPlayers": 24,
    "registeredCount": 0,
    "startsAt": "2026-10-22T16:00:00+00:00",
    "status": "recruiting",
    "format": "Hunger Games, 24 участника, 1 сессия",
    "description": "Minecraft: соревнование по режиму Hunger Games. Турнир рассчитан на фиксированное количество участников — ровно 24 человека. Формат проведения предполагает одну игровую сессию, в которой будет определен один победитель. Условия участия: Организационный взнос составляет  500 рублей. Победитель получает денежное вознаграждение в размере 2 500 рублей.",
    "entryFeeRub": 500,
    "prizePoolRub": 2500,
    "winningPlacesCount": 1,
    "prizes": {
      "1": 2500
    },
    "isPremium": false
  },
  {
    "id": "minecraft-mv8kjlc3",
    "title": "Minecraft Premium",
    "game": "minecraft",
    "maxPlayers": 24,
    "minPlayers": 24,
    "registeredCount": 0,
    "startsAt": "2026-10-22T17:00:00+00:00",
    "status": "recruiting",
    "format": "Hunger Games, 24 участника, 1 сессия",
    "description": "Minecraft: соревнование по режиму Hunger Games. Турнир рассчитан на фиксированное количество участников — ровно 24 человека. Формат проведения предполагает одну игровую сессию, в которой будет определен один победитель. Условия участия: Организационный взнос составляет 1 000 рублей. Победитель получает денежное вознаграждение в размере 6 000 рублей.",
    "entryFeeRub": 1000,
    "prizePoolRub": 6000,
    "winningPlacesCount": 1,
    "prizes": {
      "1": 6000
    },
    "isPremium": true
  },
  {
    "id": "cs2-weekly-001",
    "title": "CS2 5v5",
    "game": "cs2",
    "maxPlayers": 10,
    "minPlayers": 10,
    "registeredCount": 0,
    "startsAt": "2026-11-06T17:00:00+00:00",
    "status": "soon",
    "format": "5v5, BO1 — Регламент соревнований",
    "description": "Командные киберспортивные соревнования 5 на 5 (2 команды по 5 игроков, минимум 10 участников). Оплата организационных услуг 1 500 ₽ с игрока (судейство, платформа, подбор оппонентов). Фиксированное вознаграждение победившей команде 12 000 ₽ (по 2 400 ₽ каждому игроку) учреждено организатором соревнований за спортивные достижения и не зависит от взносов.",
    "entryFeeRub": 1500,
    "prizePoolRub": 12000,
    "winningPlacesCount": 1,
    "prizes": {
      "1": 12000
    },
    "winnerPerPlayerRub": 2400,
    "isPremium": false
  },
  {
    "id": "fortnite-solo-001",
    "title": "Fortnite Zero Build Cup",
    "game": "fortnite",
    "maxPlayers": 100,
    "minPlayers": 50,
    "registeredCount": 0,
    "startsAt": "2026-12-11T21:00:00+00:00",
    "status": "soon",
    "format": "Solo Zero Build, 1 соревнование",
    "description": "Соревнования по Fortnite откроются скоро. Регистрация и размер вознаграждения станут доступны в ближайшее время.",
    "entryFeeRub": 100,
    "prizePoolRub": 3000,
    "winningPlacesCount": 3,
    "prizes": {
      "1": 1500,
      "2": 1000,
      "3": 700
    },
    "isPremium": false
  },
  {
    "id": "warzone-solo-001",
    "title": "Call of Duty: Warzone",
    "game": "warzone",
    "maxPlayers": 150,
    "minPlayers": 50,
    "registeredCount": 0,
    "startsAt": "2026-12-11T21:00:00+00:00",
    "status": "soon",
    "format": "Solo Resurgence, 1 соревнование",
    "description": "Соревнования по Call of Duty: Warzone откроются скоро. Регистрация и размер вознаграждения станут доступны в ближайшее время.",
    "entryFeeRub": 100,
    "prizePoolRub": 3000,
    "winningPlacesCount": 3,
    "prizes": {
      "1": 1500,
      "2": 1000,
      "3": 500
    },
    "isPremium": false
  }
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
    const arr = Array.from(set);
    localStorage.setItem(DELETED_TOURNAMENTS_KEY, JSON.stringify(arr));
    saveToServerStorage('deleted_tournaments', arr);
  } catch (e) {
    console.warn('Failed to mark tournament as deleted:', e);
  }
}

export function unmarkTournamentAsDeleted(tournamentId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedTournamentIds();
    set.delete(tournamentId);
    const arr = Array.from(set);
    localStorage.setItem(DELETED_TOURNAMENTS_KEY, JSON.stringify(arr));
    saveToServerStorage('deleted_tournaments', arr);
  } catch (e) {
    console.warn('Failed to unmark tournament as deleted:', e);
  }
}

export function deduplicateTournaments(tournaments: Tournament[]): Tournament[] {
  const deletedIds = getDeletedTournamentIds();
  const valid = tournaments.filter((t) => {
    if (!t || !t.id) return false;
    if (deletedIds.has(t.id)) return false;
    if (t.id.startsWith('custom_apex') || t.id.startsWith('custom_mine')) return false;
    return true;
  });

  // Deduplicate strictly by unique tournament ID
  const uniqueMap = new Map<string, Tournament>();
  valid.forEach((t) => {
    if (!uniqueMap.has(t.id)) {
      uniqueMap.set(t.id, t);
    }
  });

  return Array.from(uniqueMap.values()).map((t) => {
    const isCsOrDota = t.game === 'cs2' || t.game === 'dota2';
    const minPlayers =
      t.minPlayers ||
      (isCsOrDota ? 10 : t.game === 'minecraft' ? 24 : 50);

    let winningPlacesCount = t.winningPlacesCount;
    if (typeof winningPlacesCount !== 'number' || winningPlacesCount < 1) {
      if (t.prizes && typeof t.prizes === 'object') {
        const nonZeroPlaces = Object.keys(t.prizes)
          .map(Number)
          .filter((k) => !isNaN(k) && Number((t.prizes as any)[k]) > 0);
        if (nonZeroPlaces.length > 0) {
          winningPlacesCount = Math.max(...nonZeroPlaces);
        }
      }
      if (!winningPlacesCount) {
        winningPlacesCount = isCsOrDota || t.game === 'minecraft' ? 1 : 3;
      }
    }

    return { ...t, minPlayers, winningPlacesCount };
  });
}

const STORAGE_TOURNAMENTS_KEY = 'nb_tournaments_v21';

export function getStoredTournaments(): Tournament[] {
  const deletedIds = getDeletedTournamentIds();
  let rawData = localStorage.getItem(STORAGE_TOURNAMENTS_KEY);

  if (!rawData) {
    const initial = deduplicateTournaments(INITIAL_TOURNAMENTS.filter((t) => !deletedIds.has(t.id)));
    try {
      localStorage.setItem(STORAGE_TOURNAMENTS_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
  }

  try {
    const parsed: Tournament[] = JSON.parse(rawData);
    const cleaned = deduplicateTournaments(parsed);
    return cleaned;
  } catch {
    return deduplicateTournaments(INITIAL_TOURNAMENTS.filter((t) => !deletedIds.has(t.id)));
  }
}

export async function saveToServerStorage(key: string, data: any): Promise<boolean> {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return false;
  const body = JSON.stringify(data);
  try {
    const res = await fetch(`/api/storage/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (res.ok) return true;
    if (res.status === 404) {
      const fallbackRes = await fetch(`/api/storage.php?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return fallbackRes.ok;
    }
  } catch {
    try {
      const fallbackRes = await fetch(`/api/storage.php?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return fallbackRes.ok;
    } catch {}
  }
  return false;
}

export async function fetchServerStorageBundle(): Promise<any | null> {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return null;
  try {
    const res = await fetch('/api/storage/bundle', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data;
    }
    const fb = await fetch('/api/storage.php?key=bundle', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (fb.ok) {
      const data = await fb.json();
      if (data && data.ok) return data;
    }
  } catch {}
  return null;
}

export function saveTournaments(tournaments: Tournament[]) {
  const clean = deduplicateTournaments(tournaments);
  localStorage.setItem(STORAGE_TOURNAMENTS_KEY, JSON.stringify(clean));
  localStorage.setItem('nb_last_sync_time', String(Date.now()));
}

export function saveTournamentsToServer(tournaments: Tournament[]) {
  const clean = deduplicateTournaments(tournaments);
  localStorage.setItem(STORAGE_TOURNAMENTS_KEY, JSON.stringify(clean));
  localStorage.setItem('nb_last_sync_time', String(Date.now()));
  saveToServerStorage('tournaments', clean);
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

export function saveRegistrationsToServer(regs: Registration[]) {
  localStorage.setItem('nb_registrations_v4', JSON.stringify(regs));
  saveToServerStorage('registrations', regs);
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

export function saveMatchesToServer(matches: Record<string, TournamentMatchAccess>) {
  localStorage.setItem('nb_matches', JSON.stringify(matches));
  saveToServerStorage('matches', matches);
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
