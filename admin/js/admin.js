/* Vastrenix Admin console
   ---------------------------------------------------------------------------
   Who can use it: accounts with the Firebase custom claim  platformAdmin: true  (set with scripts/set-admin.js).
   The claim is checked here for UX, but the real gate is firestore.rules — without the claim every read fails.
   Rendering: every value from the database is inserted with textContent (the h() helper), never as HTML. */
(function () {
  'use strict';
  var CFG = window.VX_ADMIN_CONFIG || {};
  var PLANS = CFG.plans || {};
  var DAY = 864e5;

  /* ---------------- tiny DOM helper (XSS-safe) ---------------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  var MARK_SVG = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path d="M13 13.5 L24 35 L35 13.5" stroke="#fff" stroke-width="4.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 22 H28.2 M33.4 22 H39.5" stroke="#7A63FF" stroke-width="3.4" stroke-linecap="round"/></svg>';
  function brand() { var m = h('span', { class: 'mark' }); m.innerHTML = MARK_SVG; return h('div', { class: 'brand' }, m, 'vastrenix', h('span', { class: 'tag', text: 'Admin' })); }

  /* ---------------- formatting ---------------- */
  var NF = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function inr(n) { return '₹' + NF.format(Math.round(+n || 0)); }
  function toMs(v) { if (!v) return 0; if (typeof v === 'number') return v; if (v.toMillis) return v.toMillis(); if (v.seconds) return v.seconds * 1000; var d = Date.parse(v); return isFinite(d) ? d : 0; }
  function fmtDate(v) { var ms = toMs(v); return ms ? new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
  function fmtDT(v) { var ms = toMs(v); return ms ? new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'; }
  function rel(v) { var ms = toMs(v); if (!ms) return '—'; var d = Math.round((ms - Date.now()) / DAY); if (d === 0) return 'today'; return d > 0 ? 'in ' + d + 'd' : Math.abs(d) + 'd ago'; }
  function planLabel(k) { return (PLANS[k] && PLANS[k].label) || k || '—'; }

  function subStatus(s) {
    if (!s) return { key: 'none', label: 'No plan', cls: '' };
    var now = Date.now();
    if (s.status === 'active') return now < toMs(s.expiresAt) ? { key: 'active', label: 'Active · ' + planLabel(s.cycleId), cls: 'ok' } : { key: 'expired', label: 'Plan expired', cls: 'bad' };
    if (s.status === 'trialing') return now < toMs(s.trialEndsAt) ? { key: 'trial', label: 'Trial', cls: 'acc' } : { key: 'expired', label: 'Trial ended', cls: 'bad' };
    if (s.status === 'suspended' || s.status === 'cancelled') return { key: 'suspended', label: 'Suspended', cls: 'warn' };
    return { key: 'other', label: s.status, cls: '' };
  }

  /* ---------------- state ---------------- */
  var fb, db, auth, ME = null;
  var S = { view: 'overview', q: '', storeFilter: 'all', payFilter: 'pending', ticketFilter: 'open' };
  var D = { subs: {}, codes: {}, reqs: {}, tickets: {}, log: [], loaded: {} };
  var unsub = [];

  function toast(msg, bad) {
    var t = h('div', { class: 'toast' + (bad ? ' bad' : ''), text: msg });
    document.getElementById('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, bad ? 6000 : 3500);
  }
  function errMsg(e) { var c = (e && e.code) || ''; if (/permission-denied/.test(c)) return 'Permission denied — is this account a platform admin, and are the latest firestore.rules deployed?'; return (e && e.message) || 'Something went wrong'; }

  /* ---------------- boot & auth ---------------- */
  function start() {
    if (!window.firebase || !CFG.firebase || !CFG.firebase.apiKey) { renderFatal('Firebase is not configured. Fill in admin/js/config.js.'); return; }
    fb = firebase.initializeApp(CFG.firebase, 'vx-admin');
    auth = fb.auth(); db = fb.firestore();
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(function () { });
    auth.onAuthStateChanged(async function (u) {
      stopWatching();
      if (!u) { ME = null; renderLogin(); return; }
      try {
        var tok = await u.getIdTokenResult(true);
        if (tok.claims.platformAdmin !== true) { await auth.signOut(); renderLogin('This account is not a platform admin.'); return; }
        ME = { uid: u.uid, email: u.email };
        watchAll(); render();
      } catch (e) { renderLogin(errMsg(e)); }
    });
  }
  function renderFatal(msg) { clear(document.getElementById('root')).className = 'login'; document.getElementById('root').appendChild(h('div', { class: 'login-box' }, brand(), h('p', { class: 'err', text: msg }))); }

  function renderLogin(err) {
    var root = clear(document.getElementById('root')); root.className = 'login';
    var email = h('input', { class: 'in', type: 'email', autocomplete: 'username', id: 'em', required: true });
    var pass = h('input', { class: 'in', type: 'password', autocomplete: 'current-password', id: 'pw', required: true });
    var errEl = h('p', { class: 'err', text: err || '' });
    var btn = h('button', { class: 'btn primary lg block', type: 'submit', text: 'Sign in' });
    var form = h('form', { class: 'login-box', onsubmit: async function (e) {
      e.preventDefault(); errEl.textContent = ''; btn.disabled = true;
      try { await auth.signInWithEmailAndPassword(email.value.trim(), pass.value); }
      catch (x) { errEl.textContent = /invalid|wrong|not-found/.test(x.code || '') ? 'Email or password is wrong.' : /too-many/.test(x.code || '') ? 'Too many attempts. Try again later.' : errMsg(x); }
      btn.disabled = false;
    } },
      brand(), h('div', null, h('h1', { text: 'Platform console', style: null }), h('p', { class: 'muted', text: 'Restricted to Vastrenix staff. All actions are logged.' })),
      h('div', { class: 'fld' }, h('label', { for: 'em', text: 'Email' }), email),
      h('div', { class: 'fld' }, h('label', { for: 'pw', text: 'Password' }), pass),
      errEl, btn);
    root.appendChild(form); email.focus();
  }

  function stopWatching() { unsub.forEach(function (f) { try { f(); } catch (e) { } }); unsub = []; D = { subs: {}, codes: {}, reqs: {}, tickets: {}, log: [], loaded: {} }; }
  function watchMap(key, q) {
    unsub.push(q.onSnapshot(function (snap) {
      var m = {}; snap.forEach(function (d) { m[d.id] = Object.assign({ id: d.id }, d.data()); });
      D[key] = m; D.loaded[key] = true; schedule();
    }, function (e) { D.loaded[key] = true; toast(errMsg(e), true); schedule(); }));
  }
  function watchAll() {
    watchMap('subs', db.collection('subscriptions'));
    watchMap('codes', db.collection('codes'));
    watchMap('reqs', db.collection('subscriptionRequests'));
    watchMap('tickets', db.collection('supportRequests').orderBy('createdAt', 'desc').limit(300));
    unsub.push(db.collection('adminLog').orderBy('at', 'desc').limit(100).onSnapshot(function (snap) { D.log = snap.docs.map(function (d) { return d.data(); }); D.loaded.log = true; schedule(); }, function () { }));
  }

  var rq = 0;
  function schedule() { if (rq) return; rq = requestAnimationFrame(function () { rq = 0; render(); }); }

  /* ---------------- derived ---------------- */
  function stores() {
    var ids = {};
    Object.keys(D.subs).forEach(function (k) { ids[k] = 1; });
    Object.keys(D.codes).forEach(function (c) { if (D.codes[c].storeId) ids[D.codes[c].storeId] = 1; });
    Object.keys(D.reqs).forEach(function (k) { ids[k] = 1; });
    var byStore = {}; Object.keys(D.codes).forEach(function (c) { var x = D.codes[c]; if (x.storeId) byStore[x.storeId] = { code: c, name: x.name }; });
    return Object.keys(ids).map(function (sid) {
      var sub = D.subs[sid] || null, req = D.reqs[sid] || null, code = byStore[sid] || {};
      return { id: sid, name: code.name || (req && req.storeName) || '(unnamed store)', code: code.code || (req && req.storeCode) || '', email: (req && req.email) || '', sub: sub, st: subStatus(sub), req: req };
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  function pendingReqs() { return Object.keys(D.reqs).map(function (k) { return D.reqs[k]; }).filter(function (r) { return r.status === 'pending'; }).sort(function (a, b) { return toMs(a.createdAt) - toMs(b.createdAt); }); }
  function openTickets() { return Object.keys(D.tickets).map(function (k) { return D.tickets[k]; }).filter(function (t) { return t.status !== 'resolved'; }); }

  /* ---------------- shell ---------------- */
  var VIEWS = [['overview', 'Overview'], ['payments', 'Payments'], ['stores', 'Stores'], ['support', 'Support'], ['log', 'Audit log']];
  function render() {
    if (!ME) return;
    var root = clear(document.getElementById('root')); root.className = '';
    var counts = { payments: pendingReqs().length, support: openTickets().length };
    var side = h('aside', { class: 'side', 'aria-label': 'Admin navigation' }, brand(),
      VIEWS.map(function (v) { return h('button', { class: 'nav' + (S.view === v[0] ? ' on' : ''), 'aria-current': S.view === v[0] ? 'page' : null, onclick: function () { S.view = v[0]; S.q = ''; render(); } }, v[1], counts[v[0]] ? h('span', { class: 'cnt', text: counts[v[0]] }) : null); }),
      h('div', { class: 'side-foot' }, h('span', null, 'Signed in as'), h('b', { text: ME.email }), h('button', { class: 'btn line', onclick: function () { auth.signOut(); }, text: 'Sign out' })));
    var main = h('main', { class: 'main' });
    ({ overview: vOverview, payments: vPayments, stores: vStores, support: vSupport, log: vLog })[S.view](main);
    root.appendChild(h('div', { class: 'shell' }, side, main));
  }
  function head(title, sub, tools) { return h('div', { class: 'head' }, h('div', null, h('h1', { text: title }), sub ? h('p', { text: sub }) : null), tools ? h('div', { class: 'toolbar' }, tools) : null); }
  function seg(cur, opts, onpick) { return h('div', { class: 'seg', role: 'radiogroup' }, opts.map(function (o) { return h('button', { class: cur === o[0] ? 'on' : '', role: 'radio', 'aria-checked': String(cur === o[0]), onclick: function () { onpick(o[0]); } }, o[1]); })); }
  function search(ph) { var i = h('input', { class: 'in search', type: 'search', placeholder: ph, value: S.q, oninput: function () { S.q = i.value; clearTimeout(i._t); i._t = setTimeout(function () { render(); var n = document.querySelector('.in.search'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 200); } }); return i; }
  function table(cols, rows, emptyText) {
    if (!rows.length) return h('div', { class: 'empty', text: emptyText || 'Nothing here.' });
    return h('div', { class: 'tbl-wrap' }, h('table', null,
      h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { class: c.r ? 'r' : '', text: c.t }); }))),
      h('tbody', null, rows.map(function (r) { return h('tr', null, cols.map(function (c) { return h('td', { class: c.r ? 'r num' : '' }, c.v(r)); })); }))));
  }
  function loading() { return !(D.loaded.subs && D.loaded.reqs && D.loaded.codes); }

  /* ---------------- overview ---------------- */
  function vOverview(m) {
    var st = stores(), now = Date.now();
    var active = st.filter(function (s) { return s.st.key === 'active'; });
    var mrr = active.reduce(function (a, s) { var p = PLANS[s.sub.cycleId]; return a + (p ? p.amount / p.days * 30 : 0); }, 0);
    var expSoon = active.filter(function (s) { return toMs(s.sub.expiresAt) - now < 7 * DAY; });
    var trialEnding = st.filter(function (s) { return s.st.key === 'trial' && toMs(s.sub.trialEndsAt) - now < 2 * DAY; });
    m.appendChild(head('Overview', loading() ? 'Loading…' : 'Live from Firestore'));
    m.appendChild(h('div', { class: 'kpis' },
      kpi('Stores', st.length), kpi('Paying', active.length), kpi('On trial', st.filter(function (s) { return s.st.key === 'trial'; }).length),
      kpi('Expired', st.filter(function (s) { return s.st.key === 'expired'; }).length), kpi('Est. MRR', inr(mrr)),
      kpi('Payments to verify', pendingReqs().length, pendingReqs().length > 0), kpi('Open tickets', openTickets().length, openTickets().length > 0)));
    m.appendChild(h('div', { class: 'grid2' },
      h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', { text: 'Plans expiring within 7 days' })),
        table([{ t: 'Store', v: storeCell }, { t: 'Plan', v: function (s) { return planLabel(s.sub.cycleId); } }, { t: 'Expires', v: function (s) { return fmtDate(s.sub.expiresAt) + ' (' + rel(s.sub.expiresAt) + ')'; } }], expSoon, 'No renewals due this week.')),
      h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', { text: 'Trials ending in 48 hours' })),
        table([{ t: 'Store', v: storeCell }, { t: 'Ends', v: function (s) { return fmtDT(s.sub.trialEndsAt); } }, { t: '', v: function (s) { return h('button', { class: 'btn line', text: 'Manage', onclick: function () { storeModal(s); } }); } }], trialEnding, 'No trials ending soon.'))));
  }
  function kpi(label, val, hl) { return h('div', { class: 'kpi' + (hl ? ' hl' : '') }, h('small', { text: label }), h('b', { text: val })); }
  function storeCell(s) { return h('div', null, h('b', { text: s.name }), h('span', { class: 'sub mono', text: (s.code || '') + (s.email ? ' · ' + s.email : '') })); }

  /* ---------------- payments ---------------- */
  function vPayments(m) {
    var all = Object.keys(D.reqs).map(function (k) { return D.reqs[k]; });
    var rows = all.filter(function (r) { return S.payFilter === 'all' || r.status === S.payFilter; }).sort(function (a, b) { return toMs(b.createdAt) - toMs(a.createdAt); });
    var utrCount = {}; all.forEach(function (r) { if (r.utr) utrCount[r.utr] = (utrCount[r.utr] || 0) + 1; });
    m.appendChild(head('Payments', 'Match each UTR against your bank / UPI statement before approving.',
      seg(S.payFilter, [['pending', 'To verify'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']], function (v) { S.payFilter = v; render(); })));
    m.appendChild(h('section', { class: 'card' }, table([
      { t: 'Submitted', v: function (r) { return fmtDT(r.createdAt); } },
      { t: 'Store', v: function (r) { return h('div', null, h('b', { text: r.storeName || r.businessId }), h('span', { class: 'sub mono', text: (r.storeCode || '') + ' · ' + (r.email || '') })); } },
      { t: 'Plan', v: function (r) { return planLabel(r.cycle); } },
      { t: 'Amount', r: 1, v: function (r) { return inr(r.amount); } },
      { t: 'UTR', v: function (r) { return h('div', null, h('span', { class: 'mono', text: r.utr }), utrCount[r.utr] > 1 ? h('span', { class: 'sub', style: null }, h('span', { class: 'pill bad', text: 'UTR used ' + utrCount[r.utr] + '×' })) : null); } },
      { t: 'Status', v: function (r) { return h('span', { class: 'pill ' + ({ pending: 'acc', approved: 'ok', rejected: 'bad' }[r.status] || ''), text: r.status }); } },
      { t: '', r: 1, v: function (r) { return r.status === 'pending' ? h('div', { class: 'toolbar', style: null }, h('button', { class: 'btn primary', text: 'Approve…', onclick: function () { approveModal(r); } }), h('button', { class: 'btn bad', text: 'Reject…', onclick: function () { rejectModal(r); } })) : h('span', { class: 'small muted', text: r.reviewedAt ? 'Reviewed ' + fmtDT(r.reviewedAt) : '' }); } }
    ], rows, S.payFilter === 'pending' ? 'No payments waiting. 🎉' : 'No records.')));
  }

  function approveModal(r) {
    var plan = PLANS[r.cycle];
    if (!plan) { toast('Unknown plan on this request', true); return; }
    var sid = r.id || r.businessId; /* the document key is the store id; never trust a field inside the request for it */
    var cur = D.subs[sid];
    var base = cur && cur.status === 'active' && toMs(cur.expiresAt) > Date.now() ? toMs(cur.expiresAt) : Date.now();
    var dupe = Object.keys(D.reqs).some(function (k) { var x = D.reqs[k]; return k !== sid && x.utr === r.utr && x.status === 'approved'; })
      || Object.keys(D.subs).some(function (k) { var x = D.subs[k]; return x.lastPayment && x.lastPayment.utr === r.utr; });
    var amountMismatch = +r.amount !== plan.amount;
    modal('Approve payment', [
      h('dl', { class: 'kv' }, dtdd('Store', r.storeName || sid), dtdd('Store ID', sid), dtdd('Owner email', r.email || '—'), dtdd('Plan', plan.label + ' (' + plan.days + ' days)'), dtdd('Amount', inr(r.amount)), dtdd('UTR', r.utr), dtdd('New expiry', fmtDate(base + plan.days * DAY))),
      dupe ? h('div', { class: 'warnline', text: 'This UTR was already approved before (for this or another store). Do not approve unless you are sure.' }) : null,
      amountMismatch ? h('div', { class: 'warnline', text: 'Amount does not match the plan price.' }) : null,
      h('p', { class: 'small muted', text: 'Confirm you can see ' + inr(plan.amount) + ' with UTR ' + r.utr + ' in your bank or UPI app before approving.' })
    ], 'Approve & activate', async function () {
      var now = Date.now();
      var upd = { businessId: sid, status: 'active', cycleId: r.cycle, subscribedAt: now, expiresAt: base + plan.days * DAY, lastPayment: { utr: r.utr, amount: r.amount, approvedAt: now, approvedBy: ME.uid }, updatedAt: now };
      var b = db.batch();
      b.set(db.doc('stores/' + sid + '/meta/subscription'), upd, { merge: true });
      b.set(db.doc('subscriptions/' + sid), upd, { merge: true });
      b.update(db.doc('subscriptionRequests/' + sid), { status: 'approved', reviewedAt: firebase.firestore.FieldValue.serverTimestamp(), reviewedBy: ME.uid });
      // create-only in firestore.rules: approving the same UTR a second time makes the whole batch fail
      b.set(db.doc('usedUtrs/' + r.utr), { storeId: sid, amount: r.amount, cycle: r.cycle, approvedAt: now, approvedBy: ME.uid });
      b.set(db.collection('adminLog').doc(), logEntry('payment.approve', sid, { utr: r.utr, cycle: r.cycle, amount: r.amount, expiresAt: upd.expiresAt }));
      await b.commit();
      toast('Plan activated for ' + (r.storeName || sid));
    });
  }
  function rejectModal(r) {
    var note = h('textarea', { class: 'in', maxlength: 300, placeholder: 'Shown to the store owner, e.g. "UTR not found — please check and resubmit."' });
    modal('Reject payment', [h('p', { text: 'The owner will see this reason and can resubmit.' }), h('div', { class: 'fld' }, h('label', { text: 'Reason' }), note)], 'Reject', async function () {
      var reason = note.value.trim().slice(0, 300) || 'We could not find this payment. Check the UTR and submit again.';
      var b = db.batch();
      b.update(db.doc('subscriptionRequests/' + (r.id || r.businessId)), { status: 'rejected', adminNote: reason, reviewedAt: firebase.firestore.FieldValue.serverTimestamp(), reviewedBy: ME.uid });
      b.set(db.collection('adminLog').doc(), logEntry('payment.reject', r.id || r.businessId, { utr: r.utr, reason: reason }));
      await b.commit(); toast('Payment rejected');
    }, true);
  }

  /* ---------------- stores ---------------- */
  function vStores(m) {
    var q = S.q.trim().toLowerCase();
    var rows = stores().filter(function (s) { return (S.storeFilter === 'all' || s.st.key === S.storeFilter) && (!q || (s.name + ' ' + s.code + ' ' + s.email + ' ' + s.id).toLowerCase().indexOf(q) >= 0); });
    m.appendChild(head('Stores', stores().length + ' stores', [search('Search name, code, email, ID'), seg(S.storeFilter, [['all', 'All'], ['active', 'Paying'], ['trial', 'Trial'], ['expired', 'Expired'], ['suspended', 'Suspended']], function (v) { S.storeFilter = v; render(); })]));
    m.appendChild(h('section', { class: 'card' }, table([
      { t: 'Store', v: storeCell },
      { t: 'Status', v: function (s) { return h('span', { class: 'pill ' + s.st.cls, text: s.st.label }); } },
      { t: 'Trial / plan ends', v: function (s) { var e = s.sub ? (s.sub.status === 'active' ? s.sub.expiresAt : s.sub.trialEndsAt) : 0; return e ? fmtDate(e) + ' (' + rel(e) + ')' : '—'; } },
      { t: 'Started', v: function (s) { return fmtDate(s.sub && (s.sub.trialStartedAt || s.sub.createdAt)); } },
      { t: '', r: 1, v: function (s) { return h('button', { class: 'btn line', text: 'Manage', onclick: function () { storeModal(s); } }); } }
    ], rows, loading() ? 'Loading…' : 'No stores match.')));
  }
  async function storeModal(s) {
    var profile = h('dd', { text: 'Loading…' }), staffN = h('dd', { text: '…' });
    var cycle = h('select', { class: 'in' }, Object.keys(PLANS).map(function (k) { return h('option', { value: k, text: PLANS[k].label + ' — ' + inr(PLANS[k].amount) }); }));
    var body = [
      h('dl', { class: 'kv' }, dtdd('Store', s.name), dtdd('Store ID', s.id), dtdd('Code', s.code || '—'), h('dt', { text: 'City / phone' }), profile, h('dt', { text: 'Active staff' }), staffN,
        dtdd('Status', s.st.label), dtdd('Trial ends', fmtDT(s.sub && s.sub.trialEndsAt)), dtdd('Plan expires', fmtDT(s.sub && s.sub.expiresAt)), dtdd('Last payment', s.sub && s.sub.lastPayment ? inr(s.sub.lastPayment.amount) + ' · UTR ' + s.sub.lastPayment.utr : '—')),
      h('div', { class: 'stack', style: null },
        h('div', { class: 'toolbar' }, h('button', { class: 'btn line', text: 'Extend trial +7 days', onclick: function () { act('trial.extend', extendTrial); } }),
          h('button', { class: 'btn bad', text: 'Suspend', onclick: function () { act('store.suspend', suspend); } })),
        h('div', { class: 'fld' }, h('label', { text: 'Activate a plan manually (e.g. paid by bank transfer)' }), h('div', { class: 'toolbar' }, cycle, h('button', { class: 'btn primary', text: 'Activate', onclick: function () { act('plan.manual', manual); } }))))
    ];
    var close = modal('Manage store', body, null, null);
    try {
      var p = await db.doc('stores/' + s.id + '/meta/store').get();
      var d = p.exists ? p.data() : {};
      profile.textContent = [d.city, d.phone, d.gstin ? 'GSTIN ' + d.gstin : ''].filter(Boolean).join(' · ') || '—';
      var st = await db.collection('stores/' + s.id + '/staff').where('status', '==', 'active').get();
      staffN.textContent = String(st.size);
    } catch (e) { profile.textContent = errMsg(e); staffN.textContent = '—'; }

    function cur() { return D.subs[s.id] || {}; }
    async function extendTrial() { var c = cur(), now = Date.now(); if (c.status === 'active' && toMs(c.expiresAt) > now && !confirm(s.name + ' has an active paid plan. Replace it with a trial?')) throw { cancelled: true }; var ends = Math.max(now, toMs(c.trialEndsAt)) + 7 * DAY; return { status: 'trialing', businessId: s.id, trialStartedAt: c.trialStartedAt || now, trialEndsAt: ends, updatedAt: now }; }
    async function suspend() { if (!confirm('Suspend ' + s.name + '? They will not be able to save anything until reactivated.')) throw { cancelled: true }; return { status: 'suspended', businessId: s.id, updatedAt: Date.now() }; }
    async function manual() { var k = cycle.value, p = PLANS[k], c = cur(), now = Date.now(); var base = c.status === 'active' && toMs(c.expiresAt) > now ? toMs(c.expiresAt) : now; if (!confirm('Activate ' + p.label + ' for ' + s.name + ' until ' + fmtDate(base + p.days * DAY) + '?')) throw { cancelled: true }; return { status: 'active', businessId: s.id, cycleId: k, subscribedAt: now, expiresAt: base + p.days * DAY, updatedAt: now }; }
    async function act(action, fn) {
      try {
        var upd = await fn();
        var b = db.batch();
        b.set(db.doc('stores/' + s.id + '/meta/subscription'), upd, { merge: true });
        b.set(db.doc('subscriptions/' + s.id), upd, { merge: true });
        b.set(db.collection('adminLog').doc(), logEntry(action, s.id, upd));
        await b.commit(); toast('Saved'); close();
      } catch (e) { if (!(e && e.cancelled)) toast(errMsg(e), true); }
    }
  }

  /* ---------------- support ---------------- */
  function vSupport(m) {
    var rows = Object.keys(D.tickets).map(function (k) { return D.tickets[k]; }).filter(function (t) { return S.ticketFilter === 'all' || (S.ticketFilter === 'open' ? t.status !== 'resolved' : t.status === 'resolved'); }).sort(function (a, b) { return toMs(b.createdAt) - toMs(a.createdAt); });
    m.appendChild(head('Support', 'Tickets and custom-work enquiries from the app.', seg(S.ticketFilter, [['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']], function (v) { S.ticketFilter = v; render(); })));
    m.appendChild(h('section', { class: 'card' }, table([
      { t: 'Received', v: function (t) { return fmtDT(t.createdAt); } },
      { t: 'From', v: function (t) { return h('div', null, h('b', { text: t.name || '—' }), h('span', { class: 'sub', text: [t.businessName, t.email, t.phone].filter(Boolean).join(' · ') })); } },
      { t: 'Type', v: function (t) { return h('span', { class: 'pill ' + (t.type === 'custom_work_inquiry' ? 'acc' : ''), text: t.type === 'custom_work_inquiry' ? 'Custom work' : (t.category || 'support') }); } },
      { t: 'Message', v: function (t) { var txt = (t.whatToBuild ? t.whatToBuild + ' — ' : '') + (t.message || ''); return h('span', { text: txt.length > 140 ? txt.slice(0, 140) + '…' : txt, title: txt }); } },
      { t: 'Status', v: function (t) { return h('span', { class: 'pill ' + (t.status === 'resolved' ? 'ok' : t.status === 'in_progress' ? 'warn' : 'acc'), text: (t.status || 'open').replace('_', ' ') }); } },
      { t: '', r: 1, v: function (t) { return h('button', { class: 'btn line', text: 'Open', onclick: function () { ticketModal(t); } }); } }
    ], rows, 'No tickets.')));
  }
  function ticketModal(t) {
    var mailto = t.email ? 'mailto:' + encodeURIComponent(t.email) + '?subject=' + encodeURIComponent('Re: your Vastrenix request') : null;
    var close = modal('Ticket', [
      h('dl', { class: 'kv' }, dtdd('Received', fmtDT(t.createdAt)), dtdd('Name', t.name || '—'), dtdd('Business', t.businessName || '—'), dtdd('Email', t.email || '—'), dtdd('Phone', t.phone || '—'), dtdd('Store ID', t.businessId || '—'), dtdd('Type', t.type === 'custom_work_inquiry' ? 'Custom work' : (t.category || 'support'))),
      t.whatToBuild ? h('div', { class: 'fld' }, h('label', { text: 'What they want built' }), h('p', { text: t.whatToBuild, style: null })) : null,
      h('div', { class: 'fld' }, h('label', { text: 'Message' }), h('p', { text: t.message || '—' })),
      h('div', { class: 'toolbar' },
        mailto ? h('a', { class: 'btn line', href: mailto, text: 'Reply by email' }) : null,
        t.status !== 'in_progress' && t.status !== 'resolved' ? h('button', { class: 'btn line', text: 'Mark in progress', onclick: function () { setStatus('in_progress'); } }) : null,
        t.status !== 'resolved' ? h('button', { class: 'btn primary', text: 'Mark resolved', onclick: function () { setStatus('resolved'); } }) : h('button', { class: 'btn line', text: 'Reopen', onclick: function () { setStatus('open'); } }))
    ], null, null);
    async function setStatus(st) {
      try { var b = db.batch(); b.update(db.doc('supportRequests/' + t.id), { status: st, updatedAt: Date.now(), handledBy: ME.uid }); b.set(db.collection('adminLog').doc(), logEntry('ticket.' + st, t.businessId || '', { ticket: t.id })); await b.commit(); toast('Ticket updated'); close(); }
      catch (e) { toast(errMsg(e), true); }
    }
  }

  /* ---------------- audit log ---------------- */
  function vLog(m) {
    m.appendChild(head('Audit log', 'Last 100 admin actions. Entries cannot be edited or deleted.'));
    m.appendChild(h('section', { class: 'card' }, table([
      { t: 'When', v: function (l) { return fmtDT(l.at); } },
      { t: 'Admin', v: function (l) { return l.email || l.by; } },
      { t: 'Action', v: function (l) { return h('span', { class: 'mono', text: l.action }); } },
      { t: 'Store', v: function (l) { var s = stores().find(function (x) { return x.id === l.storeId; }); return s ? s.name : (l.storeId || '—'); } },
      { t: 'Details', v: function (l) { return h('span', { class: 'mono small', text: JSON.stringify(l.details || {}).slice(0, 160) }); } }
    ], D.log, 'No actions yet.')));
  }
  function logEntry(action, storeId, details) { return { at: Date.now(), by: ME.uid, email: ME.email || '', action: action, storeId: storeId || '', details: JSON.parse(JSON.stringify(details || {})) }; }

  /* ---------------- modal ---------------- */
  function dtdd(k, v) { return [h('dt', { text: k }), h('dd', { text: v == null || v === '' ? '—' : v })]; }
  function modal(title, body, okLabel, onOk, danger) {
    var mr = clear(document.getElementById('modal-root')), prev = document.activeElement;
    function close() { clear(mr); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    var okBtn = okLabel ? h('button', { class: 'btn ' + (danger ? 'bad' : 'primary'), text: okLabel, onclick: async function () { okBtn.disabled = true; try { await onOk(); close(); } catch (e) { if (!(e && e.cancelled)) toast(errMsg(e), true); okBtn.disabled = false; } } }) : null;
    var dlg = h('section', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'modal-h' }, h('h2', { text: title }), h('button', { class: 'btn line', text: 'Close', onclick: close })),
      h('div', { class: 'modal-b' }, body),
      okBtn ? h('div', { class: 'modal-f' }, h('button', { class: 'btn line', text: 'Cancel', onclick: close }), okBtn) : null);
    mr.appendChild(h('div', { class: 'scrim', onclick: close })); mr.appendChild(dlg);
    document.addEventListener('keydown', onKey);
    (okBtn || dlg.querySelector('button')).focus();
    return close;
  }

  start();
})();
