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
    <div className="mt-4 sm:mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 sm:p-6 shadow-[0_0_50px_-15px_rgba(6,182,212,0.25)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          Данные для входа в лобби
        </span>
        <span className="text-[11px] text-zinc-500">Обновлено: {formatDateTime(match.updatedAt)}</span>
      </div>

      <h3 className="mt-2 text-base sm:text-lg font-bold text-white">{tournamentTitle}</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/50 p-3">
          <p className="text-[11px] font-semibold text-zinc-400">Имя лобби / Room ID</p>
          <p className="mt-1 font-mono text-sm sm:text-base font-bold text-white select-all break-all">{match.roomId}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/50 p-3">
          <p className="text-[11px] font-semibold text-zinc-400">Пароль</p>
          <p className="mt-1 font-mono text-sm sm:text-base font-bold text-cyan-300 select-all break-all">{match.password}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={handleCopy}
          className="w-full sm:w-auto rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-95 text-center"
        >
          {copied ? '✓ Скопировано в буфер!' : 'Скопировать данные'}
        </button>
        {match.joinUrl && (
          <a
            href={match.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 underline hover:text-cyan-300 text-center sm:text-right"
          >
            Инструкция / Стрим турнира →
          </a>
        )}
      </div>
    </div>
  );
};
