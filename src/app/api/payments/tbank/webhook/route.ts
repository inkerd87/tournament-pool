import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncPaymentFromProvider } from "@/lib/payment-store";
import { isTBankConfigured, verifyNotificationToken } from "@/lib/tbank";

export async function POST(request: Request) {
  if (!isTBankConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!verifyNotificationToken(body)) {
    return NextResponse.json({ error: "invalid token" }, { status: 403 });
  }

  const paymentId = body.PaymentId;
  const status = body.Status;
  if (paymentId && status === "CONFIRMED") {
    const result = await syncPaymentFromProvider(String(paymentId));
    if (result.ok) {
      revalidatePath("/tournaments");
      revalidatePath("/account");
    }
  }

  return new Response("OK", { status: 200 });
}
