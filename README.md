This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Платежи (ЮKassa)

1. Скопируйте шаблон переменных окружения:

```bash
cp .env.example .env.local
```

2. В [личном кабинете ЮKassa](https://yookassa.ru/my/merchant/integration/api-keys) создайте магазин (для разработки включите **тестовый режим**) и скопируйте `shopId` и секретный ключ в `.env.local`:

```
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_секретный_ключ
APP_URL=http://localhost:3000
AUTH_SECRET=случайная_строка
```

3. Перезапустите `npm run dev`.

4. **Webhook** (для продакшена): в настройках магазина укажите URL  
   `https://ваш-домен.ru/api/payments/yookassa/webhook`  
   и события `payment.succeeded`, `payment.waiting_for_capture`.  
   Локально webhook не обязателен — после оплаты пользователь возвращается на `/payments/return`, где статус подтверждается автоматически.

### Сценарии оплаты

- **Регистрация на турнир** — редирект на страницу ЮKassa, после успеха — регистрация в турнире.
- **Пополнение кошелька** — в личном кабинете (`/account`), затем оплата взноса с баланса.
