"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { STARTING_BALANCE_RUB } from "@/lib/constants";
import { formatRub } from "@/lib/format";

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="surface-card relative overflow-hidden p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await loginAction(fd);
          if (result?.ok === false) {
            setError(result.error);
          }
        });
      }}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/80">
          Личный кабинет
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-white">Вход в PoolArena</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Новым игрокам начисляем {formatRub(STARTING_BALANCE_RUB)} на демо-баланс.
        </p>

        <div className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-zinc-400">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input-field"
              placeholder="you@mail.ru"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-400">Ник (для нового аккаунта)</span>
            <input
              name="nickname"
              minLength={2}
              autoComplete="username"
              className="input-field"
              placeholder="NeonFox"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary mt-8 w-full py-3.5">
          {pending ? "Входим…" : "Войти"}
        </button>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Нет пароля — демо-режим.{" "}
          <Link href="/how-it-works" className="text-zinc-400 hover:text-white">
            Как устроены выплаты
          </Link>
        </p>
      </div>
    </form>
  );
}
