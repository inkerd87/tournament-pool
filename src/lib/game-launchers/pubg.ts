import type { Registration, TournamentLobby } from "@/lib/types";

function randomPassword(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Демо-лаунчер: генерирует данные custom match для PUBG. */
export function createPubgCustomMatch(params: {
  tournamentId: string;
  registrations: Registration[];
}): TournamentLobby {
  const suffix = params.tournamentId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  const roomId = `PA${suffix}${String(Date.now()).slice(-4)}`;

  return {
    id: crypto.randomUUID(),
    matchNumber: 1,
    playerRegistrationIds: params.registrations.map((r) => r.id),
    map: "Erangel",
    mode: "Solo TPP",
    region: "Europe",
    roomId,
    password: randomPassword(6),
    instructions: [
      "Откройте PUBG → Play → Custom Match → Join",
      "Введите Room ID и пароль с этой страницы",
      "Заходите с аккаунта, указанного при регистрации",
      "Матч стартует автоматически, когда все слоты заполнены",
    ],
  };
}
