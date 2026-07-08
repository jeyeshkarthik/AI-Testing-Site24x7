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

// ─── Semantic Search Engine ───────────────────────────────────────────────────
const { createClient } = require('redis');
const fs = require('fs');
let extractor = null;
let redisClient = null;
let vectorDB = null; // fallback in-memory if Redis KNN fails

async function initVectorEngine() {
  try {
    console.log('[proxy] Loading Transformers.js & Model...');
    const transformers = await import('@xenova/transformers');
    const pipeline = transformers.pipeline;
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[proxy] Model loaded. Connecting to Redis...');
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.on('error', err => console.error('[proxy] Redis Client Error', err));
    await redisClient.connect();
    console.log('[proxy] Connected to Redis.');
    
    // Check if the HASH-based index exists (correct binary format)
    try {
      const info = await redisClient.ft.info('idx:api_vectors');
      // Check if it is HASH type (correct) vs JSON type (old broken format)
      if (info.indexDefinition && info.indexDefinition.keyType === 'HASH') {
        console.log('[proxy] Redis HASH index detected. Semantic Search via Redis is READY.');
      } else {
        console.warn('[proxy] Redis index is JSON-type (legacy). Falling back to in-memory search.');
        console.warn('[proxy] Run: docker-compose exec proxy node migrate_to_redis.js  to fix this.');
        loadInMemoryFallback();
      }
    } catch(e) {
      console.warn('[proxy] No Redis index found. Falling back to in-memory search.');
      console.warn('[proxy] Run: docker-compose exec proxy node migrate_to_redis.js  to build it.');
      loadInMemoryFallback();
    }
  } catch (err) {
    console.error('[proxy] Failed to initialize Vector Engine:', err.message);
    loadInMemoryFallback();
  }
}

function loadInMemoryFallback() {
  try {
    vectorDB = JSON.parse(fs.readFileSync('site24x7_vector.json', 'utf8'));
    console.log(`[proxy] In-memory fallback loaded: ${Object.keys(vectorDB).length} APIs.`);
  } catch(e) {
    console.error('[proxy] Could not load in-memory fallback either:', e.message);
  }
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
initVectorEngine();

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

  // ── GET /semantic_search ────────────────────────────────────────────────────
  if (path === '/semantic_search' && req.method === 'GET') {
    if (!extractor || !vectorDB) {
      return json(res, 503, { error: 'Vector engine is still loading. Please try again in a moment.' });
    }
    const q = reqUrl.searchParams.get('q');
    if (!q) return json(res, 400, { error: 'Missing ?q= query parameter.' });
    
    console.log(`[proxy] /semantic_search query: "${q}"`);
    
    try {
      const output = await extractor(q, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(output.data);
      
      const results = [];
      for (const apiId in vectorDB) {
        let best = -1;
        for (const vec of vectorDB[apiId]) {
          const s = cosineSimilarity(queryVector, vec);
          if (s > best) best = s;
        }
        if (best > 0.15) results.push({ id: parseInt(apiId, 10), score: best });
      }
      results.sort((a, b) => b.score - a.score);
      return json(res, 200, results.slice(0, 50));
    } catch (err) {
      console.error('[proxy] Semantic search error:', err);
      return json(res, 500, { error: 'Search failed' });
    }
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

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Site24x7 Local Proxy — http://localhost:' + PORT + '  ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  POST /settings   → save session cookie      ║');
  console.log('║  GET  /status     → check proxy is alive     ║');
  console.log('║  GET  /semantic_search → query vector engine ║');
  console.log('║  *    /proxy?url= → forward to site24x7.com  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('Waiting for cookie configuration from the app Settings...');
});
