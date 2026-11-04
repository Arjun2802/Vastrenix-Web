'use strict';
/* Minimal Razorpay REST client + signature checks. Keys come only from environment variables:
   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET. */
const crypto = require('crypto');
const { HttpError } = require('./http');

const API = 'https://api.razorpay.com/v1';

function keys() {
  const id = process.env.RAZORPAY_KEY_ID || '', secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!/^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(id) || !secret) throw new HttpError(503, 'Online payments are not set up yet. Please pay by UPI or contact support.', 'not_configured');
  return { id, secret };
}
function configured() { try { keys(); return true; } catch (e) { return false; } }
function mode() { try { return keys().id.startsWith('rzp_live_') ? 'live' : 'test'; } catch (e) { return 'off'; } }

async function call(method, path, body) {
  const { id, secret } = keys();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let r;
  try {
    r = await fetch(API + path, {
      method,
      headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'), 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
  } catch (e) {
    throw new HttpError(502, 'Could not reach the payment gateway. Please try again.', 'gateway_unreachable');
  } finally { clearTimeout(timer); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const desc = (j && j.error && j.error.description) || ('HTTP ' + r.status);
    console.error('[razorpay]', method, path, r.status, desc);
    // Key/permission problems are ours, not the caller's: don't echo the gateway's wording to clients.
    if (r.status === 401 || r.status === 403 || r.status >= 500) throw new HttpError(502, 'The payment gateway is unavailable. Please try again later.', 'gateway_error');
    throw new HttpError(400, 'Payment gateway error: ' + String(desc).slice(0, 200), 'gateway_error');
  }
  return j;
}

/** Constant-time comparison of two hex signatures. */
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !/^[a-f0-9]{64}$/i.test(a) || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
function hmac(secret, data) { return crypto.createHmac('sha256', secret).update(data).digest('hex'); }

/** Checkout success signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
function verifyPaymentSignature(orderId, paymentId, signature) {
  return safeEqualHex(hmac(keys().secret, orderId + '|' + paymentId), signature);
}
/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!secret) throw new HttpError(503, 'Webhook secret not configured', 'not_configured');
  return safeEqualHex(hmac(secret, rawBody), signature);
}

module.exports = {
  keys, configured, mode, verifyPaymentSignature, verifyWebhookSignature,
  createOrder: (o) => call('POST', '/orders', o),
  fetchOrder: (id) => call('GET', '/orders/' + encodeURIComponent(id)),
  fetchPayment: (id) => call('GET', '/payments/' + encodeURIComponent(id)),
  capture: (id, amount, currency) => call('POST', '/payments/' + encodeURIComponent(id) + '/capture', { amount, currency }),
  refund: (id, body) => call('POST', '/payments/' + encodeURIComponent(id) + '/refund', body || {})
};
