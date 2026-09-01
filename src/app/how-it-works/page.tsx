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
        {SITE_NAME} — площадка любительских турниров. Взнос за участие составляет {formatRub(ENTRY_FEE_RUB)},
        денежные призы выплачиваются победителям за места 1–3.
      </p>

      <h2 className="mt-12 text-xl font-bold text-white">Путь игрока</h2>
      <ol className="mt-5 list-decimal space-y-5 pl-5 leading-relaxed text-zinc-300">
        <li>
          Выбираете турнир на странице{" "}
          <Link href="/tournaments" className="link-accent">
            Турниры
          </Link>{" "}
          — CS2, Dota 2, PUBG, Valorant. У каждого события свой формат, лимит
          мест и время старта.
        </li>
        <li>
          Входите по email и нику (пароль в демо-режиме не нужен) или сразу
          заполняете форму на странице турнира: ник, игровой ID и email. Так
          появляется аккаунт и кабинет с балансом.
        </li>
        <li>
          Платите взнос{" "}
          <strong className="text-white">{formatRub(ENTRY_FEE_RUB)}</strong>. Два
          способа: карта / СБП через Robokassa либо списание с кошелька, если
          вы уже пополнили баланс в кабинете.
        </li>
        <li>
          После успешной оплаты место в турнире закреплено. В{" "}
          <Link href="/account" className="link-accent">
            кабинете
          </Link>{" "}
          появляются ваши регистрации. Когда организатор откроет комнату —
          Room ID, пароль и инструкция (для кастомных матчей, например PUBG).
        </li>
        <li>
          Играете с того аккаунта, который указали при регистрации. Итоги и
          статистика попадают в историю матчей; призовые места 1–3 получают
          фиксированные выплаты.
        </li>
      </ol>

      <h2 className="mt-12 text-xl font-bold text-white">Взносы и призы</h2>
      <ol className="mt-5 list-decimal space-y-5 pl-5 leading-relaxed text-zinc-300">
        <li>
          Взнос за участие в турнире:{" "}
          <strong className="font-mono text-cyan-400">{formatRub(ENTRY_FEE_RUB)}</strong> с игрока.
        </li>
        <li>
          Призовой фонд распределяется за места 1–3:{" "}
          <strong className="text-amber-200/90">{formatRub(PRIZE_BY_PLACE[1])}</strong> (1 место),{" "}
          <strong className="text-amber-200/90">{formatRub(PRIZE_BY_PLACE[2])}</strong> (2 место),{" "}
          <strong className="text-amber-200/90">{formatRub(PRIZE_BY_PLACE[3])}</strong> (3 место)
          — общий призовой фонд составляет {formatRub(TOTAL_PRIZES_RUB)}.
        </li>
        <li>
          Результат матча зависит исключительно от навыков игроков. Призовые выплаты производятся по итогам турнира.
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
