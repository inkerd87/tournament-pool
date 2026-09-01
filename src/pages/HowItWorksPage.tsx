import React from 'react';
import { Link } from 'react-router-dom';
import { ENTRY_FEE_RUB, PRIZE_BY_PLACE, TOTAL_PRIZES_RUB } from '@/lib/constants';
import { formatRub } from '@/lib/format';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Как это работает</h1>
      <p className="mt-3 text-lg text-zinc-400">
        Простая и прозрачная турнирная система: взнос {formatRub(ENTRY_FEE_RUB)} и гарантированные призы за топ-3.
      </p>

      <div className="mt-12 space-y-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">1. Регистрация и взнос</h2>
          <p className="leading-relaxed text-zinc-300">
            Входной взнос в любой регулярный турнир на платформе NightByte составляет фиксированные{' '}
            <strong className="text-white">{formatRub(ENTRY_FEE_RUB)}</strong>.
            Вы можете оплатить участие напрямую через СБП/карту или с баланса личного кабинета.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">2. Получение доступа к лобби</h2>
          <p className="leading-relaxed text-zinc-300">
            После оплаты и набора участников в вашем личном кабинете на странице турнира появятся
            данные для входа в приватную игру: <strong>Room ID</strong> и <strong>Пароль</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Распределение призового фонда</h2>
          <p className="leading-relaxed text-zinc-300">
            Общий призовой фонд турнира составляет{' '}
            <strong className="text-amber-200">{formatRub(TOTAL_PRIZES_RUB)}</strong> и делится между
            лучшими игроками:
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <span className="text-2xl">🥇</span>
              <p className="mt-1 font-bold text-white">1-е место</p>
              <p className="font-mono text-lg font-extrabold text-amber-300">
                {formatRub(PRIZE_BY_PLACE[1])}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <span className="text-2xl">🥈</span>
              <p className="mt-1 font-bold text-white">2-е место</p>
              <p className="font-mono text-lg font-extrabold text-zinc-200">
                {formatRub(PRIZE_BY_PLACE[2])}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <span className="text-2xl">🥉</span>
              <p className="mt-1 font-bold text-white">3-е место</p>
              <p className="font-mono text-lg font-extrabold text-amber-600">
                {formatRub(PRIZE_BY_PLACE[3])}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">4. Честная игра</h2>
          <p className="leading-relaxed text-zinc-300">
            Использование любых сторонних программ (читов, скриптов, макросов) строго запрещено и карается
            пожизненной блокировкой аккаунта без возврата средств.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-white/10">
        <Link to="/tournaments" className="btn-primary">
          Выбрать турнир и начать играть
        </Link>
      </div>
    </div>
  );
};
