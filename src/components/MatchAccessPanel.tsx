import React, { useState } from 'react';
import { TournamentMatchAccess } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export const MatchAccessPanel: React.FC<{ match: TournamentMatchAccess; tournamentTitle: string }> = ({
  match,
  tournamentTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Room: ${match.roomId} | Password: ${match.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6 shadow-[0_0_50px_-15px_rgba(6,182,212,0.25)]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          Данные для входа в лобби
        </span>
        <span className="text-xs text-zinc-500">Обновлено: {formatDateTime(match.updatedAt)}</span>
      </div>

      <h3 className="mt-2 text-lg font-bold text-white">{tournamentTitle}</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-xs font-medium text-zinc-500">Имя лобби / Room ID</p>
          <p className="mt-1 font-mono text-base font-bold text-white select-all">{match.roomId}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-xs font-medium text-zinc-500">Пароль</p>
          <p className="mt-1 font-mono text-base font-bold text-cyan-300 select-all">{match.password}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handleCopy}
          className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          {copied ? '✓ Скопировано!' : 'Скопировать данные'}
        </button>
        {match.joinUrl && (
          <a
            href={match.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 underline hover:text-cyan-300"
          >
            Инструкция / Стрим турнира →
          </a>
        )}
      </div>
    </div>
  );
};
