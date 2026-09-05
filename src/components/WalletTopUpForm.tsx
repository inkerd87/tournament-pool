import React, { useState } from 'react';
import { formatRub } from '@/lib/format';
import { PAYANYWAY_SHOWCASE_URL } from '@/lib/payanyway-client';

const AMOUNTS = [100, 300, 500, 1000];

export const WalletTopUpForm: React.FC = () => {
  const [customAmount, setCustomAmount] = useState<string>('100');

  const handleTopUp = () => {
    window.location.href = PAYANYWAY_SHOWCASE_URL;
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <h3 className="text-base font-bold text-white">Пополнение баланса</h3>
      <p className="mt-1 text-xs text-zinc-400">
        Через СБП или банковскую карту (PayAnyWay / НКО «МОНЕТА»). Без комиссии.
      </p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AMOUNTS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setCustomAmount(String(amt))}
            className={`rounded-lg border py-2 text-xs font-semibold transition ${
              customAmount === String(amt)
                ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                : 'border-white/10 bg-black/20 text-zinc-300 hover:border-white/20'
            }`}
          >
            {formatRub(amt)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <input
          type="number"
          min="50"
          max="50000"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="input-field mt-0 font-mono text-base sm:text-sm py-2.5"
          placeholder="Сумма в рублях"
        />
        <button
          type="button"
          onClick={handleTopUp}
          className="btn-primary whitespace-nowrap text-xs py-3 sm:py-2.5 px-4 font-bold"
        >
          Пополнить через PayAnyWay (100 ₽)
        </button>
      </div>
    </div>
  );
};
