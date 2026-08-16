import crypto from "crypto";
import { getAppUrl } from "./app-url";

const API_BASE = "https://securepay.tinkoff.ru/v2";

type ApiResponse = {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
};

function credentials(): { terminalKey: string; password: string } | null {
  const terminalKey = process.env.TBANK_TERMINAL_KEY?.trim();
  const password = process.env.TBANK_PASSWORD?.trim();
  if (!terminalKey || !password) return null;
  return { terminalKey, password };
}

export function isTBankConfigured(): boolean {
  return credentials() !== null;
}

export function buildToken(
  params: Record<string, unknown>,
  password: string,
): string {
  const pairs: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(params)) {
    if (key === "Token") continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    pairs.push([key, String(value)]);
  }
  pairs.push(["Password", password]);
  pairs.sort(([a], [b]) => a.localeCompare(b));
  const concat = pairs.map(([, value]) => value).join("");
  return crypto.createHash("sha256").update(concat, "utf8").digest("hex");
}

async function apiCall<T extends ApiResponse>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const creds = credentials();
  if (!creds) {
    throw new Error("TBANK_NOT_CONFIGURED");
  }

  const payload: Record<string, unknown> = {
    ...body,
    TerminalKey: creds.terminalKey,
  };
  const token = buildToken(payload, creds.password);

  const response = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, Token: token }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`T-Bank ${method} HTTP ${response.status}: ${text}`);
  }

  const data = (await response.json()) as T;
  if (!data.Success) {
    throw new Error(
      `T-Bank ${method} failed (${data.ErrorCode}): ${data.Message ?? "unknown error"}`,
    );
  }

  return data;
}

export async function initSbpPayment(params: {
  amountRub: number;
  orderId: string;
  description: string;
  pendingId: string;
  kind: string;
  returnPath?: string;
}): Promise<{ paymentId: string }> {
  const appUrl = getAppUrl();
  const returnUrl = `${appUrl}${params.returnPath ?? "/payments/return"}`;

  const data = await apiCall<ApiResponse & { PaymentId: string | number }>("Init", {
    Amount: Math.round(params.amountRub * 100),
    OrderId: params.orderId.slice(0, 50),
    Description: params.description.slice(0, 140),
    PayType: "O",
    SuccessURL: returnUrl,
    FailURL: returnUrl,
    NotificationURL: `${appUrl}/api/payments/tbank/webhook`,
    DATA: {
      pendingId: params.pendingId,
      kind: params.kind,
    },
  });

  return { paymentId: String(data.PaymentId) };
}

export async function getSbpQr(paymentId: string): Promise<{
  payload: string | null;
  svg: string | null;
}> {
  const image = await apiCall<ApiResponse & { Data?: string }>("GetQr", {
    PaymentId: Number(paymentId),
    DataType: "IMAGE",
    PaymentMethod: "SBP",
  });

  const payload = await apiCall<ApiResponse & { Data?: string }>("GetQr", {
    PaymentId: Number(paymentId),
    DataType: "PAYLOAD",
    PaymentMethod: "SBP",
  });

  return {
    svg: image.Data ?? null,
    payload: payload.Data ?? null,
  };
}

export async function getPaymentState(paymentId: string): Promise<{
  status: string;
  amountKopecks: number;
  orderId: string;
}> {
  const data = await apiCall<
    ApiResponse & { Status: string; Amount: number; OrderId: string }
  >("GetState", {
    PaymentId: paymentId,
  });

  return {
    status: data.Status,
    amountKopecks: data.Amount,
    orderId: data.OrderId,
  };
}

export function verifyNotificationToken(notification: Record<string, unknown>): boolean {
  const creds = credentials();
  if (!creds) return false;

  const received = notification.Token;
  if (typeof received !== "string") return false;

  const params: Record<string, unknown> = { ...notification };
  delete params.Token;
  delete params.Data;
  delete params.Receipt;

  return buildToken(params, creds.password) === received;
}

export const TBANK_WAITING_STATUSES = new Set([
  "NEW",
  "FORM_SHOWED",
  "AUTHORIZING",
  "AUTHORIZED",
  "CONFIRMING",
  "3DS_CHECKING",
  "3DS_CHECKED",
]);

export function isPaymentWaiting(status: string): boolean {
  return status === "pending" || TBANK_WAITING_STATUSES.has(status);
}
