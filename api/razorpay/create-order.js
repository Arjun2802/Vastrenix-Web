'use strict';
/* POST /api/razorpay/create-order   body: { cycle }   auth: store owner's Firebase ID token
   The price always comes from config/billing on the server — never from the client. */
const { db, FieldValue } = require('../_lib/firebase');
const { handler, readJson, requireUser, send, HttpError } = require('../_lib/http');
const rzp = require('../_lib/razorpay');
const { loadConfig, planFor } = require('../_lib/billing');

const WINDOW_MS = 10 * 60 * 1000, MAX_ORDERS = 6;

/** At most MAX_ORDERS new orders per user per 10 minutes (stops order-spam against the gateway). */
async function rateLimit(uid) {
  const ref = db().doc('rateLimits/' + uid);
  await db().runTransaction(async (tx) => {
    const s = await tx.get(ref), now = Date.now();
    const d = s.exists ? s.data() : {};
    const fresh = !d.windowStart || now - d.windowStart > WINDOW_MS;
    const count = fresh ? 0 : (d.count || 0);
    if (count >= MAX_ORDERS) throw new HttpError(429, 'Too many payment attempts. Please wait a few minutes.', 'rate_limited');
    tx.set(ref, { windowStart: fresh ? now : d.windowStart, count: count + 1 });
  });
}

module.exports = handler(['POST', 'OPTIONS'], async (req, res) => {
  const user = await requireUser(req);
  const body = await readJson(req);
  const cycle = String(body.cycle || '');

  const cfg = await loadConfig();
  if (!cfg.methods.razorpay) throw new HttpError(400, 'Online payment is turned off. Please pay by UPI.', 'method_off');
  const plan = planFor(cfg, cycle);

  // Only the owner of a set-up store can buy its plan (the store id is the owner's uid).
  const sid = user.uid;
  const storeSnap = await db().doc('stores/' + sid + '/meta/store').get();
  if (!storeSnap.exists) throw new HttpError(403, 'Only a store owner can subscribe. Finish store setup first.', 'not_owner');
  const store = storeSnap.data() || {};
  // A store suspended by a platform admin cannot buy its way back in (activation would lift the suspension).
  const subSnap = await db().doc('stores/' + sid + '/meta/subscription').get();
  if (subSnap.exists && (subSnap.data() || {}).status === 'suspended') {
    throw new HttpError(403, 'This store is suspended. Please contact support.', 'suspended');
  }

  await rateLimit(user.uid);

  const order = await rzp.createOrder({
    amount: plan.amount * 100, currency: 'INR',
    receipt: ('vx_' + sid.slice(0, 12) + '_' + Date.now().toString(36)).slice(0, 40),
    notes: { sid, uid: user.uid, cycle }
  });

  await db().doc('payments/' + order.id).set({
    provider: 'razorpay', orderId: order.id, sid, uid: user.uid, email: user.email || '',
    storeName: String(store.name || '').slice(0, 120), storeCode: String(store.code || '').slice(0, 40),
    cycle, label: plan.label, amount: plan.amount, days: plan.days, currency: 'INR',
    status: 'created', createdAt: Date.now(), createdTs: FieldValue.serverTimestamp()
  });

  send(res, 200, {
    keyId: rzp.keys().id, orderId: order.id, amount: order.amount, currency: order.currency,
    plan: { cycle, label: plan.label, amount: plan.amount, days: plan.days },
    prefill: { name: String(store.ownerName || user.name || '').slice(0, 80), email: user.email || '', contact: String(store.phone || '').replace(/\D/g, '').slice(-10) },
    storeName: String(store.name || 'Vastrenix').slice(0, 80)
  });
});
