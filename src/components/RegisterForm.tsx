import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { ENTRY_FEE_RUB } from '@/lib/constants';
import { formatRub } from '@/lib/format';
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
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (!nickname.trim() || !gameAccount.trim() || !email.trim() || !phone.trim()) {
      setMessage({ type: 'err', text: 'Пожалуйста, заполните все поля, включая номер телефона.' });
      return;
    }

    if (!user && (!password || password.length < 6)) {
      setMessage({ type: 'err', text: 'Пароль для личного кабинета должен быть не менее 6 символов.' });
      return;
    }

    if (!user) {
      login(email.trim(), password.trim(), nickname.trim(), phone.trim());
    }

    if (payMethod === 'balance') {
      if (!user || user.balanceRub < ENTRY_FEE_RUB) {
        setMessage({ type: 'err', text: 'Недостаточно средств на балансе.' });
        return;
      }
      updateBalance(-ENTRY_FEE_RUB);
      registerForTournament(tournamentId, nickname.trim(), gameAccount.trim(), email.trim(), phone.trim());
      setMessage({ type: 'ok', text: 'Успешно! Вы зарегистрированы на турнир.' });
      setTimeout(() => {
        navigate('/account');
      }, 1000);
    } else {
      // Сохраняем временные данные регистрации на случай возврата
      const pendingData = {
        tournamentId,
        nickname: nickname.trim(),
        gameAccount: gameAccount.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        amount: ENTRY_FEE_RUB,
        createdAt: Date.now(),
      };
      localStorage.setItem('nb_pending_registration', JSON.stringify(pendingData));

      const checkoutUrl = createRobokassaCheckoutUrl({
        amountRub: ENTRY_FEE_RUB,
        description: `Оргсбор за участие в турнире #${tournamentId}`,
        registrationData: {
          tournamentId,
          nickname: nickname.trim(),
          gameAccount: gameAccount.trim(),
          email: email.trim(),
        },
      });
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold text-white">Регистрация на турнир</h2>
      <p className="mt-1 text-xs sm:text-sm text-zinc-400">
        Организационный сбор: <strong className="text-white font-bold">{formatRub(ENTRY_FEE_RUB)}</strong>
      </p>

      {user && (
        <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3.5 py-2 text-xs text-cyan-300">
          Вы вошли как: <strong>{user.email}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Никнейм в игре *
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
            Игровой ID (Steam ID / Riot ID / PUBG ID) *
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Номер телефона *
            </label>
            <input
              type="tel"
              required
              className="input-field text-base sm:text-sm py-2.5"
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Ваш Email *
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
        </div>

        {!user && (
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Пароль для личного кабинета *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {showPassword ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="input-field text-base sm:text-sm py-2.5 mt-1"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Используется для входа и проверки результатов турнира.
            </p>
          </div>
        )}

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
              <p className="text-xs font-bold text-white">💳 Карта / СБП</p>
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
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-cyan-500/20">
          {payMethod === 'balance' ? 'Оплатить 100 ₽ с баланса' : 'Перейти к оплате 100 ₽'}
        </button>

        <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
          Нажимая кнопку, вы соглашаетесь с условиями{' '}
          <a href="/offer" target="_blank" className="text-cyan-400 hover:underline">
            Публичной оферты
          </a>{' '}
          и{' '}
          <a href="/privacy" target="_blank" className="text-cyan-400 hover:underline">
            Политики конфиденциальности
          </a>
        </p>
      </form>
    </div>
  );
};
