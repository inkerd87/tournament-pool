import React from 'react';
import { formatRub } from '@/lib/format';
import { Tournament } from '@/lib/types';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB, PRIZE_BY_PLACE } from '@/lib/constants';

type Props = {
  tournament: Tournament;
  registered?: number;
  maxPlayers?: number;
};

const medals = ['🥇', '🥈', '🥉'] as const;

export const PrizeBreakdown: React.FC<Props> = ({ tournament }) => {
  const isSoon = tournament.status === 'soon';
  const entryFee = tournament.entryFeeRub ?? ENTRY_FEE_RUB;
  const prizePool = tournament.prizePoolRub ?? TOTAL_PRIZES_RUB;
  const prizes = tournament.prizes ?? PRIZE_BY_PLACE;

  if (isSoon) {
    return (
      <div className="surface-card p-6 border-amber-500/20 bg-amber-950/10">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <span className="text-xl">⏳</span>
          <h2 className="text-lg">Скоро на платформе</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Регламент, точный призовой фонд и дата открытия регистрации появятся в ближайшее время.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-6">
      <h2 className="text-lg font-bold text-white">Наградной фонд</h2>
      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
        {tournament.winnerPerPlayerRub ? (
          <>
            Взнос за участие — <strong className="text-white">{formatRub(entryFee)}</strong> с игрока. Победившая команда забирает весь банк:{' '}
            <strong className="text-amber-300 font-bold">{formatRub(prizePool)}</strong> (по{' '}
            <strong className="text-cyan-300">{formatRub(tournament.winnerPerPlayerRub)}</strong> на каждого игрока команды).
          </>
        ) : (
          <>
            Организационный сбор за участие — {formatRub(entryFee)}. Награды гарантированно вручаются за 1–3 призовые места.
          </>
        )}
      </p>

      <ul className="mt-6 space-y-2">
        {([1, 2, 3] as const).map((place) => {
          const prizeAmt = prizes[place] ?? 0;
          if (tournament.winnerPerPlayerRub && place === 3) return null; // Не показываем 3 место для 5v5 матча двух команд

          return (
            <li
              key={place}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                place === 1
                  ? 'border-amber-500/30 bg-amber-500/10 shadow-sm shadow-amber-500/10'
                  : 'border-white/10 bg-black/20 opacity-75'
              }`}
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
                  <span aria-hidden>{medals[place - 1]}</span>
                  {place}-е место {place === 1 && tournament.winnerPerPlayerRub ? '(Команда-победитель)' : ''}
                </span>
                {place === 1 && tournament.winnerPerPlayerRub && (
                  <span className="text-[11px] text-cyan-300 font-mono mt-0.5">
                    по {formatRub(tournament.winnerPerPlayerRub)} каждому игроку
                  </span>
                )}
              </div>
              <span className={`font-mono text-lg font-bold ${place === 1 ? 'text-amber-300' : 'text-zinc-400'}`}>
                {prizeAmt > 0 ? formatRub(prizeAmt) : '0 ₽'}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-6 grid gap-3 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Взнос с игрока</dt>
          <dd className="font-mono font-medium text-white">
            {formatRub(entryFee)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Банк матча</dt>
          <dd className="font-mono font-medium text-zinc-300">
            {formatRub(entryFee * tournament.maxPlayers)} ({tournament.maxPlayers} × {formatRub(entryFee)})
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Награда за 1 место</dt>
          <dd className="font-mono font-semibold text-amber-300">
            {formatRub(prizePool)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Набрано участников</dt>
          <dd className="font-mono text-zinc-300">
            {tournament.registeredCount} / {tournament.maxPlayers}
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
