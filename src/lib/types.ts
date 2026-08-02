export type GameId = "cs2" | "dota2" | "pubg" | "valorant";

export type TournamentStatus =
  | "recruiting"
  | "full"
  | "live"
  | "finished";

export type Tournament = {
  id: string;
  title: string;
  game: GameId;
  maxPlayers: number;
  registeredCount: number;
  startsAt: string;
  status: TournamentStatus;
  format: string;
  description: string;
};

export type Registration = {
  id: string;
  tournamentId: string;
  nickname: string;
  gameAccount: string;
  email: string;
  paidAt: string;
};
