import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournaments } from '@/context/TournamentContext';
import { TournamentCard } from '@/components/TournamentCard';
import { GameIcon } from '@/components/GameIcons';
import { VK_GROUP_URL } from '@/lib/constants';
import { GAME_WALLPAPERS } from '@/lib/games';
import { formatRub } from '@/lib/format';

export const HomePage: React.FC = () => {
  const { tournaments, allGames } = useTournaments();
  const [activeGameId, setActiveGameId] = useState<string>('cs2');
  const [homeFilterGame, setHomeFilterGame] = useState<string>('all');

  const heroGames = (allGames && allGames.length > 0 ? allGames : []).map((g) => ({
    id: g.id,
    name: g.name,
    short: g.short || g.name,
    color: g.accent || '#00d4ff',
    tag: g.tag || 'Турнир',
    standardFee: g.standardFee ?? 100,
    premiumFee: g.premiumFee ?? 1000,
    wallpaperUrl: g.wallpaperUrl || GAME_WALLPAPERS[g.id] || g.iconUrl,
  }));

  const activeGameConfig = heroGames.find((g) => g.id === activeGameId) || heroGames[0];
  const activeCount = tournaments.filter((t) => t.status === 'recruiting' || t.status === 'live').length;

  const filteredTournaments = tournaments.filter((t) => {
    if (t.isPremium) return false;
    if (homeFilterGame !== 'all' && t.game !== homeFilterGame) return false;
    return true;
  });

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Главный Hero-блок соревнований */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#070a0f] pt-6 pb-12 sm:pt-10 sm:pb-16">
        
        {/* Фоновое изображение активной дисциплины с мягким затемнением */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {heroGames.map((g) => {
            const isCurrent = activeGameId === g.id;
            return (
              <div
                key={g.id}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out ${
                  isCurrent ? 'opacity-25 scale-100' : 'opacity-0 scale-105'
                }`}
                style={{
                  backgroundImage: `url(${g.wallpaperUrl})`,
                }}
              />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a0f] via-[#070a0f]/80 to-[#070a0f]/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Левая колонка: Заголовок, описание и действия */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span className="tracking-wide uppercase text-[11px] font-mono">NightByte Esports • Сезон 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Турниры по киберспорту с гарантированными выплатами
              </h1>

              <p className="max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
                Регулярные любительские и открытые матчи по CS2, Dota 2, PUBG, Apex Legends и другим играм. Честное судейство, прозрачные регламенты и автоматические выплаты призовых через СБП.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  to="/tournaments"
                  className="btn-primary px-5 py-3 text-sm font-extrabold inline-flex items-center justify-center gap-2"
                >
                  <span>Смотреть турниры</span>
                  <span>→</span>
                </Link>

                <Link
                  to="/how-it-works"
                  className="btn-secondary px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <span>Регламент и правила</span>
                </Link>

                <a
                  href={VK_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 border-[#0077ff]/35 text-[#5ea4ff] hover:bg-[#0077ff]/10"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                  </svg>
                  <span>Сообщество VK</span>
                </a>
              </div>
            </div>

            {/* Правая колонка: Витрина дисциплин и карточка матча */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-4 sm:p-5 shadow-xl">
                
                {/* Переключатель дисциплин */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Выберите дисциплину
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {heroGames.map((g) => {
                      const isSelected = activeGameId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setActiveGameId(g.id)}
                          onMouseEnter={() => setActiveGameId(g.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                            isSelected
                              ? 'bg-white/15 text-white border border-white/25 shadow-sm'
                              : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          <GameIcon game={g.id} className="w-3.5 h-3.5 object-cover rounded-sm" />
                          <span>{g.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Карточка-превью активной игры */}
                <div className="relative rounded-xl border border-white/[0.08] overflow-hidden bg-black/50">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${activeGameConfig.wallpaperUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-[#0c1017]/85 to-transparent" />

                  <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-between min-h-[190px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-black/60 border border-white/10 p-1 flex items-center justify-center shrink-0">
                          <GameIcon game={activeGameConfig.id} className="w-full h-full object-contain rounded" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                            {activeGameConfig.name}
                          </h3>
                          <span className="text-xs text-zinc-400">
                            {activeGameConfig.tag} • Открытые соревнования
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Регистрация открыта
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Взнос</span>
                          <span className="font-extrabold text-white font-mono text-sm">
                            от {formatRub(activeGameConfig.standardFee)}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Призовые</span>
                          <span className="font-extrabold text-amber-300 font-mono text-sm">
                            до 28 000 ₽
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/tournaments?game=${activeGameConfig.id}`}
                        className="btn-primary py-2 px-4 text-xs font-extrabold"
                      >
                        <span>К турнирам {activeGameConfig.short} →</span>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Строка ключевых фактов платформы */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 border-t border-white/[0.08] pt-6">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
              <span className="font-mono text-lg sm:text-xl font-bold text-white block">8 дисциплин</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">CS2, Dota 2, PUBG, Apex, Warzone...</span>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
              <span className="font-mono text-lg sm:text-xl font-bold text-white block">До 24 часов</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">Выплаты выигрышей через СБП</span>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
              <span className="font-mono text-lg sm:text-xl font-bold text-white block">Честный арбитраж</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">Античит и видеоконтроль матчей</span>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
              <span className="font-mono text-lg sm:text-xl font-bold text-white block">Фиксированный взнос</span>
              <span className="text-xs text-zinc-400 mt-0.5 block">От 100 ₽ без скрытых комиссий</span>
            </div>
          </div>

        </div>
      </section>

      {/* Каталог актуальных турниров */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Ближайшие соревнования
              </h2>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-zinc-300 font-mono">
                {activeCount} открыто
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Выберите дисциплину, оплатите оргвзнос картой или через СБП и получите доступ в закрытое лобби
            </p>
          </div>

          <Link
            to="/tournaments"
            className="text-xs sm:text-sm font-bold text-cyan-400 hover:text-cyan-300 transition shrink-0"
          >
            Все соревнования →
          </Link>
        </div>

        {/* Быстрые фильтры игр на главной */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setHomeFilterGame('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              homeFilterGame === 'all'
                ? 'bg-white/15 text-white'
                : 'bg-white/[0.03] text-zinc-400 hover:text-white'
            }`}
          >
            Все игры
          </button>
          {heroGames.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setHomeFilterGame(g.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                homeFilterGame === g.id
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <GameIcon game={g.id} className="w-3.5 h-3.5 rounded-sm object-cover" />
              <span>{g.short}</span>
            </button>
          ))}
        </div>

        {/* Сетка карточек соревнований */}
        <div className="mt-6 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.slice(0, 9).map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-zinc-400 mt-6">
            В данной дисциплине нет открытых матчей на сегодня. Попробуйте выбрать другую игру или загляните позже.
          </div>
        )}
      </section>

      {/* Порядок участия на платформе */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-b border-white/[0.08] pb-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Порядок участия в соревнованиях
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Простой и прозрачный регламент от выбора матча до зачисления выигрыша
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Выбор соревнования',
              text: 'Выберите игру, подходящий формат (Solo, Duo, 5v5) и удобное время начала в расписании сетки.',
            },
            {
              step: '02',
              title: 'Регистрация и взнос',
              text: 'Оплатите участие картой РФ или через СБП. Слот в турнирной таблице мгновенно закрепляется за вашим никнеймом.',
            },
            {
              step: '03',
              title: 'Вход в закрытое лобби',
              text: 'За 15 минут до старта в вашем личном кабинете на сайте появятся данные для подключения (Room ID и пароль).',
            },
            {
              step: '04',
              title: 'Получение призовых',
              text: 'Судьи подтверждают результат по протоколу матча. Вознаграждение победителя переводится на баланс или через СБП до суток.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-white/[0.08] bg-[#0c1017] p-5 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400 block mb-2">{item.step}</span>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Сообщество ВКонтакте */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017] p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#0077ff]/30 bg-[#0077ff]/10 px-2.5 py-1 text-xs font-semibold text-[#5ea4ff]">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
                </svg>
                <span>Официальное сообщество</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Сообщество NightByte Club
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Следите за расписанием новых соревнований, отчётами о выплатах победителям и общайтесь с судьями и участниками напрямую.
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-zinc-400 pt-1">
                <span className="rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-1">Анонсы соревнований</span>
                <span className="rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-1">Чеки выплат призовых</span>
                <span className="rounded border border-white/[0.08] bg-white/[0.02] px-2.5 py-1">Чат игроков и арбитраж</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-3 px-6 text-sm font-bold border-[#0077ff]/40 bg-[#0077ff]/15 text-white hover:bg-[#0077ff]/25"
              >
                <span>Вступить в группу ВК →</span>
              </a>
              <span className="font-mono text-xs text-zinc-500">
                vk.ru/nightbyte.club
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
