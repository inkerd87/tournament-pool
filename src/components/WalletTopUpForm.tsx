import React, { useState, useEffect } from 'react';
import { formatRub } from '@/lib/format';
import { PAYANYWAY_SHOWCASE_URL } from '@/lib/payanyway-client';
import { useAuth } from '@/context/AuthContext';

const AMOUNTS = [10, 50, 100, 300, 500, 1000];

export const WalletTopUpForm: React.FC = () => {
  const { user, updateBalance } = useAuth();
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [confirmedPaidAmount, setConfirmedPaidAmount] = useState<string>('10');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCrediting, setIsCrediting] = useState(false);

  const parsedAmount = Math.max(10, Number(customAmount) || 10);

  // Проверяем наличие ожидающего пополнения при монтировании
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nb_pending_topup');
      if (saved) {
        const parsed = JSON.parse(saved);
        const age = Date.now() - (parsed.createdAt || 0);
        if (age < 2 * 60 * 60 * 1000 && parsed.amount > 0) {
          const amt = Number(parsed.amount);
          setPendingAmount(amt);
          setConfirmedPaidAmount(String(amt));
        } else {
          localStorage.removeItem('nb_pending_topup');
        }
      }
    } catch {}
  }, []);

  const handleStep = (delta: number) => {
    const current = Math.max(0, Number(customAmount) || 0);
    const next = Math.max(10, Math.min(50000, current + delta));
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
    setConfirmedPaidAmount(String(parsedAmount));

    // Открываем кассу в новой вкладке, чтобы текущая вкладка сразу была готова к подтверждению
    const opened = window.open(PAYANYWAY_SHOWCASE_URL, '_blank');
    if (!opened) {
      window.location.href = PAYANYWAY_SHOWCASE_URL;
    }
  };

  const handleManualConfirm = async () => {
    const finalAmount = Math.max(1, Number(confirmedPaidAmount) || pendingAmount || 0);
    if (!finalAmount || isCrediting) return;
    setIsCrediting(true);
    try {
      await updateBalance(finalAmount, user?.email);
      localStorage.removeItem('nb_pending_topup');
      setPendingAmount(null);
      setSuccessMessage(`Баланс успешно пополнен на ${formatRub(finalAmount)}!`);
    } catch (e) {
      console.error('Error crediting balance:', e);
    } finally {
      setIsCrediting(false);
    }
  };

  const handleCancelPending = () => {
    localStorage.removeItem('nb_pending_topup');
    setPendingAmount(null);
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
        <div className="mt-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
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
            <span className="font-mono text-xs font-extrabold text-emerald-400">
              {formatRub(Number(confirmedPaidAmount) || pendingAmount)}
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Платёжная страница PayAnyWay открыта в новой вкладке. После оплаты картой или по СБП нажмите кнопку подтверждения:
          </p>

          <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 space-y-1 focus-within:border-emerald-500/50 transition">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-zinc-400 font-medium">Сумма к зачислению:</span>
              <span className="text-[10px] text-zinc-500 font-mono">по чеку</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                min="1"
                max="50000"
                step="1"
                value={confirmedPaidAmount}
                onChange={(e) => setConfirmedPaidAmount(e.target.value)}
                className="w-full bg-transparent font-mono text-base font-bold text-emerald-400 outline-none placeholder:text-zinc-600"
                placeholder={String(pendingAmount)}
              />
              <span className="text-xs font-bold text-emerald-400 select-none font-mono pl-1">
                ₽
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualConfirm}
            disabled={isCrediting || !Number(confirmedPaidAmount)}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-black py-2.5 px-4 font-black text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 text-center"
          >
            {isCrediting
              ? 'Зачисление...'
              : `✓ Зачислить ${formatRub(Number(confirmedPaidAmount) || pendingAmount)} на баланс`}
          </button>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <a
              href={PAYANYWAY_SHOWCASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Открыть форму оплаты ещё раз ↗
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
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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
                min="10"
                max="50000"
                step="10"
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
                    onClick={() => handleStep(10)}
                    className="group flex h-4 w-6 items-center justify-center bg-black/30 hover:bg-cyan-500/25 active:bg-cyan-500/40 text-zinc-400 hover:text-cyan-300 transition-colors"
                    title="Увеличить на 10 ₽"
                    aria-label="Увеличить на 10 ₽"
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
                    onClick={() => handleStep(-10)}
                    disabled={Number(customAmount) <= 10}
                    className="group flex h-4 w-6 items-center justify-center bg-black/30 hover:bg-cyan-500/25 active:bg-cyan-500/40 text-zinc-400 hover:text-cyan-300 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Уменьшить на 10 ₽"
                    aria-label="Уменьшить на 10 ₽"
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

          {/* Быстрое бесплатное пополнение для тестирования платформы без списания средств */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-medium">Тестовый режим:</span>
            <button
              type="button"
              onClick={() => {
                updateBalance(100, user?.email);
                setSuccessMessage('Тестовые 100 ₽ успешно зачислены (0 ₽ к оплате)!');
              }}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1 transition flex items-center gap-1 shadow-sm"
              title="Начислить 100 ₽ для проверки турниров и функционала без списания реальных денег"
            >
              <span>🧪</span> +100 ₽ без списания (тест)
            </button>
          </div>
        </>
      )}
    </div>
  );
};
