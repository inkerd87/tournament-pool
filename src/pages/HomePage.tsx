import React from 'react';
import { Link } from 'react-router-dom';
import { ENTRY_FEE_RUB, PRIZE_BY_PLACE, TOTAL_PRIZES_RUB } from '@/lib/constants';
import { formatRub } from '@/lib/format';
import { useTournaments } from '@/context/TournamentContext';
import { TournamentCard } from '@/components/TournamentCard';

export const HomePage: React.FC = () => {
  const { tournaments } = useTournaments();
  const featured = tournaments.slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,211,238,0.25),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 bg-violet-600/20 blur-[100px]" />
        
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            CS2 · Dota 2 · PUBG · Valorant
          </span>

          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Киберспортивные турниры —{' '}
            <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
              {formatRub(ENTRY_FEE_RUB)}
            </span>{' '}
            взнос
          </h1>

          <p className="mt-4 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
            Входной взнос всего {formatRub(ENTRY_FEE_RUB)}. Призовой фонд {formatRub(TOTAL_PRIZES_RUB)}:{' '}
            {formatRub(PRIZE_BY_PLACE[1])} / {formatRub(PRIZE_BY_PLACE[2])} / {formatRub(PRIZE_BY_PLACE[3])} за топ-3 места.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/tournaments" className="btn-primary w-full sm:w-auto py-3 text-center">
              Смотреть турниры
            </Link>
            <Link to="/how-it-works" className="btn-secondary w-full sm:w-auto py-3 text-center">
              Правила и выплаты
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Ближайшие события</h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">Выберите игру и зарегистрируйтесь</p>
          </div>
          <Link to="/tournaments" className="link-accent text-sm font-semibold">
            Все турниры →
          </Link>
        </div>

        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0a0d12]">
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 sm:py-16">
          {[
            {
              step: "01",
              title: "Взнос 100 ₽",
              text: `Каждый игрок вносит фиксированные ${formatRub(ENTRY_FEE_RUB)} с карты, СБП или баланса.`,
            },
            {
              step: "02",
              title: "Вход в лобби",
              text: "Сетка и пароль от приватной комнаты появляются в личном кабинете после набора участников.",
            },
            {
              step: "03",
              title: "Призы топ-3",
              text: `Гарантированные выплаты: ${formatRub(PRIZE_BY_PLACE[1])}, ${formatRub(PRIZE_BY_PLACE[2])}, ${formatRub(PRIZE_BY_PLACE[3])}.`,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 transition hover:border-cyan-500/30"
            >
              <span className="font-mono text-xs font-bold text-cyan-400">{item.step}</span>
              <h3 className="mt-2 text-base sm:text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
