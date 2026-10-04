import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/context/TournamentContext';
import { formatRub } from '@/lib/format';
import { getStoredUser } from '@/lib/storage';
import { createTipsTipsPayment, getStoredTipsTipsPayments } from '@/lib/tipstips-client';

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tournaments } = useTournaments();

  const status = searchParams.get('status');
  const isFailed = status === 'fail' || status === 'canceled';

  const [registeredTournamentTitle, setRegisteredTournamentTitle] = useState<string>('');
  const [registeredTournamentId, setRegisteredTournamentId] = useState<string>('');
  const [playerNickname, setPlayerNickname] = useState<string>('');
  const [isTopUp, setIsTopUp] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(100);
  const [paidAmount, setPaidAmount] = useState<number>(100);
  const [pendingCode, setPendingCode] = useState<string>('');

  const hasProcessed = useRef<boolean>(false);

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

    const rawMntAmount = getFirstParam(
      'amount',
      'AMOUNT',
      'orderAmount',
      'sum',
      'SUM',
      'MNT_AMOUNT',
      'mnt_amount',
      'OutSum',
      'out_sum',
      'payment_amount',
      'pa_amount'
    );

    const parsedUrlAmount = rawMntAmount
      ? parseFloat(rawMntAmount.replace(',', '.').trim())
      : 0;

    const urlEmail = getFirstParam(
      'email',
      'EMAIL',
      'client_email',
      'payer_email',
      'MNT_SUBSCRIBER_ID',
      'mnt_subscriber_id',
      'MNT_USER',
      'mnt_user',
      'MNT_CUSTOM1'
    ) || '';

    // 1. Проверяем регистрацию на турнир
    let tId = getFirstParam('tId', 'tid', 'tournamentId');
    let nick = getFirstParam('nick', 'nickname');
    let acc = getFirstParam('acc', 'gameAccount');
    let email = getFirstParam('email') || urlEmail;
    let phone = getFirstParam('phone') || '';
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
        pendingTitle = parsedReg.tournamentTitle || '';
        pendingFee = Number(parsedReg.amount) || 0;
      } catch (e) {
        console.error('Error reading pending registration:', e);
      }
    }

    if (tId && (nick || email)) {
      setRegisteredTournamentId(tId);
      setPlayerNickname(nick || 'Игрок');

      const targetTourney = tournaments.find((t) => t.id === tId);
      const computedTitle = targetTourney?.title || pendingTitle || tId.replace(/-/g, ' ').toUpperCase();
      const computedFee = targetTourney?.entryFeeRub || pendingFee || parsedUrlAmount || 100;

      setRegisteredTournamentTitle(computedTitle);
      setPaidAmount(computedFee);

      // Проверяем, существует ли уже заявка в tips.tips
      const existing = getStoredTipsTipsPayments();
      const matched = existing.find(
        (p) => p.tournamentId === tId && (p.email.toLowerCase() === (email || '').toLowerCase() || p.nickname === nick)
      );

      if (matched) {
        setPendingCode(matched.code);
      } else if (email) {
        createTipsTipsPayment({
          amount: computedFee,
          type: 'registration',
          email: email.trim(),
          phone: phone.trim(),
          nickname: (nick || 'Игрок').trim(),
          gameAccount: (acc || '').trim(),
          tournamentId: tId,
          tournamentTitle: computedTitle,
        }).then((created) => {
          setPendingCode(created.code);
        });
      }

      localStorage.removeItem('nb_pending_registration');
      localStorage.removeItem('nb_pending_topup');
      return;
    }

    // 2. Пополнение баланса кошелька
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

      const existing = getStoredTipsTipsPayments();
      const matched = existing.find(
        (p) => p.type === 'topup' && p.amount === exactCreditAmount && (finalEmail ? p.email.toLowerCase() === finalEmail.toLowerCase() : true)
      );

      if (matched) {
        setPendingCode(matched.code);
      } else if (finalEmail) {
        createTipsTipsPayment({
          amount: exactCreditAmount,
          type: 'topup',
          userId: currentUser?.id,
          email: finalEmail,
          phone: currentUser?.phone || '',
          nickname: currentUser?.nickname || finalEmail.split('@')[0],
        }).then((created) => {
          setPendingCode(created.code);
        });
      }

      localStorage.removeItem('nb_pending_topup');
      return;
    }

    localStorage.removeItem('nb_pending_topup');
    localStorage.removeItem('nb_pending_registration');
  }, [isFailed, tournaments, user]);

  useEffect(() => {
    if (registeredTournamentId && tournaments.length > 0) {
      const targetTourney = tournaments.find((t) => t.id === registeredTournamentId);
      if (targetTourney) {
        setRegisteredTournamentTitle(targetTourney.title);
        setPaidAmount(targetTourney.entryFeeRub ?? 100);
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

  // Экран ожидания подтверждения пополнения баланса
  if (isTopUp) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="surface-card p-8 border-amber-500/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-3xl text-amber-400">
            ⏳
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Заявка на проверке</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Заявка на пополнение баланса успешно сформирована и ожидает подтверждения администратором.
          </p>

          <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-4 text-left space-y-2 text-xs">
            {pendingCode && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Код заявки:</span>
                <span className="font-mono font-extrabold text-amber-300">{pendingCode}</span>
              </div>
            )}
            {(user || getStoredUser()) && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Пользователь:</span>
                <span className="font-bold text-white">{(user || getStoredUser())?.nickname || (user || getStoredUser())?.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Сумма к зачислению:</span>
              <span className="font-bold text-white font-mono">{formatRub(topUpAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-zinc-500">Статус зачисления:</span>
              <span className="font-semibold text-amber-400">⏳ Ожидает одобрения</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-[11px] text-amber-200/90 text-left leading-relaxed">
            💡 Зачисление средств производится администратором после ручной сверки поступившего перевода в tips.tips. Обычно проверка занимает от 1 до 5 минут.
          </div>

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

  // Экран ожидания подтверждения регистрации на турнир
  if (registeredTournamentId || registeredTournamentTitle) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="surface-card p-8 border-amber-500/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-3xl text-amber-400">
            ⏳
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Заявка на проверке</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Заявка на участие в соревновании
            {registeredTournamentTitle ? ` «${registeredTournamentTitle}»` : ''} ожидает подтверждения администратором.
          </p>

          <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-4 text-left space-y-2 text-xs">
            {pendingCode && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Код заявки:</span>
                <span className="font-mono font-extrabold text-amber-300">{pendingCode}</span>
              </div>
            )}
            {playerNickname && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Участник:</span>
                <span className="font-bold text-white">{playerNickname}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Организационные услуги:</span>
              <span className="font-bold text-white font-mono">{formatRub(paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-zinc-500">Статус:</span>
              <span className="font-semibold text-amber-400">⏳ Ожидает одобрения</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-[11px] text-amber-200/90 text-left leading-relaxed">
            💡 Администратор сверит поступление оргвзноса по коду заявки. Сразу после подтверждения соревнование и данные закрытого лобби станут доступны в вашем личном кабинете.
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/account" className="btn-primary">
              Перейти в личный кабинет
            </Link>
            {registeredTournamentId && (
              <Link to={`/tournaments/${registeredTournamentId}`} className="btn-secondary">
                Страница соревнования
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

  // Общий экран статуса платежей
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <div className="surface-card p-8 border-cyan-500/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-3xl text-cyan-400">
          ℹ
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">Касса соревнований</h1>
        <p className="mt-2 text-sm text-zinc-300">
          Все платежи зачисляются строго после проверки администратором. Проверить статус ваших заявок можно в личном кабинете.
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
