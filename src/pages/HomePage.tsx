import React from 'react';
import { Link } from 'react-router-dom';
import { useTournaments } from '@/context/TournamentContext';
import { TournamentCard } from '@/components/TournamentCard';
import { GameIcon } from '@/components/GameIcons';
import { VK_GROUP_URL } from '@/lib/constants';

const DEFAULT_HERO_GAMES = [
  { id: 'cs2', name: 'CS2', color: '#f97316', glow: 'rgba(249, 115, 22, 0.45)', tag: '5v5 BO1' },
  { id: 'dota2', name: 'Dota 2', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)', tag: '5v5 MOBA' },
  { id: 'pubg', name: 'PUBG', color: '#facc15', glow: 'rgba(250, 204, 21, 0.4)', tag: 'Battle Royale' },
  { id: 'pubg_mobile', name: 'PUBG Mobile', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)', tag: 'Mobile BR' },
  { id: 'warzone', name: 'Warzone', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.45)', tag: 'Resurgence' },
  { id: 'fortnite', name: 'Fortnite', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)', tag: 'Zero Build' },
] as const;

export const HomePage: React.FC = () => {
  const { tournaments, customGames } = useTournaments();
  const heroGames = [
    ...DEFAULT_HERO_GAMES,
    ...customGames.map((cg) => ({
      id: cg.id,
      name: cg.short || cg.name,
      color: cg.accent || '#22d3ee',
      glow: cg.glow || 'rgba(34, 211, 238, 0.45)',
      tag: cg.tag || 'Tournament',
    })),
  ];
  const featured = tournaments.filter((t) => !t.isPremium).slice(0, Math.max(6, 6 + customGames.length));

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
                Ежедневные киберспортивные соревнования
              </span>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Киберспортивные соревнования{' '}
                <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                  NightByte
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed">
                Открытые любительские соревнования по CS2, Dota 2, PUBG, PUBG Mobile, Warzone и Fortnite. Различные форматы соревнований, честное судейство и вознаграждение победителям.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <Link to="/tournaments" className="btn-primary w-full sm:w-auto py-3 px-6 text-center text-sm font-bold shadow-lg shadow-cyan-500/20">
                  Смотреть соревнования
                </Link>
                <Link to="/how-it-works" className="btn-secondary w-full sm:w-auto py-3 px-6 text-center text-sm font-semibold">
                  Регламент соревнований
                </Link>
                <a
                  href={VK_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0077FF]/50 bg-[#0077FF]/15 px-5 py-3 text-sm font-bold text-white transition hover:border-[#0077FF] hover:bg-[#0077FF]/30 hover:shadow-lg hover:shadow-[#0077FF]/25 active:scale-[0.99]"
                >
                  <svg className="h-4 w-4 fill-[#3b9dff]" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                  </svg>
                  <span>Мы ВКонтакте</span>
                </a>
              </div>
            </div>

            {/* Right: Game Cubes */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-3.5">
                {heroGames.map((g) => (
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
            Все соревнования →
          </Link>
        </div>

        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </section>

      {/* Красивый баннер сообщества ВКонтакте */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-[#0077FF]/40 bg-gradient-to-br from-[#0077FF]/20 via-[#12161f] to-cyan-500/10 p-6 sm:p-10 shadow-2xl shadow-[#0077FF]/10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#0077FF]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0077FF]/40 bg-[#0077FF]/20 px-3 py-1 text-xs font-bold text-[#6eb4ff]">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                </svg>
                <span>Официальное сообщество ВКонтакте</span>
              </div>

              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Присоединяйтесь к <span className="text-[#4da3ff]">NightByte Club</span> ВКонтакте
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Следите за расписанием новых турниров, результатами матчей, отчётами о выплатах призовых, анонсами новых дисциплин и общайтесь с участниками и организаторами напрямую.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-200">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">📢 Анонсы и расписание</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">🏆 Результаты и выплаты</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">💬 Чат игроков и поддержка</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">🎁 Розыгрыши слотов</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0077FF] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-[#0077FF]/30 transition-all duration-200 hover:bg-[#1a85ff] hover:scale-[1.02] active:scale-[0.99]"
              >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                </svg>
                <span>Вступить в группу ВК</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <span className="text-center lg:text-right font-mono text-xs text-zinc-400">
                vk.ru/nightbyte.club
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0a0d12]">
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-16">
          {[
            {
              step: "01",
              title: "Организация",
              text: "Выберите дисциплину и подходящий формат. Оплата услуг по организации соревнований (судейство, платформа, подбор оппонентов) банковской картой РФ или через СБП.",
            },
            {
              step: "02",
              title: "Доступ в комнату",
              text: "Сетка соревнований и данные для подключения к лобби (Room ID и пароль) отображаются в личном кабинете после набора участников.",
            },
            {
              step: "03",
              title: "Вознаграждение организатора",
              text: "Победителей соревнований ждет фиксированное вознаграждение от организатора за спортивные достижения (не зависящее от взносов участников). Выплата через СБП до 24 часов.",
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
