import CryptoJS from 'crypto-js';

export const ROBOKASSA_LOGIN = 'Nightbyteon';
export const ROBOKASSA_PASS_1 = 'PRJIgwrcG3b4OY301Tvo';
export const ROBOKASSA_PASS_2 = 'Y71HBH3yyaX6ChH5HSOQ';

export function createRobokassaCheckoutUrl(params: {
  amountRub: number;
  description: string;
  orderId?: string;
  login?: string;
  password1?: string;
  isTest?: boolean;
  registrationData?: {
    tournamentId: string;
    nickname: string;
    gameAccount: string;
    email: string;
  };
}): string {
  const login = params.login || ROBOKASSA_LOGIN;
  const outSum = params.amountRub.toFixed(2);
  const invId = Math.floor(Date.now() / 1000) % 10000000;
  const pass1 = params.password1 || ROBOKASSA_PASS_1;
  const isTest = params.isTest !== false;

  const signature = CryptoJS.MD5(`${login}:${outSum}:${invId}:${pass1}`).toString();

  let successParams = `invId=${invId}&amount=${params.amountRub}&status=success`;
  let failParams = `invId=${invId}&status=fail`;

  if (params.registrationData) {
    const { tournamentId, nickname, gameAccount, email } = params.registrationData;
    const regQuery = `&tId=${encodeURIComponent(tournamentId)}&nick=${encodeURIComponent(nickname)}&acc=${encodeURIComponent(gameAccount)}&email=${encodeURIComponent(email)}`;
    successParams += regQuery;
    failParams += `&tId=${encodeURIComponent(tournamentId)}`;
  }

  const returnUrl = `${window.location.origin}/payments/return?${successParams}`;
  const failUrl = `${window.location.origin}/payments/return?${failParams}`;

  const qs = new URLSearchParams({
    MerchantLogin: login,
    OutSum: outSum,
    InvId: String(invId),
    Description: params.description.slice(0, 100),
    SignatureValue: signature,
    SuccessURL: returnUrl,
    FailURL: failUrl,
    Culture: 'ru',
    Encoding: 'utf-8',
    ...(isTest ? { IsTest: '1' } : {}),
  });

  return `https://auth.robokassa.ru/Merchant/Index.aspx?${qs.toString()}`;
}
