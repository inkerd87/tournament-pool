import { revalidatePath } from "next/cache";
import { fulfillRobokassaPayment } from "@/lib/payment-store";
import { isRobokassaConfigured, verifyResultSignature } from "@/lib/robokassa";

export async function POST(request: Request) {
  if (!isRobokassaConfigured()) {
    return new Response("not configured", { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("invalid form", { status: 400 });
  }

  const outSum = String(form.get("OutSum") ?? "");
  const invId = String(form.get("InvId") ?? "");
  const signature = String(form.get("SignatureValue") ?? "");
  const pendingId = String(form.get("Shp_pendingId") ?? "");

  const shp: Record<string, string> = {};
  if (pendingId) shp.pendingId = pendingId;

  if (!outSum || !invId || !signature || !pendingId) {
    return new Response("missing fields", { status: 400 });
  }

  if (!verifyResultSignature(outSum, invId, signature, shp)) {
    return new Response("bad signature", { status: 403 });
  }

  const result = await fulfillRobokassaPayment({
    pendingId,
    invoiceId: invId,
    amountRub: Number(outSum),
  });

  if (result.ok) {
    revalidatePath("/tournaments");
    revalidatePath("/account");
    if (result.tournamentId) {
      revalidatePath(`/tournaments/${result.tournamentId}`);
    }
  }

  return new Response(`OK${invId}`, { status: 200 });
}
