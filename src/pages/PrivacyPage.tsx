import React from 'react';
import { SITE_NAME } from '@/lib/constants';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white">Политика конфиденциальности</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Оператор платформы: Самозанятый / ИП, ИНН: <strong>910408161157</strong>.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300">
        <p>
          Настоящая Политика обработки персональных данных составлена в соответствии с требованиями
          Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок
          обработки данных на сайте {SITE_NAME}.
        </p>

        <h2 className="text-base font-bold text-white">1. Собираемые данные</h2>
        <p>
          Для участия в турнирах и проведения выплат мы обрабатываем: адрес электронной почты,
          игровой никнейм, игровой идентификатор (Steam ID, Riot ID, PUBG ID) и информацию о платежах.
        </p>

        <h2 className="text-base font-bold text-white">2. Цели обработки</h2>
        <p>
          Персональные данные используются исключительно для регистрации на турниры, обеспечения доступа
          к игровым комнатам, начисления и выплаты призовых средств.
        </p>

        <h2 className="text-base font-bold text-white">3. Безопасность и платежи</h2>
        <p>
          Все платежи проводятся через защищенный платежный шлюз Robokassa (АО «КИВИ Банк» / партнеры).
          Платформа {SITE_NAME} не хранит полные номера банковских карт пользователей.
        </p>
      </div>
    </div>
  );
};
