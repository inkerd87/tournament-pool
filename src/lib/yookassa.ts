import { getAppUrl } from "./app-url";

const API_BASE = "https://api.yookassa.ru/v3";

export type YooKassaPayment = {
  id: string;
  status: string;
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
};

function credentials(): { shopId: string; secretKey: string } | null {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) return null;
  return { shopId, secretKey };
}

export function isYooKassaConfigured(): boolean {
  return credentials() !== null;
}

function authHeader(): string {
  const creds = credentials();
  if (!creds) {
    throw new Error("YOOKASSA_NOT_CONFIGURED");
  }
  const token = Buffer.from(`${creds.shopId}:${creds.secretKey}`).toString("base64");
  return `Basic ${token}`;
}

function formatAmount(rub: number): string {
  return rub.toFixed(2);
}

export async function createRedirectPayment(params: {
  amountRub: number;
  description: string;
  metadata: Record<string, string>;
  returnPath?: string;
}): Promise<{ paymentId: string; confirmationUrl: string }> {
  const returnUrl = `${getAppUrl()}${params.returnPath ?? "/payments/return"}`;

  const response = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: { value: formatAmount(params.amountRub), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: returnUrl },
      description: params.description.slice(0, 128),
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YooKassa create payment failed (${response.status}): ${text}`);
  }

  const payment = (await response.json()) as YooKassaPayment;
  const confirmationUrl = payment.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    throw new Error("YooKassa did not return confirmation_url");
  }

  return { paymentId: payment.id, confirmationUrl };
}

export async function fetchPayment(paymentId: string): Promise<YooKassaPayment> {
  const response = await fetch(`${API_BASE}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YooKassa get payment failed (${response.status}): ${text}`);
  }

  return (await response.json()) as YooKassaPayment;
}
