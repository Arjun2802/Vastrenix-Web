'use strict';
/* POST /api/account/delete   body: { confirm: "DELETE" }   auth: the user's Firebase ID token from a FRESH sign-in
   Permanently deletes the signed-in user's account and their data:
     - store owner: the whole store (items, bills, customers, staff, settings…), its store code, subscription
       mirror and pending UPI request;
     - staff member: their staff entry / join request in the store they belonged to;
     - their support tickets, profile and rate-limit record; then the Firebase Auth login itself.
   Razorpay payment records are kept (tax and accounting law) but the email and store name on them are erased.
   Used by the website page /delete-account/ and the store app (More → Delete account). */
const { db, auth } = require('../_lib/firebase');
const { handler, readJson, requireUser, send, HttpError } = require('../_lib/http');

const FRESH_LOGIN_MS = 15 * 60 * 1000;

async function deleteQuery(q) {
  const s = await q.get();
  await Promise.all(s.docs.map((d) => d.ref.delete()));
  return s.size;
}

module.exports = handler(['POST', 'OPTIONS'], async (req, res) => {
  const tok = await requireUser(req);
  const body = await readJson(req);
  if (body.confirm !== 'DELETE') throw new HttpError(400, 'Type DELETE to confirm.', 'confirm_required');
  // A stolen or old session must not be enough to destroy an account: require a sign-in in the last 15 minutes.
  if (!tok.auth_time || Date.now() - tok.auth_time * 1000 > FRESH_LOGIN_MS) {
    throw new HttpError(401, 'For your security, sign in again and then delete your account.', 'reauth_required');
  }
  if (tok.platformAdmin === true) throw new HttpError(403, 'Platform admin accounts can’t be deleted here. Remove admin access first.', 'is_admin');

  const uid = tok.uid, store = db(), summary = { store: false, staff: 0, tickets: 0 };

  // 1. Store this user owns (store id = owner uid)
  const storeRef = store.doc('stores/' + uid);
  const owned = await store.doc('stores/' + uid + '/meta/store').get();
  if (owned.exists) {
    summary.store = true;
    await store.recursiveDelete(storeRef);
    await deleteQuery(store.collection('codes').where('storeId', '==', uid));
    await store.doc('subscriptions/' + uid).delete().catch(() => {});
    await store.doc('subscriptionRequests/' + uid).delete().catch(() => {});
  }
  // 2. Staff membership in someone else's store
  const prof = await store.doc('users/' + uid).get();
  const joined = prof.exists ? String(prof.data().storeId || '') : '';
  if (joined && joined !== uid && /^[A-Za-z0-9]{6,128}$/.test(joined)) {
    await store.doc('stores/' + joined + '/staff/' + uid).delete().catch(() => {});
    await store.doc('stores/' + joined + '/requests/' + uid).delete().catch(() => {});
    summary.staff = 1;
  }
  // 3. Personal records
  summary.tickets = await deleteQuery(store.collection('supportRequests').where('uid', '==', uid));
  await store.doc('users/' + uid).delete().catch(() => {});
  await store.doc('rateLimits/' + uid).delete().catch(() => {});
  // 4. Payment records stay for accounting, without personal details
  const pays = await store.collection('payments').where('uid', '==', uid).get();
  await Promise.all(pays.docs.map((d) => d.ref.update({ email: '', storeName: '(deleted account)', accountDeletedAt: Date.now() })));

  await store.collection('adminLog').add({ at: Date.now(), by: uid, email: '', action: 'account.delete', storeId: owned.exists ? uid : '', details: Object.assign({ payments: pays.size }, summary) });
  // 5. Finally the login itself
  await auth().deleteUser(uid);
  send(res, 200, { ok: true });
});
