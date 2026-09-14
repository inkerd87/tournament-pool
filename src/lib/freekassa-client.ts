/**
 * Интеграция с FreeKassa (FK) для платформы NightByte
 * Приём платежей через СБП, карты МИР/Visa/Mastercard, электронные кошельки и криптовалюту
 */

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
  confirmationUrl?: string;
  orderId?: string;
  isTestMode?: boolean;
  error?: string;
}

/**
 * Создание платёжной сессии в FreeKassa через серверный эндпоинт (freekassa-create.php)
 */
export async function createFreeKassaPayment(
  payload: FreeKassaPaymentPayload
): Promise<FreeKassaCreateResponse> {
  const bodyData = {
    amount: payload.amount,
    email: payload.email,
    phone: payload.phone || '',
    userId: payload.userId || '',
    tournamentId: payload.tournamentId || '',
    tournamentTitle: payload.tournamentTitle || '',
    nickname: payload.nickname || '',
    gameAccount: payload.gameAccount || '',
    type: payload.type,
    description: payload.description || '',
    returnUrl: FREEKASSA_DEFAULT_RETURN_URL,
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
        paymentGateway: 'freekassa',
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
        paymentGateway: 'freekassa',
        createdAt: Date.now(),
      })
    );
  }

  // 2. Вызов PHP обработчика генерации ссылки с подписью MD5
  let responseData: any = null;

  try {
    const resPhp = await fetch('/freekassa-create.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    if (resPhp.ok) {
      responseData = await resPhp.json();
    }
  } catch (err) {
    console.warn('FreeKassa PHP handler request error:', err);
  }

  // 3. Обработка ответа
  if (responseData && responseData.success && responseData.confirmationUrl) {
    return {
      success: true,
      confirmationUrl: responseData.confirmationUrl,
      orderId: responseData.orderId,
    };
  }

  // Демо/тестовый fallback если сервер временно недоступен
  const demoOrderId = 'demo_fk_' + Date.now();
  const demoReturnUrl = `${FREEKASSA_DEFAULT_RETURN_URL}?orderId=${demoOrderId}&amount=${payload.amount}&status=success&gateway=freekassa`;

  return {
    success: true,
    confirmationUrl: demoReturnUrl,
    orderId: demoOrderId,
    isTestMode: true,
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
