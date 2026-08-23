"use client";

import { useState, useTransition } from "react";
import { saveMatchAccessAction } from "@/app/actions/admin";
import type { Tournament } from "@/lib/types";
import type { TournamentMatchAccess } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type Props = {
  tournaments: Tournament[];
  configs: TournamentMatchAccess[];
};

export function AdminMatchForm({ tournaments, configs }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState(tournaments[0]?.id ?? "");

  const current = configs.find((c) => c.tournamentId === selectedId);

  return (
    <form
      className="surface-card max-w-xl p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await saveMatchAccessAction(fd);
          if (result.ok) {
            setMessage({
              type: "ok",
              text: "Данные матча сохранены. Все оплатившие игроки увидят их сразу.",
            });
          } else {
            setMessage({ type: "err", text: result.error });
          }
        });
      }}
    >
      <h2 className="text-lg font-bold text-white">Данные текущего матча</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Выберите турнир и введите актуальные Room ID и пароль из PUBG. При новом
        матче просто обновите значения здесь.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-zinc-400">Турнир</span>
          <select
            name="tournamentId"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-field mt-1"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.registeredCount}/{t.maxPlayers})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-zinc-400">Room ID</span>
          <input
            name="roomId"
            required
            pattern="\d+"
            defaultValue={current?.roomId}
            key={`room-${selectedId}-${current?.updatedAt ?? "new"}`}
            className="input-field mt-1 font-mono"
            placeholder="12345678"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-zinc-400">Пароль</span>
          <input
            name="password"
            required
            pattern="\d+"
            defaultValue={current?.password}
            key={`pass-${selectedId}-${current?.updatedAt ?? "new"}`}
            className="input-field mt-1 font-mono"
            placeholder="482917"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-zinc-400">
            Ссылка на матч (необязательно)
          </span>
          <input
            name="joinUrl"
            type="url"
            defaultValue={current?.joinUrl ?? ""}
            key={`url-${selectedId}-${current?.updatedAt ?? "new"}`}
            className="input-field mt-1"
            placeholder="https://discord.gg/…"
          />
        </label>
      </div>

      {current && (
        <p className="mt-4 text-xs text-zinc-600">
          Последнее обновление: {formatDateTime(current.updatedAt)}
        </p>
      )}

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

      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full py-3">
        {pending ? "Сохраняем…" : "Сохранить для всех игроков"}
      </button>
    </form>
  );
}
