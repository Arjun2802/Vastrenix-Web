/* ===================== PLATFORM LAYER =====================
   One codebase, three ways to run:
   1. Inside a claude.ai Artifact  -> shared Artifact database (window.claude)
   2. Android app / website with Firebase config (js/config.js) -> Firebase Auth + Firestore, multi-store
   3. No config -> works offline, saved on this device only                                  */
var IS_NATIVE = !!((window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) || window.VastrenixNative);
var FS = null, AUTH = null, FB_USER = null;

function capPlugin(name) { return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins[name] : null; }

/* ---- native bridge (Android app) ----
   The Android shell exposes window.VastrenixNative as an origin-locked message port. It can only save/share a file
   the app generated, open an allow-listed external link, or tint the system bars. */
function nativePost(msg) { try { if (window.VastrenixNative && typeof window.VastrenixNative.postMessage === 'function') { window.VastrenixNative.postMessage(JSON.stringify(msg)); return true; } } catch (e) { } return false; }
function mimeFor(name) { return /\.pdf$/i.test(name) ? 'application/pdf' : /\.csv$/i.test(name) ? 'text/csv' : /\.json$/i.test(name) ? 'application/json' : /\.png$/i.test(name) ? 'image/png' : /\.jpe?g$/i.test(name) ? 'image/jpeg' : 'text/plain'; }
window.vxNativeUi = function () {
  var dark = isDarkTheme(), bg = getComputedStyle(document.body).backgroundColor, m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg || '');
  var hex = m ? '#' + [m[1], m[2], m[3]].map(function (x) { return ('0' + (+x).toString(16)).slice(-2); }).join('') : '';
  nativePost({ cmd: 'ui', dark: dark, bg: hex });
};

/* ---- file saving outside the Artifact viewer ---- */
function makeLocalDownloads() {
  function toBlob(data, name) { if (data instanceof Blob) return data; return new Blob([data], { type: mimeFor(name) }); }
  function b64(blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(blob); }); }
  return {
    save: async function (req) {
      var blob = toBlob(req.data, req.filename);
      if (window.VastrenixNative) {
        var ok = nativePost({ cmd: 'saveFile', name: req.filename, mime: mimeFor(req.filename), data: await b64(blob), share: req.share !== false });
        if (ok) return { status: 'saved' };
      }
      var fsP = capPlugin('Filesystem'), shareP = capPlugin('Share');
      if (IS_NATIVE && fsP) {
        var w = await fsP.writeFile({ path: req.filename, data: await b64(blob), directory: 'CACHE' });
        if (shareP) { try { await shareP.share({ title: req.filename, files: [w.uri], dialogTitle: req.filename }); } catch (e) { if (!/cancel/i.test(String(e && e.message))) throw e; } }
        return { status: 'saved' };
      }
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = req.filename; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return { status: 'saved' };
    }
  };
}

/* ---- Firestore adapter with the same surface the app uses ---- */
function makeFirestoreDB(fs, prefix) {
  function clean(o) { return JSON.parse(JSON.stringify(o)); }
  function wrapQuery(q) {
    return {
      where: function (f, op, v) { return wrapQuery(q.where(f, op, v)); },
      orderBy: function (f, d) { return wrapQuery(q.orderBy(f, d || 'asc')); },
      limit: function (n) { return wrapQuery(q.limit(n)); },
      get: function () { return q.get(); },
      onSnapshot: function (next, err) { return q.onSnapshot(next, err); }
    };
  }
  function doc(p) {
    var r = fs.doc(prefix + p);
    return {
      id: r.id, path: p,
      get: function () { return r.get(); },
      set: function (o) { return r.set(clean(o)); },
      /* nested maps merge, arrays replace — same semantics as the Artifact store */
      update: function (o) { return r.set(clean(o), { merge: true }); },
      delete: function () { return r.delete(); },
      onSnapshot: function (next, err) { return r.onSnapshot(next, err); },
      acquire: function (opt) {
        return fs.runTransaction(function (tx) {
          return tx.get(r).then(function (s) {
            var now = Date.now(), d = s.exists ? s.data() : null;
            if (d && d.holder && d.holder !== opt.holder && (+d.expiresAt || 0) > now) return { acquired: false, expiresAt: new Date(d.expiresAt).toISOString() };
            tx.set(r, { holder: opt.holder, expiresAt: now + Math.max(1000, Math.min(600000, opt.ttlMs || 30000)) });
            return { acquired: true };
          });
        });
      },
      collection: function (c) { return coll(p + '/' + c); }
    };
  }
  function coll(p) {
    var c = fs.collection(prefix + p), o = wrapQuery(c);
    o.path = p;
    o.doc = function (id) { return doc(p + '/' + (id || c.doc().id)); };
    o.add = function (d) { var r = doc(p + '/' + c.doc().id); return r.set(d).then(function () { return r; }); };
    return o;
  }
  return { doc: doc, collection: coll, firestore: true };
}

