import CryptoJS from 'crypto-js';

/**
 * FreeKassa Payment Gateway Integration for NightByte
 * Shop ID (Merchant ID): 75872
 * Secret 1: владимир (Формирование формы оплаты)
 * Secret 2: данила (Проверка оповещения Result URL)
 */

export const FREEKASSA_MERCHANT_ID = '75872';
export const FREEKASSA_SECRET_1 = 'владимир';
export const FREEKASSA_SECRET_2 = 'данила';
export const FREEKASSA_CHECKOUT_URL = 'https://pay.freekassa.net/';

export interface FreeKassaPaymentOptions {
  amount: number;
  orderId: string;
  email?: string;
  phone?: string;
  currency?: string; // 'RUB' by default
  customParams?: Record<string, string>;
}

/**
 * Расчет MD5 подписи для формы оплаты FreeKassa:
 * md5(merchant_id:amount:secret_word_1:currency:order_id)
 */
export function generateFreeKassaSignature(
  merchantId: string,
  amount: number | string,
  secret1: string,
  currency: string,
  orderId: string
): string {
  const signString = `${merchantId}:${amount}:${secret1}:${currency}:${orderId}`;
  return CryptoJS.MD5(signString).toString().toLowerCase();
}

/**
 * Генерация полной ссылки для перехода на платежную страницу FreeKassa
 */
export function createFreeKassaPaymentUrl(options: FreeKassaPaymentOptions): string {
  const {
    amount,
    orderId,
    email = '',
    phone = '',
    currency = 'RUB',
    customParams = {},
  } = options;

  const sign = generateFreeKassaSignature(
    FREEKASSA_MERCHANT_ID,
    amount,
    FREEKASSA_SECRET_1,
    currency,
    orderId
  );

  const params = new URLSearchParams();
  params.set('m', FREEKASSA_MERCHANT_ID);
  params.set('oa', String(amount));
  params.set('currency', currency);
  params.set('o', orderId);
  params.set('s', sign);
  params.set('lang', 'ru');

  if (email.trim()) {
    params.set('em', email.trim());
  }

  if (phone.trim()) {
    params.set('phone', phone.trim());
  }

  // Передаем дополнительные пользовательские параметры (us_...)
  // FreeKassa сохраняет параметры с префиксом us_ и возвращает их в Result URL
  for (const [key, value] of Object.entries(customParams)) {
    const formattedKey = key.startsWith('us_') ? key : `us_${key}`;
    if (value) {
      params.set(formattedKey, value);
    }
  }

  return `${FREEKASSA_CHECKOUT_URL}?${params.toString()}`;
}
