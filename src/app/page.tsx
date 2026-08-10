import Link from "next/link";
import {
  DEFAULT_MAX_PLAYERS,
  ENTRY_FEE_RUB,
  PRIZE_BY_PLACE,
} from "@/lib/constants";
import { formatRub } from "@/lib/format";
import { defaultPotentialPool } from "@/lib/prize-pool";
import { getTournaments } from "@/lib/tournament-store";
import { TournamentCard } from "@/components/TournamentCard";

export default async function HomePage() {
  const tournaments = await getTournaments();
  const featured = tournaments.slice(0, 3);
  const examplePool = defaultPotentialPool(DEFAULT_MAX_PLAYERS);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[color:var(--border)]">
        <div className="page-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(190,242,100,0.12),transparent)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/40 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-500/20 bg-lime-400/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime-400/90">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
            CS2 · Dota 2 · PUBG · Valorant
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Турниры с общим банком —{" "}
            <span className="gradient-headline">{formatRub(ENTRY_FEE_RUB)}</span> за
            вход
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            {DEFAULT_MAX_PLAYERS} игроков × {formatRub(ENTRY_FEE_RUB)} = банк{" "}
            <span className="font-semibold text-amber-200/90">
              {formatRub(examplePool)}
            </span>
            . Призы: {formatRub(PRIZE_BY_PLACE[1])} / {formatRub(PRIZE_BY_PLACE[2])}{" "}
            / {formatRub(PRIZE_BY_PLACE[3])} за топ-3. Остальные — без выплат, но с
            шансом на медаль.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/tournaments" className="btn-primary px-7 py-3">
              Смотреть турниры
            </Link>
            <Link href="/how-it-works" className="btn-secondary px-7 py-3">
              Правила и выплаты
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Ближайшие события
            </h2>
            <p className="mt-1 text-zinc-500">Выберите игру и зарегистрируйтесь</p>
          </div>
          <Link href="/tournaments" className="link-accent text-sm font-semibold">
            Все турниры →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </section>

      <section className="border-t border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6">
          {[
            {
              step: "01",
              title: "Взнос",
              text: `Каждый игрок платит ${formatRub(ENTRY_FEE_RUB)} на общий счёт турнира.`,
            },
            {
              step: "02",
              title: "Игра",
              text: "Сетка и лобби публикуются после набора. Формат зависит от дисциплины.",
            },
            {
              step: "03",
              title: "Призы",
              text: `Только 1–3 места: ${formatRub(PRIZE_BY_PLACE[1])}, ${formatRub(PRIZE_BY_PLACE[2])}, ${formatRub(PRIZE_BY_PLACE[3])}.`,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="surface-card relative overflow-hidden p-6 hover:border-lime-500/20"
            >
              <span className="font-mono text-xs font-bold text-lime-500/50">
                {item.step}
              </span>
              <h3 className="mt-2 font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
