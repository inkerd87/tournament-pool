import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournaments } from '@/context/TournamentContext';
import { TournamentCard } from '@/components/TournamentCard';
import { GameIcon } from '@/components/GameIcons';
import { VK_GROUP_URL } from '@/lib/constants';
import { GAME_WALLPAPERS } from '@/lib/games';

export const HomePage: React.FC = () => {
  const { tournaments, customGames, allGames } = useTournaments();
  const [activeGameId, setActiveGameId] = useState<string>('cs2');

  const heroGames = (allGames && allGames.length > 0 ? allGames : []).map((g) => ({
    id: g.id,
    name: g.short || g.name,
    color: g.accent,
    glow: g.glow || `${g.accent}66`,
    tag: g.tag,
    wallpaperUrl: g.wallpaperUrl || GAME_WALLPAPERS[g.id] || g.iconUrl,
  }));

  const activeGameConfig = heroGames.find((g) => g.id === activeGameId) || heroGames[0];
  const activeCount = tournaments.filter((t) => t.status === 'recruiting' || t.status === 'live').length;
  const featured = tournaments.filter((t) => !t.isPremium);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Главный Hero-блок (Command Center) с фоновыми картинками и кибер-ареной */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#06080e]/60 pt-6 pb-12 sm:pt-12 sm:pb-20">
        
        {/* Большая кинематографичная картинка игры на заднем фоне всей верхней секции */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden transition-all duration-700">
          {heroGames.map((g) => {
            const wallpaper = (g as any).wallpaperUrl || GAME_WALLPAPERS[g.id];
            const isCurrent = activeGameId === g.id;
            return (
              <div
                key={g.id}
                className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out ${
                  isCurrent ? 'opacity-40 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                }`}
                style={{
                  backgroundImage: `url(${wallpaper})`,
                }}
              />
            );
          })}

          {/* Стандартный фоновый кибер-свет */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl opacity-50" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[350px] bg-amber-500/5 blur-3xl" />

          {/* Затемняющие градиенты для сохранения 100% контрастности и читаемости текста */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06080e]/90 via-[#090d16]/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,8,14,0.75)_85%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Левая колонка: Оффер и кнопки */}
            <div className="lg:col-span-7">
              {/* Бейдж сезона */}
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-cyan-300 mb-5 shadow-lg shadow-cyan-500/10">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="tracking-wide uppercase text-[11px]">СЕЗОН 2026 • NIGHTBYTE LEAGUE</span>
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-[52px]">
                Киберспортивные соревнования{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  NightByte
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                Открытые любительские соревнования по CS2, Dota 2, PUBG, PUBG Mobile, Apex Legends, Warzone и Fortnite. Различные форматы соревнований, честное судейство и вознаграждение победителям.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <Link
                  to="/tournaments"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 px-6 py-3.5 text-sm font-black text-black shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Смотреть соревнования</span>
                </Link>

                <Link
                  to="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Регламент соревнований</span>
                </Link>

                <a
                  href={VK_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0077FF]/40 bg-[#0077FF]/20 px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:border-[#0077FF] hover:bg-[#0077FF]/30 active:scale-[0.98]"
                >
                  <svg className="h-4 w-4 fill-[#4da3ff]" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                  </svg>
                  <span>Мы ВКонтакте</span>
                </a>
              </div>
            </div>

            {/* Правая колонка: ИНТЕРАКТИВНЫЙ КОМАНДНЫЙ ЦЕНТР ДИСЦИПЛИН */}
            <div className="lg:col-span-5 relative">
              <div
                className="relative rounded-3xl border p-4 sm:p-5 overflow-hidden shadow-2xl bg-[#070b14]/90 backdrop-blur-xl transition-all duration-300"
                style={{
                  boxShadow: `0 20px 50px -15px ${activeGameConfig.glow}`,
                  borderColor: `${activeGameConfig.color}40`,
                }}
              >
                
                {/* Кинематографичный фон активной дисциплины */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {heroGames.map((g) => {
                    const wallpaper = (g as any).wallpaperUrl || GAME_WALLPAPERS[g.id];
                    const isCurrent = activeGameId === g.id;
                    return (
                      <div
                        key={g.id}
                        className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out ${
                          isCurrent ? 'opacity-35 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                        }`}
                        style={{
                          backgroundImage: `url(${wallpaper})`,
                        }}
                      />
                    );
                  })}

                  {/* Затемняющий градиент поверх картинки */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/85 to-[#070b14]/65" />
                  <div className="absolute inset-0 bg-black/35" />
                </div>

                {/* Верхний статус-бар: Дисциплины платформы */}
                <div className="relative z-10 mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: activeGameConfig.color }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ backgroundColor: activeGameConfig.color }}
                      />
                    </span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Дисциплины платформы
                    </span>
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                      {heroGames.length} Игр
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-bold text-cyan-300 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Сезон 2026</span>
                  </div>
                </div>

                {/* Сетка карточек всех дисциплин */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5">
                  {heroGames.map((g) => {
                    const isSelected = activeGameId === g.id;

                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setActiveGameId(g.id)}
                        onMouseEnter={() => setActiveGameId(g.id)}
                        className={`group relative flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'bg-black/90 shadow-lg scale-[1.02]'
                            : 'bg-black/60 hover:bg-black/80 border-white/10 hover:border-white/25'
                        }`}
                        style={{
                          borderColor: isSelected ? g.color : undefined,
                          boxShadow: isSelected ? `0 4px 20px -2px ${g.glow}` : undefined,
                        }}
                      >
                        {/* Иконка игры с цветной рамкой */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 overflow-hidden border p-0.5"
                          style={{
                            backgroundColor: `${g.color}25`,
                            borderColor: `${g.color}60`,
                          }}
                        >
                          <GameIcon game={g.id} className="w-full h-full object-cover rounded" />
                        </div>

                        {/* Название и формат */}
                        <div className="min-w-0 flex-1">
                          <span className={`block text-xs sm:text-sm font-black tracking-tight truncate transition-colors ${
                            isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                          }`}>
                            {g.name}
                          </span>
                          <span
                            className="block text-[9px] font-bold tracking-wider uppercase font-mono truncate"
                            style={{ color: g.color }}
                          >
                            {g.tag}
                          </span>
                        </div>

                        {/* Индикатор выбора */}
                        {isSelected && (
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: g.color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Интерактивный нижний лаунчер выбранной игры */}
                <div className="relative z-10 mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3 bg-black/40 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:p-4 rounded-b-3xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 rounded-lg border p-0.5 shrink-0 flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: `${activeGameConfig.color}20`,
                        borderColor: `${activeGameConfig.color}50`,
                      }}
                    >
                      <GameIcon game={activeGameConfig.id} className="w-full h-full object-contain rounded" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        {activeGameConfig.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium truncate">
                        {activeGameConfig.tag} • Открытые соревнования
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/tournaments?game=${activeGameConfig.id}`}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black text-black transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${activeGameConfig.color}, #ffffff)`,
                      boxShadow: `0 4px 15px -2px ${activeGameConfig.glow}`,
                    }}
                  >
                    <span>К турнирам</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

              </div>
            </div>

          </div>

          {/* Информационная полоса статистики / Преимуществ */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-white/[0.08] pt-8">
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 sm:p-4">
              <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400 block">8 Игр</span>
              <span className="text-xs text-zinc-400 font-medium mt-1 block">CS2, Dota 2, PUBG, Apex, Warzone...</span>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 sm:p-4">
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 block">До 24ч</span>
              <span className="text-xs text-zinc-400 font-medium mt-1 block">Выплаты вознаграждений через СБП</span>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 sm:p-4">
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400 block">100%</span>
              <span className="text-xs text-zinc-400 font-medium mt-1 block">Честное судейство и проверка читов</span>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 sm:p-4">
              <span className="font-mono text-xl sm:text-2xl font-black text-purple-400 block">Любая сумма</span>
              <span className="text-xs text-zinc-400 font-medium mt-1 block">Пополнение 100, 200, 500, 1000 ₽ или своя</span>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог актуальных турниров */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Ближайшие соревнования
              </h2>
              <span className="rounded-full bg-cyan-500/15 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-300 font-mono">
                {activeCount} активных
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Выберите дисциплину, оплатите оргвзнос картой или СБП и получите доступ в закрытое лобби
            </p>
          </div>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>Все соревнования</span>
            <span>→</span>
          </Link>
        </div>

        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      </section>

      {/* Сообщество ВКонтакте */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[#0077FF]/35 bg-gradient-to-br from-[#0c1527] via-[#09101d] to-[#080d17] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0077FF]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0077FF]/40 bg-[#0077FF]/20 px-3 py-1 text-xs font-bold text-[#6eb4ff]">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                </svg>
                <span>Официальное сообщество ВКонтакте</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Сообщество <span className="text-[#4da3ff]">NightByte Club</span>
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Следите за расписанием новых турниров, результатами матчей, отчётами о выплатах призовых и общайтесь с участниками и организаторами напрямую.
              </p>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-300 pt-1">
                <span className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1">Анонсы и сетки турниров</span>
                <span className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1">Отчёты о выплатах призовых</span>
                <span className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1">Чат участников и судейство</span>
                <span className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1">Розыгрыши слотов</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0077FF] hover:bg-[#1a85ff] px-7 py-4 text-sm font-black text-white shadow-xl shadow-[#0077FF]/30 transition-all duration-200 active:scale-[0.98]"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                </svg>
                <span>Вступить в группу ВК</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <span className="text-center lg:text-right font-mono text-xs text-zinc-400">
                vk.ru/nightbyte.club
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Раздел: Как это работает (4 шага) */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-20">
        <div className="border-b border-white/[0.08] pb-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Как устроена платформа соревнований
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Простой и прозрачный порядок участия от выбора матча до выплаты выигрыша
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Дисциплины и форматы',
              text: 'Соревнования по CS2, Dota 2, королевским битвам PUBG, PUBG Mobile, Apex Legends, Warzone и Fortnite.',
            },
            {
              step: '02',
              title: 'Оплата и баланс',
              text: 'Оплата услуг по организации (судейство, подбор оппонентов, лобби). Пополнение баланса на любую сумму: 100, 200, 500, 1000, 1500 ₽ или произвольную через СБП и банковские карты РФ.',
            },
            {
              step: '03',
              title: 'Доступ в лобби',
              text: 'Сетка соревнований и данные для подключения к лобби (Room ID и пароль) отображаются в личном кабинете после набора участников.',
            },
            {
              step: '04',
              title: 'Вознаграждение победителей',
              text: 'Фиксированное вознаграждение учреждено организатором соревнований за спортивные достижения (не зависит от взносов участников). Выплата через СБП до 24 часов.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111726] to-[#0c101a] p-5 sm:p-6 transition hover:border-cyan-500/30 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-sm font-black text-cyan-400 block mb-2">{item.step}</span>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
