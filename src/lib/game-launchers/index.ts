import type { GameId, Registration, TournamentLobby } from "@/lib/types";
import { createPubgCustomMatch } from "./pubg";

function randomPassword(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function createCs2Lobby(params: {
  tournamentId: string;
  registrations: Registration[];
}): TournamentLobby {
  const suffix = params.tournamentId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  return {
    id: crypto.randomUUID(),
    matchNumber: 1,
    playerRegistrationIds: params.registrations.map((r) => r.id),
    map: "de_mirage",
    mode: "5v5 Competitive",
    region: "EU West",
    roomId: `connect nb-${suffix.toLowerCase()}.nightbyte.demo`,
    password: randomPassword(6),
    instructions: [
      "Откройте CS2 → Play → Community Servers",
      "В консоли (~) вставьте команду connect из поля Room ID",
      "Введите пароль лобби при подключении",
      "Играйте с аккаунта Steam, указанного при регистрации",
    ],
  };
}

function createDota2Lobby(params: {
  tournamentId: string;
  registrations: Registration[];
}): TournamentLobby {
  const suffix = params.tournamentId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  return {
    id: crypto.randomUUID(),
    matchNumber: 1,
    playerRegistrationIds: params.registrations.map((r) => r.id),
    map: "Captain's Mode",
    mode: "5v5",
    region: "Europe",
    roomId: `NightByte_${suffix}`,
    password: randomPassword(6),
    instructions: [
      "Dota 2 → Play → Browse Lobbies",
      "Найдите лобби по имени (Room ID) и введите пароль",
      "Примите приглашение капитана, если играете стеком",
    ],
  };
}

function createWarzoneLobby(params: {
  tournamentId: string;
  registrations: Registration[];
}): TournamentLobby {
  const suffix = params.tournamentId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  return {
    id: crypto.randomUUID(),
    matchNumber: 1,
    playerRegistrationIds: params.registrations.map((r) => r.id),
    map: "Urzikstan / Rebirth Island",
    mode: "Battle Royale / Resurgence",
    region: "Europe",
    roomId: `WZ-NB-${suffix}`,
    password: randomPassword(6),
    instructions: [
      "Запустите Call of Duty: Warzone",
      "Перейдите в Private Match (Закрытый матч) → Join",
      "Введите код лобби (Room ID) и пароль",
      "Играйте с Activision ID, указанного при регистрации",
    ],
  };
}

function createFortniteLobby(params: {
  tournamentId: string;
  registrations: Registration[];
}): TournamentLobby {
  const suffix = params.tournamentId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  return {
    id: crypto.randomUUID(),
    matchNumber: 1,
    playerRegistrationIds: params.registrations.map((r) => r.id),
    map: "Battle Royale Island",
    mode: "Solo Zero Build",
    region: "Europe",
    roomId: `FN-NB-${suffix}`,
    password: randomPassword(6),
    instructions: [
      "Запустите Fortnite",
      "Выберите режим 'Королевская битва' (или 'Нулевая высота')",
      "В настройках подбора нажмите 'Свой ключ' (Custom Key)",
      "Введите ключ лобби из поля Room ID и нажмите Играть",
    ],
  };
}

const LAUNCHERS: Record<
  GameId,
  (params: { tournamentId: string; registrations: Registration[] }) => TournamentLobby
> = {
  pubg: createPubgCustomMatch,
  cs2: createCs2Lobby,
  dota2: createDota2Lobby,
  warzone: createWarzoneLobby,
  fortnite: createFortniteLobby,
};

export function createGameLobby(
  game: GameId,
  params: { tournamentId: string; registrations: Registration[] },
): TournamentLobby {
  return LAUNCHERS[game](params);
}
