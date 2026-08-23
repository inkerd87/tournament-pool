"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLoginAction } from "@/app/actions/admin";

export function AdminLoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="surface-card max-w-md p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await adminLoginAction(fd);
          if (result?.ok === false) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <h1 className="text-xl font-bold text-white">Админка матчей</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Введите пароль администратора, чтобы задать Room ID и пароль для игроков.
      </p>
      <label className="mt-6 block text-sm">
        <span className="font-medium text-zinc-400">Пароль</span>
        <input
          name="password"
          type="password"
          required
          className="input-field mt-1"
          autoComplete="current-password"
        />
      </label>
      {error && (
        <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full py-3">
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
