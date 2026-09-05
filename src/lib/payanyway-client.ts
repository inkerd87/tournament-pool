/**
 * Интеграция с PayAnyWay для самозанятых (НКО МОНЕТА)
 */

// Прямая ссылка на форму оплаты / витрину PayAnyWay Self
export const PAYANYWAY_SHOWCASE_URL = 'https://self.payanyway.ru/17886374434960';
export const PAYANYWAY_ACCOUNT_ID = '500000022686';
export const PAYANYWAY_FORM_ID = '17886374434960';

export function getPayAnyWayCheckoutUrl(): string {
  return PAYANYWAY_SHOWCASE_URL;
}
