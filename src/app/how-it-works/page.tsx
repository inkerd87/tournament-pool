import Link from "next/link";
import {
  ENTRY_FEE_RUB,
  PRIZE_BY_PLACE,
  SITE_NAME,
  TOTAL_PRIZES_RUB,
} from "@/lib/constants";
import { formatRub } from "@/lib/format";

export const metadata = {
  title: "Как это работает",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/80">
        Правила
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
        Как это работает
      </h1>
      <p className="mt-4 leading-relaxed text-zinc-400">
        {SITE_NAME} — площадка любительских киберспортивных турниров. Форматы матчей и взносы различаются в зависимости от дисциплины, а победителей ждут приятные денежные призы.
      </p>

      <h2 className="mt-12 text-xl font-bold text-white">Путь игрока</h2>
      <ol className="mt-5 list-decimal space-y-5 pl-5 leading-relaxed text-zinc-300">
        <li>
          Выбираете турнир на странице{" "}
          <Link href="/tournaments" className="link-accent">
            Турниры
          </Link>{" "}
          — CS2, Dota 2, PUBG, Warzone, Fortnite. У каждого события свой формат, взнос, лимит
          мест и время старта.
        </li>
        <li>
          Входите по email и нику или сразу
          заполняете форму на странице турнира: ник, игровой ID и контактные данные.
        </li>
        <li>
          Оплачиваете организационный взнос. Способы: карта РФ / СБП либо списание с баланса кошелька в личном кабинете.
        </li>
        <li>
          После успешной оплаты место в турнире закреплено. В{" "}
          <Link href="/account" className="link-accent">
            кабинете
          </Link>{" "}
          появляются ваши регистрации. Когда группа набрана, организатор открывает комнату — появляется
          Room ID, пароль и инструкция.
        </li>
        <li>
          Играете с того аккаунта, который указали при регистрации. Победители соревнований получают гарантированные выплаты.
        </li>
      </ol>

      <h2 className="mt-12 text-xl font-bold text-white">Взносы и призы</h2>
      <ol className="mt-5 list-decimal space-y-5 pl-5 leading-relaxed text-zinc-300">
        <li>
          Размер организационного взноса зависит от дисциплины и формата состязания (например, 1 500 ₽ за участие в командном матче 5v5 по CS2 или Dota 2, либо 100 ₽ в соло-матче PUBG).
        </li>
        <li>
          Призовой фонд распределяется в зависимости от формата: в матчах 5 на 5 победившая команда забирает 12 000 ₽ (по 2 400 ₽ каждому игроку), а в королевских битвах награды получают топ-игроки высадки.
        </li>
        <li>
          Результат матча зависит исключительно от навыков участников (skill-based). Выплата наград победителям осуществляется на банковскую карту или через СБП в срок до 24 часов (до суток).
        </li>
      </ol>

      <h2 className="mt-12 text-xl font-bold text-white">Кошелёк</h2>
      <p className="mt-4 leading-relaxed text-zinc-300">
        В кабинете можно пополнить баланс через Robokassa (от 100 ₽) и затем
        оплачивать взносы без повторного ввода карты. Деньги на кошельке — это
        предоплата услуг Сервиса, а не банковский вклад. Вывод призов на карту
        в текущей версии оформляется организатором вручную после турнира.
      </p>

      <h2 className="mt-12 text-xl font-bold text-white">Организатор</h2>
      <p className="mt-4 leading-relaxed text-zinc-300">
        Администратор видит заявки, запускает лобби и публикует данные матча.
        Игрокам не нужно искать комнату в чатах: доступ появляется у тех, кто
        оплатил участие.
      </p>

      <div className="mt-12 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-100/90">
        <h2 className="font-bold text-amber-50">Важно для запуска в РФ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-amber-100/75">
          <li>
            Приём денег от физлиц требует эквайринга (Robokassa и т.п.) и
            договора с юрлицом или ИП.
          </li>
          <li>
            Турниры со взносом и денежными призами могут попадать под
            регулирование азартных игр / лотерей — нужна консультация юриста.
          </li>
          <li>
            Ключи Robokassa задаются в{" "}
            <code className="text-amber-200">.env.local</code>. Политика
            обработки данных — на странице{" "}
            <Link href="/privacy" className="text-amber-200 underline">
              конфиденциальности
            </Link>
            .
          </li>
        </ul>
      </div>
    </div>
  );
}
