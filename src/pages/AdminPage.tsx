import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminMatchForm } from '@/components/AdminMatchForm';
import { AdminRegistrationsManager } from '@/components/AdminRegistrationsManager';
import { AdminTipsTipsPayments } from '@/components/AdminTipsTipsPayments';
import { AdminCreateTournamentModal } from '@/components/AdminCreateTournamentModal';
import { getStoredTipsTipsPayments } from '@/lib/tipstips-client';

export const AdminPage: React.FC = () => {
  const { isAdmin, adminLogout } = useAuth();
  const { tournaments, matches, registrations } = useTournaments();
  const [activeTab, setActiveTab] = useState<'registrations' | 'matches' | 'tipstips'>('tipstips');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingTipsCount, setPendingTipsCount] = useState<number>(() => {
    return getStoredTipsTipsPayments().filter((p) => p.status === 'pending').length;
  });

  useEffect(() => {
    const updateCount = () => {
      setPendingTipsCount(getStoredTipsTipsPayments().filter((p) => p.status === 'pending').length);
    };
    window.addEventListener('nb_tipstips_updated', updateCount);
    return () => window.removeEventListener('nb_tipstips_updated', updateCount);
  }, []);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <AdminLoginForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Панель администратора</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Управление матчами, расписанием, участниками и платежами
          </p>
        </div>
        <button
          onClick={adminLogout}
          className="self-start sm:self-auto rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          Выйти
        </button>
      </div>

      {/* Переключатель вкладок */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('tipstips')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'tipstips'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <span>💳 Платежи tips.tips</span>
          {pendingTipsCount > 0 ? (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-extrabold text-white animate-pulse">
              {pendingTipsCount}
            </span>
          ) : (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                activeTab === 'tipstips' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'
              }`}
            >
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'matches'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <span>🏆 Матчи и расписание</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
              activeTab === 'matches' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'
            }`}
          >
            {tournaments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'registrations'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          <span>👥 Участники соревнований</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
              activeTab === 'registrations' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'
            }`}
          >
            {registrations.length}
          </span>
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'tipstips' ? (
          <AdminTipsTipsPayments />
        ) : activeTab === 'registrations' ? (
          <AdminRegistrationsManager />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
              <div>
                <h2 className="text-xl font-bold text-white">Управление матчами и расписанием</h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Меняйте время старта матчей, статусы (набор / игра / завершено), доступы к лобби или создавайте новые турниры.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="self-start sm:self-auto rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition whitespace-nowrap"
              >
                <span>➕</span>
                <span>Создать новый матч</span>
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {tournaments.map((tournament) => (
                <AdminMatchForm
                  key={tournament.id}
                  tournament={tournament}
                  initialMatch={matches[tournament.id] || null}
                />
              ))}
            </div>

            {/* Модальное окно создания нового матча/турнира */}
            <AdminCreateTournamentModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
