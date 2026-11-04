'use strict';
/* POST /api/razorpay/webhook   — set this URL in Razorpay Dashboard → Settings → Webhooks with the events
   payment.captured, payment.failed, order.paid, refund.processed and the secret in RAZORPAY_WEBHOOK_SECRET.
   Activates plans even if the customer closed the app before the verify call finished.
   Response codes: 2xx = handled (or permanently unprocessable), 4xx/5xx = Razorpay retries later. */
const { db, FieldValue } = require('../_lib/firebase');
const { readRaw, send, HttpError } = require('../_lib/http');
const rzp = require('../_lib/razorpay');
const { activateFromPayment } = require('../_lib/billing');

const ORDER_ID = /^order_[A-Za-z0-9]{6,30}$/;
const STALE_MS = 2 * 60 * 1000; // a "processing" marker older than this belongs to a crashed/timed-out run

async function handle(evt) {
  const p = evt.payload || {};
  const pay = p.payment && p.payment.entity;
  const refund = p.refund && p.refund.entity;
  switch (evt.event) {
    case 'payment.captured':
    case 'order.paid': {
      if (!pay || !ORDER_ID.test(String(pay.order_id || '')) || pay.status !== 'captured') return;
      const snap = await db().doc('payments/' + pay.order_id).get();
      if (!snap.exists) { console.warn('[webhook] payment for unknown order', pay.order_id); return; }
      const d = snap.data();
      if (+pay.amount !== d.amount * 100 || pay.currency !== 'INR') {
        console.error('[webhook] amount mismatch', pay.order_id);
        await snap.ref.update({ lastError: 'amount_mismatch' });
        return;
      }
      await activateFromPayment(pay.order_id, String(pay.id), 'webhook', String(pay.method || '').slice(0, 20));
      return;
    }
    case 'payment.failed': {
      if (!pay || !ORDER_ID.test(String(pay.order_id || ''))) return;
      const ref = db().doc('payments/' + pay.order_id);
      await db().runTransaction(async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists) return;
        const d = s.data();
        if (d.appliedAt || !['created', 'failed'].includes(d.status)) return; // a later attempt may already have succeeded
        tx.update(ref, { status: 'failed', lastError: String(pay.error_description || pay.error_reason || 'failed').slice(0, 200), failedAt: Date.now() });
      });
      return;
    }
    case 'refund.processed': {
      if (!refund || !refund.payment_id) return;
      let ref;
      if (pay && ORDER_ID.test(String(pay.order_id || ''))) ref = db().doc('payments/' + pay.order_id);
      else {
        const q = await db().collection('payments').where('paymentId', '==', String(refund.payment_id)).limit(1).get();
        if (q.empty) return;
        ref = q.docs[0].ref;
      }
      await db().runTransaction(async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists) return;
        const d = s.data(), now = Date.now();
        const refundedPaise = Math.max(+refund.amount || 0, +(pay && pay.amount_refunded) || 0);
        if (d.paymentId && d.paymentId === refund.payment_id) {
          // The payment that bought the plan.
          const full = refundedPaise >= d.amount * 100;
          tx.update(ref, Object.assign({ refundId: String(refund.id || ''), refundAmount: Math.round(refundedPaise / 100) },
            full ? { status: 'refunded', refundedAt: d.refundedAt || now } : { partialRefundAt: now }));
        } else {
          // Not (yet) the applied payment: a duplicate payment, or a refund that beat the capture webhook.
          // Remember it so this payment can never activate the plan afterwards.
          tx.update(ref, { refundedPayments: FieldValue.arrayUnion(String(refund.payment_id)) });
        }
      });
      return;
    }
    default: return;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  let raw;
  try { raw = await readRaw(req); } catch (e) { return send(res, e.status || 400, { error: 'bad body' }); }
  const sig = String(req.headers['x-razorpay-signature'] || '');
  let ok = false;
  try { ok = rzp.verifyWebhookSignature(raw, sig); } catch (e) { return send(res, 503, { error: 'not configured' }); }
  if (!ok) return send(res, 401, { error: 'bad signature' });

  let evt;
  try { evt = JSON.parse(raw.toString('utf8')); } catch (e) { return send(res, 400, { error: 'bad json' }); }
  if (!evt || typeof evt !== 'object') return send(res, 400, { error: 'bad json' });

  // Each event is processed once (Razorpay retries on any non-2xx). All handlers are idempotent anyway; the
  // marker only saves work. A marker left by a run that crashed is taken over once it is stale.
  const eventId = String(req.headers['x-razorpay-event-id'] || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 64);
  const evRef = eventId ? db().doc('webhookEvents/' + eventId) : null;
  if (evRef) {
    const claimed = await db().runTransaction(async (tx) => {
      const s = await tx.get(evRef), now = Date.now();
      if (s.exists) {
        const d = s.data() || {};
        if (d.state === 'done') return 'done';
        if (now - (+d.at || 0) < STALE_MS) return 'busy';
      }
      tx.set(evRef, { event: String(evt.event || '').slice(0, 60), state: 'processing', at: now });
      return 'ok';
    });
    if (claimed === 'done') return send(res, 200, { ok: true, duplicate: true });
    if (claimed === 'busy') return send(res, 409, { error: 'in progress' }); // retried later by Razorpay
  }

  try {
    await handle(evt);
  } catch (e) {
    if (e instanceof HttpError && e.status < 500) {
      // Permanent (e.g. refunded before activation): acknowledge so Razorpay stops retrying.
      console.warn('[webhook]', evt.event, e.code, e.message);
    } else {
      // Let Razorpay retry: forget the event id so the retry is processed.
      if (evRef) await evRef.delete().catch(() => {});
      console.error('[webhook]', evt.event, e && (e.stack || e.message));
      return send(res, 500, { error: 'processing failed' });
    }
  }
  if (evRef) await evRef.set({ state: 'done', doneAt: Date.now() }, { merge: true }).catch(() => {});
  send(res, 200, { ok: true });
};
