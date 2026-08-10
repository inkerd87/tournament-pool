"use server";

import { revalidatePath } from "next/cache";
import { getPendingById, syncPaymentFromYooKassa } from "@/lib/payment-store";

export async function confirmPendingPayment(pendingId: string) {
  const pending = await getPendingById(pendingId);
  if (!pending?.yookassaPaymentId) {
    return {
      ok: false as const,
      status: "pending" as const,
      error: "Платёж ещё обрабатывается. Подождите несколько секунд.",
    };
  }

  const result = await syncPaymentFromYooKassa(pending.yookassaPaymentId);

  if (result.ok) {
    revalidatePath("/tournaments");
    revalidatePath("/account");
    if (pending.tournamentId) {
      revalidatePath(`/tournaments/${pending.tournamentId}`);
    }
  }

  return result;
}
