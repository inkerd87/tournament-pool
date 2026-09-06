import React from 'react';
import { Link } from 'react-router-dom';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Как это работает</h1>
      <p className="mt-3 text-lg text-zinc-400">
        Прозрачная система соревнований: разные игровые форматы, честное судейство и приятные денежные призы победителям.
      </p>

      <div className="mt-12 space-y-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">1. Регистрация и взносы</h2>
          <p className="leading-relaxed text-zinc-300">
            На платформе NightByte проводятся соревнования по дисциплинам CS2, Dota 2, PUBG, Warzone и Fortnite.
            Так как форматы матчей и число игроков разные, размер организационного взноса также различается в зависимости от выбранного турнира.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Например, в командных битвах 5 на 5 (CS2 и Dota 2) взнос составляет 1 500 ₽ с игрока, а в одиночных королевских битвах PUBG — 100 ₽. Актуальный размер взноса и регламент всегда указаны в карточке каждого турнира. Оплатить участие можно банковской картой РФ, через СБП или напрямую с баланса личного кабинета.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">2. Получение доступа к лобби</h2>
          <p className="leading-relaxed text-zinc-300">
            После подтверждения участия и набора группы в вашем личном кабинете на странице турнира появятся
            данные для входа в приватную игру: <strong>Room ID</strong> и <strong>Пароль</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Призовой фонд и награды</h2>
          <p className="leading-relaxed text-zinc-300">
            Победителей соревнований ждут приятные денежные призы. Призовой фонд формируется индивидуально под формат каждого турнира:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white text-base">Командные матчи 5v5 (CS2, Dota 2)</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Две команды по 5 игроков сражаются за победу. Команда-победитель забирает приз <strong className="text-amber-300 font-bold">12 000 ₽</strong> (по 2 400 ₽ на каждого игрока команды).
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white text-base">Королевские битвы (PUBG, Warzone, Fortnite)</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Одиночные высадки и турниры на выживание. Призовой фонд распределяется среди сильнейших участников, показавших лучший результат в матче.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-sm text-zinc-300 flex items-start gap-3">
            <span className="text-xl leading-none">⏱</span>
            <div>
              <p className="font-bold text-white">Срок и порядок призовых выплат (до суток)</p>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Выплата гарантированных призов победителям соревнований осуществляется организатором в срок <strong className="text-white">до 24 часов (до одних суток)</strong> с момента окончания матча и фиксации результатов турнира. Выплата производится в безналичном порядке через Систему быстрых платежей (СБП) или переводом на банковскую карту РФ.
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

        <section className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6">
          <h2 className="text-xl font-bold text-cyan-300">5. Спортивный статус (Skill-Based)</h2>
          <p className="leading-relaxed text-zinc-300 text-sm">
            Все турниры на платформе NightByte являются официальными киберспортивными соревнованиями, в которых результат зависит исключительно от навыков, реакции, стратегии и подготовки участников.
          </p>
          <p className="leading-relaxed text-zinc-400 text-sm">
            Организационный взнос — это фиксированная плата за организационные услуги и доступ к инфраструктуре матча, а не ставка на исход. Платформа категорически не проводит азартные игры, пари или лотереи: призовой фонд формируется организатором за достижение лучших спортивных результатов.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-amber-500/25 bg-amber-950/15 p-6">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold text-lg">🔞</span>
            <h2 className="text-xl font-bold text-amber-300">6. Возрастное ограничение (Строго 18+)</h2>
          </div>
          <p className="leading-relaxed text-zinc-300 text-sm">
            К участию во всех турнирах платформы NightByte допускаются исключительно лица, достигшие возраста <strong className="text-white">18 лет</strong> и обладающие полной дееспособностью.
          </p>
          <p className="leading-relaxed text-zinc-400 text-sm">
            При регистрации на турнир участник подтверждает своё совершеннолетие. Организатор оставляет за собой право запросить подтверждение возраста победителей перед вручением наград.
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
