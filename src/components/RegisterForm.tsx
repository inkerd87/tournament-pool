"use client";

import { useState, useTransition } from "react";
import { submitRegistration } from "@/app/actions/register";
import { ENTRY_FEE_RUB } from "@/lib/constants";
import { formatRub } from "@/lib/format";

type Props = {
  tournamentId: string;
  canRegister: boolean;
};

export function RegisterForm({ tournamentId, canRegister }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  if (!canRegister) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
        Регистрация закрыта — все места заняты или турнир уже начался.
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-white/10 bg-[#12161f] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          const result = await submitRegistration({
            tournamentId,
            nickname: String(fd.get("nickname") ?? ""),
            gameAccount: String(fd.get("gameAccount") ?? ""),
            email: String(fd.get("email") ?? ""),
          });
          if (result.ok) {
            setMessage({
              type: "ok",
              text: `Вы в списке! (демо) Списано ${formatRub(ENTRY_FEE_RUB)} с тестового баланса. ID: ${result.registrationId.slice(0, 8)}…`,
            });
            form.reset();
          } else {
            setMessage({ type: "err", text: result.error });
          }
        });
      }}
    >
      <h2 className="text-lg font-semibold text-white">Регистрация</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Взнос {formatRub(ENTRY_FEE_RUB)} за место. В демо оплата не списывается
        по-настоящему — подключите ЮKassa / Robokassa для боевого режима.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm">
          <span className="text-zinc-400">Ник в игре</span>
          <input
            name="nickname"
            required
            minLength={2}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none ring-cyan-500/0 focus:ring-2"
            placeholder="s1mple_fan"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Steam / Riot / PUBG ID</span>
          <input
            name="gameAccount"
            required
            minLength={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/40"
            placeholder="76561198…"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/40"
            placeholder="you@mail.ru"
          />
        </label>
      </div>

      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "ok"
              ? "bg-emerald-500/15 text-emerald-200"
              : "bg-red-500/15 text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Обработка…" : `Оплатить ${formatRub(ENTRY_FEE_RUB)} и войти`}
      </button>
    </form>
  );
}
