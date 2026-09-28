import React from 'react';
import { formatRub } from '@/lib/format';
import { Tournament } from '@/lib/types';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB, PRIZE_BY_PLACE } from '@/lib/constants';

type Props = {
  tournament: Tournament;
  registered?: number;
  maxPlayers?: number;
};

const getMedal = (place: number) => {
  if (place === 1) return '🥇';
  if (place === 2) return '🥈';
  if (place === 3) return '🥉';
  return '🏅';
};

export const PrizeBreakdown: React.FC<Props> = ({ tournament }) => {
  const isSoon = tournament.status === 'soon';
  const entryFee = tournament.entryFeeRub ?? ENTRY_FEE_RUB;
  const prizePool = tournament.prizePoolRub ?? TOTAL_PRIZES_RUB;
  const prizes: Record<number, number> = tournament.prizes ?? PRIZE_BY_PLACE;

  const placesCount = React.useMemo(() => {
    if (typeof tournament.winningPlacesCount === 'number' && tournament.winningPlacesCount >= 1) {
      return tournament.winningPlacesCount;
    }
    const nonZeroPlaces = Object.keys(prizes)
      .map(Number)
      .filter((p) => !isNaN(p) && (prizes[p] ?? 0) > 0);
    if (nonZeroPlaces.length > 0) {
      return Math.max(...nonZeroPlaces);
    }
    return tournament.winnerPerPlayerRub ? 1 : 3;
  }, [tournament.winningPlacesCount, tournament.winnerPerPlayerRub, prizes]);

  const placesList = React.useMemo(
    () => Array.from({ length: placesCount }, (_, idx) => idx + 1),
    [placesCount]
  );

  if (isSoon) {
    return (
      <div className="surface-card p-6 border-amber-500/20 bg-amber-950/10">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <span className="text-xl">⏳</span>
          <h2 className="text-lg">Скоро на платформе</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Регламент, размер вознаграждения и дата открытия регистрации появятся в ближайшее время.
        </p>
      </div>
    );
  }

  return (
    <div className={`surface-card p-6 ${tournament.isPremium ? 'border-amber-500/40 bg-gradient-to-b from-[#181512] to-[#12161f] shadow-lg shadow-amber-500/10' : ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Вознаграждение победителям</h2>
        {tournament.isPremium && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-300">
            ⭐ Премиум
          </span>
        )}
      </div>

      <div className="mt-2.5 rounded-xl border border-white/5 bg-black/30 p-3.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Вознаграждение от организатора:</span>
          <span className="text-base font-extrabold text-amber-300 font-mono">{formatRub(prizePool)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Призовых мест:</span>
          <span className="font-bold text-cyan-300 font-mono">{placesCount}</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed pt-0.5">
          Фиксированная сумма учреждена организатором соревнований за спортивные достижения и <strong>не зависит от количества участников</strong> или сбора платежей.
        </p>
      </div>

      <ul className="mt-5 space-y-2">
        {placesList.map((place) => {
          const prizeAmt = prizes[place] ?? 0;

          return (
            <li
              key={place}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                place === 1
                  ? 'border-amber-500/30 bg-amber-500/10 shadow-sm shadow-amber-500/10'
                  : 'border-white/10 bg-black/20 opacity-85'
              }`}
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
                  <span aria-hidden>{getMedal(place)}</span>
                  {place}-е место {place === 1 && tournament.winnerPerPlayerRub ? '(Команда-победитель)' : ''}
                </span>
                {place === 1 && tournament.winnerPerPlayerRub && (
                  <span className="text-[11px] text-cyan-300 font-mono mt-0.5">
                    по {formatRub(tournament.winnerPerPlayerRub)} каждому игроку
                  </span>
                )}
              </div>
              <span className={`font-mono text-lg font-bold ${place === 1 ? 'text-amber-300' : 'text-zinc-300'}`}>
                {prizeAmt > 0 ? formatRub(prizeAmt) : '0 ₽'}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Отдельный блок: Оплата организационных услуг */}
      <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-3.5 space-y-1.5 text-xs text-zinc-300">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-white">Организационные услуги:</span>
          <span className="font-mono font-bold text-cyan-300">{formatRub(entryFee)}</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-snug">
          Оплата услуг по организации соревнований (работа судейской коллегии, серверная платформа, модерация лобби, подбор оппонентов по уровню). Не является ставкой или взносом в общий котёл.
        </p>
      </div>

      <dl className="mt-4 grid gap-2.5 border-t border-white/10 pt-3.5 text-xs sm:text-sm">
        <div className="flex justify-between items-center">
          <dt className="text-zinc-400">Участников в сетке</dt>
          <dd className="font-mono text-zinc-300 flex items-center gap-1.5">
            <span>{tournament.registeredCount} / {tournament.maxPlayers}</span>
            {tournament.minPlayers && (
              <span className="inline-flex items-center rounded border border-red-900/60 bg-red-950/70 px-1.5 py-0.5 text-[10px] font-bold text-red-400 font-sans">
                старт от {tournament.minPlayers}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-3.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300 flex items-start gap-2.5">
        <span className="text-base leading-none">⏱</span>
        <div className="leading-snug">
          <span className="font-bold text-cyan-300">Выплата вознаграждения:</span> перечисление победителям через СБП или на карту РФ в срок <strong className="text-white">до 24 часов (до суток)</strong> после судейской фиксации результатов.
        </div>
      </div>
    </div>
  );
};
