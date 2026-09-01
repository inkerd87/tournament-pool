import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "Политика конфиденциальности",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/80">
        Документы
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
        Политика конфиденциальности
      </h1>
      <p className="mt-4 leading-relaxed text-zinc-400">
        Настоящая политика описывает, какие данные обрабатывает сервис{" "}
        {SITE_NAME} (далее — «Сервис») и зачем. Документ составлен с учётом
        Федерального закона № 152-ФЗ «О персональных данных». Дата публикации: 26
        августа 2026 г.
      </p>

      <section className="mt-10 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">1. Оператор</h2>
        <p>
          Оператором персональных данных является владелец сервиса {SITE_NAME} (ИНН: 910408161157).
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">2. Какие данные мы собираем</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Аккаунт:</strong> email, никнейм,
            внутренний идентификатор, дата создания, баланс кошелька.
          </li>
          <li>
            <strong className="text-white">Участие в турнире:</strong> ник в игре,
            игровой идентификатор (Steam / Riot / PUBG ID и аналоги), email,
            время оплаты взноса.
          </li>
          <li>
            <strong className="text-white">Платежи:</strong> сумма, номер счёта,
            статус, служебный идентификатор платежа. Данные банковской карты
            Сервис не получает и не хранит — их обрабатывает платёжный провайдер.
          </li>
          <li>
            <strong className="text-white">История матчей:</strong> турнир, место,
            статистика (убийства / смерти / ассисты), сумма приза и взноса.
          </li>
          <li>
            <strong className="text-white">Сессия:</strong> cookie{" "}
            <code className="text-cyan-300">pa_session</code> (вход игрока, до 30
            дней) и при необходимости{" "}
            <code className="text-cyan-300">pa_admin</code> (доступ
            администратора). Cookie httpOnly, не используются для рекламы.
          </li>
        </ul>
        <p>
          Пароль для входа игрока в текущей версии не задаётся: аккаунт
          создаётся или находится по email. Мы не запрашиваем паспорт, телефон и
          не ведём аналитику третьих сторон (метрики, рекламные пиксели).
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">3. Для чего обрабатываем данные</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>создание и ведение аккаунта, вход в личный кабинет;</li>
          <li>регистрация на турнир и идентификация игрока в лобби;</li>
          <li>приём оплаты взноса и пополнения кошелька;</li>
          <li>показ баланса, списка регистраций и истории матчей;</li>
          <li>проведение турнира организатором (доступ в комнату, результаты);</li>
          <li>исполнение требований закона и предотвращение злоупотреблений.</li>
        </ul>
        <p>
          Правовые основания: исполнение договора оказания услуг (участие в
          турнире, кошелёк) и согласие субъекта, выраженное при входе или
          отправке формы регистрации.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">4. Кто ещё видит данные</h2>
        <p>
          Для оплаты используется{" "}
          <a
            href="https://robokassa.ru/"
            className="link-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Robokassa
          </a>
          . Провайдеру передаются сумма, описание платежа и служебные параметры
          счёта. Политика Robokassa:{" "}
          <a
            href="https://robokassa.ru/agreement"
            className="link-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            robokassa.ru/agreement
          </a>
          .
        </p>
        <p>
          Организатор турнира видит данные регистрации, необходимые для запуска
          матча (ник, игровой ID). Мы не продаём персональные данные и не
          передаём их рекламным сетям.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">5. Сколько храним</h2>
        <p>
          Данные аккаунта, регистраций и платежей хранятся, пока аккаунт нужен
          для участия и учёта выплат, либо до удаления по вашему запросу — если
          закон не требует более длительного хранения платёжных и бухгалтерских
          сведений. Сессионные cookie истекают автоматически (игрок — 30 дней,
          администратор — 7 дней) или удаляются при выходе.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">6. Ваши права</h2>
        <p>
          Вы можете запросить сведения об обработке ваших данных, их уточнение,
          ограничение или удаление, а также отозвать согласие, если обработка
          основана на нём. Для этого напишите оператору с email, указанного в
          аккаунте, тему письма: «Персональные данные».
        </p>
        <p>
          Вы вправе обратиться в Роскомнадзор, если считаете, что ваши права
          нарушены.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">7. Безопасность</h2>
        <p>
          Сессия подписывается секретом сервера. Cookie недоступны скриптам
          страницы. Платёжные реквизиты карт обрабатываются только на стороне
          Robokassa. Доступ администратора защищён отдельным паролем и cookie.
        </p>
      </section>

      <section className="mt-8 space-y-3 leading-relaxed text-zinc-300">
        <h2 className="text-xl font-bold text-white">8. Дети</h2>
        <p>
          Оплата взносов предназначена для лиц, обладающих дееспособностью для
          заключения сделки. Если вам нет 18 лет, пользуйтесь Сервисом только с
          согласия законного представителя.
        </p>
      </section>

      <p className="mt-12 text-sm text-zinc-500">
        Как устроены турниры и выплаты — на странице{" "}
        <Link href="/how-it-works" className="link-accent">
          «Как это работает»
        </Link>
        .
      </p>
    </div>
  );
}
