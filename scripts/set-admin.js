#!/usr/bin/env node
/* Grants (or revokes) access to the Vastrenix admin console by setting the Firebase custom claim `platformAdmin`.
 *
 *   Usage:  GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json node scripts/set-admin.js you@company.com
 *           GOOGLE_APPLICATION_CREDENTIALS=... node scripts/set-admin.js you@company.com --revoke
 *
 * The service-account key is an admin credential for the whole project:
 *   - keep it OUTSIDE this repository, never commit, email or upload it;
 *   - delete the key in Google Cloud → IAM → Service accounts once you're done.
 * The person must sign out and back in to the admin console for the change to apply. */
const admin = require('firebase-admin');

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes('--revoke');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Usage: node scripts/set-admin.js <email> [--revoke]');
    process.exit(1);
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of a service-account JSON kept outside the repo.');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
  const user = await admin.auth().getUserByEmail(email);
  const claims = Object.assign({}, user.customClaims || {});
  if (revoke) delete claims.platformAdmin; else claims.platformAdmin = true;
  await admin.auth().setCustomUserClaims(user.uid, claims);
  await admin.auth().revokeRefreshTokens(user.uid); // forces a fresh sign-in so the claim takes effect
  console.log(`${revoke ? 'Revoked' : 'Granted'} platform admin for ${email} (uid ${user.uid}). They must sign in again.`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
