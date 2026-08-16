This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Платежи (СБП через Т-Банк)

1. Подключите интернет-эквайринг в [Т-Бизнес](https://www.tbank.ru/business/help/business-payments/internet-acquiring/how-involve/integrate/) и включите **СБП** в настройках магазина.

2. Скопируйте шаблон переменных:

```bash
cp .env.example .env.local
```

3. Заполните `.env.local`:

```
TBANK_TERMINAL_KEY=ваш_terminal_key
TBANK_PASSWORD=ваш_пароль_терминала
APP_URL=http://localhost:3000
AUTH_SECRET=случайная_строка
```

4. Перезапустите `npm run dev`.

5. **Webhook** (продакшен): в настройках терминала или в запросе `Init` используется  
   `https://ваш-домен.ru/api/payments/tbank/webhook`  
   Ответ сервера на уведомление: `HTTP 200` с телом `OK`.

Документация API: [developer.tbank.ru — СБП](https://developer.tbank.ru/eacq/scenarios/payments/PCI_DSS/sbp/)

### Сценарии

- **Регистрация на турнир** — QR СБП на `/payments/sbp`, после оплаты — регистрация.
- **Пополнение кошелька** — в `/account`, затем можно оплатить взнос с баланса.
