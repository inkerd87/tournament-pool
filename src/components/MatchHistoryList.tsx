import React from 'react';
import { MatchHistoryEntry } from '@/lib/types';
import { formatDateShort, formatRub, placementLabel } from '@/lib/format';
import { GameBadge } from '@/components/GameBadge';

export const MatchHistoryList: React.FC<{ matches: MatchHistoryEntry[] }> = ({ matches }) => {
  if (matches.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-sm text-zinc-500">
        У вас пока нет завершённых матчей.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <div key={m.id} className="surface-card flex flex-wrap items-center justify-between gap-4 p-4 text-sm">
          <div className="flex items-center gap-3">
            <GameBadge game={m.game} />
            <div>
              <p className="font-semibold text-white">{m.tournamentTitle}</p>
              <p className="text-xs text-zinc-500">{formatDateShort(m.playedAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span
                className={`font-bold ${
                  m.placement === 1
                    ? 'text-amber-300'
                    : m.placement === 2
                    ? 'text-zinc-300'
                    : m.placement === 3
                    ? 'text-amber-600'
                    : 'text-zinc-500'
                }`}
              >
                {placementLabel(m.placement)}
              </span>
              <p className="text-xs text-zinc-500">
                {m.kills} / {m.deaths} / {m.assists}
              </p>
            </div>

            <div className="text-right font-mono">
              <span className={m.prizeRub > 0 ? 'font-bold text-emerald-400' : 'text-zinc-500'}>
                {m.prizeRub > 0 ? `+${formatRub(m.prizeRub)}` : '0 ₽'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
