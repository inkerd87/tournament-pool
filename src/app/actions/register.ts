"use server";

import { revalidatePath } from "next/cache";
import { createSession, getSession } from "@/lib/session";
import {
  attachYooKassaPaymentId,
  createPendingPayment,
  createTournamentEntryPayment,
  createWalletTopUpPayment,
} from "@/lib/payment-store";
import { isYooKassaConfigured, createRedirectPayment } from "@/lib/yookassa";
import { ENTRY_FEE_RUB } from "@/lib/constants";
import { chargeEntryFee, findOrCreateUser, getUserById } from "@/lib/user-store";
import {
  finalizeTournamentRegistration,
  registerForTournament,
  type RegisterInput,
} from "@/lib/tournament-store";

export async function submitRegistration(input: RegisterInput) {
  const session = await getSession();
  const payload: RegisterInput = {
    ...input,
    sessionUserId: session?.userId,
  };

  if (session) {
    const sessionUser = await getUserById(session.userId);
    if (sessionUser && sessionUser.email !== input.email.trim().toLowerCase()) {
      return {
        ok: false as const,
        error: "Используйте email из вашего кабинета или выйдите из аккаунта.",
      };
    }
  }

  if (!isYooKassaConfigured()) {
    return {
      ok: false as const,
      error:
        "Платежи не настроены. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.local и перезапустите сервер.",
    };
  }

  const prepared = await createTournamentEntryPayment(payload);
  if (!prepared.ok) return prepared;

  try {
    const { paymentId, confirmationUrl } = await createRedirectPayment({
      amountRub: ENTRY_FEE_RUB,
      description: `Взнос за турнир: ${prepared.tournamentTitle}`,
      metadata: { pendingId: prepared.pendingId, kind: "tournament_entry" },
      returnPath: `/payments/return?pending=${prepared.pendingId}`,
    });
    await attachYooKassaPaymentId(prepared.pendingId, paymentId);

    if (!session) {
      const user = await findOrCreateUser(
        input.email.trim().toLowerCase(),
        input.nickname.trim(),
      );
      await createSession({
        userId: user.id,
        email: user.email,
        nickname: user.nickname,
      });
    }

    return {
      ok: true as const,
      paymentUrl: confirmationUrl,
      pendingId: prepared.pendingId,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка создания платежа";
    return { ok: false as const, error: message };
  }
}

/** Оплата взноса с баланса (после пополнения через ЮKassa). */
export async function submitRegistrationFromBalance(input: RegisterInput) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, error: "Войдите в кабинет, чтобы оплатить с баланса." };
  }

  const sessionUser = await getUserById(session.userId);
  if (!sessionUser) {
    return { ok: false as const, error: "Пользователь не найден." };
  }

  const payload: RegisterInput = {
    ...input,
    email: sessionUser.email,
    sessionUserId: session.userId,
  };

  const charge = await chargeEntryFee(session.userId, ENTRY_FEE_RUB);
  if (!charge.ok) {
    return { ok: false as const, error: charge.error };
  }

  const finalized = await finalizeTournamentRegistration(payload);
  if (!finalized.ok) {
    await findOrCreateUser(sessionUser.email, sessionUser.nickname);
    return finalized;
  }

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${input.tournamentId}`);
  revalidatePath("/account");

  return {
    ok: true as const,
    registrationId: finalized.registrationId,
    balanceRub: charge.balanceRub,
  };
}

export async function startWalletTopUp(amountRub: number) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, error: "Войдите в кабинет для пополнения." };
  }

  if (!isYooKassaConfigured()) {
    return {
      ok: false as const,
      error:
        "Платежи не настроены. Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.local.",
    };
  }

  const prepared = await createWalletTopUpPayment(session.userId, session.email, amountRub);
  if (!prepared.ok) return prepared;

  try {
    const { paymentId, confirmationUrl } = await createRedirectPayment({
      amountRub,
      description: "Пополнение кошелька PoolArena",
      metadata: { pendingId: prepared.pendingId, kind: "wallet_topup" },
      returnPath: `/payments/return?pending=${prepared.pendingId}`,
    });
    await attachYooKassaPaymentId(prepared.pendingId, paymentId);

    return {
      ok: true as const,
      paymentUrl: confirmationUrl,
      pendingId: prepared.pendingId,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка создания платежа";
    return { ok: false as const, error: message };
  }
}

/** @deprecated kept for tests — prefer submitRegistration */
export async function submitRegistrationLegacy(input: RegisterInput) {
  return registerForTournament(input);
}
