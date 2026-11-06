// Payment API tests with an in-memory Firestore and a fake Razorpay. Run: node --test tests/api.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const Module = require('module');
const path = require('path');
const { Readable } = require('stream');

/* ---------------- fake firebase-admin ---------------- */
const store = new Map();
const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
function merge(a, b) { const o = Object.assign({}, a); for (const k of Object.keys(b)) { const v = b[k]; if (v && v.__arrayUnion) { o[k] = [...new Set([...(o[k] || []), ...v.__arrayUnion])]; continue; } o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' ? merge(o[k], v) : v; } return o; }
function snap(p) { const d = store.get(p); return { id: p.split('/').pop(), exists: d !== undefined, data: () => clone(d), ref: docRef(p) }; }
let autoId = 0;
function docRef(p) {
  return {
    path: p,
    get: async () => snap(p),
    set: async (d, o) => { store.set(p, o && o.merge ? merge(store.get(p) || {}, clone(d)) : merge({}, clone(d))); },
    update: async (d) => { if (!store.has(p)) throw new Error('NOT_FOUND'); store.set(p, merge(store.get(p), clone(d))); },
    create: async (d) => { if (store.has(p)) { const e = new Error('6 ALREADY_EXISTS: already exists'); e.code = 6; throw e; } store.set(p, clone(d)); },
    delete: async () => { store.delete(p); }
  };
}
function collRef(p) {
  const q = (filters, lim) => ({
    where: (f, op, v) => q(filters.concat([[f, v]]), lim),
    limit: (n) => q(filters, n),
    get: async () => {
      let docs = [...store.keys()].filter((k) => k.startsWith(p + '/') && k.split('/').length === p.split('/').length + 1)
        .filter((k) => filters.every(([f, v]) => store.get(k)[f] === v)).map(snap);
      if (lim) docs = docs.slice(0, lim);
      return { empty: !docs.length, docs, size: docs.length };
    }
  });
  return Object.assign(q([], 0), { doc: (id) => docRef(p + '/' + (id || 'auto' + (++autoId))), add: async (d) => { const r = docRef(p + '/auto' + (++autoId)); await r.set(d); return r; } });
}
const DELETED_USERS = [];
const fakeDb = {
  doc: docRef, collection: collRef,
  recursiveDelete: async (ref) => { for (const k of [...store.keys()]) if (k === ref.path || k.startsWith(ref.path + '/')) store.delete(k); },
  runTransaction: async (fn) => {
    const writes = [];
    const tx = { get: (r) => r.get(), set: (r, d, o) => writes.push(() => r.set(d, o)), update: (r, d) => writes.push(() => r.update(d)) };
    const out = await fn(tx); for (const w of writes) await w(); return out;
  }
};
const USERS = { owner1: { email: 'owner@shop.in', emailVerified: true }, other1: { email: 'Boss@VX.in', emailVerified: false }, adm1: { email: 'admin@vx.in', emailVerified: true } };
const CLAIMS = {};
const TOKENS = {
  'owner-token-0000000000000': { uid: 'owner1', email: 'owner@shop.in' },
  'other-token-0000000000000': { uid: 'other1', email: 'other@shop.in' },
  'admin-token-0000000000000': { uid: 'adm1', email: 'admin@vx.in', platformAdmin: true }
};
const fakeAdmin = {
  apps: [1],
  initializeApp: () => {}, credential: { cert: () => ({}) },
  app: () => ({ firestore: () => fakeDb, auth: () => ({ verifyIdToken: async (t) => { if (!TOKENS[t]) throw new Error('bad token'); return TOKENS[t]; }, getUser: async (uid) => Object.assign({ uid, customClaims: CLAIMS[uid] || {} }, USERS[uid] || {}), setCustomUserClaims: async (uid, c) => { CLAIMS[uid] = c; }, deleteUser: async (uid) => { DELETED_USERS.push(uid); } }) }),
  firestore: { FieldValue: { serverTimestamp: () => 'TS', arrayUnion: (...v) => ({ __arrayUnion: v }) } }
};
const origLoad = Module._load;
Module._load = function (req, parent, isMain) { if (req === 'firebase-admin') return fakeAdmin; return origLoad.apply(this, arguments); };

/* ---------------- fake Razorpay ---------------- */
process.env.RAZORPAY_KEY_ID = 'rzp_test_ABCDEFGH12345';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'wh_secret';
const RZ = { orders: {}, payments: {}, refunds: [], captures: [] };
global.fetch = async (url, opt) => {
  const u = new URL(url), body = opt.body ? JSON.parse(opt.body) : null;
  const ok = (j) => ({ ok: true, status: 200, json: async () => j });
  if (opt.method === 'POST' && u.pathname === '/v1/orders') { const id = 'order_T' + Object.keys(RZ.orders).length + 'AAAAAA'; RZ.orders[id] = Object.assign({ id, status: 'created' }, body); return ok(RZ.orders[id]); }
  let m;
  if ((m = /^\/v1\/payments\/([^/]+)$/.exec(u.pathname))) return RZ.payments[m[1]] ? ok(RZ.payments[m[1]]) : { ok: false, status: 404, json: async () => ({ error: { description: 'not found' } }) };
  if ((m = /^\/v1\/payments\/([^/]+)\/capture$/.exec(u.pathname))) { RZ.captures.push(m[1]); RZ.payments[m[1]].status = 'captured'; return ok(RZ.payments[m[1]]); }
  if ((m = /^\/v1\/payments\/([^/]+)\/refund$/.exec(u.pathname))) { if (RZ.failRefund) return { ok: false, status: 400, json: async () => ({ error: { description: 'refund failed' } }) }; RZ.refunds.push(m[1]); return ok({ id: 'rfnd_X1', payment_id: m[1], amount: body.amount }); }
  throw new Error('unexpected fetch ' + url);
};

/* ---------------- request helper ---------------- */
const api = (f) => require(path.join(__dirname, '..', 'api', f));
async function call(fn, { method = 'POST', token, body, headers = {}, raw } = {}) {
  const payload = raw !== undefined ? raw : body ? JSON.stringify(body) : '';
  const req = Readable.from(payload ? [Buffer.from(payload)] : []);
  req.method = method; req.url = '/test';
  req.headers = Object.assign({}, headers, token ? { authorization: 'Bearer ' + token } : {});
  const res = { statusCode: 200, headers: {}, body: '', setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b || ''; } };
  await fn(req, res);
  let json = null; try { json = JSON.parse(res.body); } catch (e) { }
  return { status: res.statusCode, json };
}
const sign = (s, d) => crypto.createHmac('sha256', s).update(d).digest('hex');

test.beforeEach(() => {
  store.clear(); RZ.orders = {}; RZ.payments = {}; RZ.refunds = []; RZ.captures = []; RZ.failRefund = false;
  store.set('stores/owner1/meta/store', { name: 'Shree Fashion', code: 'VX-SF-AB12', phone: '9876543210' });
  store.set('stores/owner1/meta/subscription', { status: 'trialing', trialEndsAt: Date.now() + 864e5 });
});

async function newOrder(cycle = 'quarterly') {
  const r = await call(api('razorpay/create-order'), { token: 'owner-token-0000000000000', body: { cycle } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json;
}
function payFor(orderId, amount, status = 'captured') { const id = 'pay_P' + Object.keys(RZ.payments).length + 'BBBBBB'; RZ.payments[id] = { id, order_id: orderId, amount, currency: 'INR', status, method: 'upi' }; return id; }

test('create-order uses the server price, not the client', async () => {
  const o = await newOrder('quarterly');
  assert.equal(o.amount, 189900);
  assert.equal(store.get('payments/' + o.orderId).amount, 1899);
  assert.equal(store.get('payments/' + o.orderId).uid, 'owner1');
});

test('create-order follows admin price changes and rejects inactive plans', async () => {
  store.set('config/billing', { plans: { monthly: { label: 'Monthly', amount: 799, days: 30, active: true }, annual: { label: 'Annual', amount: 6999, days: 365, active: false } }, methods: { razorpay: true, upi: true } });
  assert.equal((await newOrder('monthly')).amount, 79900);
  const r = await call(api('razorpay/create-order'), { token: 'owner-token-0000000000000', body: { cycle: 'annual' } });
  assert.equal(r.status, 400);
});

test('create-order requires sign-in, a real store, and a known plan', async () => {
  assert.equal((await call(api('razorpay/create-order'), { body: { cycle: 'monthly' } })).status, 401);
  assert.equal((await call(api('razorpay/create-order'), { token: 'other-token-0000000000000', body: { cycle: 'monthly' } })).status, 403);
  assert.equal((await call(api('razorpay/create-order'), { token: 'owner-token-0000000000000', body: { cycle: 'lifetime' } })).status, 400);
  assert.equal((await call(api('razorpay/create-order'), { method: 'GET', token: 'owner-token-0000000000000' })).status, 405);
});

test('create-order is rate limited', async () => {
  for (let i = 0; i < 6; i++) await newOrder();
  const r = await call(api('razorpay/create-order'), { token: 'owner-token-0000000000000', body: { cycle: 'monthly' } });
  assert.equal(r.status, 429);
});

test('verify activates the plan once; repeat and webhook do not extend twice', async () => {
  const o = await newOrder('quarterly');
  const pid = payFor(o.orderId, 189900);
  const body = { razorpay_order_id: o.orderId, razorpay_payment_id: pid, razorpay_signature: sign('test_secret', o.orderId + '|' + pid) };
  const r1 = await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body });
  assert.equal(r1.status, 200, JSON.stringify(r1.json));
  const sub = store.get('stores/owner1/meta/subscription');
  assert.equal(sub.status, 'active'); assert.equal(sub.cycleId, 'quarterly');
  const exp = sub.expiresAt;
  assert.ok(Math.abs(exp - (Date.now() + 90 * 864e5)) < 5000);
  assert.equal(store.get('subscriptions/owner1').expiresAt, exp);

  const r2 = await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body });
  assert.equal(r2.json.already, true);
  const evt = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: RZ.payments[pid] } } });
  const w = await call(api('razorpay/webhook'), { raw: evt, headers: { 'x-razorpay-signature': sign('wh_secret', evt), 'x-razorpay-event-id': 'evt_1' } });
  assert.equal(w.status, 200);
  assert.equal(store.get('stores/owner1/meta/subscription').expiresAt, exp, 'plan must not be extended twice');
});

