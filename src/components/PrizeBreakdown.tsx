import React from 'react';
import { formatRub } from '@/lib/format';
import { ENTRY_FEE_RUB, PRIZE_BY_PLACE, TOTAL_PRIZES_RUB } from '@/lib/constants';

type Props = {
  registered: number;
  maxPlayers: number;
};

const medals = ['🥇', '🥈', '🥉'] as const;

export const PrizeBreakdown: React.FC<Props> = ({ registered, maxPlayers }) => {
  return (
    <div className="surface-card p-6">
      <h2 className="text-lg font-bold text-white">Наградной фонд</h2>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500">
        Организационный сбор за участие — {formatRub(ENTRY_FEE_RUB)}. Награды гарантированно вручаются за 1–3 призовые места.
      </p>

      <ul className="mt-6 space-y-2">
        {([1, 2, 3] as const).map((place) => (
          <li
            key={place}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-zinc-300">
              <span aria-hidden>{medals[place - 1]}</span>
              {place}-е место
            </span>
            <span className="font-mono text-lg font-bold text-amber-200/90">
              {formatRub(PRIZE_BY_PLACE[place])}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 grid gap-3 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Оргсбор с игрока</dt>
          <dd className="font-mono font-medium text-white">
            {formatRub(ENTRY_FEE_RUB)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Общий наградной фонд</dt>
          <dd className="font-mono font-semibold text-amber-200/90">
            {formatRub(TOTAL_PRIZES_RUB)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Участников</dt>
          <dd className="font-mono text-zinc-300">
            {registered} / {maxPlayers}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-zinc-300 flex items-start gap-2.5">
        <span className="text-base leading-none">⏱</span>
        <div className="leading-snug">
          <span className="font-bold text-cyan-300">Выплата призовых:</span> перевод на карту РФ или СБП осуществляется в срок <strong className="text-white">до 24 часов (до суток)</strong> после фиксации результатов матча.
        </div>
      </div>
    </div>
  );
};
