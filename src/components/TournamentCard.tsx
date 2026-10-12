import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GameBadge } from '@/components/GameBadge';
import { formatDateTime, formatRub, statusLabel } from '@/lib/format';
import { GAMES, GAME_WALLPAPERS, DEFAULT_GAME_COVERS } from '@/lib/games';
import { ENTRY_FEE_RUB, TOTAL_PRIZES_RUB } from '@/lib/constants';
import { Tournament } from '@/lib/types';
import { useTournaments } from '@/context/TournamentContext';

export const TournamentCard: React.FC<{
  tournament: Tournament;
  onPubgModeChange?: (mode: 'standard' | 'premium') => void;
}> = ({ tournament: propTournament, onPubgModeChange }) => {
  const { tournaments, allGames } = useTournaments();

  const isPremiumSupported = (g: string) => {
    const conf = allGames?.find((x) => x.id === g);
    if (conf?.hasPremiumMode) return true;
    if (g === 'pubg' || g === 'pubg_mobile' || g === 'apex') return true;
    return tournaments.some((t) => t.game === g && (t.isPremium || t.id.toLowerCase().includes('premium')));
  };

  const hasToggle = isPremiumSupported(propTournament.game);

  const gameConfig = allGames?.find((x) => x.id === propTournament.game);
  const standardFee = gameConfig?.standardFee ?? (propTournament.entryFeeRub ?? ENTRY_FEE_RUB);
  const premiumFee = gameConfig?.premiumFee ?? 1000;

  const [cardMode, setCardMode] = useState<'standard' | 'premium'>(
    propTournament.isPremium ? 'premium' : 'standard'
  );

  useEffect(() => {
    if (propTournament.isPremium) {
      setCardMode('premium');
    } else if (hasToggle) {
      setCardMode('standard');
    }
  }, [propTournament.id, propTournament.isPremium, propTournament.game, hasToggle]);

  const tournament = useMemo(() => {
    if (!hasToggle) return propTournament;
    const targetGame = propTournament.game;
    if (cardMode === 'premium') {
      const prem = tournaments.find(
        (t) =>
          t.game === targetGame &&
          (t.isPremium || t.id.toLowerCase().includes('premium') || t.title.toLowerCase().includes('premium'))
      );
      if (prem) {
        return {
          ...prem,
          entryFeeRub: prem.entryFeeRub ?? premiumFee,
        };
      }
      return {
        ...propTournament,
        id: `${propTournament.id}-premium`,
        title: `${propTournament.title} Premium`,
        isPremium: true,
        entryFeeRub: premiumFee,
        prizePoolRub: premiumFee * 28,
        prizes: { 1: Math.round(premiumFee * 15), 2: Math.round(premiumFee * 8), 3: Math.round(premiumFee * 5) },
        description: `Премиум соревнование. Оплата организационных услуг ${formatRub(premiumFee)}. Фиксированное вознаграждение учреждено организатором соревнований.`,
      };
    } else {
      const std = tournaments.find(
        (t) =>
          t.game === targetGame &&
          !t.isPremium &&
          !t.id.toLowerCase().includes('premium') &&
          !t.title.toLowerCase().includes('premium')
      ) || propTournament;
      return {
        ...std,
        entryFeeRub: std.entryFeeRub ?? standardFee,
      };
    }
  }, [propTournament, cardMode, tournaments, hasToggle, standardFee, premiumFee]);

  const game = GAMES[tournament.game] || {
    name: tournament.game,
    short: tournament.game,
    accent: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.3)',
  };

  const wallpaperUrl =
    tournament.wallpaperUrl ||
    (game as any)?.coverUrl ||
    DEFAULT_GAME_COVERS[tournament.game] ||
    GAME_WALLPAPERS[tournament.game] ||
    (game as any)?.wallpaperUrl ||
    (game as any)?.iconUrl;

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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border transition-all duration-200 active:scale-[0.99] cursor-pointer ${
        isPremium
          ? 'border-amber-500/35 bg-[#121013] hover:border-amber-400/80 hover:shadow-xl hover:shadow-amber-500/10'
          : 'border-white/[0.1] bg-[#0c1017] hover:border-white/30 hover:shadow-xl'
      }`}
    >
      {/* Фоновая картинка игры при наведении */}
      {wallpaperUrl && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center transition-all duration-500 ease-out opacity-25 group-hover:opacity-45 group-hover:scale-105"
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
        />
      )}

      {/* Затемняющий градиент поверх фоновой картинки */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c1017] via-[#0c1017]/85 to-transparent group-hover:via-[#0c1017]/75 transition-colors" />

      {/* Верхняя полоска дисциплины */}
      <div
        className="relative z-10 h-[3px] w-full transition-all duration-300 opacity-90 group-hover:opacity-100"
        style={{
          background: isPremium
            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
            : `linear-gradient(90deg, ${game.accent || '#00d4ff'}, ${game.accent || '#00d4ff'}66)`,
        }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        {/* Хедер карточки: Бейдж игры, Премиум / Режим, Статус */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GameBadge game={tournament.game} customIconUrl={tournament.customIconUrl} />
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                Премиум
              </span>
            )}
          </div>

          {hasToggle ? (
            <div
              className="flex items-center rounded-lg bg-black/60 p-0.5 border border-white/10 text-[10px] font-bold shrink-0"
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
                  setCardMode('standard');
                  onPubgModeChange?.('standard');
                }}
                className={`rounded-md px-2 py-1 transition-all ${
                  cardMode === 'standard'
                    ? 'bg-cyan-400 text-black font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Обычные соревнования (${formatRub(standardFee)})`}
              >
                {formatRub(standardFee)}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCardMode('premium');
                  onPubgModeChange?.('premium');
                }}
                className={`rounded-md px-2 py-1 flex items-center gap-0.5 transition-all ${
                  cardMode === 'premium'
                    ? 'bg-amber-400 text-black font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Премиум соревнования (${formatRub(premiumFee)})`}
              >
                <span>{formatRub(premiumFee)}</span>
              </button>
            </div>
          ) : isSoon ? (
            <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
              Скоро
            </span>
          ) : tournament.status === 'finished' ? (
            <span className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
              Завершён
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {statusLabel(tournament.status)}
            </span>
          )}
        </div>

        {/* Название и формат турнира */}
        <div className="mt-3.5">
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
            {tournament.title}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 font-medium line-clamp-1">
            {tournament.format}
          </p>
        </div>

        {/* Блок победителя турнира */}
        {tournament.winner && (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2">
            <span className="text-base">🏆</span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Победитель
              </div>
              <div className="truncate text-xs font-black text-amber-200 font-mono">
                {tournament.winner}
              </div>
            </div>
          </div>
        )}

        {/* Блок призового вознаграждения */}
        <div className="mt-3.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.05] p-3 transition-colors group-hover:border-amber-500/40 group-hover:bg-amber-500/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300/85 block">
                Призовой фонд
              </span>
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono tracking-tight leading-none mt-0.5 block">
                {isSoon ? 'Анонс скоро' : formatRub(prizePool)}
              </span>
            </div>

            {tournament.winnerPerPlayerRub ? (
              <span className="text-right text-[11px] font-bold text-amber-300 font-mono">
                {formatRub(tournament.winnerPerPlayerRub)} <span className="text-amber-400/60 text-[9px] font-normal block">игроку</span>
              </span>
            ) : isPremium ? (
              <span className="text-right text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                TOP-3 награды
              </span>
            ) : null}
          </div>

          {/* Премиум распределение TOP-3 при наличии */}
          {isPremium && tournament.prizes && (
            <div className="mt-2.5 pt-2 border-t border-amber-500/20 grid grid-cols-3 gap-1 text-center text-[10px]">
              <div>
                <div className="text-amber-400/70 text-[9px] uppercase font-bold">1 место</div>
                <div className="font-bold text-amber-300 font-mono">{formatRub(tournament.prizes[1] || 15000)}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-[9px] uppercase font-bold">2 место</div>
                <div className="font-bold text-zinc-200 font-mono">{formatRub(tournament.prizes[2] || 8000)}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-[9px] uppercase font-bold">3 место</div>
                <div className="font-bold text-zinc-400 font-mono">{formatRub(tournament.prizes[3] || 5000)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Шкала заполнения слотов турнира */}
        {!isSoon && (
          <div className="mt-3.5">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-zinc-400">
                {tournament.registeredCount} / {tournament.maxPlayers} слотов
                {remainingSlots > 0 ? (
                  <span className="text-zinc-400 text-[10px] ml-1">
                    (осталось {remainingSlots})
                  </span>
                ) : (
                  <span className="text-amber-400 text-[10px] ml-1 font-bold">
                    (заполнено)
                  </span>
                )}
              </span>
              <span className="font-mono text-zinc-300 text-[10px]">{fillPercent}%</span>
            </div>

            {/* Полоса прогресса */}
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: isPremium ? '#f59e0b' : (game.accent || '#00d4ff'),
                  boxShadow: `0 0 10px ${(isPremium ? '#f59e0b' : (game.accent || '#00d4ff'))}66`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span>
                Старт: <span className="text-zinc-200">{formatDateTime(tournament.startsAt)}</span>
              </span>
              {Boolean(tournament.minPlayers && tournament.minPlayers > 0) && (
                <span className="text-zinc-400 text-[10px]">
                  от {tournament.minPlayers} игр.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Нижняя плашка действий и оргвзноса */}
      <div className="relative z-10 border-t border-white/[0.06] bg-black/40 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block leading-none">
            Взнос
          </span>
          <span className="text-sm font-extrabold text-white font-mono mt-0.5 block leading-none">
            {formatRub(entryFee)}
          </span>
        </div>

        {isSoon ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
            <span>Анонс</span>
          </div>
        ) : tournament.status === 'finished' ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-colors group-hover:text-white">
            <span>Результаты →</span>
          </div>
        ) : isPremium ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-extrabold text-black transition-transform group-hover:scale-[1.02] shadow-sm shadow-amber-400/25">
            <span>Участвовать →</span>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all group-hover:scale-[1.02] shadow-sm"
            style={{
              backgroundColor: game.accent || '#00d4ff',
              color: '#000000',
              boxShadow: `0 2px 10px -2px ${game.accent || '#00d4ff'}60`,
            }}
          >
            <span>Участвовать →</span>
          </div>
        )}
      </div>
    </Link>
  );
};
