'use strict';
/* POST /api/admin/refund   body: { orderId, revokePlan: boolean, reason }   auth: platform admin
   Refunds a captured Razorpay payment in full and, optionally, takes back the plan time it bought. */
const { db } = require('../_lib/firebase');
const { handler, readJson, requireUser, send, HttpError } = require('../_lib/http');
const rzp = require('../_lib/razorpay');
const { DAY } = require('../_lib/billing');

module.exports = handler(['POST', 'OPTIONS'], async (req, res) => {
  const adminUser = await requireUser(req, { admin: true });
  const b = await readJson(req);
  const orderId = String(b.orderId || '');
  if (!/^order_[A-Za-z0-9]{6,30}$/.test(orderId)) throw new HttpError(400, 'Invalid order id.');
  const reason = String(b.reason || '').slice(0, 200);

  const ref = db().doc('payments/' + orderId);
  // Claim the order first (atomically), so two concurrent refund clicks can't both reach the gateway.
  const pay = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, 'Unknown order.', 'unknown_order');
    const d = snap.data();
    if (d.status === 'refunded' || d.status === 'refunding' || d.refundId) throw new HttpError(409, 'Already refunded (or a refund is in progress).', 'already_refunded');
    if (d.status !== 'paid' || !d.paymentId) throw new HttpError(409, 'Only paid orders can be refunded.', 'not_paid');
    tx.update(ref, { status: 'refunding', refundStartedAt: Date.now(), refundedBy: adminUser.uid });
    return d;
  });

  let r;
  try {
    r = await rzp.refund(pay.paymentId, { amount: pay.amount * 100, notes: { reason: reason || 'admin refund', by: adminUser.uid } });
  } catch (e) {
    // The gateway refused (or was unreachable): release the claim so the admin can retry.
    await ref.update({ status: 'paid', lastError: 'refund_failed' }).catch(() => {});
    throw e;
  }
  const now = Date.now();
  await ref.update({ status: 'refunded', refundId: String(r.id || ''), refundedAt: now, refundAmount: pay.amount, refundReason: reason, refundedBy: adminUser.uid });

  let newExpiry = null;
  // A payment held because the store was suspended never added plan time, so there is nothing to take back.
  if (b.revokePlan === true && !pay.heldSuspended) {
    const subRef = db().doc('stores/' + pay.sid + '/meta/subscription');
    await db().runTransaction(async (tx) => {
      const s = await tx.get(subRef); if (!s.exists) return;
      const cur = s.data();
      newExpiry = Math.max(now, (+cur.expiresAt || now) - pay.days * DAY);
      // Never turn a suspended store into a merely "cancelled" one (that would let it pay its way back in).
      const upd = newExpiry <= now + 60000 && cur.status !== 'suspended' ? { status: 'cancelled', expiresAt: now, updatedAt: now } : { expiresAt: newExpiry, updatedAt: now };
      tx.set(subRef, upd, { merge: true });
      tx.set(db().doc('subscriptions/' + pay.sid), upd, { merge: true });
    });
  }
  await db().collection('adminLog').add({ at: now, by: adminUser.uid, email: adminUser.email || '', action: 'razorpay.refund', storeId: pay.sid, details: { orderId, paymentId: pay.paymentId, amount: pay.amount, revokePlan: b.revokePlan === true, newExpiry, reason } });
  send(res, 200, { ok: true, refundId: r.id, newExpiry });
});
