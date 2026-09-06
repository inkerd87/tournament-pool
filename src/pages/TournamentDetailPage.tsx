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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GameBadge game={tournament.game} />
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
