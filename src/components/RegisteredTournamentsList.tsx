import React from 'react';
import { Link } from 'react-router-dom';
import { Tournament, TournamentMatchAccess } from '@/lib/types';
import { formatDateTime, statusLabel } from '@/lib/format';
import { GameBadge } from '@/components/GameBadge';
import { MatchAccessPanel } from '@/components/MatchAccessPanel';

type Props = {
  items: {
    tournament: Tournament;
    match?: TournamentMatchAccess | null;
  }[];
};

export const RegisteredTournamentsList: React.FC<Props> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-zinc-500">Вы пока не зарегистрированы ни на один турнир.</p>
        <Link to="/tournaments" className="btn-primary mt-4 inline-flex">
          Выбрать турнир
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(({ tournament, match }) => (
        <div key={tournament.id} className="surface-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GameBadge game={tournament.game} />
                <span className="text-xs text-zinc-500">{statusLabel(tournament.status)}</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <Link to={`/tournaments/${tournament.id}`} className="hover:text-cyan-300">
                  {tournament.title}
                </Link>
              </h3>
              <p className="text-xs text-zinc-500">Старт: {formatDateTime(tournament.startsAt)}</p>
            </div>
            <Link to={`/tournaments/${tournament.id}`} className="link-accent text-xs font-semibold">
              Страница турнира →
            </Link>
          </div>

          {match ? (
            <MatchAccessPanel match={match} tournamentTitle={tournament.title} />
          ) : (
            <p className="mt-4 text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
              ⏳ Оплата подтверждена. Данные комнаты (Room ID и пароль) появятся здесь перед началом матча.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
