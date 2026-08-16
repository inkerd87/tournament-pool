"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmPendingPayment } from "@/app/actions/payments";
import { formatRub } from "@/lib/format";

type Props = {
  pendingId: string;
  amountRub: number;
  description: string;
  qrSvg: string | null;
  payloadUrl: string | null;
};

export function SbpPaymentView({
  pendingId,
  amountRub,
  description,
  qrSvg,
  payloadUrl,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusText, setStatusText] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      startTransition(async () => {
        const result = await confirmPendingPayment(pendingId);
        if (result.ok) {
          router.replace(`/payments/return?pending=${pendingId}`);
          return;
        }
        if (result.status && result.status !== "pending") {
          setStatusText(result.error ?? "Ожидаем подтверждение оплаты…");
        }
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [pendingId, router]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400/80">
        Оплата через СБП
      </p>
      <h1 className="mt-3 text-2xl font-extrabold text-white">{description}</h1>
      <p className="mt-2 font-mono text-3xl font-bold text-cyan-400">
        {formatRub(amountRub)}
      </p>

      <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-white p-6">
        {qrSvg ? (
          <div
            className="mx-auto flex max-w-[280px] items-center justify-center [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : (
          <p className="text-sm text-zinc-500">QR-код загружается…</p>
        )}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-zinc-500">
        Отсканируйте QR в приложении банка или подтвердите платёж по СБП.
        {pending && " Проверяем статус…"}
      </p>

      {payloadUrl && (
        <a href={payloadUrl} className="btn-primary mt-6 inline-flex">
          Открыть в банке
        </a>
      )}

      {statusText && (
        <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {statusText}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/payments/return?pending=${pendingId}`} className="btn-secondary">
          Я оплатил
        </Link>
        <Link href="/account" className="btn-secondary">
          В кабинет
        </Link>
      </div>
    </div>
  );
}
