'use strict';
/* POST /api/admin/status — lets the admin console show whether the payment server is set up.
   Returns booleans only; never echoes secrets. */
const { handler, requireUser, send } = require('../_lib/http');
const rzp = require('../_lib/razorpay');

module.exports = handler(['POST', 'OPTIONS'], async (req, res) => {
  await requireUser(req, { admin: true });
  send(res, 200, {
    firebase: true,
    razorpay: rzp.configured(),
    mode: rzp.mode(),
    keyIdSuffix: rzp.configured() ? rzp.keys().id.slice(-4) : '',
    webhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET
  });
});
