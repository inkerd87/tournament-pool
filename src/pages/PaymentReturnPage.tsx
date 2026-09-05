import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub } from '@/lib/format';

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, login } = useAuth();
  const { registerForTournament, tournaments, isUserRegistered } = useTournaments();

  const status = searchParams.get('status');
  const isFailed = status === 'fail';

  const [registeredTournamentTitle, setRegisteredTournamentTitle] = useState<string>('');
  const [playerNickname, setPlayerNickname] = useState<string>('');

  const amountStr = searchParams.get('amount') || searchParams.get('OutSum');
  const amount = amountStr ? parseFloat(amountStr) : 100;

  useEffect(() => {
    if (isFailed) {
      localStorage.removeItem('nb_pending_registration');
      return;
    }

    // Получаем данные либо из URL параметров, либо из локального хранилища
    let tId = searchParams.get('tId');
    let nick = searchParams.get('nick');
    let acc = searchParams.get('acc');
    let email = searchParams.get('email');
    let phone = searchParams.get('phone') || '';
    let password = '';

    if (!tId || !email) {
      try {
        const saved = localStorage.getItem('nb_pending_registration');
        if (saved) {
          const parsed = JSON.parse(saved);
          tId = parsed.tournamentId;
          nick = parsed.nickname;
          acc = parsed.gameAccount;
          email = parsed.email;
          if (parsed.phone) phone = parsed.phone;
          if (parsed.password) password = parsed.password;
        }
      } catch (e) {
        console.error('Error reading pending registration:', e);
      }
    }

    if (tId && nick && email) {
      setPlayerNickname(nick);
      const targetTourney = tournaments.find(t => t.id === tId);
      if (targetTourney) {
        setRegisteredTournamentTitle(targetTourney.title);
      }

      // Регистрируем игрока ТОЛЬКО СЕЙЧАС (после подтверждения оплаты)
      if (!isUserRegistered(tId, email)) {
        registerForTournament(tId, nick, acc || '', email, phone);
      }

      // Если пользователь не авторизован в браузере, авторизуем под его почтой
      if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
        login(email, password, nick, phone);
      }

      localStorage.removeItem('nb_pending_registration');
    }
  }, [searchParams, isFailed, tournaments, isUserRegistered, registerForTournament, user, login]);

  if (isFailed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="surface-card p-8 border-red-500/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl text-red-400">
            ✕
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Оплата отменена</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Вы не были зарегистрированы на турнир. Средства с вашей карты не списывались.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/tournaments" className="btn-primary">
              Вернуться к турнирам
            </Link>
            <Link to="/" className="btn-secondary">
              На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <div className="surface-card p-8 border-emerald-500/30">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">Оплата прошла успешно!</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Вы успешно оплатили участие и зарегистрированы на турнир
          {registeredTournamentTitle ? ` «${registeredTournamentTitle}»` : ''}!
        </p>

        <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-4 text-left space-y-2 text-xs">
          {playerNickname && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Участник:</span>
              <span className="font-bold text-white">{playerNickname}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">Сумма взноса:</span>
            <span className="font-bold text-emerald-400">{formatRub(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Статус:</span>
            <span className="font-semibold text-cyan-400">Оплачено (Lava Pay / СБП)</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Все данные матча, комната и пароль станут доступны в вашем личном кабинете.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link to="/account" className="btn-primary">
            Перейти в личный кабинет
          </Link>
          <Link to="/tournaments" className="btn-secondary">
            Все турниры
          </Link>
        </div>
      </div>
    </div>
  );
};
