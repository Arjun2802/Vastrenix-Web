'use strict';
/* POST /api/razorpay/verify   body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   Called by the store app right after Checkout succeeds. The webhook does the same work as a backup. */
const { db } = require('../_lib/firebase');
const { handler, readJson, requireUser, send, HttpError } = require('../_lib/http');
const rzp = require('../_lib/razorpay');
const { activateFromPayment } = require('../_lib/billing');

const ORDER_ID = /^order_[A-Za-z0-9]{6,30}$/, PAY_ID = /^pay_[A-Za-z0-9]{6,30}$/;

module.exports = handler(['POST', 'OPTIONS'], async (req, res) => {
  const user = await requireUser(req);
  const b = await readJson(req);
  const orderId = String(b.razorpay_order_id || ''), paymentId = String(b.razorpay_payment_id || ''), sig = String(b.razorpay_signature || '');
  if (!ORDER_ID.test(orderId) || !PAY_ID.test(paymentId)) throw new HttpError(400, 'Invalid payment reference.', 'bad_request');

  const paySnap = await db().doc('payments/' + orderId).get();
  if (!paySnap.exists) throw new HttpError(404, 'Unknown order.', 'unknown_order');
  const pay = paySnap.data();
  if (pay.uid !== user.uid) throw new HttpError(403, 'This payment belongs to another account.', 'forbidden');

  if (!rzp.verifyPaymentSignature(orderId, paymentId, sig)) {
    throw new HttpError(400, 'Payment could not be verified. If money was deducted, it will be confirmed automatically or refunded.', 'bad_signature');
  }
  if (pay.appliedAt && pay.paymentId === paymentId) return send(res, 200, { ok: true, already: true, expiresAt: pay.expiresAtAfter, held: !!pay.heldSuspended });
  if (pay.status === 'refunded' || pay.status === 'refunding') throw new HttpError(409, 'This payment was refunded.', 'refunded');

  // Trust the gateway, not the browser: the payment must belong to this order, for the full amount.
  let p = await rzp.fetchPayment(paymentId);
  const matches = (x) => x && x.id === paymentId && x.order_id === orderId && +x.amount === pay.amount * 100 && x.currency === 'INR';
  if (!matches(p)) throw new HttpError(400, 'Payment does not match this order.', 'mismatch');
  // Only capture if this order has not already been paid by another payment (avoid taking money twice).
  if (p.status === 'authorized' && !pay.appliedAt) {
    try { p = await rzp.capture(paymentId, pay.amount * 100, 'INR'); }
    catch (e) { p = await rzp.fetchPayment(paymentId); } // the webhook / auto-capture may have captured it meanwhile
    if (!matches(p)) throw new HttpError(400, 'Payment does not match this order.', 'mismatch');
  }
  if (p.status !== 'captured') throw new HttpError(402, 'Payment is not complete yet (' + String(p.status).slice(0, 20) + ').', 'not_captured');

  const r = await activateFromPayment(orderId, paymentId, 'checkout', String(p.method || '').slice(0, 20));
  send(res, 200, { ok: true, already: r.already, expiresAt: r.expiresAt, held: !!r.held });
});
