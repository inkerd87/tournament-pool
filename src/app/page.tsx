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
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,211,238,0.25),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 bg-violet-600/20 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
            CS2 · Dota 2 · PUBG · Valorant
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Турниры с общим банком —{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
              {formatRub(ENTRY_FEE_RUB)}
            </span>{" "}
            за вход
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400">
            {DEFAULT_MAX_PLAYERS} игроков × {formatRub(ENTRY_FEE_RUB)} = банк{" "}
            {formatRub(examplePool)}. Призы: {formatRub(PRIZE_BY_PLACE[1])} /{" "}
            {formatRub(PRIZE_BY_PLACE[2])} / {formatRub(PRIZE_BY_PLACE[3])} за
            топ-3. Остальные — без выплат, но с шансом на медаль.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/tournaments"
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-black hover:bg-cyan-400"
            >
              Смотреть турниры
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white hover:bg-white/5"
            >
              Правила и выплаты
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Ближайшие события</h2>
            <p className="mt-1 text-zinc-500">Выберите игру и зарегистрируйтесь</p>
          </div>
          <Link href="/tournaments" className="text-sm text-cyan-400 hover:text-cyan-300">
            Все турниры →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0a0d12]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
          {[
            {
              title: "1. Взнос",
              text: `Каждый игрок платит ${formatRub(ENTRY_FEE_RUB)} на общий счёт турнира.`,
            },
            {
              title: "2. Игра",
              text: "Сетка и лобби публикуются после набора. Формат зависит от дисциплины.",
            },
            {
              title: "3. Призы",
              text: `Только 1–3 места: ${formatRub(PRIZE_BY_PLACE[1])}, ${formatRub(PRIZE_BY_PLACE[2])}, ${formatRub(PRIZE_BY_PLACE[3])}.`,
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
