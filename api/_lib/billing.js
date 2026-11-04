'use strict';
/* Plans, prices and the one place a paid plan is activated. */
const { db, FieldValue } = require('./firebase');
const { HttpError } = require('./http');

const DAY = 864e5;
const CYCLES = ['monthly', 'quarterly', 'annual'];
const DEFAULTS = {
  plans: {
    monthly: { label: 'Monthly', amount: 699, days: 30, active: true },
    quarterly: { label: '3 Months', amount: 1899, days: 90, active: true },
    annual: { label: 'Annual', amount: 6999, days: 365, active: true }
  },
  methods: { razorpay: true, upi: true }
};

/** Billing settings managed from the admin console (config/billing), with safe defaults. */
async function loadConfig(tx) {
  const ref = db().doc('config/billing');
  const snap = tx ? await tx.get(ref) : await ref.get();
  const c = snap.exists ? snap.data() : {};
  const plans = {};
  CYCLES.forEach((k) => {
    const p = Object.assign({}, DEFAULTS.plans[k], (c.plans || {})[k] || {});
    plans[k] = { label: String(p.label || k).slice(0, 40), amount: Math.round(+p.amount), days: Math.round(+p.days), active: p.active !== false };
  });
  return { plans, methods: Object.assign({}, DEFAULTS.methods, c.methods || {}) };
}

function planFor(cfg, cycle) {
  if (!CYCLES.includes(cycle)) throw new HttpError(400, 'Unknown plan.', 'bad_plan');
  const p = cfg.plans[cycle];
  if (!p.active) throw new HttpError(400, 'This plan is not available right now.', 'plan_inactive');
  if (!Number.isInteger(p.amount) || p.amount < 1 || p.amount > 500000 || !Number.isInteger(p.days) || p.days < 1 || p.days > 1100) {
    throw new HttpError(503, 'This plan is misconfigured. Please contact support.', 'plan_misconfigured');
  }
  return p;
}

/**
 * Activates (or extends) a store's plan for a captured Razorpay payment. Idempotent: the verify call, the
 * webhook and retries can all arrive, but each order extends the plan exactly once.
 */
async function activateFromPayment(orderId, paymentId, via, method) {
  const store = db();
  const payRef = store.doc('payments/' + orderId);
  return store.runTransaction(async (tx) => {
    const paySnap = await tx.get(payRef);
    if (!paySnap.exists) throw new HttpError(404, 'Unknown order.', 'unknown_order');
    const pay = paySnap.data();
    if (pay.appliedAt) {
      // A second, different captured payment on an order that already bought its plan (late authorisation,
      // double tap): keep the money visible to the admin for a refund instead of silently swallowing it.
      if (paymentId && pay.paymentId && paymentId !== pay.paymentId && !(pay.extraPayments || []).includes(paymentId)) {
        tx.update(payRef, { extraPayments: FieldValue.arrayUnion(paymentId), lastError: 'duplicate_payment' });
        tx.set(store.collection('adminLog').doc(), {
          at: Date.now(), by: 'system', email: 'razorpay', action: 'razorpay.duplicate', storeId: pay.sid,
          details: { orderId, paymentId, appliedPaymentId: pay.paymentId, amount: pay.amount, note: 'Second payment on a paid order. Refund it from the Razorpay dashboard.' }
        });
      }
      return { already: true, expiresAt: pay.expiresAtAfter, sid: pay.sid };
    }
    if (pay.status === 'refunded' || pay.status === 'refunding' || (pay.refundedPayments || []).includes(paymentId)) {
      throw new HttpError(409, 'This payment was refunded.', 'refunded');
    }

    const sid = pay.sid;
    const subRef = store.doc('stores/' + sid + '/meta/subscription');
    const mirRef = store.doc('subscriptions/' + sid);
    const subSnap = await tx.get(subRef);
    const cur = subSnap.exists ? subSnap.data() : {};
    const now = Date.now();

    // A platform admin suspended this store: a payment must not lift the suspension. Record it for review.
    if (cur.status === 'suspended') {
      tx.update(payRef, { status: 'paid', paymentId, paidAt: now, appliedAt: now, heldSuspended: true, expiresAtAfter: null, via, method: method || '', lastError: 'store_suspended' });
      tx.set(store.collection('adminLog').doc(), {
        at: now, by: 'system', email: 'razorpay', action: 'razorpay.paid_suspended', storeId: sid,
        details: { orderId, paymentId, cycle: pay.cycle, amount: pay.amount, via, note: 'Store is suspended; plan not activated. Refund or activate manually.' }
      });
      return { already: false, held: true, expiresAt: null, sid };
    }
    const base = cur.status === 'active' && +cur.expiresAt > now ? +cur.expiresAt : now;
    const expiresAt = base + pay.days * DAY;

    const upd = {
      businessId: sid, status: 'active', cycleId: pay.cycle, subscribedAt: now, expiresAt, updatedAt: now,
      lastPayment: { provider: 'razorpay', orderId, paymentId, amount: pay.amount, at: now }
    };
    if (!subSnap.exists) Object.assign(upd, { trialStartedAt: now, trialEndsAt: now, createdAt: now });
    tx.set(subRef, upd, { merge: true });
    tx.set(mirRef, upd, { merge: true });
    tx.update(payRef, { status: 'paid', paymentId, paidAt: now, appliedAt: now, expiresAtAfter: expiresAt, via, method: method || '' });
    tx.set(store.collection('adminLog').doc(), {
      at: now, by: 'system', email: 'razorpay', action: 'razorpay.paid', storeId: sid,
      details: { orderId, paymentId, cycle: pay.cycle, amount: pay.amount, expiresAt, via }
    });
    return { already: false, expiresAt, sid };
  });
}

module.exports = { DAY, CYCLES, DEFAULTS, loadConfig, planFor, activateFromPayment, FieldValue };
