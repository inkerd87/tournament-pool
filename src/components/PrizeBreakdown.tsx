import { formatRub } from "@/lib/format";
import { PRIZE_BY_PLACE } from "@/lib/constants";
import { poolSummary } from "@/lib/prize-pool";

type Props = {
  registered: number;
  maxPlayers: number;
};

const medals = ["🥇", "🥈", "🥉"] as const;

export function PrizeBreakdown({ registered, maxPlayers }: Props) {
  const summary = poolSummary(registered, maxPlayers);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12161f] p-6">
      <h2 className="text-lg font-semibold text-white">Призы и банк</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Каждый участник вносит {formatRub(summary.entryFee)}. Призы только за
        1–3 место — остальные играют за шанс попасть в топ.
      </p>

      <ul className="mt-6 space-y-3">
        {([1, 2, 3] as const).map((place) => (
          <li
            key={place}
            className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3"
          >
            <span className="flex items-center gap-2 text-zinc-300">
              <span aria-hidden>{medals[place - 1]}</span>
              {place}-е место
            </span>
            <span className="text-lg font-bold text-white">
              {formatRub(PRIZE_BY_PLACE[place])}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 grid gap-3 border-t border-white/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Собрано сейчас</dt>
          <dd className="font-medium text-white">{formatRub(summary.collected)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Банк при {maxPlayers} игроках</dt>
          <dd className="font-medium text-cyan-300">
            {formatRub(summary.potential)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Выплаты топ-3</dt>
          <dd className="text-zinc-300">{formatRub(summary.prizesPaid)}</dd>
        </div>
        <div className="flex justify-between text-xs">
          <dt className="text-zinc-600">Остаток банка при полном наборе*</dt>
          <dd className="text-zinc-500">{formatRub(summary.remainderAtFull)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-zinc-600">
        * Остаток можно зарезервировать на комиссию платформы, анти-чит и
        организацию — настройка для продакшена.
      </p>
    </div>
  );
}