/* ---- loading vendor libraries: bundled copy first, CDN as a fallback ---- */
var FB_VER = '10.14.1';
function loadFirebaseLibs() {
  var names = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-firestore-compat.js'];
  return names.reduce(function (p, n) { return p.then(function () { return loadLib(['vendor/' + n]); }); }, Promise.resolve());
}

/* ---- sign in / join gates ---- */
var _gateView = gateView;
gateView = function (g) { if (g === 'login') return gateLogin(); if (g === 'join') return gateJoin(); return _gateView(g); };
function authErr(e) {
  var c = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return t('ae_cred', 'Email or password is wrong.');
  if (/email-already-in-use/.test(c)) return t('ae_used', 'An account with this email already exists. Sign in instead.');
  if (/weak-password/.test(c)) return t('ae_weak', 'Use at least 6 characters for the password.');
  if (/invalid-email/.test(c)) return t('ae_email', 'Enter a valid email address.');
  if (/network/.test(c)) return t('err_net', 'Connection problem. Check your internet and try again.');
  if (/too-many/.test(c)) return t('ae_many', 'Too many attempts. Wait a minute and try again.');
  if (/configuration-not-found/.test(c)) return 'Firebase Auth is not activated yet. In Firebase Console, go to Build → Authentication → "Get started", and enable Email/Password.';
  return (e && e.message) || t('err_generic', 'Something went wrong. Try again.');
}
function gateLogin() {
  var f = S.f.login || (S.f.login = { mode: 'in', name: '', email: '', pass: '', show: false, err: '' });
  var up = f.mode === 'up';
  return '<div class="gate"><div class="box">' +
    '<div class="between"><div class="rowx">' + logo(36) + '<b style="font-size:20px;letter-spacing:-.04em">vastrenix</b></div>' + langMini() + '</div>' +
    '<div class="stack sm" style="padding-top:24px"><h1 style="font-size:30px">' + esc(up ? t('li_up_t', 'Create your account') : t('li_in_t', 'Sign in to your store')) + '</h1><p class="muted">' + esc(up ? t('li_up_b', 'Owners create a store next. Staff join an existing store with its code.') : t('li_in_b', 'Billing, stock and dealer orders — wherever you are.')) + '</p></div>' +
    '<form class="stack" data-form="1">' + (up ? txtF(t('full_name', 'Full name'), 'f.login.name', 'autocomplete="name"') : '') +
    fld(t('email', 'Email'), '<div class="inwrap"><span class="lead">' + icon('mail', 19) + '</span>' + inp('f.login.email', 'type="email" autocomplete="email" inputmode="email"') + '</div>', null, null, 'f-f-login-email') +
    fld(t('password', 'Password'), '<div class="inwrap"><span class="lead">' + icon('lock', 19) + '</span>' + inp('f.login.pass', 'type="' + (f.show ? 'text' : 'password') + '" autocomplete="' + (up ? 'new-password' : 'current-password') + '" data-enter="doLogin"') + '<span class="trail"><button type="button" class="ib plain" data-a="set" data-k="f.login.show" data-v="' + (!f.show) + '" aria-label="' + esc(t('show_pw', 'Show password')) + '">' + icon('eye', 19) + '</button></span></div>', null, null, 'f-f-login-pass') +
    (f.err ? '<div class="banner bad"><span class="ic bad">' + icon('alert', 17) + '</span><span class="tx"><b>' + esc(f.err) + '</b></span></div>' : '') +
    busyBtn(up ? t('li_create', 'Create account') : t('li_continue', 'Continue'), 'doLogin', 'strong lg block', '', 'auth') + '</form>' +
    '<div class="between small">' + (up ? '<span></span>' : '<button class="btn ghost sm" data-a="forgotPw">' + esc(t('li_forgot', 'Forgot password?')) + '</button>') + '<button class="btn ghost sm" data-a="set" data-k="f.login.mode" data-v="' + (up ? 'in' : 'up') + '">' + esc(up ? t('li_have', 'I have an account') : t('li_new', 'New here? Create account')) + '</button></div>' +
    '<div class="sync" style="justify-content:center">' + icon('shield', 14) + esc(t('li_secure', 'Secured by Firebase Authentication')) + '</div></div></div>';
}
function langMini() { return '<div class="seg" style="width:auto">' + [['en', 'EN'], ['hi', 'हि'], ['gu', 'ગુ']].map(function (l) { return '<button type="button" class="' + (LANG === l[0] ? 'on' : '') + '" data-a="setLang" data-v="' + l[0] + '" style="flex:0 0 auto;padding:0 10px">' + l[1] + '</button>'; }).join('') + '</div>'; }
A.doLogin = async function () {
  var f = S.f.login; f.err = '';
  var email = String(f.email || '').trim(), pass = String(f.pass || '');
  if (!email || !pass) { f.err = t('ae_fill', 'Enter your email and password.'); schedule(); return; }
  if (f.mode === 'up' && !String(f.name || '').trim()) { f.err = t('err_name', 'Enter your name'); schedule(); return; }
  S.busy = 'auth'; schedule();
  try {
    if (f.mode === 'up') { var cred = await AUTH.createUserWithEmailAndPassword(email, pass); await cred.user.updateProfile({ displayName: f.name.trim() }); ME.name = f.name.trim(); }
    else await AUTH.signInWithEmailAndPassword(email, pass);
    S.f.login = null;
  } catch (e) { f.err = authErr(e); }
  S.busy = null; schedule();
};
A.forgotPw = async function () {
  var f = S.f.login, email = String(f.email || '').trim();
  if (!email) { f.err = t('ae_email', 'Enter a valid email address.'); schedule(); return; }
  try { await AUTH.sendPasswordResetEmail(email); toast(t('li_reset', 'Password reset link sent to {e}', { e: email })); } catch (e) { f.err = authErr(e); schedule(); }
};
function gateJoin() {
  var f = S.f.join || (S.f.join = { code: '', err: '' });
  return '<div class="gate"><div class="box">' +
    '<div class="between"><div class="rowx">' + logo(36) + '<b style="font-size:20px;letter-spacing:-.04em">vastrenix</b></div><button class="btn ghost sm" data-a="signOut">' + esc(t('sign_out', 'Sign out')) + '</button></div>' +
    '<div class="stack sm"><h1 style="font-size:28px">' + esc(t('jn_t', 'Welcome, {n}', { n: ME.name || '' })) + '</h1><p class="muted">' + esc(t('jn_b', 'Set up a new store, or join the store you work at.')) + '</p></div>' +
    '<section class="card pad stack"><div class="rowx"><span class="ic acc">' + icon('store', 19) + '</span><div class="grow"><b>' + esc(t('jn_own', 'I own a store')) + '</b><div class="small muted">' + esc(t('jn_own_b', 'Create your store and invite your team.')) + '</div></div></div>' + busyBtn(t('jn_create', 'Create a new store'), 'createStore', 'primary', '', 'join') + '</section>' +
    '<section class="card pad stack"><div class="rowx"><span class="ic">' + icon('users', 19) + '</span><div class="grow"><b>' + esc(t('jn_staff', 'I work at a store')) + '</b><div class="small muted">' + esc(t('jn_staff_b', 'Ask the owner for the store code (More → Account, or Dealers → Network).')) + '</div></div></div>' +
    txtF(t('store_code', 'Store code'), 'f.join.code', 'autocapitalize="characters" placeholder="VX-ODF-AB12" style="letter-spacing:.05em" data-enter="joinStore"', null, f.err) + busyBtn(t('jn_join', 'Join store'), 'joinStore', 'strong', '', 'join') + '</section></div></div>';
}
A.createStore = async function () {
  S.busy = 'join'; schedule();
  try {
    var pSet = FS.doc('users/' + ME.id).set({ storeId: ME.id, email: (FB_USER && FB_USER.email) || '', name: ME.name || '' }, { merge: true });
    var pTimeout = new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error('Cloud Firestore database not created yet. In Firebase Console, go to Build → Firestore Database → Create database.'));
      }, 7000);
    });
    await Promise.race([pSet, pTimeout]);
    enterStore(ME.id);
  }
  catch (e) { toast(errText(e), 'bad'); }
  S.busy = null; schedule();
};
A.joinStore = async function () {
  var f = S.f.join, code = String(f.code || '').trim().toUpperCase(); f.err = '';
  if (!code) { f.err = t('jn_err_code', 'Enter the store code'); schedule(); return; }
  if (!/^VX-[A-Z0-9]{2,8}-[A-Z0-9]{4}$/.test(code)) { f.err = t('jn_err_none', 'No store has this code. Check it with the owner.'); schedule(); return; }
  S.busy = 'join'; schedule();
  try {
    var s = await FS.doc('codes/' + code).get();
    if (!s.exists) { f.err = t('jn_err_none', 'No store has this code. Check it with the owner.'); }
    else { var sid = s.data().storeId; await FS.doc('users/' + ME.id).set({ storeId: sid, joinCode: code, email: (FB_USER && FB_USER.email) || '', name: ME.name || '' }, { merge: true }); enterStore(sid); }
  } catch (e) { f.err = errText(e); }
  S.busy = null; schedule();
};
A.signOut = async function () { try { await AUTH.signOut(); } catch (e) { } try { location.hash = ''; } catch (e) { } location.reload(); };
/* Returns false when the code is already registered to another store, so onboarding can pick a new one
   (otherwise staff entering this store's code would be sent to whoever registered it first). */
