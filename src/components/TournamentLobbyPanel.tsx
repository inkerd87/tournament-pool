"use client";

import { useState } from "react";
import type { TournamentLobby, TournamentRuntime } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <code className="break-all font-mono text-sm text-cyan-200">{value}</code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
        >
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
    </div>
  );
}

function LobbyCard({ lobby, index }: { lobby: TournamentLobby; index: number }) {
  return (
    <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">
          Лобби {index + 1}
          <span className="ml-2 text-sm font-normal text-zinc-500">
            · {lobby.mode}
          </span>
        </h3>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          {lobby.map} · {lobby.region}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <CopyField label="Room ID / код" value={lobby.roomId} />
        <CopyField label="Пароль" value={lobby.password} />
      </div>

      <ol className="mt-6 space-y-2 text-sm text-zinc-400">
        {lobby.instructions.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 font-mono text-xs text-zinc-500">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-zinc-600">
        Игроков в лобби: {lobby.playerRegistrationIds.length}
      </p>
    </article>
  );
}

export function TournamentLobbyPanel({ runtime }: { runtime: TournamentRuntime }) {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-[#0c1018] to-[#0a0d12] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Турнир запущен
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">Лобби в игре создано</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Набор закрыт {formatDateTime(runtime.startedAt)} — подключайтесь по данным ниже.
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
          Live
        </span>
      </div>

      <div className="mt-8 space-y-4">
        {runtime.lobbies.map((lobby, i) => (
          <LobbyCard key={lobby.id} lobby={lobby} index={i} />
        ))}
      </div>
    </section>
  );
}
