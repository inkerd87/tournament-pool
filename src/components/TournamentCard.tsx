import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameBadge } from '@/components/GameBadge';
import { formatDateTime, formatRub, statusLabel } from '@/lib/format';
import { GAMES, GAME_WALLPAPERS } from '@/lib/games';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB } from '@/lib/constants';
import { Tournament } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';

export const TournamentCard: React.FC<{
  tournament: Tournament;
  onPubgModeChange?: (mode: 'standard' | 'premium') => void;
}> = ({ tournament: propTournament, onPubgModeChange }) => {
  const { tournaments } = useTournaments();
  const isPubgFamily = (g: string) => g === 'pubg' || g === 'pubg_mobile';

  const [pubgMode, setPubgMode] = useState<'standard' | 'premium'>(
    propTournament.isPremium ? 'premium' : 'standard'
  );

  useEffect(() => {
    if (propTournament.isPremium) {
      setPubgMode('premium');
    } else if (isPubgFamily(propTournament.game)) {
      setPubgMode('standard');
    }
  }, [propTournament.id, propTournament.isPremium, propTournament.game]);

  const tournament = useMemo(() => {
    if (!isPubgFamily(propTournament.game)) return propTournament;
    const targetGame = propTournament.game;
    if (pubgMode === 'premium') {
      return (
        tournaments.find(
          (t) => t.game === targetGame && (t.isPremium || t.id === 'pubg-premium-001' || t.id === 'pubg-mobile-premium-001')
        ) || propTournament
      );
    } else {
      return (
        tournaments.find(
          (t) => t.game === targetGame && !t.isPremium && t.id !== 'pubg-premium-001' && t.id !== 'pubg-mobile-premium-001'
        ) || propTournament
      );
    }
  }, [propTournament, pubgMode, tournaments]);

  const game = GAMES[tournament.game] || {
    name: tournament.game,
    short: tournament.game,
    accent: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.3)',
  };

  const wallpaperUrl =
    GAME_WALLPAPERS[tournament.game] || (game as any)?.wallpaperUrl || (game as any)?.iconUrl;

  const isSoon = tournament.status === 'soon';
  const isPremium = Boolean(
    tournament.isPremium || tournament.id === 'pubg-premium-001' || tournament.id === 'pubg-mobile-premium-001'
  );
  const entryFee = tournament.entryFeeRub ?? ENTRY_FEE_RUB;
  const prizePool = tournament.prizePoolRub ?? TOTAL_PRIZES_RUB;
  const fillPercent = Math.min(100, Math.round((tournament.registeredCount / tournament.maxPlayers) * 100));
  const remainingSlots = Math.max(0, tournament.maxPlayers - tournament.registeredCount);

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 active:scale-[0.99] ${
        isPremium
          ? 'border-amber-500/35 bg-gradient-to-b from-[#181410] via-[#120f0c] to-[#0d0b09] hover:border-amber-400 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]'
          : 'border-white/[0.1] bg-gradient-to-b from-[#111726] via-[#0e1320] to-[#090d16] hover:border-cyan-500/40 hover:shadow-[0_8px_30px_rgba(0,240,255,0.12)]'
      }`}
    >
      {/* Фоновая картинка игры при наведении */}
      {wallpaperUrl && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out opacity-15 group-hover:opacity-45 group-hover:scale-110"
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
        />
      )}

      {/* Затемняющий градиент поверх фоновой картинки */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#0e1320]/80 to-[#111726]/60 group-hover:via-[#0e1320]/65 transition-colors duration-300" />

      {/* Верхняя цветная полоска дисциплины */}
      <div
        className="relative z-10 h-1 w-full transition-opacity duration-300 opacity-80 group-hover:opacity-100"
        style={{
          background: isPremium
            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
            : `linear-gradient(90deg, ${game.accent}, #00f0ff)`,
        }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        {/* Хедер карточки: Бейдж игры, Премиум / Режим, Статус */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GameBadge game={tournament.game} />
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 tracking-wide shadow-sm">
                ★ ПРЕМИУМ
              </span>
            )}
          </div>

          {isPubgFamily(tournament.game) ? (
            <div
              className="flex items-center rounded-xl bg-black/80 p-0.5 border border-white/15 text-[10px] font-extrabold shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPubgMode('standard');
                  onPubgModeChange?.('standard');
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  pubgMode === 'standard'
                    ? 'bg-cyan-400 text-black shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Обычные соревнования (100 ₽)"
              >
                100 ₽
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPubgMode('premium');
                  onPubgModeChange?.('premium');
                }}
                className={`rounded-lg px-2.5 py-1 flex items-center gap-0.5 transition-all ${
                  pubgMode === 'premium'
                    ? 'bg-amber-400 text-black shadow-sm font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Премиум соревнования (1 000 ₽)"
              >
                <span>1 000 ₽</span>
              </button>
            </div>
          ) : isSoon ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Скоро
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {statusLabel(tournament.status)}
            </span>
          )}
        </div>

        {/* Название и формат турнира */}
        <div className="mt-3.5">
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
            {tournament.title}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 font-medium line-clamp-1">
            {tournament.format}
          </p>
        </div>

        {/* Блок призового вознаграждения */}
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H7M14 14.66V17c0 .55.45 1 1 1h2M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400/80 block">
                  Призовой фонд
                </span>
                <span className="text-lg font-black text-amber-300 font-mono tracking-tight leading-none">
                  {isSoon ? 'Анонс скоро' : formatRub(prizePool)}
                </span>
              </div>
            </div>

            {tournament.winnerPerPlayerRub ? (
              <span className="text-right text-[11px] font-bold text-amber-200 font-mono">
                {formatRub(tournament.winnerPerPlayerRub)} <span className="text-zinc-400 text-[9px] font-normal block">игроку</span>
              </span>
            ) : isPremium ? (
              <span className="text-right text-[11px] font-extrabold text-amber-300 font-mono">
                TOP-3 <span className="text-zinc-400 text-[9px] font-normal block">награды</span>
              </span>
            ) : null}
          </div>

          {/* Премиум распределение TOP-3 при наличии */}
          {isPremium && tournament.prizes && (
            <div className="mt-2.5 pt-2 border-t border-amber-500/20 grid grid-cols-3 gap-1 text-center text-[10px]">
              <div>
                <div className="text-zinc-400 text-[9px] uppercase font-bold">1 место</div>
                <div className="font-black text-amber-300 font-mono">{formatRub(tournament.prizes[1] || 15000)}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-[9px] uppercase font-bold">2 место</div>
                <div className="font-bold text-zinc-300 font-mono">{formatRub(tournament.prizes[2] || 8000)}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-[9px] uppercase font-bold">3 место</div>
                <div className="font-bold text-zinc-400 font-mono">{formatRub(tournament.prizes[3] || 5000)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Шкала заполнения слотов турнира */}
        {!isSoon && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>{tournament.registeredCount} / {tournament.maxPlayers} слотов</span>
                {remainingSlots > 0 ? (
                  <span className="text-zinc-500 text-[10px] font-normal">
                    (осталось {remainingSlots})
                  </span>
                ) : (
                  <span className="text-amber-400 text-[10px] font-bold">
                    (заполнено)
                  </span>
                )}
              </span>
              <span className="font-mono font-bold text-zinc-400">{fillPercent}%</span>
            </div>

            {/* Полоса прогресса */}
            <div className="h-1.5 overflow-hidden rounded-full bg-black/60 border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fillPercent}%`,
                  background: isPremium
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : `linear-gradient(90deg, ${game.accent}, #00f0ff)`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span>
                Старт: <span className="text-zinc-200 font-medium">{formatDateTime(tournament.startsAt)}</span>
              </span>
              {Boolean(tournament.minPlayers && tournament.minPlayers > 0) && (
                <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
                  старт от {tournament.minPlayers}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Нижняя плашка действий и оргвзноса */}
      <div className="relative z-10 border-t border-white/[0.08] bg-black/50 backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
            Орг. тариф
          </span>
          <span className="text-sm font-black text-white font-mono">
            {formatRub(entryFee)}
          </span>
        </div>

        {isSoon ? (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300">
            <span>Анонс</span>
          </div>
        ) : isPremium ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-2 text-xs font-black text-black shadow-md shadow-amber-500/20 transition-all duration-200 group-hover:scale-[1.02]">
            <span>Участвовать</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 px-4 py-2 text-xs font-black text-black shadow-md shadow-cyan-400/20 transition-all duration-200 group-hover:scale-[1.02]">
            <span>Участвовать</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </div>
        )}
      </div>
    </Link>
  );
};