test('a second paid order extends from the current expiry', async () => {
  const o1 = await newOrder('monthly'); const p1 = payFor(o1.orderId, 69900);
  await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body: { razorpay_order_id: o1.orderId, razorpay_payment_id: p1, razorpay_signature: sign('test_secret', o1.orderId + '|' + p1) } });
  const first = store.get('stores/owner1/meta/subscription').expiresAt;
  const o2 = await newOrder('monthly'); const p2 = payFor(o2.orderId, 69900);
  await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body: { razorpay_order_id: o2.orderId, razorpay_payment_id: p2, razorpay_signature: sign('test_secret', o2.orderId + '|' + p2) } });
  assert.equal(store.get('stores/owner1/meta/subscription').expiresAt, first + 30 * 864e5);
});

test('verify rejects a forged signature, someone else\'s order, and an underpaid payment', async () => {
  const o = await newOrder('annual');
  const pid = payFor(o.orderId, 699900);
  let r = await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body: { razorpay_order_id: o.orderId, razorpay_payment_id: pid, razorpay_signature: 'a'.repeat(64) } });
  assert.equal(r.status, 400);
  r = await call(api('razorpay/verify'), { token: 'other-token-0000000000000', body: { razorpay_order_id: o.orderId, razorpay_payment_id: pid, razorpay_signature: sign('test_secret', o.orderId + '|' + pid) } });
  assert.equal(r.status, 403);
  const cheap = payFor(o.orderId, 100);
  r = await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body: { razorpay_order_id: o.orderId, razorpay_payment_id: cheap, razorpay_signature: sign('test_secret', o.orderId + '|' + cheap) } });
  assert.equal(r.status, 400);
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'trialing');
});

