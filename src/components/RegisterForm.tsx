import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ENTRY_FEE_RUB } from '@/lib/constants';
import { formatRub } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { createRobokassaCheckoutUrl } from '@/lib/robokassa-client';

type Props = {
  tournamentId: string;
  canRegister: boolean;
};

export const RegisterForm: React.FC<Props> = ({ tournamentId, canRegister }) => {
  const navigate = useNavigate();
  const { user, login, updateBalance } = useAuth();
  const { registerForTournament } = useTournaments();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [gameAccount, setGameAccount] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [payMethod, setPayMethod] = useState<'card' | 'balance'>('card');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const canPayFromBalance = user && user.balanceRub >= ENTRY_FEE_RUB;

  if (!canRegister) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-5 text-xs sm:text-sm text-amber-100">
        Регистрация закрыта — все места заняты или турнир уже начался.
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!nickname.trim() || !gameAccount.trim() || !email.trim()) {
      setMessage({ type: 'err', text: 'Пожалуйста, заполните все поля.' });
      return;
    }

    if (!user) {
      login(email.trim(), nickname.trim());
    }

    if (payMethod === 'balance') {
      if (!user || user.balanceRub < ENTRY_FEE_RUB) {
        setMessage({ type: 'err', text: 'Недостаточно средств на балансе.' });
        return;
      }
      updateBalance(-ENTRY_FEE_RUB);
      registerForTournament(tournamentId, nickname.trim(), gameAccount.trim(), email.trim());
      setMessage({ type: 'ok', text: 'Успешно! Вы зарегистрированы на турнир.' });
      setTimeout(() => {
        navigate('/account');
      }, 1000);
    } else {
      registerForTournament(tournamentId, nickname.trim(), gameAccount.trim(), email.trim());
      const checkoutUrl = createRobokassaCheckoutUrl({
        amountRub: ENTRY_FEE_RUB,
        description: `Взнос за турнир #${tournamentId}`,
      });
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold text-white">Регистрация на турнир</h2>
      <p className="mt-1 text-xs sm:text-sm text-zinc-400">
        Взнос: <strong className="text-white font-bold">{formatRub(ENTRY_FEE_RUB)}</strong>
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Никнейм в игре
          </label>
          <input
            type="text"
            required
            className="input-field text-base sm:text-sm py-2.5"
            placeholder="Например: CyberNinja"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Игровой ID (Steam ID / Riot ID / PUBG ID)
          </label>
          <input
            type="text"
            required
            className="input-field text-base sm:text-sm py-2.5"
            placeholder="Например: 76561198000000000 или Ninja#EUW"
            value={gameAccount}
            onChange={(e) => setGameAccount(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Ваш Email
          </label>
          <input
            type="email"
            required
            className="input-field text-base sm:text-sm py-2.5"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="pt-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Способ оплаты
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPayMethod('card')}
              className={`rounded-xl border p-3 text-left transition ${
                payMethod === 'card'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/10 bg-black/20 text-zinc-400 hover:border-white/20'
              }`}
            >
              <p className="text-xs font-bold text-white">💳 Карта / СБП (Robokassa)</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Любые банки РФ без комиссии</p>
            </button>

            <button
              type="button"
              onClick={() => setPayMethod('balance')}
              disabled={!canPayFromBalance}
              className={`rounded-xl border p-3 text-left transition ${
                payMethod === 'balance'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : canPayFromBalance
                  ? 'border-white/10 bg-black/20 text-zinc-400 hover:border-white/20'
                  : 'border-white/5 bg-black/10 text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <p className="text-xs font-bold text-white">
                💰 С баланса ({user ? formatRub(user.balanceRub) : '0 ₽'})
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Мгновенное списание</p>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg p-3 text-xs sm:text-sm ${
              message.type === 'ok'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-300 border border-red-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-cyan-500/15">
          Оплатить {formatRub(ENTRY_FEE_RUB)} и участвовать
        </button>

        <p className="text-center text-[11px] text-zinc-500 leading-normal">
          Нажимая «Оплатить», вы принимаете условия{' '}
          <Link to="/offer" className="text-zinc-400 underline hover:text-zinc-200">
            публичной оферты
          </Link>{' '}
          и{' '}
          <Link to="/privacy" className="text-zinc-400 underline hover:text-zinc-200">
            политики конфиденциальности
          </Link>
        </p>
      </form>
    </div>
  );
};
