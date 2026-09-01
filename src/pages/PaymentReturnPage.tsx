import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatRub } from '@/lib/format';

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, updateBalance } = useAuth();

  const amountStr = searchParams.get('amount') || searchParams.get('OutSum');
  const amount = amountStr ? parseFloat(amountStr) : 0;

  useEffect(() => {
    if (amount > 0) {
      updateBalance(amount);
    }
  }, [amount]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <div className="surface-card p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">Оплата прошла успешно!</h1>
        {amount > 0 && (
          <p className="mt-2 text-sm text-zinc-400">
            Сумма: <strong className="text-white">{formatRub(amount)}</strong>
          </p>
        )}
        <p className="mt-4 text-xs text-zinc-500">
          Ваш взнос зачислен. Все данные матча доступны в личном кабинете.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to="/account" className="btn-primary">
            Перейти в личный кабинет
          </Link>
          <Link to="/tournaments" className="btn-secondary">
            К турнирам
          </Link>
        </div>
      </div>
    </div>
  );
};
