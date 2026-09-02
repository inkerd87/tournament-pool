import CryptoJS from 'crypto-js';

export const ROBOKASSA_LOGIN = 'Nightbyteon';
export const ROBOKASSA_PASS_1 = 'IR4gsbkUGNFi1t29t0lZ';
export const ROBOKASSA_PASS_2 = 'b5t5l7mQUIZtrQ5fXRy0';

export function createRobokassaCheckoutUrl(params: {
  amountRub: number;
  description: string;
  orderId?: string;
  login?: string;
  password1?: string;
  isTest?: boolean;
}): string {
  const login = params.login || ROBOKASSA_LOGIN;
  const outSum = params.amountRub.toFixed(2);
  const invId = Math.floor(Date.now() / 1000) % 10000000;
  const pass1 = params.password1 || ROBOKASSA_PASS_1;
  const isTest = params.isTest !== false;

  const signature = CryptoJS.MD5(`${login}:${outSum}:${invId}:${pass1}`).toString();
  const returnUrl = `${window.location.origin}/payments/return?invId=${invId}&amount=${params.amountRub}`;

  const qs = new URLSearchParams({
    MerchantLogin: login,
    OutSum: outSum,
    InvId: String(invId),
    Description: params.description.slice(0, 100),
    SignatureValue: signature,
    SuccessURL: returnUrl,
    FailURL: returnUrl,
    Culture: 'ru',
    Encoding: 'utf-8',
    ...(isTest ? { IsTest: '1' } : {}),
  });

  return `https://auth.robokassa.ru/Merchant/Index.aspx?${qs.toString()}`;
}
