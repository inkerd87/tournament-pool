import React from 'react';
import { Link } from 'react-router-dom';
import { ENTRY_FEE_RUB, PRIZE_BY_PLACE, TOTAL_PRIZES_RUB } from '@/lib/constants';
import { formatRub } from '@/lib/format';
import { useTournaments } from '@/context/TournamentContext';
import { TournamentCard } from '@/components/TournamentCard';
import { GameIcon } from '@/components/GameIcons';

const HERO_GAMES = [
  { id: 'cs2', name: 'CS2', color: '#f97316', glow: 'rgba(249, 115, 22, 0.45)', tag: '5v5 BO1' },
  { id: 'dota2', name: 'Dota 2', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)', tag: '5v5 MOBA' },
  { id: 'pubg', name: 'PUBG', color: '#facc15', glow: 'rgba(250, 204, 21, 0.4)', tag: 'Battle Royale' },
  { id: 'warzone', name: 'Warzone', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.45)', tag: 'Resurgence' },
  { id: 'fortnite', name: 'Fortnite', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)', tag: 'Zero Build' },
] as const;

export const HomePage: React.FC = () => {
  const { tournaments } = useTournaments();
  const featured = tournaments.slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,211,238,0.25),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 bg-violet-600/20 blur-[100px]" />
        
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Headline & Info */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Ежедневные киберспортивные турниры
              </span>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Киберспортивные турниры —{' '}
                <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                  {formatRub(ENTRY_FEE_RUB)}
                </span>{' '}
                участие
              </h1>

              <p className="mt-4 max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed">
                Открытые любительские соревнования по компьютерному спорту. Организационный сбор {formatRub(ENTRY_FEE_RUB)}.
                Наградной фонд соревнований {formatRub(TOTAL_PRIZES_RUB)}:{' '}
                {formatRub(PRIZE_BY_PLACE[1])} / {formatRub(PRIZE_BY_PLACE[2])} / {formatRub(PRIZE_BY_PLACE[3])} за 1–3 призовые места.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/tournaments" className="btn-primary w-full sm:w-auto py-3 px-6 text-center text-sm font-bold shadow-lg shadow-cyan-500/20">
                  Смотреть турниры
                </Link>
                <Link to="/how-it-works" className="btn-secondary w-full sm:w-auto py-3 px-6 text-center text-sm font-semibold">
                  Регламент соревнований
                </Link>
              </div>
            </div>

            {/* Right: 5 Game Cubes */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-3.5">
                {HERO_GAMES.map((g) => (
                  <Link
                    key={g.id}
                    to="/tournaments"
                    className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#12161f]/90 p-5 text-center transition-all duration-300 hover:scale-[1.04] hover:border-white/30 hover:shadow-2xl active:scale-[0.98] overflow-hidden"
                    style={{
                      boxShadow: `0 8px 30px -10px ${g.glow}`,
                    }}
                  >
                    {/* Glowing background bloom */}
                    <div
                      className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl opacity-30 transition-opacity duration-300 group-hover:opacity-70"
                      style={{ backgroundColor: g.color }}
                    />

                    {/* Square Icon Cube */}
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-lg overflow-hidden border p-1"
                      style={{
                        backgroundColor: `${g.color}15`,
                        borderColor: `${g.color}40`,
                      }}
                    >
                      <GameIcon game={g.id} className="w-full h-full object-cover rounded-xl" />
                    </div>

                    {/* Game Name */}
                    <span className="mt-3.5 text-sm font-extrabold text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                      {g.name}
                    </span>

                    {/* Tag / Format */}
                    <span
                      className="mt-1 text-[10px] font-semibold tracking-wider uppercase font-mono"
                      style={{ color: g.color }}
                    >
                      {g.tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
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
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-16">
          {[
            {
              step: "01",
              title: "Участие 100 ₽",
              text: `Фиксированный организационный сбор ${formatRub(ENTRY_FEE_RUB)} за регистрацию и судейство. Оплата картой или СБП.`,
            },
            {
              step: "02",
              title: "Доступ в комнату",
              text: "Сетка турнира и пароль от приватного лобби отображаются в личном кабинете после набора участников.",
            },
            {
              step: "03",
              title: "Награды топ-3",
              text: `Наградной фонд соревнований: ${formatRub(PRIZE_BY_PLACE[1])}, ${formatRub(PRIZE_BY_PLACE[2])}, ${formatRub(PRIZE_BY_PLACE[3])} за 1–3 призовые места. Выплата призовых на карту или СБП — в срок до 24 часов (до суток).`,
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
