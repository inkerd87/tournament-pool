import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub } from '@/lib/format';
import { getStoredUser } from '@/lib/storage';

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, login, updateBalance } = useAuth();
  const { registerForTournament, tournaments, isUserRegistered } = useTournaments();

  const status = searchParams.get('status');
  const isFailed = status === 'fail';

  const [registeredTournamentTitle, setRegisteredTournamentTitle] = useState<string>('');
  const [registeredTournamentId, setRegisteredTournamentId] = useState<string>('');
  const [playerNickname, setPlayerNickname] = useState<string>('');
  const [isTopUp, setIsTopUp] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(100);
  const [paidAmount, setPaidAmount] = useState<number>(100);

  // Защита от повторного выполнения и зацикливания
  const hasProcessed = useRef<boolean>(false);

  // Helper to extract query parameters from React Router searchParams, window.location.search, and hash
  const getParam = (paramName: string): string | null => {
    let val = searchParams.get(paramName);
    if (val) return val;

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      val = urlParams.get(paramName);
      if (val) return val;

      if (window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          val = hashParams.get(paramName);
          if (val) return val;
        }
      }
    }
    return null;
  };

  const getFirstParam = (...paramNames: string[]): string | null => {
    for (const name of paramNames) {
      const v = getParam(name);
      if (v !== null && v !== undefined && v.trim() !== '') {
        return v.trim();
      }
    }
    return null;
  };

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    if (isFailed) {
      localStorage.removeItem('nb_pending_registration');
      localStorage.removeItem('nb_pending_topup');
      return;
    }

    // Извлекаем фактическую сумму оплаты из параметров возврата PayAnyWay / Moneta
    const rawMntAmount = getFirstParam(
      'MNT_AMOUNT',
      'mnt_amount',
      'amount',
      'AMOUNT',
      'sum',
      'SUM',
      'OutSum',
      'out_sum',
      'payment_amount',
      'pa_amount'
    );

    const parsedUrlAmount = rawMntAmount
      ? parseFloat(rawMntAmount.replace(',', '.').trim())
      : 0;

    // Извлекаем email плательщика из параметров возврата PayAnyWay
    const urlEmail = getFirstParam(
      'MNT_SUBSCRIBER_ID',
      'mnt_subscriber_id',
      'email',
      'EMAIL',
      'MNT_USER',
      'mnt_user',
      'payer_email',
      'client_email',
      'MNT_CUSTOM1'
    ) || '';

    // Извлекаем ID операции для защиты от повторного зачисления при обновлении страницы
    const opId = getFirstParam(
      'MNT_OPERATION_ID',
      'mnt_operation_id',
      'MNT_TRANSACTION_ID',
      'mnt_transaction_id',
      'operation_id',
      'transaction_id'
    );

    // 1. Проверяем регистрацию на турнир
    let tId = getFirstParam('tId', 'tid', 'tournamentId');
    let nick = getFirstParam('nick', 'nickname');
    let acc = getFirstParam('acc', 'gameAccount');
    let email = getFirstParam('email') || urlEmail;
    let phone = getFirstParam('phone') || '';
    let password = '';
    let pendingTitle = '';
    let pendingFee = 0;

    const savedRegStr = localStorage.getItem('nb_pending_registration');
    if (savedRegStr) {
      try {
        const parsedReg = JSON.parse(savedRegStr);
        tId = tId || parsedReg.tournamentId;
        nick = nick || parsedReg.nickname;
        acc = acc || parsedReg.gameAccount;
        email = email || parsedReg.email;
        phone = phone || parsedReg.phone || '';
        password = parsedReg.password || '';
        pendingTitle = parsedReg.tournamentTitle || '';
        pendingFee = Number(parsedReg.amount) || 0;
      } catch (e) {
        console.error('Error reading pending registration:', e);
      }
    }

    if (tId && nick && email) {
      localStorage.removeItem('nb_pending_registration');
      localStorage.removeItem('nb_pending_topup');

      setRegisteredTournamentId(tId);
      setPlayerNickname(nick);

      const targetTourney = tournaments.find((t) => t.id === tId);
      const computedTitle = targetTourney?.title || pendingTitle || tId.replace(/-/g, ' ').toUpperCase();
      const computedFee = targetTourney?.entryFeeRub || pendingFee || parsedUrlAmount || 100;

      setRegisteredTournamentTitle(computedTitle);
      setPaidAmount(computedFee);

      if (!isUserRegistered(tId, email)) {
        registerForTournament(tId, nick, acc || '', email, phone);
      }

      if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
        login(email, password, nick, phone);
      }
      return;
    }

    // 2. Пополнение баланса кошелька
    // Читаем сохраненные данные о пополнении из localStorage
    let savedTopupAmount = 0;
    let savedTopupEmail = '';
    const savedTopupStr = localStorage.getItem('nb_pending_topup');
    if (savedTopupStr) {
      try {
        const parsedTopup = JSON.parse(savedTopupStr);
        savedTopupAmount = Number(parsedTopup.amount) || 0;
        savedTopupEmail = (parsedTopup.email || '').trim();
      } catch (e) {
        console.error('Error reading pending topup:', e);
      }
    }

    // Определяем сумму зачисления:
    // 1) Если шлюз PayAnyWay передал фактическую оплаченную сумму в URL (например, MNT_AMOUNT=10.00) — берем её!
    // 2) Иначе берем сумму, указанную пользователем перед переходом на кассу
    const exactCreditAmount = parsedUrlAmount > 0 ? parsedUrlAmount : savedTopupAmount;

    if (exactCreditAmount > 0) {
      const currentUser = user || getStoredUser();
      const finalEmail = (
        currentUser?.email || 
        savedTopupEmail || 
        urlEmail || 
        ''
      ).trim();

      setIsTopUp(true);
      setTopUpAmount(exactCreditAmount);

      // Защита от повторного начисления при перезагрузке страницы (F5) пользователем
      const dedupeKey = `nb_processed_${opId || ('amt_' + exactCreditAmount + '_' + (savedTopupStr ? 'saved' : 'url'))}`;
      const isAlreadyCredited = sessionStorage.getItem(dedupeKey) === 'true';

      if (!isAlreadyCredited) {
        sessionStorage.setItem(dedupeKey, 'true');
        updateBalance(exactCreditAmount, finalEmail);

        if (!user && finalEmail) {
          login(finalEmail);
        }
      }

      localStorage.removeItem('nb_pending_topup');
      return;
    }

    // Если нет ни данных турнира, ни суммы пополнения
    localStorage.removeItem('nb_pending_topup');
  }, []); // Выполняется строго 1 раз при монтировании компонента

  // Обновляем название турнира и взнос, если список турниров догрузился позже
  useEffect(() => {
    if (registeredTournamentId && tournaments.length > 0) {
      const targetTourney = tournaments.find((t) => t.id === registeredTournamentId);
      if (targetTourney) {
        setRegisteredTournamentTitle(targetTourney.title);
        setPaidAmount(targetTourney.entryFeeRub);
      }
    }
  }, [registeredTournamentId, tournaments]);

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
              Вернуться к соревнованиям
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
            {(user || getStoredUser()) && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Пользователь:</span>
                <span className="font-bold text-white">{(user || getStoredUser())?.nickname || (user || getStoredUser())?.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Сумма зачисления:</span>
              <span className="font-bold text-emerald-400">+{formatRub(topUpAmount)}</span>
            </div>
            {(user || getStoredUser()) && (
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-zinc-500">Текущий баланс:</span>
                <span className="font-extrabold text-white">
                  {formatRub((user?.balanceRub ?? getStoredUser()?.balanceRub) || topUpAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Статус:</span>
              <span className="font-semibold text-cyan-400">Зачислено (PayAnyWay / СБП)</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Теперь вы можете оплачивать организационные услуги соревнований моментально в один клик.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/account" className="btn-primary">
              Перейти в личный кабинет
            </Link>
            <Link to="/tournaments" className="btn-secondary">
              Выбрать соревнование
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Экран успешной регистрации на турнир
  if (registeredTournamentId || registeredTournamentTitle) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="surface-card p-8 border-emerald-500/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Оплата прошла успешно!</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Вы успешно оплатили организационные услуги и зарегистрированы на соревнование
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
              <span className="text-zinc-500">Организационные услуги:</span>
              <span className="font-bold text-emerald-400">{formatRub(paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Статус:</span>
              <span className="font-semibold text-cyan-400">Оплачено (PayAnyWay / СБП)</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Все данные для входа, комната и пароль станут доступны в вашем личном кабинете.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/account" className="btn-primary">
              Перейти в личный кабинет
            </Link>
            {registeredTournamentId && (
              <Link to={`/tournaments/${registeredTournamentId}`} className="btn-secondary">
                Перейти на страницу соревнования
              </Link>
            )}
            <Link to="/tournaments" className="btn-secondary">
              Все соревнования
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Если страница открыта без подтверждённого платежа
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <div className="surface-card p-8 border-cyan-500/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-3xl text-cyan-400">
          ℹ
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">Статус платежа</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Информация об оплате ожидает подтверждения от платёжного шлюза. Проверьте актуальный баланс в личном кабинете.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link to="/account" className="btn-primary">
            Перейти в личный кабинет
          </Link>
          <Link to="/tournaments" className="btn-secondary">
            К соревнованиям
          </Link>
        </div>
      </div>
    </div>
  );
};
