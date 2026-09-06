import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub } from '@/lib/format';

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, login, updateBalance } = useAuth();
  const { registerForTournament, tournaments, isUserRegistered } = useTournaments();

  const status = searchParams.get('status');
  const isFailed = status === 'fail';

  const [registeredTournamentTitle, setRegisteredTournamentTitle] = useState<string>('');
  const [playerNickname, setPlayerNickname] = useState<string>('');
  const [isTopUp, setIsTopUp] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(100);
  const [paidAmount, setPaidAmount] = useState<number>(100);

  // Защита от повторного выполнения и зацикливания
  const hasProcessed = useRef<boolean>(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    if (isFailed) {
      localStorage.removeItem('nb_pending_registration');
      localStorage.removeItem('nb_pending_topup');
      return;
    }

    // 1. Проверяем наличие ожидающего пополнения баланса
    const savedTopupStr = localStorage.getItem('nb_pending_topup');
    if (savedTopupStr) {
      localStorage.removeItem('nb_pending_topup');
      try {
        const parsed = JSON.parse(savedTopupStr);
        const amt = Number(parsed.amount);
        if (!isNaN(amt) && amt > 0) {
          setIsTopUp(true);
          setTopUpAmount(amt);
          updateBalance(amt, parsed.email);
          return;
        }
      } catch (e) {
        console.error('Error reading pending topup:', e);
      }
    }

    // 2. Проверяем регистрацию на турнир
    let tId = searchParams.get('tId');
    let nick = searchParams.get('nick');
    let acc = searchParams.get('acc');
    let email = searchParams.get('email');
    let phone = searchParams.get('phone') || '';
    let password = '';

    const savedRegStr = localStorage.getItem('nb_pending_registration');
    if (savedRegStr) {
      localStorage.removeItem('nb_pending_registration');
      try {
        const parsed = JSON.parse(savedRegStr);
        tId = tId || parsed.tournamentId;
        nick = nick || parsed.nickname;
        acc = acc || parsed.gameAccount;
        email = email || parsed.email;
        phone = phone || parsed.phone || '';
        password = parsed.password || '';
      } catch (e) {
        console.error('Error reading pending registration:', e);
      }
    }

    if (tId && nick && email) {
      setPlayerNickname(nick);
      const targetTourney = tournaments.find(t => t.id === tId);
      if (targetTourney) {
        setRegisteredTournamentTitle(targetTourney.title);
        setPaidAmount(targetTourney.entryFeeRub);
      }

      if (!isUserRegistered(tId, email)) {
        registerForTournament(tId, nick, acc || '', email, phone);
      }

      if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
        login(email, password, nick, phone);
      }
    }
  }, []); // Выполняется строго 1 раз при монтировании компонента

  if (isFailed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="surface-card p-8 border-red-500/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl text-red-400">
            ✕
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Оплата отменена</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Платёж был отменён. Средства с вашей карты не списывались.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/tournaments" className="btn-primary">
              Вернуться к турнирам
            </Link>
            <Link to="/account" className="btn-secondary">
              В личный кабинет
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Экран успешного пополнения баланса
  if (isTopUp) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="surface-card p-8 border-emerald-500/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Баланс пополнен!</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Средства успешно зачислены и уже отображаются в вашем личном кабинете.
          </p>

          <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-4 text-left space-y-2 text-xs">
            {user && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Пользователь:</span>
                <span className="font-bold text-white">{user.nickname || user.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Сумма зачисления:</span>
              <span className="font-bold text-emerald-400">+{formatRub(topUpAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Статус:</span>
              <span className="font-semibold text-cyan-400">Зачислено (PayAnyWay / СБП)</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Теперь вы можете оплачивать участие в турнирах моментально в один клик.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/account" className="btn-primary">
              Перейти в личный кабинет
            </Link>
            <Link to="/tournaments" className="btn-secondary">
              Выбрать турнир
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Экран успешной регистрации на турнир
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
            <span className="font-bold text-emerald-400">{formatRub(paidAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Статус:</span>
            <span className="font-semibold text-cyan-400">Оплачено (PayAnyWay / СБП)</span>
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
