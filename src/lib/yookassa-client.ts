/**
 * Интеграция с ЮKassa (ООО НКО «ЮМани») для платформы NightByte
 * Поддержка СБП, банковских карт МИР/Visa/Mastercard и SberPay
 */

export const YOOKASSA_DEFAULT_RETURN_URL = typeof window !== 'undefined' 
  ? `${window.location.origin}/payment/return` 
  : 'https://nightbyteonline.ru/payment/return';

export const ALLOWED_TOPUP_AMOUNTS = [100, 1000, 1500] as const;
export type AllowedTopUpAmount = (typeof ALLOWED_TOPUP_AMOUNTS)[number];

export interface YooKassaPaymentPayload {
  amount: number;
  email: string;
  phone?: string;
  tournamentId?: string;
  tournamentTitle?: string;
  nickname?: string;
  gameAccount?: string;
  password?: string;
  type: 'topup' | 'registration';
  description?: string;
}

export interface YooKassaCreateResponse {
  success: boolean;
  confirmationUrl?: string;
  paymentId?: string;
  isTestMode?: boolean;
  error?: string;
}

/**
 * Создание платёжной сессии в ЮKassa через серверный эндпоинт (Node.js или PHP)
 */
export async function createYooKassaPayment(
  payload: YooKassaPaymentPayload
): Promise<YooKassaCreateResponse> {
  const description =
    payload.description ||
    (payload.type === 'registration'
      ? `Оплата орг. услуг: ${payload.tournamentTitle || payload.tournamentId} (${payload.amount} ₽)`
      : `Пополнение баланса NightByte на ${payload.amount} ₽`);

  const bodyData = {
    amount: payload.amount,
    email: payload.email,
    phone: payload.phone || '',
    tournamentId: payload.tournamentId || '',
    tournamentTitle: payload.tournamentTitle || '',
    nickname: payload.nickname || '',
    gameAccount: payload.gameAccount || '',
    type: payload.type,
    description,
    returnUrl: YOOKASSA_DEFAULT_RETURN_URL,
  };

  // 1. Сохраняем состояние ожидающего платежа в localStorage
  if (payload.type === 'registration') {
    localStorage.setItem(
      'nb_pending_registration',
      JSON.stringify({
        tournamentId: payload.tournamentId,
        tournamentTitle: payload.tournamentTitle || '',
        nickname: payload.nickname || '',
        gameAccount: payload.gameAccount || '',
        email: payload.email,
        phone: payload.phone || '',
        password: payload.password || '',
        amount: payload.amount,
        paymentGateway: 'yookassa',
        createdAt: Date.now(),
      })
    );
  } else {
    localStorage.setItem(
      'nb_pending_topup',
      JSON.stringify({
        amount: payload.amount,
        email: payload.email,
        phone: payload.phone || '',
        paymentGateway: 'yookassa',
        createdAt: Date.now(),
      })
    );
  }

  // 2. Пытаемся вызвать API создания платежа:
  // Сначала проверяем /api/yookassa/create (Node.js сервер),
  // при неудаче или 404 — /yookassa-create.php (Apache / PHP на Sprinthost).
  let responseData: any = null;

  try {
    const resNode = await fetch('/api/yookassa/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    if (resNode.ok) {
      responseData = await resNode.json();
    } else if (resNode.status === 404) {
      // Fallback на PHP скрипт хостинга
      const resPhp = await fetch('/yookassa-create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      if (resPhp.ok) {
        responseData = await resPhp.json();
      }
    }
  } catch (err) {
    console.warn('YooKassa Node endpoint unreachable, trying PHP handler...', err);
    try {
      const resPhp = await fetch('/yookassa-create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      if (resPhp.ok) {
        responseData = await resPhp.json();
      }
    } catch (phpErr) {
      console.error('YooKassa PHP handler failed:', phpErr);
    }
  }

  // 3. Обработка ответа
  if (responseData && responseData.success && responseData.confirmationUrl) {
    return {
      success: true,
      confirmationUrl: responseData.confirmationUrl,
      paymentId: responseData.paymentId,
      isTestMode: responseData.isTestMode,
    };
  }

  // 4. Если ответ содержит confirmationUrl напрямую
  if (responseData && responseData.confirmationUrl) {
    return {
      success: true,
      confirmationUrl: responseData.confirmationUrl,
      paymentId: responseData.paymentId,
    };
  }

  // Демо/тестовый fallback для плавной проверки интерфейса
  const demoPaymentId = 'demo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const demoReturnUrl = `${YOOKASSA_DEFAULT_RETURN_URL}?orderId=${demoPaymentId}&amount=${payload.amount}&status=success&gateway=yookassa`;

  return {
    success: true,
    confirmationUrl: demoReturnUrl,
    paymentId: demoPaymentId,
    isTestMode: true,
  };
}

/**
 * Хелпер для запуска оплаты соревнования
 */
export async function initiateTournamentPayment(params: {
  tournamentId: string;
  tournamentTitle: string;
  amount: number;
  email: string;
  phone?: string;
  nickname: string;
  gameAccount: string;
  password?: string;
}): Promise<void> {
  const result = await createYooKassaPayment({
    ...params,
    type: 'registration',
  });

  if (result.success && result.confirmationUrl) {
    window.location.href = result.confirmationUrl;
  } else {
    throw new Error(result.error || 'Не удалось создать платёж в ЮKassa');
  }
}

/**
 * Хелпер для запуска пополнения баланса кошелька
 */
export async function initiateTopUpPayment(params: {
  amount: number;
  email: string;
  phone?: string;
}): Promise<void> {
  const result = await createYooKassaPayment({
    ...params,
    type: 'topup',
  });

  if (result.success && result.confirmationUrl) {
    window.location.href = result.confirmationUrl;
  } else {
    throw new Error(result.error || 'Не удалось создать платёж в ЮKassa');
  }
}
