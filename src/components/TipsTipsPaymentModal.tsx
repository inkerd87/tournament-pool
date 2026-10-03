import React, { useState } from 'react';
import { formatRub } from '@/lib/format';
import {
  TIPSTIPS_URL,
  TIPSTIPS_QR_IMAGE,
  TIPSTIPS_RECIPIENT,
  TipsTipsPayment,
} from '@/lib/tipstips-client';

interface TipsTipsPaymentModalProps {
  payment: TipsTipsPayment;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmitted: (payment: TipsTipsPayment) => void;
}

export const TipsTipsPaymentModal: React.FC<TipsTipsPaymentModalProps> = ({
  payment,
  isOpen,
  onClose,
  onPaymentSubmitted,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(payment.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePaidClick = () => {
    setIsDone(true);
    onPaymentSubmitted(payment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl text-left">
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Закрыть"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {!isDone ? (
          <div>
            {/* Заголовок */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Оплата через tips.tips
                </h3>
                <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
                  СБП · МИР · Карты РФ
                </span>
              </div>
            </div>

            {/* Сумма и получатель */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Сумма к переводу:</span>
                <span className="text-lg font-extrabold font-mono text-white">
                  {formatRub(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Назначение:</span>
                <span className="font-semibold text-cyan-300">
                  {payment.type === 'topup'
                    ? 'Пополнение баланса'
                    : `Участие в ${payment.tournamentTitle || 'соревновании'}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Получатель:</span>
                <span className="font-mono text-zinc-300">{TIPSTIPS_RECIPIENT}</span>
              </div>
            </div>

            {/* Важнейший блок: Код для комментария */}
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Код для поля «Комментарий»:
                </span>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase">
                  Обязательно
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-black/70 border border-amber-500/30 px-3 py-2 text-center font-mono text-lg font-extrabold text-amber-200 tracking-widest selection:bg-amber-500">
                  {payment.code}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-black'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  {copied ? 'Скопировано' : 'Скопировать'}
                </button>
              </div>

              <p className="text-[11px] text-amber-200/90 leading-tight">
                Укажите этот код в поле <strong>«Комментарий»</strong> на странице перевода для моментальной автоматической идентификации платежа.
              </p>
            </div>

            {/* QR-код и прямая ссылка */}
            <div className="mt-4 flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-black/40 text-center">
              <div className="p-2 rounded-xl bg-white shadow-lg">
                <img
                  src={TIPSTIPS_QR_IMAGE}
                  alt="QR-код tips.tips"
                  className="w-36 h-36 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.tips.tips/codes/light-image/482808';
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">
                Отсканируйте камерой смартфона для быстрой оплаты через <strong>СБП</strong>
              </p>

              <div className="mt-3 w-full">
                <a
                  href={TIPSTIPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 px-4 font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-500/20"
                >
                  <span>Перейти к оплате на tips.tips</span>
                  <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Кнопка подтверждения после оплаты */}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handlePaidClick}
                className="w-full rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold py-3 text-xs sm:text-sm transition shadow-md text-center"
              >
                Я оплатил(а) {formatRub(payment.amount)}
              </button>
              <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                После нажатия заявка мгновенно поступит на сверку администратору.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Заявка принята в обработку</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Код перевода: <strong className="text-amber-300 font-mono">{payment.code}</strong> на сумму{' '}
                <strong className="text-white font-mono">{formatRub(payment.amount)}</strong>
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3.5 text-xs text-cyan-200 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Ожидает подтверждения администратором</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Администратор сверяет поступивший перевод в tips.tips. Средства будут начислены на ваш баланс сразу после проверки.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full btn-primary py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-cyan-500/20 transition"
            >
              Закрыть окно
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
