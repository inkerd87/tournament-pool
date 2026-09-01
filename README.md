# NightByte — Турнирная платформа

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Платежи (Robokassa)

1. Подключите магазин в [Robokassa](https://robokassa.ru/) и получите **MerchantLogin**, **Password #1** и **Password #2**.

2. Скопируйте шаблон переменных:

```bash
cp .env.example .env.local
```

3. Заполните `.env.local`:

```
ROBOKASSA_MERCHANT_LOGIN=ваш_логин
ROBOKASSA_PASSWORD1=пароль_1
ROBOKASSA_PASSWORD2=пароль_2
ROBOKASSA_IS_TEST=1
APP_URL=http://localhost:3000
AUTH_SECRET=случайная_строка
```

4. Перезапустите `npm run dev`.

5. **Result URL** (webhook, продакшен): в настройках магазина укажите  
   `https://ваш-домен.ru/api/payments/robokassa/result`  
   Метод: **POST**. Ответ сервера: `OK{InvId}`.

6. **Success / Fail URL** можно оставить пустыми в кабинете — приложение передаёт их при создании платежа (`/payments/return?pending=…`).

Документация: [docs.robokassa.ru](https://docs.robokassa.ru/)

### Сценарии

- **Регистрация на турнир** — редирект на форму Robokassa, после оплаты — регистрация.
- **Пополнение кошелька** — в `/account`, затем можно оплатить взнос с баланса.
