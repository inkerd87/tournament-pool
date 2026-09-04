import CryptoJS from 'crypto-js';

// Поддомен вашей платежной страницы в Prodamus (например: nightbyte.payform.ru)
export const PRODAMUS_DOMAIN = 'nightbyte.payform.ru';
export const PRODAMUS_SECRET_KEY = ''; // Заполняется из настроек Продамуса

/**
 * Рекурсивная сортировка объекта по ключам в алфавитном порядке
 * согласно технической спецификации Prodamus API
 */
function sortObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return String(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

/**
 * Формирование подписи HMAC-SHA256 для Prodamus
 */
export function createProdamusSignature(data: Record<string, any>, secretKey: string): string {
  if (!secretKey) return '';
  const sortedData = sortObjectKeys(data);
  // Экранирование прямых слэшей согласно требованиям Prodamus
  const jsonStr = JSON.stringify(sortedData).replace(/\//g, '\\/');
  return CryptoJS.HmacSHA256(jsonStr, secretKey).toString(CryptoJS.enc.Hex);
}

/**
 * Создание URL для моментального перехода к оплате в Prodamus (do=pay)
 */
export function createProdamusCheckoutUrl(params: {
  amountRub: number;
  productName: string;
  orderId?: string;
  customerEmail?: string;
  subdomain?: string;
  secretKey?: string;
  registrationData?: {
    tournamentId: string;
    nickname: string;
    gameAccount: string;
    email: string;
  };
}): string {
  const domain = params.subdomain || PRODAMUS_DOMAIN;
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const orderId = params.orderId || `NB-${Math.floor(Date.now() / 1000)}`;
  const secretKey = params.secretKey ?? PRODAMUS_SECRET_KEY;

  let successParams = `invId=${orderId}&amount=${params.amountRub}&status=success`;
  let failParams = `invId=${orderId}&status=fail`;

  if (params.registrationData) {
    const { tournamentId, nickname, gameAccount, email } = params.registrationData;
    const regQuery = `&tId=${encodeURIComponent(tournamentId)}&nick=${encodeURIComponent(nickname)}&acc=${encodeURIComponent(gameAccount)}&email=${encodeURIComponent(email)}`;
    successParams += regQuery;
    failParams += `&tId=${encodeURIComponent(tournamentId)}`;
  }

  const returnUrl = `${window.location.origin}/payments/return?${successParams}`;
  const failUrl = `${window.location.origin}/payments/return?${failParams}`;

  // Структура данных заказа для Продамус
  const requestData: Record<string, any> = {
    do: 'pay',
    order_id: orderId,
    products: [
      {
        name: params.productName,
        price: String(params.amountRub),
        quantity: '1',
        type: 'service',
      },
    ],
    urlReturn: returnUrl,
    urlSuccess: returnUrl,
    urlNotification: `${window.location.origin}/api/prodamus/webhook`,
  };

  if (params.customerEmail) {
    requestData.customer_email = params.customerEmail;
  }

  // Преобразуем в query-параметры
  const query = new URLSearchParams();
  query.append('do', 'pay');
  query.append('order_id', orderId);
  query.append('products[0][name]', params.productName);
  query.append('products[0][price]', String(params.amountRub));
  query.append('products[0][quantity]', '1');
  query.append('products[0][type]', 'service');
  query.append('urlReturn', returnUrl);
  query.append('urlSuccess', returnUrl);

  if (params.customerEmail) {
    query.append('customer_email', params.customerEmail);
  }

  // Если секретный ключ задан — добавляем HMAC-подпись
  if (secretKey) {
    const signature = createProdamusSignature(requestData, secretKey);
    query.append('signature', signature);
  }

  return `${baseUrl}/?${query.toString()}`;
}
