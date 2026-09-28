export type BuiltinGameId = "cs2" | "dota2" | "pubg" | "pubg_mobile" | "warzone" | "fortnite";

export type GameId = BuiltinGameId | (string & {});

export type CustomGame = {
  id: string;
  name: string;
  short: string;
  accent: string;
  glow: string;
  iconUrl: string;
  tag?: string;
};

export type TournamentStatus =
  | "recruiting"
  | "full"
  | "live"
  | "finished"
  | "soon";

export type Tournament = {
  id: string;
  title: string;
  game: GameId;
  maxPlayers: number;
  minPlayers?: number;
  registeredCount: number;
  startsAt: string;
  status: TournamentStatus;
  format: string;
  description: string;
  entryFeeRub?: number;
  prizePoolRub?: number;
  winningPlacesCount?: number;
  prizes?: Record<number, number>;
  winnerPerPlayerRub?: number;
  isPremium?: boolean;
  customGame?: CustomGame;
};

export type Registration = {
  id: string;
  tournamentId: string;
  nickname: string;
  gameAccount: string;
  email: string;
  phone: string;
  paidAt: string;
};

export type TournamentLobby = {
  id: string;
  matchNumber: number;
  playerRegistrationIds: string[];
  map: string;
  mode: string;
  region: string;
  roomId: string;
  password: string;
  instructions: string[];
};

export type TournamentRuntime = {
  tournamentId: string;
  status: "live" | "finished";
  startedAt: string;
  lobbies: TournamentLobby[];
};

export type TournamentMatchAccess = {
  tournamentId: string;
  roomId: string;
  password: string;
  /** Необязательная ссылка (Discord, стрим, инструкция) */
  joinUrl?: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  nickname: string;
  phone?: string;
  balanceRub: number;
  createdAt: string;
};

export type MatchHistoryEntry = {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentTitle: string;
  game: GameId;
  /** 1–3 for podium; null if eliminated earlier */
  placement: number | null;
  kills: number;
  deaths: number;
  assists: number;
  prizeRub: number;
  entryFeeRub: number;
  playedAt: string;
};
