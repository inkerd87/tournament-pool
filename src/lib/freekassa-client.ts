import CryptoJS from 'crypto-js';

/**
 * Интеграция с FreeKassa (FK) для платформы NightByte
 * Приём платежей через СБП, карты МИР/Visa/Mastercard, электронные кошельки и криптовалюту
 * ID Магазина (Кассы): 75872
 * Секретное слово 1: владимир (для подписи формы оплаты)
 * Секретное слово 2: данила (для проверки оповещений Result URL)
 * API Ключ: bc33c022a82f116ee612de14ea5f8e40
 */

export const FREEKASSA_SHOP_ID = '75872';
export const FREEKASSA_SECRET_1 = 'владимир';
export const FREEKASSA_PAYMENT_BASE_URL = 'https://pay.duckgo.io/';

export const FREEKASSA_DEFAULT_RETURN_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/payment/return`
  : 'https://nightbyteonline.ru/payment/return';

export const ALLOWED_TOPUP_AMOUNTS = [100, 1000, 1500] as const;
export type AllowedTopUpAmount = (typeof ALLOWED_TOPUP_AMOUNTS)[number];

export interface FreeKassaPaymentPayload {
  amount: number;
  email: string;
  phone?: string;
  userId?: string;
  tournamentId?: string;
  tournamentTitle?: string;
  nickname?: string;
  gameAccount?: string;
  password?: string;
  type: 'topup' | 'registration';
  description?: string;
}

export interface FreeKassaCreateResponse {
  success: boolean;
  confirmationUrl: string;
  orderId: string;
  isTestMode?: boolean;
  error?: string;
}

/**
 * Генерация ссылки для оплаты во FreeKassa (SCI)
 * Рассчитывает MD5 подпись прямо в браузере для мгновенного редиректа в 0 мс
 * Формула FreeKassa SCI: md5(shopId:amount:secret1:currency:orderId)
 */
export function buildFreeKassaPaymentUrl(payload: FreeKassaPaymentPayload): {
  url: string;
  orderId: string;
} {
  const orderId = 'nb_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
  const amountStr = payload.amount % 1 === 0
    ? String(payload.amount)
    : payload.amount.toFixed(2);
  const currency = 'RUB';

  // md5(merchant_id:order_amount:secret_word:currency:order_id)
  const signString = `${FREEKASSA_SHOP_ID}:${amountStr}:${FREEKASSA_SECRET_1}:${currency}:${orderId}`;
  const sign = CryptoJS.MD5(signString).toString().toLowerCase();

  const params = new URLSearchParams();
  params.set('m', FREEKASSA_SHOP_ID);
  params.set('oa', amountStr);
  params.set('o', orderId);
  params.set('s', sign);
  params.set('currency', currency);
  params.set('lang', 'ru');

  if (payload.email && payload.email.trim()) {
    params.set('em', payload.email.trim());
  }
  if (payload.phone && payload.phone.trim()) {
    params.set('phone', payload.phone.trim().replace(/[^\d+]/g, ''));
  }
  if (payload.userId && payload.userId.trim()) {
    params.set('us_userId', payload.userId.trim());
  }
  params.set('us_type', payload.type);
  if (payload.tournamentId && payload.tournamentId.trim()) {
    params.set('us_tournamentId', payload.tournamentId.trim());
  }
  if (payload.nickname && payload.nickname.trim()) {
    params.set('us_nickname', payload.nickname.trim());
  }
  if (payload.gameAccount && payload.gameAccount.trim()) {
    params.set('us_gameAccount', payload.gameAccount.trim());
  }

  return {
    url: `${FREEKASSA_PAYMENT_BASE_URL}?${params.toString()}`,
    orderId,
  };
}

/**
 * Создание платёжной сессии и подготовка к редиректу
 */
export async function createFreeKassaPayment(
  payload: FreeKassaPaymentPayload
): Promise<FreeKassaCreateResponse> {
  const { url: fallbackUrl, orderId } = buildFreeKassaPaymentUrl(payload);

  // 1. Сохраняем состояние ожидающего платежа в localStorage для обработки после возврата
  if (payload.type === 'registration') {
    localStorage.setItem(
      'nb_pending_registration',
      JSON.stringify({
        orderId,
        tournamentId: payload.tournamentId,
        tournamentTitle: payload.tournamentTitle || '',
        nickname: payload.nickname || '',
        gameAccount: payload.gameAccount || '',
        email: payload.email,
        phone: payload.phone || '',
        password: payload.password || '',
        amount: payload.amount,
        paymentGateway: 'freekassa',
        createdAt: Date.now(),
      })
    );
  } else {
    localStorage.setItem(
      'nb_pending_topup',
      JSON.stringify({
        orderId,
        amount: payload.amount,
        email: payload.email,
        phone: payload.phone || '',
        paymentGateway: 'freekassa',
        createdAt: Date.now(),
      })
    );
  }

  // 2. Вызываем серверный обработчик для создания официального заказа через FreeKassa API v1
  try {
    const res = await fetch('/freekassa-create.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: payload.amount,
        email: payload.email,
        phone: payload.phone,
        tournamentId: payload.tournamentId,
        tournamentTitle: payload.tournamentTitle,
        nickname: payload.nickname,
        gameAccount: payload.gameAccount,
        userId: payload.userId,
        type: payload.type,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.confirmationUrl) {
        let cleanUrl = data.confirmationUrl;
        cleanUrl = cleanUrl.replace('https://pay.freekassa.net', 'https://pay.duckgo.io');
        cleanUrl = cleanUrl.replace('https://pay.freekassa.ru', 'https://pay.duckgo.io');
        return {
          success: true,
          confirmationUrl: cleanUrl,
          orderId: data.orderId || orderId,
        };
      }
    }
  } catch (err) {
    console.warn('[FreeKassa] API backend order creation error, using fallback:', err);
  }

  // 3. Fallback: прямая ссылка FreeKassa
  return {
    success: true,
    confirmationUrl: fallbackUrl,
    orderId,
  };
}

/**
 * Хелпер для запуска оплаты соревнования через FreeKassa
 */
export async function initiateTournamentPayment(params: {
  tournamentId: string;
  tournamentTitle: string;
  amount: number;
  email: string;
  phone?: string;
  userId?: string;
  nickname: string;
  gameAccount: string;
  password?: string;
}): Promise<void> {
  const result = await createFreeKassaPayment({
    ...params,
    type: 'registration',
  });

  if (result.success && result.confirmationUrl) {
    window.location.href = result.confirmationUrl;
  } else {
    throw new Error(result.error || 'Не удалось создать платёж в FreeKassa');
  }
}

/**
 * Хелпер для запуска пополнения баланса через FreeKassa
 */
export async function initiateTopUpPayment(params: {
  amount: number;
  email: string;
  phone?: string;
  userId?: string;
}): Promise<void> {
  const result = await createFreeKassaPayment({
    ...params,
    type: 'topup',
  });

  if (result.success && result.confirmationUrl) {
    window.location.href = result.confirmationUrl;
  } else {
    throw new Error(result.error || 'Не удалось создать платёж в FreeKassa');
  }
}
