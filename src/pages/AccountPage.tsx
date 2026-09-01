import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub, formatDateShort } from '@/lib/format';
import { WalletTopUpForm } from '@/components/WalletTopUpForm';
import { RegisteredTournamentsList } from '@/components/RegisteredTournamentsList';
import { MatchHistoryList } from '@/components/MatchHistoryList';
import { getStoredHistory } from '@/lib/storage';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { tournaments, getUserRegistrations, matches } = useTournaments();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRegistrations = getUserRegistrations(user.email);
  const registeredTournaments = userRegistrations
    .map((reg) => {
      const tournament = tournaments.find((t) => t.id === reg.tournamentId);
      if (!tournament) return null;
      const match = matches[reg.tournamentId] || null;
      return { tournament, match };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const history = getStoredHistory(user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Личный кабинет</h1>
          <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          Выйти из аккаунта
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="surface-card p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Баланс кошелька</p>
            <p className="mt-2 text-3xl font-black text-white">{formatRub(user.balanceRub)}</p>
            <p className="mt-1 text-xs text-zinc-500">Используется для мгновенной оплаты взносов</p>
          </div>

          <WalletTopUpForm />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Мои турниры ({registeredTournaments.length})</h2>
            <RegisteredTournamentsList items={registeredTournaments} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">История матчей</h2>
            <MatchHistoryList matches={history} />
          </div>
        </div>
      </div>
    </div>
  );
};