test('verify captures an authorized payment', async () => {
  const o = await newOrder('monthly'); const pid = payFor(o.orderId, 69900, 'authorized');
  const r = await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body: { razorpay_order_id: o.orderId, razorpay_payment_id: pid, razorpay_signature: sign('test_secret', o.orderId + '|' + pid) } });
  assert.equal(r.status, 200); assert.equal(RZ.payments[pid].status, 'captured');
});

test('webhook alone activates the plan, rejects bad signatures and ignores duplicates', async () => {
  const o = await newOrder('monthly'); const pid = payFor(o.orderId, 69900);
  const evt = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: RZ.payments[pid] } } });
  assert.equal((await call(api('razorpay/webhook'), { raw: evt, headers: { 'x-razorpay-signature': sign('nope', evt) } })).status, 401);
  assert.equal((await call(api('razorpay/webhook'), { raw: evt, headers: { 'x-razorpay-signature': sign('wh_secret', evt), 'x-razorpay-event-id': 'evt_9' } })).status, 200);
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'active');
  const d = await call(api('razorpay/webhook'), { raw: evt, headers: { 'x-razorpay-signature': sign('wh_secret', evt), 'x-razorpay-event-id': 'evt_9' } });
  assert.equal(d.json.duplicate, true);
});

test('admin refund needs the admin claim, refunds once, and can revoke plan time', async () => {
  const o = await newOrder('monthly'); const pid = payFor(o.orderId, 69900);
  await call(api('razorpay/verify'), { token: 'owner-token-0000000000000', body: { razorpay_order_id: o.orderId, razorpay_payment_id: pid, razorpay_signature: sign('test_secret', o.orderId + '|' + pid) } });
  assert.equal((await call(api('admin/refund'), { token: 'owner-token-0000000000000', body: { orderId: o.orderId } })).status, 403);
  const r = await call(api('admin/refund'), { token: 'admin-token-0000000000000', body: { orderId: o.orderId, revokePlan: true, reason: 'test' } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.deepEqual(RZ.refunds, [pid]);
  assert.equal(store.get('payments/' + o.orderId).status, 'refunded');
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'cancelled');
  assert.equal((await call(api('admin/refund'), { token: 'admin-token-0000000000000', body: { orderId: o.orderId } })).status, 409);
});

test('status endpoint never leaks secrets', async () => {
  const r = await call(api('admin/status'), { token: 'admin-token-0000000000000' });
  assert.equal(r.status, 200);
  assert.ok(!JSON.stringify(r.json).includes('test_secret'));
  assert.equal(r.json.mode, 'test');
});

test('public plans endpoint shows admin prices and no private data', async () => {
  store.set('config/billing', { plans: { monthly: { label: 'Monthly', amount: 899, days: 30, active: true }, annual: { label: 'Annual', amount: 6999, days: 365, active: false } }, methods: { razorpay: true, upi: true }, upiId: 'secret@upi' });
  const r = await call(api('public/plans'), { method: 'GET' });
  assert.equal(r.status, 200);
  assert.equal(r.json.plans.find((p) => p.cycle === 'monthly').amount, 899);
  assert.equal(r.json.plans.find((p) => p.cycle === 'annual').active, false);
  assert.ok(!JSON.stringify(r.json).includes('secret@upi'));
});

/* ---------------- hardening regressions ---------------- */
const OWNER = 'owner-token-0000000000000', ADMIN = 'admin-token-0000000000000';
const vbody = (o, pid) => ({ razorpay_order_id: o, razorpay_payment_id: pid, razorpay_signature: sign('test_secret', o + '|' + pid) });
function hook(evt, id) { const raw = JSON.stringify(evt); return call(api('razorpay/webhook'), { raw, headers: Object.assign({ 'x-razorpay-signature': sign('wh_secret', raw) }, id ? { 'x-razorpay-event-id': id } : {}) }); }

test('a suspended store cannot buy its way back, and a late payment does not lift the suspension', async () => {
  const o = await newOrder('monthly');
  store.set('stores/owner1/meta/subscription', { status: 'suspended', businessId: 'owner1' });
  assert.equal((await call(api('razorpay/create-order'), { token: OWNER, body: { cycle: 'monthly' } })).status, 403);
  const pid = payFor(o.orderId, 69900);
  const r = await call(api('razorpay/verify'), { token: OWNER, body: vbody(o.orderId, pid) });
  assert.equal(r.status, 200); assert.equal(r.json.held, true);
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'suspended');
  assert.equal(store.get('payments/' + o.orderId).heldSuspended, true);
  // refund with revoke keeps the suspension
  assert.equal((await call(api('admin/refund'), { token: ADMIN, body: { orderId: o.orderId, revokePlan: true } })).status, 200);
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'suspended');
});

