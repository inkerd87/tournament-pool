import React, { useState } from 'react';
import { formatRub } from '@/lib/format';
import { getTopUpCheckoutUrl } from '@/lib/payanyway-client';
import { useAuth } from '@/context/AuthContext';

interface TopUpTier {
  amount: number;
  badge: string;
  games: string;
  isPopular?: boolean;
}

const TOPUP_TIERS: TopUpTier[] = [
  {
    amount: 100,
    badge: 'Одиночные соревнования',
    games: 'PUBG Solo, Warzone, Fortnite',
  },
  {
    amount: 1000,
    badge: 'Премиум соревнования',
    games: 'PUBG Solo Premium (вознаграждение 28 000 ₽)',
    isPopular: true,
  },
  {
    amount: 1500,
    badge: 'Командные соревнования 5v5',
    games: 'CS2 5v5, Dota 2 5v5 (вознаграждение 12 000 ₽)',
  },
];

export const WalletTopUpForm: React.FC = () => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(100);

  const handleTopUp = () => {
    localStorage.setItem(
      'nb_pending_topup',
      JSON.stringify({
        amount: selectedAmount,
        email: user?.email || '',
        createdAt: Date.now(),
      })
    );
    window.location.href = getTopUpCheckoutUrl(selectedAmount);
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

      {/* Список доступных фиксированных сумм */}
      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Выберите доступную сумму:
        </p>

        <div className="space-y-2">
          {TOPUP_TIERS.map((tier) => {
            const isSelected = selectedAmount === tier.amount;
            return (
              <button
                key={tier.amount}
                type="button"
                onClick={() => setSelectedAmount(tier.amount)}
                className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                    : 'border-white/10 bg-black/30 text-zinc-300 hover:border-white/20 hover:bg-black/50'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-white">
                      {formatRub(tier.amount)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        tier.isPopular
                          ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300'
                          : 'border border-white/10 bg-white/5 text-zinc-400'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{tier.games}</p>
                </div>

                <div className="pl-3">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400 text-black'
                        : 'border-zinc-600 bg-transparent'
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Кнопка пополнения на выбранную сумму */}
      <div className="mt-4 space-y-2.5">
        <button
          type="button"
          onClick={handleTopUp}
          className="btn-primary w-full text-xs sm:text-sm py-3 px-4 font-bold shadow-lg shadow-cyan-500/20 transition text-center"
        >
          Пополнить кошелек на {formatRub(selectedAmount)}
        </button>

        <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
          🔒 В соответствии с правилами платформы пополнение осуществляется только фиксированными номиналами (100, 1 000, 1 500 ₽).
        </p>
      </div>
    </div>
  );
};
