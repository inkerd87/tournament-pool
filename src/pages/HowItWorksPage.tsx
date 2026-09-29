import React from 'react';
import { Link } from 'react-router-dom';
import { VK_GROUP_URL } from '@/lib/constants';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Как это работает</h1>
      <p className="mt-3 text-lg text-zinc-400">
        Прозрачная система соревнований: разные игровые форматы, честное судейство и вознаграждение победителям.
      </p>

      <div className="mt-12 space-y-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">1. Оплата услуг по организации соревнований</h2>
          <p className="leading-relaxed text-zinc-300">
            На платформе NightByte проводятся соревнования по дисциплинам CS2, Dota 2, PUBG, PUBG Mobile, Apex Legends, Minecraft, Warzone и Fortnite.
            Участие в соревнованиях предусматривает оплату организационных услуг: судейство соревнований, предоставление игровой платформы, модерация лобби и автоматизированный подбор равных оппонентов.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Тариф за организационные услуги составляет 100 ₽, 200 ₽, 500 ₽, 1 000 ₽ или 1 500 ₽ в зависимости от регламента выбранного соревнования. Данный платёж является оплатой услуг организатора и <strong>категорически не является ставкой, пари или взносом в общий котёл</strong>. Оплатить услуги можно банковской картой РФ, через СБП или с баланса личного кабинета.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-950/15 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h2 className="text-lg sm:text-xl font-bold text-amber-300">2. Правило идентификации: совпадение никнейма</h2>
          </div>
          <p className="leading-relaxed text-zinc-300 text-sm">
            При регистрации на сайте и входе в соревнования действует строгое правило: <strong>ваш игровой никнейм в клиенте игры (CS2, PUBG, PUBG Mobile, Dota 2, Apex Legends, Minecraft, Warzone, Fortnite) обязан в точности совпадать с ником, указанным при регистрации на платформе</strong>.
          </p>
          <p className="leading-relaxed text-zinc-400 text-xs sm:text-sm">
            Судейская коллегия перед стартом соревнований сверяет ники участников в лобби с регистрационным списком платформы. Это необходимо для исключения подмены игроков (ringers), фиксации официальных спортивных итогов и корректного перечисления вознаграждения. При несовпадении никнеймов игрок не допускается к участию в соревнованиях.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Получение доступа к лобби</h2>
          <p className="leading-relaxed text-zinc-300">
            После подтверждения участия и набора группы в вашем личном кабинете на странице соревнования появятся
            данные для входа в приватную игру: <strong>Room ID</strong> и <strong>Пароль</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">4. Вознаграждение победителям</h2>
          <p className="leading-relaxed text-zinc-300">
            Победителей соревнований ждет фиксированное вознаграждение. Вознаграждение учреждается организатором соревнований <strong>исключительно из собственных средств</strong> за спортивные достижения и <strong>не зависит от количества участников или собранных орг. платежей</strong>:
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white text-base">Командные соревнования 5v5 (CS2, Dota 2)</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Две команды по 5 игроков сражаются за победу (оплата орг. услуг — 1 500 ₽ с игрока). Фиксированное вознаграждение победившей команде составляет <strong className="text-amber-300 font-bold">12 000 ₽</strong> (по 2 400 ₽ каждому игроку команды).
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-bold text-white text-base">Королевские битвы (PUBG, PUBG Mobile, Apex Legends, Warzone, Fortnite)</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Соревнования на выбывание (оплата орг. услуг — 100 ₽, 200 ₽, 500 ₽ или 1 000 ₽). Фиксированное вознаграждение от организатора: <strong className="text-amber-300 font-bold">2 200 ₽</strong> в стандартных соревнованиях и <strong className="text-amber-300 font-bold">28 000 ₽</strong> в Премиум-соревнованиях (1-е место — 15 000 ₽, 2-е место — 8 000 ₽, 3-е место — 5 000 ₽).
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 sm:col-span-2 lg:col-span-1">
              <h3 className="font-bold text-white text-base">Minecraft (Hunger Games)</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Minecraft: соревнование по режиму Hunger Games. Турнир рассчитан на фиксированное количество участников — ровно 24 человека. Формат проведения предполагает одну игровую сессию, в которой будет определен один победитель. Условия участия: Организационный взнос составляет <strong className="text-white font-bold">500 рублей</strong>. Победитель получает денежное вознаграждение в размере <strong className="text-amber-300 font-bold">2500 рублей</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-sm text-zinc-300 flex items-start gap-3">
            <span className="text-xl leading-none">⏱</span>
            <div>
              <p className="font-bold text-white">Срок и порядок выплат вознаграждений (до суток)</p>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Выплата гарантированного вознаграждения победителям соревнований осуществляется организатором в срок <strong className="text-white">до 24 часов (до одних суток)</strong> с момента окончания соревнований и фиксации результатов соревнований. Выплата производится в безналичном порядке через Систему быстрых платежей (СБП) или переводом на банковскую карту РФ.
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
            Все соревнования на платформе NightByte являются официальными киберспортивными соревнованиями, в которых результат зависит исключительно от навыков, реакции, стратегии и подготовки участников.
          </p>
          <p className="leading-relaxed text-zinc-400 text-sm">
            Оплата организационных услуг — это фиксированная плата за услуги организатора по судейству, модерации и предоставлению платформы (ст. 779 ГК РФ), а не ставка на исход. Вознаграждение формируется организатором за достижение лучших спортивных результатов (ст. 1055, 1057 ГК РФ) и не формируется из «общего котла». Платформа категорически не проводит азартные игры, тотализаторы, пари или лотереи.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-amber-500/25 bg-amber-950/15 p-6">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold text-lg">🔞</span>
            <h2 className="text-xl font-bold text-amber-300">7. Возрастное ограничение (Строго 18+)</h2>
          </div>
          <p className="leading-relaxed text-zinc-300 text-sm">
            К участию во всех соревнованиях платформы NightByte допускаются исключительно лица, достигшие возраста <strong className="text-white">18 лет</strong> и обладающие полной дееспособностью.
          </p>
          <p className="leading-relaxed text-zinc-400 text-sm">
            При регистрации на соревнование участник подтверждает своё совершеннолетие. Организатор оставляет за собой право запросить подтверждение возраста победителей перед выплатой вознаграждения.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <h2 className="text-xl font-bold text-cyan-300">8. Порядок возврата денежных средств</h2>
          </div>
          <p className="leading-relaxed text-zinc-300 text-sm">
            В случае отмены или невозможности проведения соревнований по вине организатора либо из-за технических сбоев, оплата организационных услуг возвращается Заказчику в 100% полном объеме.
          </p>
          <p className="leading-relaxed text-zinc-400 text-sm">
            Заказчик также вправе отказаться от участия и запросить возврат до момента публикации Room ID и пароля к игровому лобби. Заявления направляются на <a href="mailto:inkerdany@mail.ru" className="text-cyan-400 underline font-mono">inkerdany@mail.ru</a> и рассматриваются до 3 рабочих дней. Возврат осуществляется в безналичном порядке через сервис tips.tips / СБП на карту Заказчика в срок от 1 до 5 рабочих дней.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center gap-4">
        <Link to="/tournaments" className="btn-primary">
          Выбрать соревнование и начать играть
        </Link>
        <a
          href={VK_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[#0077FF]/50 bg-[#0077FF]/15 px-5 py-3 text-sm font-bold text-white transition hover:border-[#0077FF] hover:bg-[#0077FF]/30"
        >
          <svg className="h-4 w-4 fill-[#3b9dff]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.08 14.27h-1.46c-.55 0-.72-.44-1.71-1.43-.86-.83-1.24-.94-1.46-.94-.3 0-.38.08-.38.49v1.31c0 .35-.11.56-1.04.56-1.54 0-3.24-.93-4.44-2.66-1.81-2.54-2.3-4.45-2.3-4.84 0-.21.08-.41.49-.41h1.46c.37 0 .51.17.65.56.72 2.08 1.92 3.9 2.41 3.9.19 0 .27-.09.27-.56V9.97c-.06-.99-.58-1.07-.58-1.42 0-.17.14-.34.37-.34h2.29c.31 0 .42.17.42.53v2.89c0 .31.14.42.23.42.19 0 .34-.11.68-.45 1.05-1.18 1.8-3 1.8-3 .1-.21.27-.41.64-.41h1.46c.44 0 .54.23.44.53-.18.85-1.95 3.35-1.95 3.35-.16.25-.22.36 0 .65.16.21.69.67 1.04 1.08.65.74 1.14 1.36 1.28 1.79.14.42-.08.64-.51.64z" />
          </svg>
          <span>Наше сообщество ВКонтакте →</span>
        </a>
      </div>
    </div>
  );
};
