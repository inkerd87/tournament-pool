import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTournaments } from '@/context/TournamentContext';
import { useAuth } from '@/context/AuthContext';
import { GameBadge } from '@/components/GameBadge';
import { PrizeBreakdown } from '@/components/PrizeBreakdown';
import { RegisterForm } from '@/components/RegisterForm';
import { MatchAccessPanel } from '@/components/MatchAccessPanel';
import { formatDateTime, statusLabel } from '@/lib/format';
import { GAMES } from '@/lib/games';

export const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tournaments, isUserRegistered, matches } = useTournaments();
  const { user } = useAuth();

  const tournament = tournaments.find((t) => t.id === id);

  if (!tournament) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Турнир не найден</h1>
        <Link to="/tournaments" className="btn-primary mt-4 inline-flex">
          Ко всем турнирам
        </Link>
      </div>
    );
  }

  const game = GAMES[tournament.game];
  const isRegistered = user ? isUserRegistered(tournament.id, user.email) : false;
  const matchAccess = matches[tournament.id];
  const canRegister = tournament.status === 'recruiting' && tournament.registeredCount < tournament.maxPlayers && !isRegistered;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-12 sm:px-6">
      <Link to="/tournaments" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white py-1">
        ← Ко всем турнирам
      </Link>

      {tournament.game === 'pubg' && (
        <div className="my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-[#12161f] to-amber-500/5 p-3.5 sm:p-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-extrabold text-base shadow-md shadow-amber-500/20">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white">Режим: Премиум матч</span>
                <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {tournament.isPremium ? 'Включен Премиум' : 'Включен Обычный'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-400">
                Переключайтесь между обычным турниром (взнос 100 ₽) и премиум-матчем с призовым фондом 28 000 ₽.
              </p>
            </div>
          </div>

          <div className="relative inline-flex items-center rounded-xl bg-black/60 p-1 border border-white/10 shrink-0 self-start sm:self-auto">
            <Link
              to="/tournaments/pubg-solo-001"
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                !tournament.isPremium
                  ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🎮 Обычный (100 ₽)
            </Link>
            <Link
              to="/tournaments/pubg-premium-001"
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                tournament.isPremium
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black shadow-md shadow-amber-400/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>⭐ Премиум (1 000 ₽)</span>
            </Link>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GameBadge game={tournament.game} />
            {tournament.isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-300 shadow-sm shadow-amber-500/20">
                ⭐ Премиум матч
              </span>
            )}
            <span className="text-xs text-zinc-400">{statusLabel(tournament.status)}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">{tournament.title}</h1>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-card p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-white">О турнире</h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-300">{tournament.description}</p>
            
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 border-t border-white/10 pt-4 text-xs sm:text-sm sm:grid-cols-3">
              <div>
                <dt className="text-zinc-500 text-[11px] uppercase font-semibold">Формат</dt>
                <dd className="mt-0.5 font-bold text-white">{tournament.format}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 text-[11px] uppercase font-semibold">Старт</dt>
                <dd className="mt-0.5 font-bold text-white">{formatDateTime(tournament.startsAt)}</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-zinc-500 text-[11px] uppercase font-semibold">Участников</dt>
                <dd className="mt-0.5 font-bold text-white">{tournament.registeredCount} / {tournament.maxPlayers}</dd>
              </div>
            </dl>
          </div>

          {isRegistered && (
            <div className="surface-card p-5 sm:p-6 border-emerald-500/30 bg-emerald-950/10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                ✓ Вы зарегистрированы на этот турнир
              </span>
              {matchAccess ? (
                <MatchAccessPanel match={matchAccess} tournamentTitle={tournament.title} />
              ) : (
                <p className="mt-2 text-xs text-zinc-300">
                  Данные комнаты (Room ID и пароль) будут опубликованы здесь перед стартом матча.
                </p>
              )}
            </div>
          )}

          {tournament.status === 'soon' ? (
            <div className="surface-card p-8 border-amber-500/30 bg-amber-950/10 text-center">
              <span className="text-4xl">⏳</span>
              <h3 className="mt-3 text-lg font-bold text-white">Регистрация откроется скоро</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Регламент, игровые лобби и дата старта турнира по <strong className="text-white">{game.name}</strong> будут объявлены в ближайшее время. Следите за обновлениями!
              </p>
            </div>
          ) : !isRegistered ? (
            <RegisterForm
              tournamentId={tournament.id}
              canRegister={canRegister}
              entryFeeRub={tournament.entryFeeRub}
            />
          ) : null}
        </div>

        <div>
          <PrizeBreakdown tournament={tournament} />
        </div>
      </div>
    </div>
  );
};