window.VX_onStoreCreated = async function (code, name) { if (!FS || !code) return true; try { await FS.doc('codes/' + code).set({ storeId: ME.id, name: String(name || '').slice(0, 120) }); return true; } catch (e) { console.warn('code register failed', e); return false; } };
function vxExtraMore() {
  if (!AUTH) return '';
  var st = storeV();
  return '<section class="stack sm"><div class="sect"><h2>' + esc(t('account', 'Account')) + '</h2></div><div class="card pad stack">' +
    '<div class="between small"><span class="muted">' + esc(t('email', 'Email')) + '</span><b>' + esc((FB_USER && FB_USER.email) || '') + '</b></div>' +
    (st.code ? '<div class="between small"><span class="muted">' + esc(t('store_code', 'Store code')) + '</span><button class="btn soft xs" data-a="copy" data-v="' + esc(st.code) + '">' + icon('copy', 14) + esc(st.code) + '</button></div>' : '') +
    '<button class="btn danger" data-a="signOut">' + icon('logout', 17) + esc(t('sign_out', 'Sign out')) + '</button></div></section>';
}

/* ---- store entry after sign-in ---- */
function enterStore(sid) {
  window.FS = FS; window.AUTH = AUTH;
  DB = makeFirestoreDB(FS, 'stores/' + sid + '/');
  ME.isOwner = sid === ME.id; ME.canEdit = ME.isOwner; ME.gate = 'boot';
  watchDoc('store', DB.doc('meta/store'));
  watchDoc('subscription', DB.doc('meta/subscription'));
  setTimeout(function () {
    if (!D.loaded.store) {
      D.storeTimeout = true;
      schedule();
    }
  }, 5000);
  if (ME.isOwner) { evalIdentity(); return; }
  watchDoc('myStaff', DB.doc('staff/' + ME.id), function (d) { ME.staffDoc = d; ME.canEdit = !!(d && d.status === 'active' && d.role === 'admin'); evalIdentity(); });
  watchDoc('myReq', DB.doc('requests/' + ME.id), function (d) { ME.reqDoc = d; evalIdentity(); });
}
A.useOfflineMode = function () {
  D.storeTimeout = false;
  MODE = 'local';
  DB = makeLocalDB();
  ME.isOwner = true;
  ME.canEdit = true;
  ME.role = 'owner';
  ME.gate = 'ready';
  startData();
  schedule();
};
async function bootFirebase(cfg) {
  applyTheme();
  var st = document.createElement('style'); st.textContent = IVX_CSS; document.head.appendChild(st);
  var h = (location.hash || '').slice(1); if (h && ROUTES[h]) S.route = h;
  DL = makeLocalDownloads();
  render();
  try { await loadFirebaseLibs(); }
  catch (e) { console.warn('Firebase not reachable, using device storage', e); return boot(); }
  firebase.initializeApp(cfg.firebase);
  FS = firebase.firestore();
  try { await FS.enablePersistence({ synchronizeTabs: true }); } catch (e) { }
  AUTH = firebase.auth();
  MODE = 'live'; schedule();
  AUTH.onAuthStateChanged(async function (u) {
    FB_USER = u;
    if (!u) { ME.gate = 'login'; schedule(); return; }
    ME.id = u.uid; ME.name = u.displayName || ME.name || String(u.email || '').split('@')[0]; ME.avatar = '';
    ME.gate = 'boot'; schedule();
    var sid = null;
    try { var ud = await FS.doc('users/' + u.uid).get(); sid = ud.exists ? ud.data().storeId : null; } catch (e) { }
    if (!sid) { ME.gate = 'join'; schedule(); return; }
    enterStore(sid);
  });
}

