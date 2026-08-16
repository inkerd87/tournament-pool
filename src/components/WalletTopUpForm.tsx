"use client";

import { useState, useTransition } from "react";
import { startWalletTopUp } from "@/app/actions/register";
import { formatRub } from "@/lib/format";

type Props = {
  paymentsEnabled: boolean;
};

const PRESETS = [100, 300, 500, 1000] as const;

export function WalletTopUpForm({ paymentsEnabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(500);
  const [error, setError] = useState<string | null>(null);

  if (!paymentsEnabled) {
    return (
      <p className="text-sm text-zinc-500">
        Пополнение недоступно — настройте{" "}
        <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-400">
          TBANK_TERMINAL_KEY
        </code>{" "}
        и{" "}
        <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-400">
          TBANK_PASSWORD
        </code>{" "}
        в <code className="text-zinc-400">.env.local</code>.
      </p>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await startWalletTopUp(amount);
          if (result.ok) {
            window.location.href = result.paymentUrl;
            return;
          }
          setError(result.error);
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
              amount === preset
                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                : "border-[color:var(--border)] bg-black/30 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {formatRub(preset)}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <span className="font-medium text-zinc-400">Сумма, ₽</span>
        <input
          type="number"
          min={100}
          max={100_000}
          step={100}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="input-field mt-1"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Создаём платёж…" : `Пополнить ${formatRub(amount)} через СБП`}
      </button>
    </form>
  );
}
