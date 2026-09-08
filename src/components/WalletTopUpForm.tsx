import React, { useState, useEffect } from 'react';
import { formatRub } from '@/lib/format';
import { PAYANYWAY_SHOWCASE_URL } from '@/lib/payanyway-client';
import { useAuth } from '@/context/AuthContext';

const AMOUNTS = [100, 300, 500, 1000];

export const WalletTopUpForm: React.FC = () => {
  const { user } = useAuth();
  const [customAmount, setCustomAmount] = useState<string>('100');
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCrediting, setIsCrediting] = useState(false);

  const parsedAmount = Math.max(10, Number(customAmount) || 100);

  // При загрузке проверяем, есть ли незавершенный платеж в localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nb_pending_topup');
      if (saved) {
        const parsed = JSON.parse(saved);
        const age = Date.now() - (parsed.createdAt || 0);
        // Если платеж был создан менее 2 часов назад
        if (age < 2 * 60 * 60 * 1000 && parsed.amount > 0) {
          const amt = Number(parsed.amount);
          setPendingAmount(amt);
        } else {
          localStorage.removeItem('nb_pending_topup');
        }
      }
    } catch {}
  }, []);

  const handleStep = (delta: number) => {
    const current = Math.max(0, Number(customAmount) || 0);
    const next = Math.max(50, Math.min(50000, current + delta));
    setCustomAmount(String(next));
  };

  const handleTopUp = () => {
    setSuccessMessage(null);
    const email = user?.email || '';

    localStorage.setItem(
      'nb_pending_topup',
      JSON.stringify({
        amount: parsedAmount,
        email,
        createdAt: Date.now(),
      })
    );

    setPendingAmount(parsedAmount);

    // Открываем витрину PayAnyWay в новой вкладке, чтобы игрок не терял страницу NightByte
    const opened = window.open(PAYANYWAY_SHOWCASE_URL, '_blank');
    if (!opened) {
      // Если браузер заблокировал всплывающее окно, перенаправляем в текущей вкладке
      window.location.href = PAYANYWAY_SHOWCASE_URL;
    }
  };

  const handleCancelPending = () => {
    localStorage.removeItem('nb_pending_topup');
    setPendingAmount(null);
  };

  const handleCheckBalance = async () => {
    setIsCrediting(true);
    try {
      const prevBal = user?.balanceRub || 0;
      await refreshUser();
      const current = getStoredUser();
      if (current && current.balanceRub > prevBal) {
        localStorage.removeItem('nb_pending_topup');
        setPendingAmount(null);
        setSuccessMessage(`Баланс успешно обновлен: ${formatRub(current.balanceRub)}`);
      }
    } catch (e) {
      console.error('Error refreshing balance:', e);
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Пополнение баланса</h3>
        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
          СБП / МИР
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        Через СБП или банковскую карту (PayAnyWay / НКО «МОНЕТА»). Без комиссии.
      </p>

      {/* Успешное зачисление */}
      {successMessage && (
        <div className="mt-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between">
          <span className="font-semibold">✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Активное состояние ожидания подтверждения оплаты */}
      {pendingAmount ? (
        <div className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              Ожидание оплаты
            </span>
            <span className="font-mono text-xs font-extrabold text-cyan-300">
              {formatRub(pendingAmount)}
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-1.5 text-xs text-zinc-300">
            <p className="leading-relaxed">
              Платёжная страница PayAnyWay открыта в новой вкладке. После завершения перевода картой или через СБП банк подтвердит платёж.
            </p>
            <p className="text-[11px] text-zinc-400">
              Средства зачисляются автоматически после получения уведомления от платёжного шлюза.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckBalance}
            disabled={isCrediting}
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-50 text-black py-2.5 px-4 font-bold text-xs sm:text-sm transition shadow-lg shadow-cyan-500/20 text-center flex items-center justify-center gap-2"
          >
            {isCrediting ? 'Проверка...' : '🔄 Проверить статус зачисления'}
          </button>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <a
              href={PAYANYWAY_SHOWCASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Открыть страницу оплаты ещё раз ↗
            </a>
            <button
              type="button"
              onClick={handleCancelPending}
              className="text-zinc-500 hover:text-zinc-300 transition"
            >
              Отменить
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Быстрый выбор суммы */}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCustomAmount(String(amt))}
                className={`rounded-lg border py-2 px-1 text-center text-xs font-semibold transition ${
                  customAmount === String(amt)
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'border-white/10 bg-black/20 text-zinc-300 hover:border-white/20'
                }`}
              >
                {formatRub(amt)}
              </button>
            ))}
          </div>

          {/* Поле ввода и кнопка в аккуратной вертикальной компоновке */}
          <div className="mt-3.5 space-y-2.5">
            <div className="relative flex items-center rounded-xl border border-white/10 bg-black/40 px-3.5 py-1.5 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-inner">
              <input
                type="number"
                min="50"
                max="50000"
                step="50"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-transparent font-mono text-base sm:text-sm font-bold text-white outline-none placeholder:text-zinc-600"
                placeholder="Своя сумма"
              />

              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-bold text-zinc-400 select-none font-mono">
                  ₽
                </span>

                {/* Стрелки-степпер в стиле NightByte */}
                <div className="flex flex-col rounded-lg border border-white/10 bg-white/5 overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleStep(50)}
                    className="group flex h-4 w-6 items-center justify-center bg-black/30 hover:bg-cyan-500/25 active:bg-cyan-500/40 text-zinc-400 hover:text-cyan-300 transition-colors"
                    title="Увеличить на 50 ₽"
                    aria-label="Увеличить на 50 ₽"
                  >
                    <svg
                      className="w-2.5 h-2.5 transition-transform group-hover:-translate-y-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <div className="h-px w-full bg-white/10" />
                  <button
                    type="button"
                    onClick={() => handleStep(-50)}
                    disabled={Number(customAmount) <= 50}
                    className="group flex h-4 w-6 items-center justify-center bg-black/30 hover:bg-cyan-500/25 active:bg-cyan-500/40 text-zinc-400 hover:text-cyan-300 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Уменьшить на 50 ₽"
                    aria-label="Уменьшить на 50 ₽"
                  >
                    <svg
                      className="w-2.5 h-2.5 transition-transform group-hover:translate-y-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTopUp}
              className="btn-primary w-full text-xs sm:text-sm py-3 px-4 font-bold shadow-lg shadow-cyan-500/20 transition text-center"
            >
              Пополнить {formatRub(parsedAmount)}
            </button>
          </div>

          <p className="mt-2.5 text-[10px] text-zinc-500 text-center">
            Мгновенное зачисление на баланс личного кабинета
          </p>
        </>
      )}
    </div>
  );
};
