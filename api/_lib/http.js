'use strict';
/* Small HTTP helpers shared by every endpoint: JSON in/out, CORS allow-list, auth, uniform errors. */
const { auth } = require('./firebase');

const MAX_BODY = 64 * 1024;

class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code || 'error'; }
}

/** Reads the raw request body (bounded, with a timeout). Vercel's Node runtime parses `req.body` lazily (only
 *  when the getter is touched), so the stream is intact here; we never touch `req.body` unless the stream has
 *  already been consumed, and then accept only a Buffer/string (a re-serialised object would break the HMAC). */
function readRaw(req) {
  const tooLarge = () => new HttpError(413, 'Request too large', 'too_large');
  const declared = +(req.headers && req.headers['content-length']);
  if (declared > MAX_BODY) return Promise.reject(tooLarge());
  const pre = req.rawBody !== undefined ? req.rawBody : (req.readableEnded ? req.body : undefined);
  if (typeof pre === 'string' || Buffer.isBuffer(pre)) {
    const b = Buffer.from(pre);
    return b.length > MAX_BODY ? Promise.reject(tooLarge()) : Promise.resolve(b);
  }
  if (req.readableEnded) return Promise.reject(new HttpError(400, 'Request body unavailable', 'bad_request'));
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0, done = false;
    const finish = (err, val) => { if (done) return; done = true; clearTimeout(timer); req.removeListener('data', onData); err ? reject(err) : resolve(val); };
    const timer = setTimeout(() => finish(new HttpError(408, 'Request timed out', 'timeout')), 10000);
    const onData = (c) => {
      size += c.length;
      // Stop buffering but let the stream drain, so the 413 response can still be written.
      if (size > MAX_BODY) { finish(tooLarge()); req.resume(); return; }
      chunks.push(c);
    };
    req.on('data', onData);
    req.on('end', () => finish(null, Buffer.concat(chunks)));
    req.on('error', (e) => finish(e));
  });
}

async function readJson(req) {
  const raw = await readRaw(req);
  if (!raw.length) return {};
  try {
    const v = JSON.parse(raw.toString('utf8'));
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('not an object');
    return v;
  } catch (e) { throw new HttpError(400, 'Invalid JSON body'); }
}

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

/** Same-origin calls need no CORS. Cross-origin calls are allowed only from ALLOWED_ORIGINS. */
function cors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (origin && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true; }
  return false;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/** Verifies the Firebase ID token in "Authorization: Bearer …" (revoked tokens are rejected). */
async function requireUser(req, { admin = false } = {}) {
  const h = String(req.headers.authorization || '');
  const m = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(h);
  if (!m) throw new HttpError(401, 'Sign in again to continue.', 'unauthenticated');
  let tok;
  try { tok = await auth().verifyIdToken(m[1], true); }
  catch (e) { throw new HttpError(401, 'Your session expired. Sign in again.', 'unauthenticated'); }
  if (admin && tok.platformAdmin !== true) throw new HttpError(403, 'Platform admin only.', 'forbidden');
  return tok;
}

/** Wraps a handler: method check, CORS, JSON errors without leaking internals. */
function handler(methods, fn) {
  return async (req, res) => {
    try {
      if (cors(req, res)) return;
      if (!methods.includes(req.method)) { res.setHeader('Allow', methods.join(', ')); throw new HttpError(405, 'Method not allowed'); }
      await fn(req, res);
    } catch (e) {
      const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
      if (status >= 500) console.error('[api]', req.url, e && (e.stack || e.message || e));
      send(res, status, { error: status >= 500 && !(e instanceof HttpError) ? 'Something went wrong on our side. Please try again.' : e.message, code: e.code || 'error' });
    }
  };
}

module.exports = { HttpError, readRaw, readJson, send, requireUser, handler, cors };
