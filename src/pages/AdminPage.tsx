import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminMatchForm } from '@/components/AdminMatchForm';

export const AdminPage: React.FC = () => {
  const { isAdmin, adminLogout } = useAuth();
  const { tournaments, matches } = useTournaments();

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <AdminLoginForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Панель администратора</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Управление доступами к игровым лобби (CS2, Dota 2, PUBG, Valorant)
          </p>
        </div>
        <button
          onClick={adminLogout}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          Выйти
        </button>
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold text-white">Активные турниры</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {tournaments.map((tournament) => (
            <AdminMatchForm
              key={tournament.id}
              tournament={tournament}
              initialMatch={matches[tournament.id] || null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