/* ---- Android niceties: hardware back button, external links ---- */
function nativeSetup() {
  var isNativeAndroid = !!(window.VastrenixNative || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()));
  if (isNativeAndroid) {
    document.documentElement.classList.add('native');
    setTimeout(window.vxNativeUi, 0);
    if (window.matchMedia) { try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { window.vxNativeUi(); }); } catch (e) { } }
  }
  var app = capPlugin('App');
  if (app && app.addListener) {
    app.addListener('backButton', function () {
      if (S.sheet) { closeSheet(); return; }
      if (S.sub) { backSub(); return; }
      if (S.route !== 'home') { go('home'); return; }
      if (app.minimizeApp) app.minimizeApp(); else if (app.exitApp) app.exitApp();
    });
  }
  /* links that open other apps (WhatsApp, browser) leave the WebView cleanly through the native system */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href) return;
    e.preventDefault();
    e.stopPropagation();
    if (!nativePost({ cmd: 'open', url: href })) window.open(href, '_blank', 'noopener,noreferrer');
  }, true);
}

/* ---- start ---- */
(function startApp() {
  nativeSetup();
  if (!window.QRCode && !window.qrcode && !(window.claude && window.claude.use)) loadLib(['vendor/qrcode.js']).then(function () { schedule(); }).catch(function () { });
  var cfg = window.VX_CONFIG || {};
  var inArtifact = !!(window.claude && window.claude.use);
  if (!inArtifact && cfg.firebase && cfg.firebase.apiKey) { bootFirebase(cfg); return; }
  if (!inArtifact) DL = makeLocalDownloads();
  boot();
})();