test('a refund that beats the capture webhook blocks activation and is acknowledged (no retry loop)', async () => {
  const o = await newOrder('monthly'); const pid = payFor(o.orderId, 69900);
  assert.equal((await hook({ event: 'refund.processed', payload: { refund: { entity: { id: 'rfnd_A1', payment_id: pid, amount: 69900 } }, payment: { entity: Object.assign({}, RZ.payments[pid], { amount_refunded: 69900 }) } } }, 'evt_r1')).status, 200);
  const w = await hook({ event: 'payment.captured', payload: { payment: { entity: RZ.payments[pid] } } }, 'evt_c1');
  assert.equal(w.status, 200);
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'trialing');
  assert.equal(store.get('webhookEvents/evt_c1').state, 'done');
});

test('refund of a duplicate payment does not mark the plan-buying payment refunded', async () => {
  const o = await newOrder('monthly'); const p1 = payFor(o.orderId, 69900);
  await call(api('razorpay/verify'), { token: OWNER, body: vbody(o.orderId, p1) });
  const p2 = payFor(o.orderId, 69900);
  await hook({ event: 'payment.captured', payload: { payment: { entity: RZ.payments[p2] } } }, 'evt_d1');
  assert.deepEqual(store.get('payments/' + o.orderId).extraPayments, [p2]);
  await hook({ event: 'refund.processed', payload: { refund: { entity: { id: 'rfnd_B1', payment_id: p2, amount: 69900 } }, payment: { entity: RZ.payments[p2] } } }, 'evt_d2');
  assert.equal(store.get('payments/' + o.orderId).status, 'paid');
});

