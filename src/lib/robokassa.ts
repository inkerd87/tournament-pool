import crypto from "crypto";
import { getAppUrl } from "./app-url";

type Credentials = {
  login: string;
  password1: string;
  password2: string;
};

function credentials(): Credentials | null {
  const login = process.env.ROBOKASSA_MERCHANT_LOGIN?.trim();
  const password1 = process.env.ROBOKASSA_PASSWORD1?.trim();
  const password2 = process.env.ROBOKASSA_PASSWORD2?.trim();
  if (!login || !password1 || !password2) return null;
  return { login, password1, password2 };
}

export function isRobokassaConfigured(): boolean {
  return credentials() !== null;
}

function md5(value: string): string {
  return crypto.createHash("md5").update(value, "utf8").digest("hex");
}

function shpSignaturePart(shp: Record<string, string>): string {
  return Object.keys(shp)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `Shp_${key}=${shp[key]}`)
    .join(":");
}

export function buildPaymentSignature(
  outSum: string,
  invId: number,
  password1: string,
  shp: Record<string, string> = {},
): string {
  const creds = credentials();
  if (!creds) throw new Error("ROBOKASSA_NOT_CONFIGURED");

  const shpPart = shpSignaturePart(shp);
  const base = `${creds.login}:${outSum}:${invId}:${password1}`;
  return md5(shpPart ? `${base}:${shpPart}` : base);
}

export function buildPaymentUrl(params: {
  amountRub: number;
  invId: number;
  description: string;
  pendingId: string;
}): string {
  const creds = credentials();
  if (!creds) throw new Error("ROBOKASSA_NOT_CONFIGURED");

  const appUrl = getAppUrl();
  const isTest = process.env.ROBOKASSA_IS_TEST === "1";
  const outSum = params.amountRub.toFixed(2);
  const shp = { pendingId: params.pendingId };
  const returnUrl = `${appUrl}/payments/return?pending=${encodeURIComponent(params.pendingId)}`;

  const signature = buildPaymentSignature(outSum, params.invId, creds.password1, shp);

  const qs = new URLSearchParams({
    MerchantLogin: creds.login,
    OutSum: outSum,
    InvId: String(params.invId),
    Description: params.description.slice(0, 100),
    SignatureValue: signature,
    Shp_pendingId: params.pendingId,
    SuccessURL: returnUrl,
    FailURL: returnUrl,
    Encoding: "utf-8",
    Culture: "ru",
    ...(isTest ? { IsTest: "1" } : {}),
  });

  return `https://auth.robokassa.ru/Merchant/Index.aspx?${qs.toString()}`;
}

export function verifyResultSignature(
  outSum: string,
  invId: string,
  signature: string,
  shp: Record<string, string>,
): boolean {
  const creds = credentials();
  if (!creds) return false;

  const shpPart = shpSignaturePart(shp);
  const base = `${outSum}:${invId}:${creds.password2}`;
  const expected = md5(shpPart ? `${base}:${shpPart}` : base);
  return expected.toLowerCase() === signature.toLowerCase();
}

const OP_STATE_URL =
  "https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt";

function parseOpStateXml(xml: string): { code: number; outSum: number } | null {
  const codeMatch = xml.match(/<Code>(\d+)<\/Code>/i);
  const sumMatch = xml.match(/<OutSum>([\d.]+)<\/OutSum>/i);
  if (!codeMatch) return null;
  return {
    code: Number(codeMatch[1]),
    outSum: sumMatch ? Number(sumMatch[1]) : 0,
  };
}

export async function getPaymentState(invoiceId: string): Promise<{
  status: string;
  amountRub: number;
}> {
  const creds = credentials();
  if (!creds) throw new Error("ROBOKASSA_NOT_CONFIGURED");

  const signature = md5(`${creds.login}:${invoiceId}:${creds.password2}`);
  const qs = new URLSearchParams({
    MerchantLogin: creds.login,
    InvoiceID: invoiceId,
    Signature: signature,
  });

  const response = await fetch(`${OP_STATE_URL}?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Robokassa OpStateExt HTTP ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parseOpStateXml(xml);
  if (!parsed) {
    throw new Error("Robokassa OpStateExt: unexpected response");
  }

  if (parsed.code === 50) {
    return { status: "succeeded", amountRub: parsed.outSum };
  }
  if (parsed.code === 10 || parsed.code === 60 || parsed.code === 80 || parsed.code === 100) {
    return { status: "canceled", amountRub: parsed.outSum };
  }
  return { status: "pending", amountRub: parsed.outSum };
}

export function isPaymentWaiting(status: string): boolean {
  return status === "pending" || status === "waiting";
}
