import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const SUPABASE_URL = 'https://qblybjpioynwgheqhxyo.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

// Настройки интеграции ЮKassa (ООО НКО «ЮМани»)
const YOOKASSA_SHOP_ID = (process.env.YOOKASSA_SHOP_ID || '').trim();
const YOOKASSA_SECRET_KEY = (process.env.YOOKASSA_SECRET_KEY || '').trim();
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        resolve('');
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}

function parseParams(bodyStr, searchParams) {
  const combined = {};
  for (const [k, v] of searchParams.entries()) {
    combined[k] = v;
  }
  if (bodyStr) {
    try {
      const parsedUrl = new URLSearchParams(bodyStr);
      for (const [k, v] of parsedUrl.entries()) {
        combined[k] = v;
      }
    } catch {}
    try {
      const json = JSON.parse(bodyStr);
      if (typeof json === 'object' && json !== null) {
        Object.assign(combined, json);
      }
    } catch {}
  }
  return combined;
}

async function handlePayAnyWayWebhook(req, res, searchParams, bodyStr) {
  const params = parseParams(bodyStr, searchParams);
  const timestamp = new Date().toISOString();

  // Extract amount
  const rawAmount =
    params.MNT_AMOUNT ||
    params.mnt_amount ||
    params.amount ||
    params.AMOUNT ||
    params.sum ||
    params.SUM ||
    params.OutSum ||
    '0';
  const amount = parseFloat(String(rawAmount).replace(',', '.').trim());

  // Extract payer email / identifier
  const rawEmail = (
    params.MNT_SUBSCRIBER_ID ||
    params.mnt_subscriber_id ||
    params.email ||
    params.EMAIL ||
    params.MNT_USER ||
    params.payer_email ||
    params.client_email ||
    ''
  ).trim();

  // Extract operation ID
  const opId = (
    params.MNT_OPERATION_ID ||
    params.mnt_operation_id ||
    params.MNT_TRANSACTION_ID ||
    params.mnt_transaction_id ||
    ''
  ).trim();

  const logLine = `[${timestamp}] ${req.method} ${req.url}\n` +
    `PARAMS: ${JSON.stringify(params)}\n` +
    `AMOUNT: ${amount} | EMAIL: ${rawEmail} | OP_ID: ${opId}\n\n`;

  try {
    fs.appendFileSync(path.join(__dirname, 'payanyway.log'), logLine);
  } catch (e) {
    console.error('Log write error:', e);
  }

  // Handle PayAnyWay CHECK command
  if (params.MNT_COMMAND === 'CHECK') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('SUCCESS');
  }

  // Deduplication check
  if (opId) {
    const processedFile = path.join(__dirname, 'processed_ops.txt');
    let processed = '';
    try {
      if (fs.existsSync(processedFile)) {
        processed = fs.readFileSync(processedFile, 'utf8');
      }
    } catch {}

    if (processed.includes(opId)) {
      console.log(`[PayAnyWay] OpID ${opId} already processed`);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('SUCCESS');
    }

    try {
      fs.appendFileSync(processedFile, opId + '\n');
    } catch {}
  }

  // Update Supabase user balance
  if (amount > 0 && rawEmail) {
    const cleanEmail = rawEmail.toLowerCase();
    const isEmail = cleanEmail.includes('@');

    const filterParam = isEmail
      ? `email=ilike.${encodeURIComponent(cleanEmail)}`
      : `phone=ilike.*${encodeURIComponent(cleanEmail.replace(/[^0-9]/g, ''))}*`;

    try {
      const userRes = await fetch(`${SUPABASE_URL}/users?${filterParam}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      const users = await userRes.json();
      if (Array.isArray(users) && users.length > 0 && users[0].id) {
        const user = users[0];
        const currBal = Number(user.balance_rub) || 0;
        const newBal = currBal + amount;

        await fetch(`${SUPABASE_URL}/users?id=eq.${encodeURIComponent(user.id)}`, {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ balance_rub: newBal }),
        });

        const updateLog = `[${new Date().toISOString()}] SUPABASE UPDATED: ${cleanEmail} +${amount} => ${newBal} RUB\n`;
        fs.appendFileSync(path.join(__dirname, 'payanyway.log'), updateLog);
        console.log(updateLog);
      } else {
        const insertPayload = {
          nickname: 'Player',
          balance_rub: amount,
        };
        if (isEmail) {
          insertPayload.email = cleanEmail;
        } else {
          insertPayload.email = `${cleanEmail}@nightbyte.local`;
          insertPayload.phone = cleanEmail;
        }

        await fetch(`${SUPABASE_URL}/users`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(insertPayload),
        });

        const insertLog = `[${new Date().toISOString()}] SUPABASE USER CREATED: ${cleanEmail} balance=${amount} RUB\n`;
        fs.appendFileSync(path.join(__dirname, 'payanyway.log'), insertLog);
        console.log(insertLog);
      }
    } catch (err) {
      console.error('Supabase update error:', err);
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('SUCCESS');
}

function generateUUID() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function handleCreateYooKassaPayment(req, res, bodyStr) {
  let body = {};
  try {
    body = JSON.parse(bodyStr);
  } catch {}

  const amount = parseFloat(body.amount) || 100;
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const tournamentId = (body.tournamentId || '').trim();
  const tournamentTitle = (body.tournamentTitle || '').trim();
  const nickname = (body.nickname || '').trim();
  const gameAccount = (body.gameAccount || '').trim();
  const type = body.type || 'topup';
  const description = body.description || (
    type === 'registration'
      ? `Оплата орг. услуг: ${tournamentTitle || tournamentId} (${amount} ₽)`
      : `Пополнение баланса NightByte (${amount} ₽)`
  );
  const returnUrl = body.returnUrl || 'https://nightbyteonline.ru/payment/return';

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [YooKassa] Create payment request: ${amount} RUB, email: ${email}, type: ${type}`);

  // Если боевые ключи ЮKassa заданы в окружении - обращаемся к официальному API v3 ЮKassa
  if (YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY) {
    try {
      const idempotenceKey = generateUUID();
      const authHeader = 'Basic ' + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');

      const yooPayload = {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        description: description.substring(0, 128),
        metadata: {
          email,
          phone,
          tournamentId,
          tournamentTitle,
          nickname,
          gameAccount,
          type,
        },
      };

      const yooRes = await fetch(YOOKASSA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotence-Key': idempotenceKey,
          'Authorization': authHeader,
        },
        body: JSON.stringify(yooPayload),
      });

      const yooData = await yooRes.json();

      if (yooRes.ok && yooData?.confirmation?.confirmation_url) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          confirmationUrl: yooData.confirmation.confirmation_url,
          paymentId: yooData.id,
        }));
      } else {
        console.error('[YooKassa] API error response:', yooData);
      }
    } catch (err) {
      console.error('[YooKassa] API request error:', err);
    }
  }

  // Если ключи ЮKassa еще не прописаны — формируем тестовый редирект для проверки работы
  const demoId = 'test_' + Date.now();
  const demoUrl = `${returnUrl}?orderId=${demoId}&amount=${amount}&status=success&gateway=yookassa&tId=${encodeURIComponent(tournamentId)}&nick=${encodeURIComponent(nickname)}&acc=${encodeURIComponent(gameAccount)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    success: true,
    confirmationUrl: demoUrl,
    paymentId: demoId,
    isTestMode: true,
  }));
}

async function handleYooKassaWebhook(req, res, bodyStr) {
  const timestamp = new Date().toISOString();
  let notification = null;

  try {
    notification = JSON.parse(bodyStr);
  } catch (e) {
    console.error('[YooKassa] Webhook JSON parse error:', e);
  }

  const logEntry = `[${timestamp}] ${req.method} ${req.url}\nPAYLOAD: ${bodyStr}\n\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'yookassa.log'), logEntry);
  } catch {}

  if (!notification || !notification.object) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ status: 'ignored' }));
  }

  const event = notification.event;
  const paymentObj = notification.object;

  if (event !== 'payment.succeeded' || paymentObj.status !== 'succeeded') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ status: 'ignored_event', event }));
  }

  const paymentId = paymentObj.id || '';
  const amount = parseFloat(paymentObj.amount?.value || '0');
  const metadata = paymentObj.metadata || {};
  const rawEmail = (metadata.email || metadata.client_email || '').trim();
  const tournamentId = (metadata.tournamentId || '').trim();
  const nickname = (metadata.nickname || 'Player').trim();
  const gameAccount = (metadata.gameAccount || '').trim();
  const phone = (metadata.phone || '').trim();

  // Deduplication
  if (paymentId) {
    const processedFile = path.join(__dirname, 'processed_ops.txt');
    let processed = '';
    try {
      if (fs.existsSync(processedFile)) {
        processed = fs.readFileSync(processedFile, 'utf8');
      }
    } catch {}

    if (processed.includes(paymentId)) {
      console.log(`[YooKassa] Payment ID ${paymentId} already processed, skipping`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ status: 'already_processed' }));
    }

    try {
      fs.appendFileSync(processedFile, paymentId + '\n');
    } catch {}
  }

  // Обновление баланса или регистрация пользователя в Supabase
  if (amount > 0 && rawEmail) {
    const cleanEmail = rawEmail.toLowerCase();
    const isEmail = cleanEmail.includes('@');
    const filterParam = isEmail
      ? `email=ilike.${encodeURIComponent(cleanEmail)}`
      : `phone=ilike.*${encodeURIComponent(cleanEmail.replace(/[^0-9]/g, ''))}*`;

    try {
      const userRes = await fetch(`${SUPABASE_URL}/users?${filterParam}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      const users = await userRes.json();
      let userId = null;

      if (Array.isArray(users) && users.length > 0 && users[0].id) {
        const user = users[0];
        userId = user.id;

        // При обычном пополнении кошелька увеличиваем balance_rub
        if (!tournamentId) {
          const currBal = Number(user.balance_rub) || 0;
          const newBal = currBal + amount;
          await fetch(`${SUPABASE_URL}/users?id=eq.${encodeURIComponent(userId)}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ balance_rub: newBal }),
          });
          const updateLog = `[${timestamp}] [YooKassa] SUPABASE BALANCE UPDATED: ${cleanEmail} +${amount} => ${newBal} RUB\n`;
          fs.appendFileSync(path.join(__dirname, 'yookassa.log'), updateLog);
          console.log(updateLog);
        }
      } else {
        const insertPayload = {
          nickname: nickname || 'Player',
          balance_rub: tournamentId ? 0 : amount,
        };
        if (isEmail) {
          insertPayload.email = cleanEmail;
        } else {
          insertPayload.email = `${cleanEmail}@nightbyte.local`;
          insertPayload.phone = cleanEmail;
        }

        const createRes = await fetch(`${SUPABASE_URL}/users`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(insertPayload),
        });
        const createdUsers = await createRes.json();
        if (Array.isArray(createdUsers) && createdUsers[0]?.id) {
          userId = createdUsers[0].id;
        }
        const insertLog = `[${timestamp}] [YooKassa] SUPABASE USER CREATED: ${cleanEmail}\n`;
        fs.appendFileSync(path.join(__dirname, 'yookassa.log'), insertLog);
        console.log(insertLog);
      }

      // При прямой оплате соревнования сохраняем подтвержденную регистрацию
      if (tournamentId) {
        const regPayload = {
          tournament_id: tournamentId,
          email: cleanEmail,
          nickname: nickname || 'Player',
          game_account: gameAccount || '',
          phone: phone || '',
          payment_status: 'paid',
          payment_id: paymentId,
        };
        await fetch(`${SUPABASE_URL}/registrations`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(regPayload),
        });
        const regLog = `[${timestamp}] [YooKassa] SUPABASE REGISTRATION SAVED: ${cleanEmail} -> ${tournamentId}\n`;
        fs.appendFileSync(path.join(__dirname, 'yookassa.log'), regLog);
        console.log(regLog);
      }
    } catch (err) {
      console.error('[YooKassa] Supabase sync error:', err);
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ status: 'ok' }));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Health check endpoint
  if (pathname === '/api/health' || pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      ok: true,
      service: 'nightbyte',
      node: process.version,
      port: PORT,
      uptime: process.uptime(),
      time: new Date().toISOString(),
    }));
  }

  // YooKassa: создание платежа
  if (pathname === '/api/yookassa/create' || pathname === '/api/create-yookassa-payment') {
    const bodyStr = await readBody(req);
    return handleCreateYooKassaPayment(req, res, bodyStr);
  }

  // YooKassa: вебхук уведомлений о платежах
  if (
    pathname === '/yookassa-notification' ||
    pathname === '/yookassa-notification.php' ||
    pathname === '/api/yookassa-webhook'
  ) {
    const bodyStr = await readBody(req);
    return handleYooKassaWebhook(req, res, bodyStr);
  }

  // PayAnyWay notification webhook
  if (
    pathname === '/payanyway-notification.php' ||
    pathname === '/payanyway-notification' ||
    pathname === '/api/payanyway-webhook' ||
    pathname === '/freekassa-notification.php' ||
    pathname === '/freekassa-result.php'
  ) {
    const bodyStr = await readBody(req);
    return handlePayAnyWayWebhook(req, res, parsedUrl.searchParams, bodyStr);
  }

  // Serve static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  // Check if file exists in root or in dist
  let fileToServe = null;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    fileToServe = filePath;
  } else {
    const distPath = path.join(__dirname, 'dist', safePath);
    if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
      fileToServe = distPath;
    }
  }

  if (fileToServe) {
    const ext = path.extname(fileToServe).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    return fs.createReadStream(fileToServe).pipe(res);
  }

  // Fallback to index.html for SPA client-side routing
  let indexPath = path.join(__dirname, 'index.html');
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(__dirname, 'dist', 'index.html');
  }

  if (fs.existsSync(indexPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`NightByte Node.js server running on http://${HOST}:${PORT}`);
});