test('verify does not capture a second authorized payment on an already-paid order', async () => {
  const o = await newOrder('monthly'); const p1 = payFor(o.orderId, 69900);
  await call(api('razorpay/verify'), { token: OWNER, body: vbody(o.orderId, p1) });
  const p2 = payFor(o.orderId, 69900, 'authorized');
  const r = await call(api('razorpay/verify'), { token: OWNER, body: vbody(o.orderId, p2) });
  assert.equal(r.status, 402);
  assert.deepEqual(RZ.captures, []);
});

test('verify rejects a payment id from another order even with a valid signature for it', async () => {
  const o1 = await newOrder('monthly'), o2 = await newOrder('monthly');
  const pid = payFor(o1.orderId, 69900);
  const r = await call(api('razorpay/verify'), { token: OWNER, body: vbody(o2.orderId, pid) });
  assert.equal(r.status, 400);
  assert.equal(store.get('payments/' + o2.orderId).appliedAt, undefined);
});

test('webhook ignores non-captured payments and retries events whose processing crashed', async () => {
  const o = await newOrder('monthly'); const pid = payFor(o.orderId, 69900, 'authorized');
  assert.equal((await hook({ event: 'payment.captured', payload: { payment: { entity: RZ.payments[pid] } } }, 'evt_n1')).status, 200);
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'trialing');
  RZ.payments[pid].status = 'captured';
  // a fresh "processing" marker from another run -> ask Razorpay to retry later
  store.set('webhookEvents/evt_n2', { state: 'processing', at: Date.now() });
  assert.equal((await hook({ event: 'payment.captured', payload: { payment: { entity: RZ.payments[pid] } } }, 'evt_n2')).status, 409);
  // a stale marker (crashed run) is taken over and processed
  store.set('webhookEvents/evt_n2', { state: 'processing', at: Date.now() - 10 * 60 * 1000 });
  assert.equal((await hook({ event: 'payment.captured', payload: { payment: { entity: RZ.payments[pid] } } }, 'evt_n2')).status, 200);
  assert.equal(store.get('stores/owner1/meta/subscription').status, 'active');
});

test('refund is claimed atomically and released if the gateway refuses', async () => {
  const o = await newOrder('monthly'); const pid = payFor(o.orderId, 69900);
  await call(api('razorpay/verify'), { token: OWNER, body: vbody(o.orderId, pid) });
  RZ.failRefund = true;
  assert.equal((await call(api('admin/refund'), { token: ADMIN, body: { orderId: o.orderId } })).status, 400);
  assert.equal(store.get('payments/' + o.orderId).status, 'paid');
  store.set('payments/' + o.orderId, Object.assign(store.get('payments/' + o.orderId), { status: 'refunding' }));
  RZ.failRefund = false;
  assert.equal((await call(api('admin/refund'), { token: ADMIN, body: { orderId: o.orderId } })).status, 409);
  assert.deepEqual(RZ.refunds, []);
});

