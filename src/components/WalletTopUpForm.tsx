import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRub } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { TipsTipsPaymentModal } from '@/components/TipsTipsPaymentModal';
import { createTipsTipsPayment, TipsTipsPayment } from '@/lib/tipstips-client';

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
    badge: 'Премиум Solo',
    games: 'PUBG Solo Premium',
  },
  {
    amount: 1500,
    badge: 'Командные соревнования',
    games: 'CS2 5v5, Dota 2 Battle Cup',
    isPopular: true,
  },
];

export const WalletTopUpForm: React.FC = () => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(1500);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<TipsTipsPayment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleTopUp = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payment = await createTipsTipsPayment({
        amount: selectedAmount,
        type: 'topup',
        userId: user?.id,
        email: user?.email || '',
        phone: user?.phone || '',
        nickname: user?.nickname || user?.email || 'Игрок',
      });

      setActivePayment(payment);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('tips.tips top-up error:', err);
      setErrorMessage(err.message || 'Ошибка создания платежа. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmitted = (payment: TipsTipsPayment) => {
    setSuccessBanner(
      `Заявка ${payment.code} на сумму ${formatRub(payment.amount)} принята в обработку! Администратор сверит перевод в tips.tips.`
    );
  };

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Предоплата услуг платформы</h3>
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
          СБП / МИР / tips.tips
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        Моментальный перевод через СБП или любую карту РФ через сервис <strong>tips.tips</strong> без банковских комиссий и отказов.
      </p>

      {/* Сообщение об успешном создании заявки */}
      {successBanner && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
          ✓ {successBanner}
        </div>
      )}

      {/* Список доступных фиксированных сумм */}
      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Выберите пакет организационных услуг:
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
                    ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
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
                        ? 'border-emerald-400 bg-emerald-400 text-black'
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

      {/* Ошибка */}
      {errorMessage && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Кнопка пополнения на выбранную сумму */}
      <div className="mt-4 space-y-2.5">
        <button
          type="button"
          onClick={handleTopUp}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm py-3 px-4 font-extrabold shadow-lg shadow-emerald-500/20 transition text-center ${
            isLoading ? 'opacity-70 cursor-wait' : ''
          }`}
        >
          <span>💳</span>
          <span>
            {isLoading
              ? 'Формирование платежа...'
              : `Пополнить баланс на ${formatRub(selectedAmount)} через tips.tips`}
          </span>
        </button>

        <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
          Нажимая кнопку, вы принимаете условия{' '}
          <Link to="/offer" target="_blank" className="text-cyan-400 hover:underline">
            Публичной оферты
          </Link>{' '}
          и соглашаетесь с{' '}
          <Link to="/privacy" target="_blank" className="text-cyan-400 hover:underline">
            Политикой конфиденциальности
          </Link>
          .
        </p>

        <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
          🔒 Оплата услуг по организации соревнований через безопасный перевод tips.tips (СБП, МИР, Visa, Mastercard).
        </p>
      </div>

      {/* Модальное окно оплаты */}
      {activePayment && (
        <TipsTipsPaymentModal
          payment={activePayment}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPaymentSubmitted={handlePaymentSubmitted}
        />
      )}
    </div>
  );
};
