/**
 * Интеграция с PayAnyWay для самозанятых (НКО МОНЕТА)
 * Поддержка отдельных витрин/товаров под каждую игру и сумму
 */

export const PAYANYWAY_DEFAULT_URL = 'https://self.payanyway.ru/17886374434960';
export const PAYANYWAY_SHOWCASE_URL = PAYANYWAY_DEFAULT_URL;
export const PAYANYWAY_ACCOUNT_ID = '500000022686';

// 1. Ссылки на витрины / товары для конкретных турниров
export const PAYANYWAY_TOURNAMENT_URLS: Record<string, string> = {
  // CS2 5v5 — Взнос 1 500 ₽
  'cs2-weekly-001': 'https://self.payanyway.ru/17886374434960',
  // Dota 2 5v5 — Взнос 1 500 ₽
  'dota2-open-001': 'https://self.payanyway.ru/17886374434960',
  // PUBG Solo Showdown — Взнос 100 ₽
  'pubg-solo-001': 'https://self.payanyway.ru/17886374434960',
  // PUBG Solo Premium Showdown — Взнос 1 000 ₽
  'pubg-premium-001': 'https://self.payanyway.ru/17886374434960',
  // Warzone — Взнос 100 ₽
  'warzone-solo-001': 'https://self.payanyway.ru/17886374434960',
  // Fortnite — Взнос 100 ₽
  'fortnite-solo-001': 'https://self.payanyway.ru/17886374434960',
};

// 2. Ссылки на фиксированные пакеты пополнения баланса в личном кабинете
export const PAYANYWAY_TOPUP_URLS: Record<number, string> = {
  10: 'https://self.payanyway.ru/17886374434960', // 10 ₽ (текущая готовая форма)
  100: 'https://self.payanyway.ru/17886374434960',
  300: 'https://self.payanyway.ru/17886374434960',
  500: 'https://self.payanyway.ru/17886374434960',
  1000: 'https://self.payanyway.ru/17886374434960',
  1500: 'https://self.payanyway.ru/17886374434960',
};

/**
 * Получить URL оплаты для конкретного турнира
 */
export function getTournamentCheckoutUrl(tournamentId: string, feeRub?: number): string {
  if (PAYANYWAY_TOURNAMENT_URLS[tournamentId]) {
    return PAYANYWAY_TOURNAMENT_URLS[tournamentId];
  }
  if (feeRub && PAYANYWAY_TOPUP_URLS[feeRub]) {
    return PAYANYWAY_TOPUP_URLS[feeRub];
  }
  return PAYANYWAY_DEFAULT_URL;
}

/**
 * Получить URL оплаты для пополнения кошелька на определенную сумму
 */
export function getTopUpCheckoutUrl(amountRub: number): string {
  return PAYANYWAY_TOPUP_URLS[amountRub] || PAYANYWAY_DEFAULT_URL;
}

export function getPayAnyWayCheckoutUrl(): string {
  return PAYANYWAY_DEFAULT_URL;
}
