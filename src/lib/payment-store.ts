import { promises as fs } from "fs";
import path from "path";
import { ENTRY_FEE_RUB } from "./constants";
import { creditBalance } from "./user-store";
import {
  finalizeTournamentRegistration,
  type RegisterInput,
  validateRegistrationInput,
} from "./tournament-store";
import { getPaymentState, isRobokassaConfigured } from "./robokassa";

const DATA_DIR = path.join(process.cwd(), "data");
const PAYMENTS_FILE = path.join(DATA_DIR, "pending-payments.json");
const INVOICE_SEQ_FILE = path.join(DATA_DIR, "payment-invoice-seq.json");

export type PaymentKind = "tournament_entry" | "wallet_topup";

export type PendingPayment = {
  id: string;
  invoiceId: number;
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

type PendingPaymentRaw = PendingPayment & {
  yookassaPaymentId?: string | null;
  invoiceId?: number;
};

function normalizePayment(raw: PendingPaymentRaw): PendingPayment {
  const externalPaymentId =
    raw.externalPaymentId ?? raw.yookassaPaymentId ?? null;
  const invoiceId =
    raw.invoiceId ??
    (externalPaymentId && /^\d+$/.test(externalPaymentId)
      ? Number(externalPaymentId)
      : 0);
  return { ...raw, externalPaymentId, invoiceId };
}

async function nextInvoiceId(): Promise<number> {
  await ensureDataDir();
  let next = 1;
  try {
    const raw = await fs.readFile(INVOICE_SEQ_FILE, "utf8");
    next = (JSON.parse(raw) as { next: number }).next;
  } catch {
    /* first invoice */
  }
  await fs.writeFile(INVOICE_SEQ_FILE, JSON.stringify({ next: next + 1 }), "utf8");
  return next;
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
  data: Omit<
    PendingPayment,
    "id" | "invoiceId" | "status" | "externalPaymentId" | "createdAt" | "fulfilledAt"
  >,
): Promise<PendingPayment> {
  const invoiceId = await nextInvoiceId();
  const item: PendingPayment = {
    ...data,
    id: crypto.randomUUID(),
    invoiceId,
    status: "pending",
    externalPaymentId: String(invoiceId),
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

export async function fulfillRobokassaPayment(input: {
  pendingId: string;
  invoiceId: string;
  amountRub: number;
}): Promise<{ ok: boolean; tournamentId?: string; error?: string }> {
  const pending = await getPendingById(input.pendingId);
  if (!pending) {
    return { ok: false, error: "Локальный платёж не найден." };
  }

  if (pending.status === "succeeded") {
    return { ok: true, tournamentId: pending.tournamentId };
  }

  if (String(pending.invoiceId) !== input.invoiceId) {
    return { ok: false, error: "Номер счёта не совпадает." };
  }

  if (Math.abs(pending.amountRub - input.amountRub) > 0.01) {
    return { ok: false, error: "Сумма платежа не совпадает." };
  }

  try {
    await fulfillPending(pending);
    return { ok: true, tournamentId: pending.tournamentId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обработки платежа";
    return { ok: false, error: message };
  }
}

export async function syncPaymentFromProvider(externalPaymentId: string): Promise<{
  ok: boolean;
  status: string;
  pendingId?: string;
  error?: string;
}> {
  if (!isRobokassaConfigured()) {
    return { ok: false, status: "error", error: "Платежи не настроены." };
  }

  const pending = await getPendingByExternalId(externalPaymentId);
  if (!pending) {
    return { ok: false, status: "error", error: "Локальный платёж не найден." };
  }

  if (pending.status === "succeeded") {
    return { ok: true, status: "succeeded", pendingId: pending.id };
  }

  if (pending.status === "canceled") {
    return { ok: false, status: "canceled", pendingId: pending.id };
  }

  const remote = await getPaymentState(externalPaymentId);

  if (Math.abs(pending.amountRub - remote.amountRub) > 0.01) {
    return { ok: false, status: remote.status, error: "Сумма платежа не совпадает." };
  }

  if (remote.status === "succeeded") {
    await fulfillPending(pending);
    return { ok: true, status: "succeeded", pendingId: pending.id };
  }

  if (remote.status === "canceled") {
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

  return { ok: true as const, pendingId: pending.id, invoiceId: pending.invoiceId, tournamentTitle: validation.tournamentTitle };
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

  return { ok: true as const, pendingId: pending.id, invoiceId: pending.invoiceId };
}
