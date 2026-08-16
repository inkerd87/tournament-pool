import Link from "next/link";
import { redirect } from "next/navigation";
import { SbpPaymentView } from "@/components/SbpPaymentView";
import { getPendingById } from "@/lib/payment-store";
import { getSbpQr, isTBankConfigured } from "@/lib/tbank";

export const metadata = { title: "Оплата СБП" };

type Props = {
  searchParams: Promise<{ pending?: string }>;
};

export default async function SbpPaymentPage({ searchParams }: Props) {
  const { pending: pendingId } = await searchParams;
  if (!pendingId) {
    redirect("/account");
  }

  if (!isTBankConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-white">Платежи не настроены</h1>
        <p className="mt-3 text-zinc-500">
          Добавьте TBANK_TERMINAL_KEY и TBANK_PASSWORD в .env.local.
        </p>
        <Link href="/account" className="btn-primary mt-8 inline-flex">
          В кабинет
        </Link>
      </div>
    );
  }

  const pending = await getPendingById(pendingId);
  if (!pending?.externalPaymentId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-white">Платёж не найден</h1>
        <p className="mt-3 text-zinc-500">Попробуйте начать оплату заново.</p>
        <Link href="/account" className="btn-primary mt-8 inline-flex">
          В кабинет
        </Link>
      </div>
    );
  }

  if (pending.status === "succeeded") {
    redirect(`/payments/return?pending=${pendingId}`);
  }

  let qrSvg: string | null = null;
  let payloadUrl: string | null = null;

  try {
    const qr = await getSbpQr(pending.externalPaymentId);
    qrSvg = qr.svg;
    payloadUrl = qr.payload;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Не удалось получить QR-код";
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-white">Ошибка СБП</h1>
        <p className="mt-3 text-zinc-500">{message}</p>
        <Link href="/account" className="btn-primary mt-8 inline-flex">
          В кабинет
        </Link>
      </div>
    );
  }

  const description =
    pending.kind === "wallet_topup"
      ? "Пополнение кошелька"
      : "Взнос за турнир";

  return (
    <SbpPaymentView
      pendingId={pendingId}
      amountRub={pending.amountRub}
      description={description}
      qrSvg={qrSvg}
      payloadUrl={payloadUrl}
    />
  );
}
