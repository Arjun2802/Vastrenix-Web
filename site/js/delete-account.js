/* Vastrenix — account deletion page. Signs in (session-only, nothing is remembered), then asks the
   server (/api/account/delete) to delete the account. The server requires a sign-in from the last 15 minutes. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.VX_CONFIG && window.VX_CONFIG.firebase;
  var apiBase = String((window.VX_CONFIG && window.VX_CONFIG.billing && window.VX_CONFIG.billing.apiBase) || '').replace(/\/+$/, '');
  if (!window.firebase || !cfg || !cfg.apiKey) { $('del-login-err').textContent = 'Online deletion is unavailable right now. Please use the app or email us.'; $('del-signin').disabled = true; return; }
  var app = firebase.initializeApp(cfg, 'vx-delete'), auth = app.auth();
  auth.setPersistence(firebase.auth.Auth.Persistence.NONE).catch(function () { });

  function loginMsg(e) {
    var c = (e && e.code) || '';
    if (/invalid|wrong|not-found|user-disabled/.test(c)) return 'Email or password is wrong.';
    if (/too-many/.test(c)) return 'Too many attempts. Wait a few minutes and try again.';
    if (/network/.test(c)) return 'Connection problem. Check your internet and try again.';
    return 'Could not sign in. Please try again.';
  }
  function show(step) { $('del-login').hidden = step !== 'login'; $('del-confirm').hidden = step !== 'confirm'; $('del-done').hidden = step !== 'done'; }

  $('del-login').addEventListener('submit', async function (e) {
    e.preventDefault(); $('del-login-err').textContent = '';
    var email = $('del-email').value.trim(), pass = $('del-pass').value;
    if (!email || !pass) { $('del-login-err').textContent = 'Enter your email and password.'; return; }
    $('del-signin').disabled = true;
    try {
      var cred = await auth.signInWithEmailAndPassword(email, pass);
      $('del-who').textContent = cred.user.email || email; $('del-pass').value = '';
      show('confirm'); $('del-type').focus();
    } catch (x) { $('del-login-err').textContent = loginMsg(x); }
    $('del-signin').disabled = false;
  });

  $('del-forgot').addEventListener('click', async function () {
    var email = $('del-email').value.trim();
    if (!email) { $('del-login-err').textContent = 'Enter your email first, then tap Forgot password.'; return; }
    try { await auth.sendPasswordResetEmail(email); } catch (x) { }
    $('del-login-err').textContent = 'If an account exists for ' + email + ', a password reset link is on its way.';
  });

  $('del-cancel').addEventListener('click', function () { auth.signOut(); $('del-type').value = ''; show('login'); });

  $('del-confirm').addEventListener('submit', async function (e) {
    e.preventDefault(); $('del-err').textContent = '';
    if ($('del-type').value.trim().toUpperCase() !== 'DELETE') { $('del-err').textContent = 'Type DELETE to confirm.'; return; }
    var u = auth.currentUser; if (!u) { show('login'); return; }
    $('del-go').disabled = true;
    try {
      var tok = await u.getIdToken(true), r;
      try { r = await fetch(apiBase + '/api/account/delete', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ confirm: 'DELETE' }) }); }
      catch (x) { throw new Error('Connection problem. Check your internet and try again.'); }
      var j = {}; try { j = await r.json(); } catch (x) { }
      if (!r.ok) {
        if (j.code === 'reauth_required') { await auth.signOut(); show('login'); $('del-login-err').textContent = 'Please sign in again to confirm it’s you.'; $('del-go').disabled = false; return; }
        throw new Error(j.error || ('Deletion failed (' + r.status + '). Please email contact@vastrenix.com and we’ll do it for you.'));
      }
      try { await auth.signOut(); } catch (x) { }
      show('done');
    } catch (x) { $('del-err').textContent = x.message || String(x); }
    $('del-go').disabled = false;
  });
})();
