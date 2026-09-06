import React, { useState } from 'react';
import { formatRub } from '@/lib/format';
import { PAYANYWAY_SHOWCASE_URL } from '@/lib/payanyway-client';
import { useAuth } from '@/context/AuthContext';

const AMOUNTS = [100, 300, 500, 1000];

export const WalletTopUpForm: React.FC = () => {
  const { user } = useAuth();
  const [customAmount, setCustomAmount] = useState<string>('100');

  const parsedAmount = Math.max(10, Number(customAmount) || 100);

  const handleStep = (delta: number) => {
    const current = Math.max(0, Number(customAmount) || 0);
    const next = Math.max(50, Math.min(50000, current + delta));
    setCustomAmount(String(next));
  };

  const handleTopUp = () => {
    localStorage.setItem(
      'nb_pending_topup',
      JSON.stringify({
        amount: parsedAmount,
        email: user?.email || '',
        createdAt: Date.now(),
      })
    );
    window.location.href = PAYANYWAY_SHOWCASE_URL;
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

            {/* Стильные стрелки-степпер в стиле NightByte */}
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
    </div>
  );
};
