import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const SUPABASE_URL = 'https://qblybjpioynwgheqhxyo.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

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
