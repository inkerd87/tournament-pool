import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncPaymentFromYooKassa } from "@/lib/payment-store";
import { isYooKassaConfigured } from "@/lib/yookassa";

export async function POST(request: Request) {
  if (!isYooKassaConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  let body: { event?: string; object?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const paymentId = body.object?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "missing payment id" }, { status: 400 });
  }

  if (body.event === "payment.succeeded" || body.event === "payment.waiting_for_capture") {
    const result = await syncPaymentFromYooKassa(paymentId);
    if (result.ok) {
      revalidatePath("/tournaments");
      revalidatePath("/account");
    }
  }

  return NextResponse.json({ received: true });
}
