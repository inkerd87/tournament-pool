export const ENTRY_FEE_RUB = 100;

export const DEFAULT_MAX_PLAYERS = 100;

/** Фиксированные призы за 1–3 места (₽) */
export const PRIZE_BY_PLACE: Record<1 | 2 | 3, number> = {
  1: 1000,
  2: 700,
  3: 500,
};

export const TOTAL_PRIZES_RUB =
  PRIZE_BY_PLACE[1] + PRIZE_BY_PLACE[2] + PRIZE_BY_PLACE[3];

export const SITE_NAME = "NightByte";

/** Баланс кошелька после пополнения через Robokassa */
export const STARTING_BALANCE_RUB = 0;
