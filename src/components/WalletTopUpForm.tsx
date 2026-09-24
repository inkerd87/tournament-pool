import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRub } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { TipsTipsPaymentModal } from '@/components/TipsTipsPaymentModal';
import { createTipsTipsPayment, TipsTipsPayment } from '@/lib/tipstips-client';

const QUICK_PRESETS = [100, 300, 500, 1000, 1500, 3000, 5000];

export const WalletTopUpForm: React.FC = () => {
  const { user } = useAuth();
  // Динамическая сумма: по умолчанию 1000 ₽, но пользователь может ввести любую сумму
  const [amount, setAmount] = useState<number>(1000);
  const [rawInput, setRawInput] = useState<string>('1000');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<TipsTipsPayment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setRawInput(val);
    const parsed = parseInt(val, 10);
    setAmount(isNaN(parsed) ? 0 : Math.min(150000, parsed));
    setErrorMessage(null);
  };

  const handleSelectPreset = (preset: number) => {
    setAmount(preset);
    setRawInput(String(preset));
    setErrorMessage(null);
  };

  const handleAddAmount = (delta: number) => {
    const newAmount = Math.min(150000, Math.max(10, (amount || 0) + delta));
    setAmount(newAmount);
    setRawInput(String(newAmount));
    setErrorMessage(null);
  };

  const handleTopUp = async () => {
    if (!amount || amount < 10) {
      setErrorMessage('Минимальная сумма пополнения — 10 ₽');
      return;
    }
    if (amount > 150000) {
      setErrorMessage('Максимальная сумма разового пополнения — 150 000 ₽');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payment = await createTipsTipsPayment({
        amount: amount,
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
        <h3 className="text-base font-bold text-white">Пополнение баланса</h3>
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          СБП / МИР / tips.tips
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        Укажите любую желаемую сумму. Перевод через СБП любого банка или карту РФ в сервисе <strong>tips.tips</strong>.
      </p>

      {/* Уведомление об успешной отправке заявки */}
      {successBanner && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
          ✓ {successBanner}
        </div>
      )}

      {/* Поле ввода произвольной суммы */}
      <div className="mt-5 space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Сумма пополнения (₽):
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            inputMode="numeric"
            value={rawInput}
            onChange={handleInputChange}
            placeholder="Введите любую сумму..."
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 pr-12 text-xl font-mono font-extrabold text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          />
          <span className="absolute right-4 text-lg font-bold text-zinc-400 select-none">
            ₽
          </span>
        </div>
      </div>

      {/* Быстрые кнопки пресетов */}
      <div className="mt-3.5 space-y-2">
        <p className="text-[11px] text-zinc-400 font-medium">Быстрый выбор суммы:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((preset) => {
            const isSelected = amount === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400'
                    : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {formatRub(preset)}
              </button>
            );
          })}
        </div>

        {/* Быстрое добавление к сумме */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] text-zinc-500">Добавить:</span>
          {[100, 500, 1000].map((add) => (
            <button
              key={add}
              type="button"
              onClick={() => handleAddAmount(add)}
              className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              +{add} ₽
            </button>
          ))}
        </div>
      </div>

      {/* Ошибка */}
      {errorMessage && (
        <div className="mt-3.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Кнопка пополнения на динамическую сумму */}
      <div className="mt-5 space-y-2.5">
        <button
          type="button"
          onClick={handleTopUp}
          disabled={isLoading || amount < 10}
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm py-3.5 px-4 font-extrabold shadow-lg shadow-emerald-500/20 transition text-center ${
            isLoading || amount < 10 ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <span>💳</span>
          <span>
            {isLoading
              ? 'Формирование платежа...'
              : `Пополнить баланс на ${formatRub(amount || 0)}`}
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
          🔒 Оплата через защищённый сервис tips.tips (СБП любого банка РФ, МИР, Visa, Mastercard).
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
