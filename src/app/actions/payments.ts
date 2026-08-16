"use server";

import { revalidatePath } from "next/cache";
import { getPendingById, syncPaymentFromProvider } from "@/lib/payment-store";

export async function confirmPendingPayment(pendingId: string) {
  const pending = await getPendingById(pendingId);
  if (!pending?.externalPaymentId) {
    return {
      ok: false as const,
      status: "pending" as const,
      error: "Платёж ещё обрабатывается. Подождите несколько секунд.",
    };
  }

  const result = await syncPaymentFromProvider(pending.externalPaymentId);

  if (result.ok) {
    revalidatePath("/tournaments");
    revalidatePath("/account");
    if (pending.tournamentId) {
      revalidatePath(`/tournaments/${pending.tournamentId}`);
    }
  }

  return result;
}
