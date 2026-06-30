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

const PORT          = process.env.PROXY_PORT || 3334;
const DEFAULT_HOST  = 'www.site24x7.com';
const ALLOWED_HOSTS = ['www.site24x7.com', 'staticdownloads.site24x7.com', 'tools.site24x7.com'];
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3333';

let storedCookie = '';
let storedAuthToken = '';

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

  // Parse request URL using WHATWG URL API
  let reqUrl;
  try {
    reqUrl = new URL(req.url, 'http://localhost');
  } catch(e) {
    return json(res, 400, { error: 'Bad request URL' });
  }
  const path = reqUrl.pathname;

  // ── POST /settings ──────────────────────────────────────────────────────────
  if (path === '/settings' && req.method === 'POST') {
    const body = await readBody(req);
    try {
      const data = JSON.parse(body);
      let updated = false;
      if (data.cookie !== undefined) {
        storedCookie = data.cookie.trim();
        updated = true;
      }
      if (data.authToken !== undefined) {
        storedAuthToken = data.authToken.trim();
        updated = true;
      }
      if (updated) {
        console.log(`[proxy] Settings updated ✓ (Cookie: ${!!storedCookie}, AuthToken: ${!!storedAuthToken})`);
        return json(res, 200, { ok: true, message: 'Settings saved successfully.' });
      }
      return json(res, 400, { ok: false, message: 'No "cookie" or "authToken" field found in request body.' });
    } catch {
      return json(res, 400, { ok: false, message: 'Invalid JSON body.' });
    }
  }

  // ── GET /status ─────────────────────────────────────────────────────────────
  if (path === '/status' && req.method === 'GET') {
    return json(res, 200, { ok: true, hasCookie: !!storedCookie, hasAuthToken: !!storedAuthToken, port: PORT });
  }

  // ── /proxy?url=<target> ─────────────────────────────────────────────────────
  if (path === '/proxy') {
    const rawTarget = reqUrl.searchParams.get('url');

    if (!rawTarget) {
      return json(res, 400, { error: 'Missing ?url= query parameter.' });
    }

    if (!storedCookie) {
      return json(res, 401, {
        error: 'No session cookie configured.',
        hint:  'Open Settings in the app and paste your cookie string.',
      });
    }

    let targetUrl;
    try {
      targetUrl = resolveTarget(rawTarget);
      new URL(targetUrl); // validate
    } catch(e) {
      return json(res, 400, { error: 'Invalid target URL: ' + rawTarget });
    }

    const parsedTarget = new URL(targetUrl);
    const hostname   = parsedTarget.hostname;

    if (!ALLOWED_HOSTS.includes(hostname)) {
      return json(res, 403, { error: `Host "${hostname}" is not allowed.` });
    }

    // Extract CSRF token from cookie to send as header (Zoho requirement)
    let csrfToken = '';
    const csrfMatch = storedCookie.match(/CT_CSRF_TOKEN=([^;]+)/);
    if (csrfMatch) csrfToken = csrfMatch[1].trim();

    const fullPath = parsedTarget.pathname + (parsedTarget.search || '');
    console.log(`[proxy] ${req.method} ${parsedTarget.hostname}${fullPath}`);

    const options = {
      hostname: hostname,
      port:     443,
      path:     fullPath,
      method:   req.method,
      headers: {
        'Cookie':              storedCookie,
        'User-Agent':          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept':              'application/json, text/plain, */*',
        'Accept-Language':     'en-US,en;q=0.9',
        'Accept-Encoding':     'identity',
        'Referer':             'https://www.site24x7.com/app/demo',
        'Origin':              'https://www.site24x7.com',
        'X-Requested-With':    'XMLHttpRequest',
        'Sec-Fetch-Dest':      'empty',
        'Sec-Fetch-Mode':      'cors',
        'Sec-Fetch-Site':      'same-origin',
        'sec-ch-ua':           '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        'sec-ch-ua-mobile':    '?0',
        'sec-ch-ua-platform':  '"Windows"',
        'Connection':          'keep-alive',
        ...(csrfToken ? { 'CT_CSRF_TOKEN': csrfToken } : {}),
        ...(storedAuthToken ? { 'Authorization': storedAuthToken } : {}),
        'time-zone':           'PST8PDT'
      },
    };

    const reqBody = await readBody(req);

    if (reqBody && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      options.headers['Content-Type']   = req.headers['content-type'] || 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(reqBody);
    }

    // Follow redirects up to 5 hops
    function doRequest(opts, body, hops, finalRes) {
      if (hops > 5) return json(finalRes, 502, { error: 'Too many redirects' });
      const r = https.request(opts, (proxyRes) => {
        const status = proxyRes.statusCode;
        if ((status === 301 || status === 302 || status === 303 || status === 307 || status === 308) && proxyRes.headers.location) {
          const loc = proxyRes.headers.location;
          console.log(`[proxy] Redirect ${status} → ${loc}`);
          const nextUrl  = new URL(loc, `https://${opts.hostname}`);
          const nextOpts = Object.assign({}, opts, {
            hostname: nextUrl.hostname,
            path:     nextUrl.pathname + (nextUrl.search || ''),
            method:   (status === 303) ? 'GET' : opts.method,
          });
          proxyRes.resume(); // drain
          return doRequest(nextOpts, (status === 303 ? '' : body), hops + 1, finalRes);
        }
        const ct = proxyRes.headers['content-type'] || 'application/json';
        finalRes.writeHead(status, { 'Content-Type': ct });
        proxyRes.pipe(finalRes);
      });
      r.on('error', (e) => {
        console.error('[proxy] Request error:', e.message);
        json(finalRes, 502, { error: 'Proxy request failed: ' + e.message });
      });
      if (body) r.write(body);
      r.end();
    }

    doRequest(options, reqBody, 0, res);
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
