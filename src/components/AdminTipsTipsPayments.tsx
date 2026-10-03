import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatRub, formatDateTime } from '@/lib/format';
import {
  TipsTipsPayment,
  getStoredTipsTipsPayments,
  fetchTipsTipsPaymentsFromDb,
  confirmTipsTipsPayment,
  rejectTipsTipsPayment,
  getSyncStatus,
} from '@/lib/tipstips-client';
import { useTournaments } from '@/context/TournamentContext';
import { supabase } from '@/lib/supabase';

export const AdminTipsTipsPayments: React.FC = () => {
  const { registerForTournament, refreshData } = useTournaments();
  const [payments, setPayments] = useState<TipsTipsPayment[]>(() => getStoredTipsTipsPayments());
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'online' | 'local_fallback'>(() => getSyncStatus());

  const isFetchingRef = useRef(false);

  const loadPayments = useCallback(async (showLoading = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showLoading) setIsLoading(true);
    try {
      const all = await fetchTipsTipsPaymentsFromDb();
      setPayments(all);
      setSyncStatus(getSyncStatus());
    } catch (err) {
      console.warn('loadPayments error:', err);
      // Fallback to local storage
      setPayments(getStoredTipsTipsPayments());
      setSyncStatus('local_fallback');
    } finally {
      if (showLoading) setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Первоначальная загрузка
    loadPayments(true);

    // 2. Слушатель локальных событий обновления
    const handleUpdate = () => loadPayments(false);
    window.addEventListener('nb_tipstips_updated', handleUpdate);

    // 3. Обновление при возвращении на вкладку
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPayments(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Безопасный интервал опроса (20 сек) без наслоения запросов
    const interval = setInterval(() => {
      if (!document.hidden && !isFetchingRef.current) {
        loadPayments(false);
      }
    }, 20000);

    // 5. Realtime-подписка с перехватом ошибок (в РФ WebSockets Supabase могут блокироваться)
    let channel: any = null;
    try {
      channel = supabase
        .channel('realtime-admin-transactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => {
            if (!isFetchingRef.current) {
              loadPayments(false);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setSyncStatus('online');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setSyncStatus('local_fallback');
          }
        });
    } catch (e) {
      console.warn('Realtime subscription notice:', e);
      setSyncStatus('local_fallback');
    }

    return () => {
      window.removeEventListener('nb_tipstips_updated', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [loadPayments]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirm = async (p: TipsTipsPayment) => {
    setIsProcessing(p.id);
    try {
      const ok = await confirmTipsTipsPayment(p.id, async (tId, nick, gameAcc, email, phone) => {
        await registerForTournament(tId, nick, gameAcc, email, phone);
        await refreshData();
        return true;
      });

      if (ok) {
        await loadPayments();
        showNotice(`✓ Платеж ${p.code} (${formatRub(p.amount)}) подтверждён. ${p.type === 'topup' ? 'Баланс зачислен.' : 'Игрок зарегистрирован на турнир.'}`);
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      showNotice(`Ошибка при подтверждении платежа ${p.code}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (p: TipsTipsPayment) => {
    setIsProcessing(p.id);
    try {
      const ok = await rejectTipsTipsPayment(p.id);
      if (ok) {
        setRejectConfirmId(null);
        await loadPayments();
        showNotice(`✓ Заявка ${p.code} успешно отклонена.`);
      } else {
        showNotice(`Не удалось отклонить заявку ${p.code}`);
      }
    } catch (err) {
      console.error('Error rejecting payment:', err);
      showNotice(`Ошибка при отклонении заявки ${p.code}`);
    } finally {
      setIsProcessing(null);
    }
  };

  // Метрики
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const confirmedPayments = payments.filter((p) => p.status === 'confirmed');
  const rejectedPayments = payments.filter((p) => p.status === 'rejected');

  const pendingCount = pendingPayments.length;
  const confirmedCount = confirmedPayments.length;
  const rejectedCount = rejectedPayments.length;

  const pendingSum = pendingPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const confirmedSum = confirmedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Фильтрация по статусу и поиску
  const filtered = payments.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    return (
      p.code?.toLowerCase().includes(q) ||
      p.nickname?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.gameAccount?.toLowerCase().includes(q) ||
      p.tournamentTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Верхние информационные карточки / Метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* На проверке */}
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#181512] to-[#12100d] p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400/90">
              На проверке
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
              {pendingCount}
            </span>
            <span className="text-sm font-bold text-amber-400/80 font-mono">
              {formatRub(pendingSum)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            {pendingCount === 0 ? 'Все заявки проверены' : 'Требуют сверки в tips.tips'}
          </p>
        </div>

        {/* Подтверждено */}
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-[#0f1917] to-[#0c1412] p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400/90">
              Подтверждено
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-300 font-mono tracking-tight">
              {confirmedCount}
            </span>
            <span className="text-sm font-bold text-emerald-400/80 font-mono">
              {formatRub(confirmedSum)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Зачислено на баланс и в турниры
          </p>
        </div>

        {/* Отклонено */}
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-b from-[#180f12] to-[#140b0d] p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-red-400/90">
              Отклонено
            </span>
            <span className="h-2 w-2 rounded-full bg-red-400" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-300 font-mono tracking-tight">
              {rejectedCount}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              заявок
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Неоплаченные или ошибочные
          </p>
        </div>

        {/* Статус соединения */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#131a29] to-[#0f1522] p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">
              Статус сети
            </span>
            {syncStatus === 'online' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cloud активен
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300" title="Работает локальный кэш без задержек">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Автономно (РФ)
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className="text-[11px] text-zinc-300 leading-tight">
              {syncStatus === 'online'
                ? 'Прямая синхронизация с Supabase Cloud'
                : 'Мгновенная работа без зависаний через локальное хранилище'}
            </p>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => loadPayments(true)}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-1.5 px-3 text-xs font-bold text-zinc-200 hover:text-white hover:bg-white/10 transition active:scale-[0.98] disabled:opacity-50"
            >
              <svg className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isLoading ? 'Проверка...' : 'Обновить сейчас'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Уведомление о действиях */}
      {actionNotice && (
        <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-blue-950/40 p-3.5 text-xs font-bold text-cyan-200 flex items-center justify-between shadow-lg">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-cyan-400 hover:text-white text-xs px-2 py-0.5">
            ✕
          </button>
        </div>
      )}

      {/* Панель фильтров и поиска */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Кнопки статуса */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                filter === 'pending'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <span>На проверке</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${filter === 'pending' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-amber-400'}`}>
                {pendingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('confirmed')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                filter === 'confirmed'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Подтвержденные</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${filter === 'confirmed' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-emerald-400'}`}>
                {confirmedCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('rejected')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Отклоненные</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${filter === 'rejected' ? 'bg-black/30 text-white font-extrabold' : 'bg-white/10 text-red-400'}`}>
                {rejectedCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                filter === 'all'
                  ? 'bg-cyan-400 text-black shadow-md'
                  : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <span>Все</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${filter === 'all' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-zinc-400'}`}>
                {payments.length}
              </span>
            </button>
          </div>

          {/* Быстрый поиск */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по NB-..., нику, телефону..."
              className="w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 pl-9 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none transition"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Таблица заявок */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-zinc-400 mb-3">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-bold text-zinc-300">
              {searchQuery
                ? `По запросу «${searchQuery}» ничего не найдено`
                : filter === 'pending'
                ? 'Нет заявок, ожидающих подтверждения. Все платежи сверены.'
                : 'В этом статусе нет заявок.'}
            </p>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Когда игрок сформирует перевод по реквизитам tips.tips, заявка появится здесь автоматически.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0c1017]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase font-bold text-zinc-400">
                <tr>
                  <th className="px-4 py-3.5">Код перевода</th>
                  <th className="px-4 py-3.5">Сумма</th>
                  <th className="px-4 py-3.5">Тип</th>
                  <th className="px-4 py-3.5">Игрок / Контакты</th>
                  <th className="px-4 py-3.5">Создан</th>
                  <th className="px-4 py-3.5">Статус</th>
                  <th className="px-4 py-3.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((p) => {
                  const isPending = p.status === 'pending';
                  const isConfirmed = p.status === 'confirmed';
                  const isRejected = p.status === 'rejected';

                  return (
                    <tr
                      key={p.id}
                      className={`transition ${
                        isPending ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Код перевода */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block rounded-lg bg-black/80 border border-amber-500/40 px-2.5 py-1 font-mono text-xs font-black text-amber-300 tracking-wider">
                            {p.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCodeToClipboard(p.code)}
                            title="Скопировать код"
                            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition"
                          >
                            {copiedCode === p.code ? (
                              <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                            ) : (
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Сумма */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-sm font-black text-white">
                          {formatRub(p.amount)}
                        </span>
                      </td>

                      {/* Назначение */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.type === 'topup' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                            Пополнение баланса
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                              Взнос на турнир
                            </span>
                            <div className="text-[11px] font-medium text-zinc-300 truncate max-w-[160px]">
                              {p.tournamentTitle || p.tournamentId}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Игрок */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{p.nickname}</span>
                            {p.gameAccount && (
                              <span className="font-mono text-[10px] text-zinc-400">
                                [{p.gameAccount}]
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-400">
                            {p.phone || p.email}
                          </div>
                        </div>
                      </td>

                      {/* Дата */}
                      <td className="px-4 py-3.5 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDateTime(p.createdAt)}
                      </td>

                      {/* Статус */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            На проверке
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Подтвержден
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/40 px-2.5 py-1 text-[11px] font-bold text-red-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            Отклонен
                          </span>
                        )}
                      </td>

                      {/* Действия */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {isPending && (
                          <>
                            {rejectConfirmId === p.id ? (
                              <div className="inline-flex items-center gap-1.5 bg-red-950/90 border border-red-500/60 rounded-xl p-1 shadow-lg">
                                <span className="text-[11px] font-bold text-red-200 pl-1.5">Отклонить?</span>
                                <button
                                  type="button"
                                  onClick={() => handleReject(p)}
                                  disabled={isProcessing === p.id}
                                  className="rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[11px] px-2.5 py-1 transition disabled:opacity-50"
                                >
                                  {isProcessing === p.id ? '...' : 'Да'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectConfirmId(null)}
                                  className="rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] px-2 py-1 transition"
                                >
                                  Отмена
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleConfirm(p)}
                                  disabled={isProcessing === p.id}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-1.5 text-xs font-extrabold transition shadow-md shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span>{isProcessing === p.id ? 'Зачисление...' : 'Подтвердить'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectConfirmId(p.id)}
                                  disabled={isProcessing === p.id}
                                  className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-950/40 hover:bg-red-900/70 text-red-300 px-2.5 py-1.5 text-xs font-semibold transition active:scale-[0.98]"
                                  title="Отклонить заявку"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                        {isConfirmed && (
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Зачислено {p.confirmedAt ? formatDateTime(p.confirmedAt) : ''}
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[11px] text-red-400 font-mono">
                            Отклонено
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
