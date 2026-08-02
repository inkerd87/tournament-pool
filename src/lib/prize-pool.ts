import {
  DEFAULT_MAX_PLAYERS,
  ENTRY_FEE_RUB,
  PRIZE_BY_PLACE,
  TOTAL_PRIZES_RUB,
} from "./constants";

export function poolFromPlayers(players: number): number {
  return players * ENTRY_FEE_RUB;
}

export function prizeRows() {
  return ([1, 2, 3] as const).map((place) => ({
    place,
    amount: PRIZE_BY_PLACE[place],
  }));
}

export function poolSummary(registered: number, maxPlayers: number) {
  const collected = poolFromPlayers(registered);
  const potential = poolFromPlayers(maxPlayers);
  const remainderAtFull = potential - TOTAL_PRIZES_RUB;

  return {
    entryFee: ENTRY_FEE_RUB,
    collected,
    potential,
    prizesPaid: TOTAL_PRIZES_RUB,
    remainderAtFull,
    slotsLeft: Math.max(0, maxPlayers - registered),
    fillPercent: Math.min(100, Math.round((registered / maxPlayers) * 100)),
  };
}

export function defaultPotentialPool(maxPlayers = DEFAULT_MAX_PLAYERS) {
  return poolFromPlayers(maxPlayers);
}
