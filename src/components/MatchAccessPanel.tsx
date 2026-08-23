"use client";

import { useState } from "react";
import type { TournamentMatchAccess } from "@/lib/types";
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

type Props = {
  match: TournamentMatchAccess;
  tournamentTitle: string;
};

export function MatchAccessPanel({ match, tournamentTitle }: Props) {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-[#0c1018] to-[#0a0d12] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Доступ к матчу
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{tournamentTitle}</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Вы оплатили участие. Данные обновлены{" "}
            {formatDateTime(match.updatedAt)}.
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
          Оплачено
        </span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <CopyField label="Room ID (только цифры)" value={match.roomId} />
        <CopyField label="Пароль" value={match.password} />
      </div>

      {match.joinUrl && (
        <a
          href={match.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
        >
          Перейти к матчу →
        </a>
      )}

      <ol className="mt-6 space-y-2 text-sm text-zinc-400">
        <li>1. Откройте PUBG → Play → Custom Match → Join</li>
        <li>2. Введите Room ID и пароль с этой страницы</li>
        <li>3. Заходите с аккаунта, указанного при регистрации</li>
      </ol>
    </section>
  );
}
