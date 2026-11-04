'use strict';
/* Firebase Admin SDK, initialised once per serverless instance.
   Credentials come ONLY from the FIREBASE_SERVICE_ACCOUNT environment variable (Vercel → Settings →
   Environment Variables), as the raw JSON or base64 of it. Never commit a service-account file. */
const admin = require('firebase-admin');

function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
  if (!raw) throw Object.assign(new Error('Server is not configured (FIREBASE_SERVICE_ACCOUNT missing).'), { status: 503 });
  let json = raw.trim();
  if (!json.startsWith('{')) json = Buffer.from(json, 'base64').toString('utf8');
  let sa;
  // Never let the parser's error (which quotes part of the input) put key material into the logs.
  try { sa = JSON.parse(json); } catch (e) { throw Object.assign(new Error('Server is not configured (FIREBASE_SERVICE_ACCOUNT is not valid JSON).'), { status: 503 }); }
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

function app() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(credentials()) });
  return admin.app();
}

module.exports = {
  admin,
  db: () => app().firestore(),
  auth: () => app().auth(),
  FieldValue: admin.firestore.FieldValue
};
