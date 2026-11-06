'use strict';
/* POST /api/admin/bootstrap — makes the signed-in user a platform admin, without any terminal or key download.
   Allowed only when ALL of these hold:
     - the account's email is listed in the ADMIN_EMAILS environment variable (Vercel, comma-separated);
     - that email is VERIFIED (so nobody can claim admin by signing up first with someone else's address).
   To remove an admin later: take the email out of ADMIN_EMAILS and run scripts/set-admin.js --revoke. */
const { auth, db } = require('../_lib/firebase');
const { handler, requireUser, send, HttpError } = require('../_lib/http');

module.exports = handler(['POST', 'OPTIONS'], async (req, res) => {
  const tok = await requireUser(req);
  const list = String(process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!list.length) throw new HttpError(403, 'Admin sign-up is switched off. Add ADMIN_EMAILS in Vercel and redeploy.', 'disabled');

  const user = await auth().getUser(tok.uid); // fresh from Firebase, not just the token
  const email = String(user.email || '').toLowerCase();
  if (!email || !list.includes(email)) throw new HttpError(403, 'This email is not on the admin list (ADMIN_EMAILS).', 'not_listed');
  if (user.emailVerified !== true) throw new HttpError(403, 'Verify your email first, then try again.', 'unverified');
  if (user.disabled) throw new HttpError(403, 'This account is disabled.', 'disabled_user');

  const claims = Object.assign({}, user.customClaims || {});
  const already = claims.platformAdmin === true;
  if (!already) {
    claims.platformAdmin = true;
    await auth().setCustomUserClaims(user.uid, claims);
    await db().collection('adminLog').add({ at: Date.now(), by: user.uid, email, action: 'admin.bootstrap', storeId: '', details: {} });
  }
  send(res, 200, { ok: true, already });
});
