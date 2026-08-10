"use client";

import { useRef, useState, useTransition } from "react";
import {
  submitRegistration,
  submitRegistrationFromBalance,
} from "@/app/actions/register";
import { ENTRY_FEE_RUB } from "@/lib/constants";
import { formatRub } from "@/lib/format";

type Props = {
  tournamentId: string;
  canRegister: boolean;
  defaultEmail?: string;
  defaultNickname?: string;
  balanceRub?: number;
  paymentsEnabled: boolean;
  isLoggedIn: boolean;
};

export function RegisterForm({
  tournamentId,
  canRegister,
  defaultEmail,
  defaultNickname,
  balanceRub,
  paymentsEnabled,
  isLoggedIn,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const canPayFromBalance =
    isLoggedIn && balanceRub !== undefined && balanceRub >= ENTRY_FEE_RUB;

  if (!canRegister) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-6 text-sm text-amber-100">
        Регистрация закрыта — все места заняты или турнир уже начался.
      </div>
    );
  }

  function readForm(form: HTMLFormElement) {
    const fd = new FormData(form);
    return {
      tournamentId,
      nickname: String(fd.get("nickname") ?? ""),
      gameAccount: String(fd.get("gameAccount") ?? ""),
      email: String(fd.get("email") ?? ""),
    };
  }

  return (
    <form
      ref={formRef}
      className="surface-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const form = e.currentTarget;
        startTransition(async () => {
          const input = readForm(form);
          const result = await submitRegistration(input);
          if (result.ok) {
            window.location.href = result.paymentUrl;
            return;
          }
          setMessage({ type: "err", text: result.error });
        });
      }}
    >
      <h2 className="text-lg font-bold text-white">Регистрация</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Взнос {formatRub(ENTRY_FEE_RUB)} — оплата картой через ЮKassa.
        {balanceRub !== undefined && (
          <>
            {" "}
            На балансе{" "}
            <span className="font-mono font-semibold text-lime-400">
              {formatRub(balanceRub)}
            </span>
            .
          </>
        )}
      </p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-zinc-400">Ник в игре</span>
          <input
            name="nickname"
            required
            minLength={2}
            defaultValue={defaultNickname}
            className="input-field mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-400">Steam / Riot / PUBG ID</span>
          <input
            name="gameAccount"
            required
            minLength={3}
            className="input-field mt-1"
            placeholder="76561198…"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-400">Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            readOnly={isLoggedIn}
            className="input-field mt-1"
            placeholder="you@mail.ru"
          />
        </label>
      </div>

      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "ok"
              ? "bg-lime-500/15 text-lime-200"
              : "bg-red-500/15 text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {!paymentsEnabled && (
        <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Платежи не настроены. Добавьте ключи ЮKassa в{" "}
          <code className="text-amber-200">.env.local</code> и перезапустите сервер.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending || !paymentsEnabled}
          className="btn-primary w-full py-3"
        >
          {pending ? "Переход к оплате…" : `Оплатить ${formatRub(ENTRY_FEE_RUB)} картой`}
        </button>

        {canPayFromBalance && (
          <button
            type="button"
            disabled={pending}
            className="btn-secondary w-full py-3"
            onClick={() => {
              setMessage(null);
              const form = formRef.current;
              if (!form) return;
              startTransition(async () => {
                const result = await submitRegistrationFromBalance(readForm(form));
                if (result.ok) {
                  setMessage({
                    type: "ok",
                    text: `Вы зарегистрированы! Списано ${formatRub(ENTRY_FEE_RUB)}, остаток ${formatRub(result.balanceRub)}.`,
                  });
                  form.reset();
                } else {
                  setMessage({ type: "err", text: result.error });
                }
              });
            }}
          >
            Оплатить с баланса ({formatRub(ENTRY_FEE_RUB)})
          </button>
        )}
      </div>
    </form>
  );
}
