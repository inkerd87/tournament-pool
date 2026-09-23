import React, { useState, useEffect } from 'react';
import { formatRub, formatDateTime } from '@/lib/format';
import {
  TipsTipsPayment,
  getStoredTipsTipsPayments,
  confirmTipsTipsPayment,
  rejectTipsTipsPayment,
} from '@/lib/tipstips-client';
import { useTournaments } from '@/context/TournamentContext';

export const AdminTipsTipsPayments: React.FC = () => {
  const { registerForTournament, refreshData } = useTournaments();
  const [payments, setPayments] = useState<TipsTipsPayment[]>(() => getStoredTipsTipsPayments());
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadPayments = () => {
    setPayments(getStoredTipsTipsPayments());
  };

  useEffect(() => {
    loadPayments();
    const handleUpdate = () => loadPayments();
    window.addEventListener('nb_tipstips_updated', handleUpdate);
    return () => window.removeEventListener('nb_tipstips_updated', handleUpdate);
  }, []);

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
        loadPayments();
        showNotice(`✓ Платеж ${p.code} (${formatRub(p.amount)}) успешно подтверждён! ${p.type === 'topup' ? 'Баланс зачислен.' : 'Игрок зарегистрирован на турнир.'}`);
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      showNotice(`Ошибка при подтверждении платежа ${p.code}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (p: TipsTipsPayment) => {
    if (!window.confirm(`Отклонить заявку ${p.code} на сумму ${formatRub(p.amount)}?`)) return;
    setIsProcessing(p.id);
    try {
      await rejectTipsTipsPayment(p.id);
      loadPayments();
      showNotice(`Заявка ${p.code} отклонена.`);
    } catch {
      showNotice(`Ошибка при отклонении заявки.`);
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Сверка платежей tips.tips</h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 border border-amber-500/40 animate-pulse">
                {pendingCount} на проверке
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Сверяйте поступившие в tips.tips переводы по коду комментария (<code className="text-amber-300 font-mono">NB-XXXX</code>) и подтверждайте в 1 клик
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayments}
          className="self-start sm:self-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
        >
          🔄 Обновить список
        </button>
      </div>

      {actionNotice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-300">
          {actionNotice}
        </div>
      )}

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'pending'
              ? 'bg-amber-500 text-black font-bold'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Ожидают проверки ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('confirmed')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'confirmed'
              ? 'bg-emerald-500 text-black font-bold'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Подтвержденные ({confirmedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('rejected')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'rejected'
              ? 'bg-rose-500 text-black font-bold'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Отклоненные ({rejectedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-cyan-500 text-black font-bold'
              : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          Все заявки ({payments.length})
        </button>
      </div>

      {/* Таблица заявок */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
          <p className="text-sm font-semibold text-zinc-400">
            {filter === 'pending'
              ? 'Нет заявок, ожидающих подтверждения. Все платежи сверены!'
              : 'В этом статусе нет заявок.'}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Когда игрок сформирует оплату на tips.tips, она мгновенно появится здесь.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-[11px] uppercase font-bold text-zinc-400">
              <tr>
                <th className="px-4 py-3">Код перевода</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Назначение</th>
                <th className="px-4 py-3">Игрок / Контакты</th>
                <th className="px-4 py-3">Дата создания</th>
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
                      isPending ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Код перевода */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-black/60 border border-amber-500/40 px-2.5 py-1 font-mono text-xs font-extrabold text-amber-300 tracking-wider">
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                          💰 Пополнение баланса
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                            🏆 Турнир
                          </span>
                          <div className="text-[11px] font-semibold text-zinc-300">
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
                            <span className="font-mono text-[10px] text-zinc-500">
                              ({p.gameAccount})
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                          ⏳ Ожидает проверки
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          ✓ Подтвержден
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
                          ✕ Отклонен
                        </span>
                      )}
                    </td>

                    {/* Действия */}
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleConfirm(p)}
                            disabled={isProcessing === p.id}
                            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 text-xs font-bold transition shadow-sm"
                          >
                            {isProcessing === p.id ? 'Зачисление...' : '✓ Подтвердить'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(p)}
                            disabled={isProcessing === p.id}
                            className="rounded-lg border border-red-500/30 bg-red-950/40 hover:bg-red-900/60 text-red-300 px-2.5 py-1.5 text-xs font-semibold transition"
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {isConfirmed && (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          Зачислено {p.confirmedAt ? formatDateTime(p.confirmedAt) : ''}
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
