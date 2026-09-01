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
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Турнир не найден</h1>
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link to="/tournaments" className="text-xs font-semibold text-zinc-500 hover:text-white">
        ← Ко всем турнирам
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GameBadge game={tournament.game} />
            <span className="text-xs text-zinc-500">{statusLabel(tournament.status)}</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-white">{tournament.title}</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-card p-6">
            <h2 className="text-lg font-bold text-white">О турнире</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{tournament.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-zinc-500">Формат</dt>
                <dd className="font-semibold text-white">{tournament.format}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Старт</dt>
                <dd className="font-semibold text-white">{formatDateTime(tournament.startsAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Участников</dt>
                <dd className="font-semibold text-white">{tournament.registeredCount} / {tournament.maxPlayers}</dd>
              </div>
            </dl>
          </div>

          {isRegistered && (
            <div className="surface-card p-6 border-emerald-500/30 bg-emerald-950/10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                ✓ Вы зарегистрированы на этот турнир
              </span>
              {matchAccess ? (
                <MatchAccessPanel match={matchAccess} tournamentTitle={tournament.title} />
              ) : (
                <p className="mt-2 text-xs text-zinc-400">
                  Данные комнаты (Room ID и пароль) будут опубликованы здесь перед стартом матча.
                </p>
              )}
            </div>
          )}

          {!isRegistered && (
            <RegisterForm tournamentId={tournament.id} canRegister={canRegister} />
          )}
        </div>

        <div>
          <PrizeBreakdown registered={tournament.registeredCount} maxPlayers={tournament.maxPlayers} />
        </div>
      </div>
    </div>
  );
};
