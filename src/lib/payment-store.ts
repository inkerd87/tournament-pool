import { promises as fs } from "fs";
import path from "path";
import { ENTRY_FEE_RUB } from "./constants";
import { creditBalance } from "./user-store";
import {
  finalizeTournamentRegistration,
  type RegisterInput,
  validateRegistrationInput,
} from "./tournament-store";
import { getPaymentState, isTBankConfigured } from "./tbank";

const DATA_DIR = path.join(process.cwd(), "data");
const PAYMENTS_FILE = path.join(DATA_DIR, "pending-payments.json");

export type PaymentKind = "tournament_entry" | "wallet_topup";

export type PendingPayment = {
  id: string;
  kind: PaymentKind;
  amountRub: number;
  status: "pending" | "succeeded" | "canceled";
  externalPaymentId: string | null;
  createdAt: string;
  fulfilledAt: string | null;
  tournamentId?: string;
  nickname?: string;
  gameAccount?: string;
  email?: string;
  userId?: string;
};

type PendingPaymentRaw = PendingPayment & { yookassaPaymentId?: string | null };

function normalizePayment(raw: PendingPaymentRaw): PendingPayment {
  if (!raw.externalPaymentId && raw.yookassaPaymentId) {
    return { ...raw, externalPaymentId: raw.yookassaPaymentId };
  }
  return raw;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readPayments(): Promise<PendingPayment[]> {
  try {
    const raw = await fs.readFile(PAYMENTS_FILE, "utf8");
    const items = JSON.parse(raw) as PendingPaymentRaw[];
    return items.map(normalizePayment);
  } catch {
    return [];
  }
}

async function writePayments(items: PendingPayment[]) {
  await ensureDataDir();
  await fs.writeFile(PAYMENTS_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function createPendingPayment(
  data: Omit<PendingPayment, "id" | "status" | "externalPaymentId" | "createdAt" | "fulfilledAt">,
): Promise<PendingPayment> {
  const item: PendingPayment = {
    ...data,
    id: crypto.randomUUID(),
    status: "pending",
    externalPaymentId: null,
    createdAt: new Date().toISOString(),
    fulfilledAt: null,
  };
  const all = await readPayments();
  all.push(item);
  await writePayments(all);
  return item;
}

export async function attachExternalPaymentId(pendingId: string, externalPaymentId: string) {
  const all = await readPayments();
  const item = all.find((p) => p.id === pendingId);
  if (!item) return null;
  item.externalPaymentId = externalPaymentId;
  await writePayments(all);
  return item;
}

export async function getPendingByExternalId(
  externalPaymentId: string,
): Promise<PendingPayment | null> {
  const all = await readPayments();
  return all.find((p) => p.externalPaymentId === externalPaymentId) ?? null;
}

export async function getPendingById(id: string): Promise<PendingPayment | null> {
  const all = await readPayments();
  return all.find((p) => p.id === id) ?? null;
}

async function markPayment(
  id: string,
  status: PendingPayment["status"],
): Promise<PendingPayment | null> {
  const all = await readPayments();
  const item = all.find((p) => p.id === id);
  if (!item) return null;
  item.status = status;
  if (status === "succeeded") {
    item.fulfilledAt = new Date().toISOString();
  }
  await writePayments(all);
  return item;
}

async function fulfillPending(pending: PendingPayment): Promise<void> {
  if (pending.status === "succeeded") return;

  if (pending.kind === "wallet_topup") {
    if (!pending.userId) throw new Error("Top-up without userId");
    await creditBalance(pending.userId, pending.amountRub);
    await markPayment(pending.id, "succeeded");
    return;
  }

  if (pending.kind === "tournament_entry") {
    const input: RegisterInput = {
      tournamentId: pending.tournamentId!,
      nickname: pending.nickname!,
      gameAccount: pending.gameAccount!,
      email: pending.email!,
    };
    const result = await finalizeTournamentRegistration(input);
    if (!result.ok) {
      throw new Error(result.error);
    }
    await markPayment(pending.id, "succeeded");
    return;
  }
}

export async function syncPaymentFromProvider(externalPaymentId: string): Promise<{
  ok: boolean;
  status: string;
  pendingId?: string;
  error?: string;
}> {
  if (!isTBankConfigured()) {
    return { ok: false, status: "error", error: "Платежи не настроены." };
  }

  let pending = await getPendingByExternalId(externalPaymentId);
  const remote = await getPaymentState(externalPaymentId);

  if (!pending) {
    pending = await getPendingById(remote.orderId);
    if (pending && !pending.externalPaymentId) {
      await attachExternalPaymentId(pending.id, externalPaymentId);
    }
  }

  if (!pending) {
    return { ok: false, status: remote.status, error: "Локальный платёж не найден." };
  }

  const expectedKopecks = Math.round(pending.amountRub * 100);
  if (remote.amountKopecks !== expectedKopecks) {
    return { ok: false, status: remote.status, error: "Сумма платежа не совпадает." };
  }

  if (remote.status === "CONFIRMED") {
    await fulfillPending(pending);
    return { ok: true, status: "succeeded", pendingId: pending.id };
  }

  if (remote.status === "REJECTED" || remote.status === "CANCELED") {
    await markPayment(pending.id, "canceled");
    return { ok: false, status: "canceled", pendingId: pending.id };
  }

  return { ok: false, status: remote.status, pendingId: pending.id };
}

export async function createTournamentEntryPayment(input: RegisterInput) {
  const validation = await validateRegistrationInput(input);
  if (!validation.ok) return validation;

  const pending = await createPendingPayment({
    kind: "tournament_entry",
    amountRub: ENTRY_FEE_RUB,
    tournamentId: input.tournamentId,
    nickname: validation.normalized.nickname,
    gameAccount: validation.normalized.gameAccount,
    email: validation.normalized.email,
    userId: validation.normalized.userId,
  });

  return { ok: true as const, pendingId: pending.id, tournamentTitle: validation.tournamentTitle };
}

export async function createWalletTopUpPayment(userId: string, email: string, amountRub: number) {
  if (amountRub < 100 || amountRub > 100_000) {
    return { ok: false as const, error: "Сумма пополнения: от 100 до 100 000 ₽." };
  }

  const pending = await createPendingPayment({
    kind: "wallet_topup",
    amountRub,
    userId,
    email,
  });

  return { ok: true as const, pendingId: pending.id };
}
