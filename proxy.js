/**
 * proxy.js  —  Site24x7 Local Proxy Server
 *
 * Runs on http://localhost:3334
 * Forwards API requests from the browser to site24x7.com with the
 * user's session cookie (configured via POST /settings).
 *
 * Endpoints:
 *   POST /settings        — Save session cookie
 *   GET  /status          — Check proxy status
 *   *    /proxy?url=<url> — Forward request to site24x7.com
 */

const http  = require('http');
const https = require('https');
const url   = require('url');

const PORT          = 3334;
const DEFAULT_HOST  = 'www.site24x7.com';
const ALLOWED_HOSTS = ['www.site24x7.com', 'staticdownloads.site24x7.com', 'tools.site24x7.com'];
const ALLOWED_ORIGIN = 'http://localhost:3333';

let storedCookie = '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

function resolveTarget(rawUrl) {
  // If it's already absolute, use it
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  // Otherwise prefix with the default site24x7 host
  return `https://${DEFAULT_HOST}${rawUrl}`;
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  cors(res);

  // Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path      = parsedUrl.pathname;

  // ── POST /settings ──────────────────────────────────────────────────────────
  if (path === '/settings' && req.method === 'POST') {
    const body = await readBody(req);
    try {
      const data = JSON.parse(body);
      if (data.cookie) {
        storedCookie = data.cookie.trim();
        console.log('[proxy] Cookie updated ✓');
        return json(res, 200, { ok: true, message: 'Cookie saved successfully.' });
      }
      return json(res, 400, { ok: false, message: 'No "cookie" field found in request body.' });
    } catch {
      return json(res, 400, { ok: false, message: 'Invalid JSON body.' });
    }
  }

  // ── GET /status ─────────────────────────────────────────────────────────────
  if (path === '/status' && req.method === 'GET') {
    return json(res, 200, { ok: true, hasCookie: !!storedCookie, port: PORT });
  }

  // ── /proxy?url=<target> ─────────────────────────────────────────────────────
  if (path === '/proxy') {
    const rawTarget = parsedUrl.query.url;

    if (!rawTarget) {
      return json(res, 400, { error: 'Missing ?url= query parameter.' });
    }

    if (!storedCookie) {
      return json(res, 401, {
        error: 'No session cookie configured.',
        hint:  'Open Settings in the app and paste your cookie string.',
      });
    }

    const targetUrl  = resolveTarget(decodeURIComponent(rawTarget));
    const parsedTarget = url.parse(targetUrl);
    const hostname   = parsedTarget.hostname;

    if (!ALLOWED_HOSTS.includes(hostname)) {
      return json(res, 403, { error: `Host "${hostname}" is not allowed.` });
    }

    const reqBody = await readBody(req);

    const options = {
      hostname: hostname,
      port:     443,
      path:     parsedTarget.path,
      method:   req.method,
      headers: {
        'Cookie':     storedCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        'Accept':     'application/json, text/plain, */*',
        'Referer':    'https://www.site24x7.com/app/demo',
        'Origin':     'https://www.site24x7.com',
      },
    };

    if (reqBody && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      options.headers['Content-Type']   = req.headers['content-type'] || 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(reqBody);
    }

    console.log(`[proxy] ${req.method} ${targetUrl}`);

    const proxyReq = https.request(options, (proxyRes) => {
      const status      = proxyRes.statusCode;
      const contentType = proxyRes.headers['content-type'] || 'application/json';

      res.writeHead(status, {
        'Content-Type': contentType,
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      console.error('[proxy] Request error:', e.message);
      json(res, 502, { error: 'Proxy request failed: ' + e.message });
    });

    if (reqBody) proxyReq.write(reqBody);
    proxyReq.end();
    return;
  }

  // ── 404 ─────────────────────────────────────────────────────────────────────
  json(res, 404, { error: 'Unknown endpoint.' });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Site24x7 Local Proxy — http://localhost:' + PORT + '  ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  POST /settings   → save session cookie      ║');
  console.log('║  GET  /status     → check proxy is alive     ║');
  console.log('║  *    /proxy?url= → forward to site24x7.com  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('Waiting for cookie configuration from the app Settings...');
});
