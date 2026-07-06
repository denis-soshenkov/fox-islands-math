'use strict';

/* ============================================================
   Мини-сервис авторизации: POST /api/auth/yandex
   Принимает OAuth-токен Яндекса, проверяет его через
   login.yandex.ru и выдаёт Firebase custom token с uid
   «yandex:<id>» — так прогресс аккаунта в Firestore единый,
   каким бы способом человек ни вошёл.

   Секрет: FIREBASE_SERVICE_ACCOUNT_JSON (однострочный JSON
   сервисного аккаунта Firebase) — задаётся на сервере в
   /opt/fox-islands/deploy/.env (каталог compose-файла).
   Без него сервис отвечает 503, игра деградирует в локальный профиль.
   ============================================================ */

const http = require('http');
const admin = require('firebase-admin');

const PORT = process.env.PORT || 8080;
const ALLOWED = (process.env.CORS_ORIGINS ||
  'https://game.eropulsars.com,http://localhost:8899').split(',');

let app = null;
function firebaseApp() {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  app = admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  return app;
}

function cors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
};

http.createServer((req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.method === 'GET' && req.url === '/api/health') {
    let credentialOk = false;
    try { credentialOk = !!firebaseApp(); } catch (e) { credentialOk = false; }
    return send(res, 200, {
      ok: true,
      configured: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      credential_ok: credentialOk
    });
  }

  if (req.method !== 'POST' || req.url !== '/api/auth/yandex') {
    return send(res, 404, { error: 'not_found' });
  }
  let fbApp = null;
  try { fbApp = firebaseApp(); } catch (e) {
    console.error('bad service account:', e && e.message);
    return send(res, 500, { error: 'bad_service_account' });
  }
  if (!fbApp) return send(res, 503, { error: 'service_account_not_configured' });

  let body = '';
  req.on('data', c => {
    body += c;
    if (body.length > 4096) req.destroy();
  });
  req.on('end', async () => {
    try {
      const { access_token } = JSON.parse(body || '{}');
      if (!access_token) return send(res, 400, { error: 'no_token' });

      const info = await fetch('https://login.yandex.ru/info?format=json', {
        headers: { Authorization: 'OAuth ' + access_token }
      }).then(r => (r.ok ? r.json() : null)).catch(() => null);
      if (!info || !info.id) return send(res, 401, { error: 'bad_yandex_token' });

      const token = await admin.auth().createCustomToken('yandex:' + info.id, { provider: 'yandex' });
      send(res, 200, { token });
    } catch (e) {
      console.error('auth error:', e && e.message);
      send(res, 500, { error: 'internal' });
    }
  });
}).listen(PORT, () => console.log('fox-islands auth service on :' + PORT));
