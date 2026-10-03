import React, { useState, useEffect, useCallback } from 'react';
import { formatRub, formatDateTime } from '@/lib/format';
import {
  TipsTipsPayment,
  getStoredTipsTipsPayments,
  fetchTipsTipsPaymentsFromDb,
  confirmTipsTipsPayment,
  rejectTipsTipsPayment,
} from '@/lib/tipstips-client';
import { useTournaments } from '@/context/TournamentContext';
import { supabase } from '@/lib/supabase';

export const AdminTipsTipsPayments: React.FC = () => {
  const { registerForTournament, refreshData } = useTournaments();
  const [payments, setPayments] = useState<TipsTipsPayment[]>(() => getStoredTipsTipsPayments());
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadPayments = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const all = await fetchTipsTipsPaymentsFromDb();
      setPayments(all);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Первоначальная загрузка всех платежей из Supabase
    loadPayments(true);

    // 2. Слушатель локальных событий обновления
    const handleUpdate = () => loadPayments(false);
    window.addEventListener('nb_tipstips_updated', handleUpdate);

    // 3. Автоматический опрос каждые 8 секунд для моментального получения новых платежей со всех устройств
    const interval = setInterval(() => {
      loadPayments(false);
    }, 8000);

    // 4. Подписка на Realtime-изменения таблицы transactions в Supabase
    let channel: any = null;
    try {
      channel = supabase
        .channel('realtime-admin-transactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => {
            loadPayments(false);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription notice:', e);
    }

    return () => {
      window.removeEventListener('nb_tipstips_updated', handleUpdate);
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadPayments]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
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
        showNotice(`Платеж ${p.code} (${formatRub(p.amount)}) подтверждён. ${p.type === 'topup' ? 'Баланс зачислен.' : 'Игрок зарегистрирован на турнир.'}`);
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
        showNotice(`Заявка ${p.code} отклонена.`);
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

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const confirmedCount = payments.filter((p) => p.status === 'confirmed').length;
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length;

  const filtered = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="surface-card p-6 space-y-6">
      {/* Шапка раздела */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Сверка платежей tips.tips</h2>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                {pendingCount} на проверке
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Сверяйте комментарий перевода в tips.tips (<code className="text-amber-300 font-mono font-semibold">NB-XXXX</code>) и подтверждайте зачисление
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPayments(true)}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
        >
          <svg className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isLoading ? 'Обновление...' : 'Обновить список'}</span>
        </button>
      </div>

      {actionNotice && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 p-3 text-xs font-semibold text-cyan-200 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-cyan-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            filter === 'pending'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          На проверке ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('confirmed')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            filter === 'confirmed'
              ? 'bg-emerald-500 text-black shadow-sm'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Подтвержденные ({confirmedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('rejected')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            filter === 'rejected'
              ? 'bg-red-500 text-white shadow-sm'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Отклоненные ({rejectedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-cyan-500 text-black shadow-sm'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Все ({payments.length})
        </button>
      </div>

      {/* Таблица заявок */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-sm font-semibold text-zinc-300">
            {filter === 'pending'
              ? 'Нет заявок, ожидающих подтверждения. Все платежи сверены.'
              : 'В этом статусе нет заявок.'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Когда игрок сформирует перевод в tips.tips, заявка отобразится здесь автоматически.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0d1117]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase font-bold text-zinc-400">
              <tr>
                <th className="px-4 py-3">Код перевода</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Игрок / Контакты</th>
                <th className="px-4 py-3">Создан</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
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
                      isPending ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Код перевода */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-black/70 border border-amber-500/40 px-2.5 py-1 font-mono text-xs font-bold text-amber-300 tracking-wider">
                        {p.code}
                      </span>
                    </td>

                    {/* Сумма */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-sm font-extrabold text-white">
                        {formatRub(p.amount)}
                      </span>
                    </td>

                    {/* Назначение */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.type === 'topup' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                          Баланс
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                            Турнир
                          </span>
                          <div className="text-[11px] font-medium text-zinc-300 truncate max-w-[150px]">
                            {p.tournamentTitle || p.tournamentId}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Игрок */}
                    <td className="px-4 py-3 whitespace-nowrap">
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
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(p.createdAt)}
                    </td>

                    {/* Статус */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Ожидает проверки
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Подтвержден
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[11px] font-semibold text-red-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          Отклонен
                        </span>
                      )}
                    </td>

                    {/* Действия */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isPending && (
                        <>
                          {rejectConfirmId === p.id ? (
                            <div className="inline-flex items-center gap-1.5 bg-red-950/80 border border-red-500/50 rounded-lg p-1">
                              <span className="text-[11px] font-bold text-red-200 pl-1">Отклонить?</span>
                              <button
                                type="button"
                                onClick={() => handleReject(p)}
                                disabled={isProcessing === p.id}
                                className="rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] px-2 py-1 transition disabled:opacity-50"
                              >
                                {isProcessing === p.id ? 'Отклонение...' : 'Да'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectConfirmId(null)}
                                className="rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] px-2 py-1 transition"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleConfirm(p)}
                                disabled={isProcessing === p.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 text-xs font-bold transition shadow-sm disabled:opacity-50"
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
                                className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-950/30 hover:bg-red-900/60 text-red-300 px-2.5 py-1.5 text-xs font-medium transition"
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
  );
};