test('oversized bodies are rejected with 413', async () => {
  const big = JSON.stringify({ cycle: 'monthly', pad: 'x'.repeat(70 * 1024) });
  assert.equal((await call(api('razorpay/create-order'), { token: OWNER, raw: big })).status, 413);
  assert.equal((await call(api('razorpay/webhook'), { raw: big, headers: { 'content-length': String(big.length) } })).status, 413);
});

test('admin bootstrap: only listed + verified emails become admin', async () => {
  delete process.env.ADMIN_EMAILS;
  assert.equal((await call(api('admin/bootstrap'), { token: 'owner-token-0000000000000' })).status, 403, 'off when ADMIN_EMAILS is empty');
  process.env.ADMIN_EMAILS = 'boss@vx.in, someone@else.in';
  let r = await call(api('admin/bootstrap'), { token: 'owner-token-0000000000000' });
  assert.equal(r.status, 403); assert.equal(r.json.code, 'not_listed');
  r = await call(api('admin/bootstrap'), { token: 'other-token-0000000000000' });
  assert.equal(r.status, 403); assert.equal(r.json.code, 'unverified');
  assert.equal(CLAIMS.other1, undefined);
  USERS.other1.emailVerified = true;
  r = await call(api('admin/bootstrap'), { token: 'other-token-0000000000000' });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(CLAIMS.other1.platformAdmin, true);
  assert.equal((await call(api('admin/bootstrap'), { token: 'other-token-0000000000000' })).json.already, true);
  assert.equal((await call(api('admin/bootstrap'), {})).status, 401);
  delete process.env.ADMIN_EMAILS;
});

test('account deletion: needs DELETE + fresh sign-in, wipes the store, keeps anonymised payments', async () => {
  const o = await newOrder('monthly');
  store.set('codes/VX-SF-AB12', { storeId: 'owner1', name: 'Shree Fashion' });
  store.set('stores/owner1/products/p1', { name: 'Saree' });
  store.set('stores/owner1/ledger/2026-11-06', { invoices: [] });
  store.set('subscriptions/owner1', { status: 'active' });
  store.set('users/owner1', { storeId: 'owner1' });
  store.set('supportRequests/t1', { uid: 'owner1', message: 'hi' });
  store.set('supportRequests/t2', { uid: 'someone-else', message: 'keep' });
  const tok = TOKENS['owner-token-0000000000000'];
  tok.auth_time = Math.floor(Date.now() / 1000) - 3600;
  let r = await call(api('account/delete'), { token: 'owner-token-0000000000000', body: { confirm: 'DELETE' } });
  assert.equal(r.status, 401, 'old sign-in must be refused'); assert.equal(r.json.code, 'reauth_required');
  tok.auth_time = Math.floor(Date.now() / 1000) - 60;
  r = await call(api('account/delete'), { token: 'owner-token-0000000000000', body: { confirm: 'yes' } });
  assert.equal(r.status, 400);
  r = await call(api('account/delete'), { token: 'owner-token-0000000000000', body: { confirm: 'DELETE' } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.ok(![...store.keys()].some((k) => k.startsWith('stores/owner1')), 'store data removed');
  assert.ok(!store.has('codes/VX-SF-AB12') && !store.has('subscriptions/owner1') && !store.has('users/owner1') && !store.has('supportRequests/t1'));
  assert.ok(store.has('supportRequests/t2'), 'other users untouched');
  const pay = store.get('payments/' + o.orderId);
  assert.ok(pay, 'payment record kept'); assert.equal(pay.email, ''); assert.equal(pay.storeName, '(deleted account)');
  assert.deepEqual(DELETED_USERS, ['owner1']);
  delete tok.auth_time;
});

test('account deletion: staff member leaves the store; admins are refused', async () => {
  store.set('users/other1', { storeId: 'owner1' });
  store.set('stores/owner1/staff/other1', { role: 'cashier', status: 'active' });
  TOKENS['other-token-0000000000000'].auth_time = Math.floor(Date.now() / 1000);
  const r = await call(api('account/delete'), { token: 'other-token-0000000000000', body: { confirm: 'DELETE' } });
  assert.equal(r.status, 200);
  assert.ok(!store.has('stores/owner1/staff/other1')); assert.ok(store.has('stores/owner1/meta/store'), 'owner store kept');
  TOKENS['admin-token-0000000000000'].auth_time = Math.floor(Date.now() / 1000);
  assert.equal((await call(api('account/delete'), { token: 'admin-token-0000000000000', body: { confirm: 'DELETE' } })).status, 403);
});
