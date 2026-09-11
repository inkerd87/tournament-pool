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
          <h2 className="text-xl font-bold text-cyan-300">1. Оплата услуг по организации соревнований</h2>
          <p className="leading-relaxed text-zinc-300">
            На платформе NightByte проводятся соревнования по дисциплинам CS2, Dota 2, PUBG, Warzone и Fortnite.
            Участие в турнире предусматривает оплату организационных услуг: судейство матчей, предоставление игровой платформы, модерация лобби и автоматизированный подбор равных оппонентов.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Тариф за организационные услуги составляет 100 ₽, 1 000 ₽ или 1 500 ₽ в зависимости от регламента выбранного соревнования. Данный платёж является оплатой услуг организатора и <strong>категорически не является ставкой, пари или взносом в общий котёл</strong>. Оплатить услуги можно банковской картой РФ, через СБП или с баланса личного кабинета.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-950/15 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h2 className="text-lg sm:text-xl font-bold text-amber-300">2. Правило идентификации: совпадение никнейма</h2>
          </div>
          <p className="leading-relaxed text-zinc-300 text-sm">
            При регистрации на сайте и входе в игровой матч действует строгое правило: <strong>ваш игровой никнейм в клиенте игры (CS2, PUBG, Dota 2, Warzone, Fortnite) обязан в точности совпадать с ником, указанным при регистрации на платформе</strong>.
          </p>
          <p className="leading-relaxed text-zinc-400 text-xs sm:text-sm">
            Судейская коллегия перед запуском матча сверяет ники участников в лобби с регистрационным списком платформы. Это необходимо для исключения подмены игроков (ringers), фиксации официальных спортивных итогов и корректного перечисления наград. При несовпадении никнеймов игрок не допускается к участию в матче.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Получение доступа к лобби</h2>
          <p className="leading-relaxed text-zinc-300">
            После подтверждения участия и набора группы в вашем личном кабинете на странице турнира появятся
            данные для входа в приватную игру: <strong>Room ID</strong> и <strong>Пароль</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">4. Наградной фонд и вознаграждение победителям</h2>
          <p className="leading-relaxed text-zinc-300">
            Победителей соревнований ждут фиксированные денежные награды. Наградной фонд учреждается организатором турнира <strong>исключительно из собственных средств</strong> за спортивные достижения и <strong>не зависит от количества участников или собранных орг. платежей</strong>:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white text-base">Командные матчи 5v5 (CS2, Dota 2)</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Две команды по 5 игроков сражаются за победу. Фиксированное вознаграждение победившей команде составляет <strong className="text-amber-300 font-bold">12 000 ₽</strong> (по 2 400 ₽ каждому игроку команды).
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white text-base">Королевские битвы (PUBG, Warzone, Fortnite)</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Одиночные соревнования на выбывание. Фиксированный наградной фонд от организатора: 2 200 ₽ в стандартных турнирах и 28 000 ₽ в Премиум-матчах (1-е место — 15 000 ₽, 2-е место — 8 000 ₽, 3-е место — 5 000 ₽).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-sm text-zinc-300 flex items-start gap-3">
            <span className="text-xl leading-none">⏱</span>
            <div>
              <p className="font-bold text-white">Срок и порядок выплат вознаграждений (до суток)</p>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Выплата гарантированных денежных наград победителям соревнований осуществляется организатором в срок <strong className="text-white">до 24 часов (до одних суток)</strong> с момента окончания матча и фиксации результатов турнира. Выплата производится в безналичном порядке через Систему быстрых платежей (СБП) или переводом на банковскую карту РФ.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">5. Честная игра</h2>
          <p className="leading-relaxed text-zinc-300">
            Использование любых сторонних программ (читов, скриптов, макросов) строго запрещено и карается
            пожизненной блокировкой аккаунта без возврата средств.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6">
          <h2 className="text-xl font-bold text-cyan-300">6. Спортивный статус (Skill-Based) и разделение понятий</h2>
          <p className="leading-relaxed text-zinc-300 text-sm">
            Все турниры на платформе NightByte являются официальными киберспортивными соревнованиями, в которых результат зависит исключительно от навыков, реакции, стратегии и подготовки участников.
          </p>
          <p className="leading-relaxed text-zinc-400 text-sm">
            Оплата организационных услуг — это фиксированная плата за услуги организатора по судейству, модерации и предоставлению платформы (ст. 779 ГК РФ), а не ставка на исход. Наградной фонд формируется организатором за достижение лучших спортивных результатов (ст. 1055, 1057 ГК РФ) и не формируется из «общего котла». Платформа категорически не проводит азартные игры, тотализаторы, пари или лотереи.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-amber-500/25 bg-amber-950/15 p-6">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold text-lg">🔞</span>
            <h2 className="text-xl font-bold text-amber-300">7. Возрастное ограничение (Строго 18+)</h2>
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
