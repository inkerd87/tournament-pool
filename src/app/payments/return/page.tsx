import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmPendingPayment } from "@/app/actions/payments";
import { getPendingById } from "@/lib/payment-store";
import { isPaymentWaiting } from "@/lib/robokassa";

export const metadata = { title: "Оплата" };

type Props = {
  searchParams: Promise<{ pending?: string }>;
};

export default async function PaymentReturnPage({ searchParams }: Props) {
  const { pending: pendingId } = await searchParams;
  if (!pendingId) {
    redirect("/account");
  }

  const pending = await getPendingById(pendingId);
  if (!pending) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-white">Платёж не найден</h1>
        <p className="mt-3 text-zinc-500">Проверьте историю в личном кабинете.</p>
        <Link href="/account" className="btn-primary mt-8 inline-flex">
          В кабинет
        </Link>
      </div>
    );
  }

  const result = await confirmPendingPayment(pendingId);

  if (result.ok) {
    if (pending.kind === "tournament_entry" && pending.tournamentId) {
      redirect(`/tournaments/${pending.tournamentId}?paid=1`);
    }
    redirect("/account?topup=1");
  }

  const waiting = isPaymentWaiting(result.status);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-white">
        {waiting ? "Обрабатываем оплату…" : "Оплата не прошла"}
      </h1>
      <p className="mt-3 text-zinc-500">
        {waiting
          ? "Платёж подтверждается. Обновите страницу через несколько секунд или вернитесь в кабинет."
          : (result.error ?? "Платёж отменён или отклонён.")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/payments/return?pending=${pendingId}`} className="btn-primary">
          Обновить статус
        </Link>
        <Link href="/account" className="btn-secondary">
          В кабинет
        </Link>
      </div>
    </div>
  );
}
