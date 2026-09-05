import React, { useState } from 'react';
import { formatRub } from '@/lib/format';
import { PAYANYWAY_SHOWCASE_URL } from '@/lib/payanyway-client';

const AMOUNTS = [100, 300, 500, 1000];

export const WalletTopUpForm: React.FC = () => {
  const [customAmount, setCustomAmount] = useState<string>('100');

  const handleTopUp = () => {
    window.location.href = PAYANYWAY_SHOWCASE_URL;
  };

  const parsedAmount = Math.max(10, Number(customAmount) || 100);

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
        <div className="relative">
          <input
            type="number"
            min="50"
            max="50000"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="input-field mt-0 font-mono text-base sm:text-sm py-2.5 pr-8"
            placeholder="Своя сумма"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
            ₽
          </span>
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
