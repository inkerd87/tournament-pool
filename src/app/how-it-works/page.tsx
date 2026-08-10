import {
  DEFAULT_MAX_PLAYERS,
  ENTRY_FEE_RUB,
  PRIZE_BY_PLACE,
  TOTAL_PRIZES_RUB,
} from "@/lib/constants";
import { formatRub } from "@/lib/format";
import { defaultPotentialPool } from "@/lib/prize-pool";

export const metadata = {
  title: "Как это работает",
};

export default function HowItWorksPage() {
  const fullPool = defaultPotentialPool(DEFAULT_MAX_PLAYERS);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-500/70">
        Правила
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
        Как это работает
      </h1>
      <p className="mt-4 leading-relaxed text-zinc-400">
        Модель простая: игроки скидываются на общий банк, организатор проводит
        турнир, призовой фонд получают только призёры.
      </p>

      <ol className="mt-10 list-decimal space-y-5 pl-5 leading-relaxed text-zinc-300">
        <li>
          Вы выбираете турнир по игре (CS2, Dota 2, PUBG, Valorant и др.) и
          оплачиваете участие — <strong className="text-white">{formatRub(ENTRY_FEE_RUB)}</strong> с
          человека.
        </li>
        <li>
          Когда набирается лимит (например, {DEFAULT_MAX_PLAYERS} человек), банк
          составляет{" "}
          <strong className="font-mono text-lime-400">{formatRub(fullPool)}</strong> (
          {DEFAULT_MAX_PLAYERS} × {formatRub(ENTRY_FEE_RUB)}).
        </li>
        <li>
          После матчей выплаты получают только места 1–3:{" "}
          <strong className="text-amber-200/90">{formatRub(PRIZE_BY_PLACE[1])}</strong>,{" "}
          <strong className="text-amber-200/90">{formatRub(PRIZE_BY_PLACE[2])}</strong>,{" "}
          <strong className="text-amber-200/90">{formatRub(PRIZE_BY_PLACE[3])}</strong>{" "}
          (всего {formatRub(TOTAL_PRIZES_RUB)}).
        </li>
        <li>
          Остальные участники приз не получают — они играют ради места в топ-3.
        </li>
      </ol>

      <div className="mt-12 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-100/90">
        <h2 className="font-bold text-amber-50">Важно для запуска в РФ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-amber-100/75">
          <li>
            Приём денег от физлиц требует подключения платёжного агрегатора (ЮKassa,
            Robokassa и т.п.) и договора с вашим юрлицом или ИП.
          </li>
          <li>
            Турниры с взносом и денежными призами могут попадать под регулирование
            азартных игр / лотерей — нужна консультация юриста.
          </li>
          <li>
            В этой версии сайта оплата <em>демонстрационная</em>: регистрация
            сохраняется локально в файл для прототипа.
          </li>
        </ul>
      </div>
    </div>
  );
}
