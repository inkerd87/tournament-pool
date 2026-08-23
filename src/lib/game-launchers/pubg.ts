import type { Registration, TournamentLobby } from "@/lib/types";

/** PUBG Custom Match: Room ID и пароль — только цифры. */
function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String(Math.floor(Math.random() * 10));
  }
  if (out[0] === "0") {
    out = String(1 + Math.floor(Math.random() * 9)) + out.slice(1);
  }
  return out;
}

function pubgRoomId(tournamentId: string): string {
  const fromTournament = tournamentId.replace(/\D/g, "").padStart(4, "0").slice(-4);
  const fromTime = String(Date.now()).slice(-4);
  return `${fromTournament}${fromTime}`;
}

/** Демо-лаунчер: генерирует данные custom match для PUBG. */
export function createPubgCustomMatch(params: {
  tournamentId: string;
  registrations: Registration[];
}): TournamentLobby {
  const roomId = pubgRoomId(params.tournamentId);
  const password = randomDigits(6);

  return {
    id: crypto.randomUUID(),
    matchNumber: 1,
    playerRegistrationIds: params.registrations.map((r) => r.id),
    map: "Erangel",
    mode: "Solo TPP",
    region: "Europe",
    roomId,
    password,
    instructions: [
      "Откройте PUBG → Play → Custom Match → Join",
      "В поле Room ID введите только цифры (без букв и пробелов)",
      "Пароль — тоже только цифры",
      "Заходите с аккаунта, указанного при регистрации",
    ],
  };
}
