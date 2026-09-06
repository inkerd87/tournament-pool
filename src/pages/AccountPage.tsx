import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub } from '@/lib/format';
import { WalletTopUpForm } from '@/components/WalletTopUpForm';
import { RegisteredTournamentsList } from '@/components/RegisteredTournamentsList';
import { MatchHistoryList } from '@/components/MatchHistoryList';
import { getStoredHistory } from '@/lib/storage';

export const AccountPage: React.FC = () => {
  const { user, logout, updateBalance, refreshUser } = useAuth();
  const { tournaments, getUserRegistrations, matches, registerForTournament, isUserRegistered } = useTournaments();
  const [topUpSuccess, setTopUpSuccess] = useState<number | null>(null);

  // Проверяем, вернулся ли пользователь после оплаты через PayAnyWay (пополнение или турнир)
  useEffect(() => {
    if (!user) return;

    // 1. Ожидающее пополнение баланса
    const pendingTopupStr = localStorage.getItem('nb_pending_topup');
    if (pendingTopupStr) {
      localStorage.removeItem('nb_pending_topup');
      try {
        const data = JSON.parse(pendingTopupStr);
        const amt = Number(data.amount);
        if (!isNaN(amt) && amt > 0) {
          updateBalance(amt, user.email);
          setTopUpSuccess(amt);
        }
      } catch (e) {
        console.error('Error processing pending topup on account page:', e);
      }
    }

    // 2. Ожидающая регистрация на турнир
    const pendingRegStr = localStorage.getItem('nb_pending_registration');
    if (pendingRegStr) {
      localStorage.removeItem('nb_pending_registration');
      try {
        const reg = JSON.parse(pendingRegStr);
        if (reg.tournamentId && !isUserRegistered(reg.tournamentId, user.email)) {
          registerForTournament(
            reg.tournamentId,
            reg.nickname || user.nickname,
            reg.gameAccount || '',
            user.email,
            reg.phone || user.phone || ''
          );
        }
      } catch (e) {
        console.error('Error processing pending registration on account page:', e);
      }
    }
  }, [user?.email]);

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Личный кабинет</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-400">
            <span className="font-bold text-white">{user.nickname}</span>
            <span>•</span>
            <span className="font-mono">{user.email}</span>
            {user.phone && (
              <>
                <span>•</span>
                <span className="font-mono text-cyan-300">{user.phone}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="self-start sm:self-auto rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          Выйти из аккаунта
        </button>
      </div>

      <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Баланс кошелька</p>
              <button
                type="button"
                onClick={() => refreshUser()}
                className="text-[11px] text-zinc-500 hover:text-cyan-400 transition"
                title="Синхронизировать баланс"
              >
                🔄 Обновить
              </button>
            </div>

            {topUpSuccess && (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                ✓ Баланс успешно пополнен на +{formatRub(topUpSuccess)}!
              </div>
            )}

            <p className="mt-2 text-3xl font-black text-white">{formatRub(user.balanceRub)}</p>
            <p className="mt-1 text-xs text-zinc-400">Для мгновенной оплаты участия без комиссии</p>
          </div>

          <WalletTopUpForm />
        </div>

        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
              Мои турниры ({registeredTournaments.length})
            </h2>
            <RegisteredTournamentsList items={registeredTournaments} />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">История матчей</h2>
            <MatchHistoryList matches={history} />
          </div>
        </div>
      </div>
    </div>
  );
};
