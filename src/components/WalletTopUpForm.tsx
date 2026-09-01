import React, { useState } from 'react';
import { formatRub } from '@/lib/format';
import { createRobokassaCheckoutUrl } from '@/lib/robokassa-client';

const AMOUNTS = [100, 300, 500, 1000];

export const WalletTopUpForm: React.FC = () => {
  const [customAmount, setCustomAmount] = useState<string>('300');

  const handleTopUp = (amount: number) => {
    if (amount < 10) return;
    const checkoutUrl = createRobokassaCheckoutUrl({
      amountRub: amount,
      description: 'Пополнение кошелька NightByte',
    });
    window.location.href = checkoutUrl;
  };

  return (
    <div className="surface-card p-6">
      <h3 className="text-base font-bold text-white">Пополнение баланса</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Через СБП или банковскую карту (Robokassa). Без комиссии.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2">
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

      <div className="mt-4 flex gap-3">
        <input
          type="number"
          min="50"
          max="50000"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="input-field mt-0 font-mono text-sm"
          placeholder="Сумма в рублях"
        />
        <button
          type="button"
          onClick={() => handleTopUp(Number(customAmount))}
          className="btn-primary whitespace-nowrap text-xs px-4"
        >
          Пополнить
        </button>
      </div>
    </div>
  );
};
