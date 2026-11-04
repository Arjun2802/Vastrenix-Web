/* ===================== ROUTES & SHELL ===================== */
var ROUTES = {
  home: { v: function () { return vHome(); }, perm: null, icon: 'home', t: ['nav_home', 'Home'], g: 'sell' },
  bill: { v: function () { return vBill(); }, perm: ['sell'], icon: 'receipt', t: ['nav_bill', 'New bill'], g: 'sell', nobar: true },
  invoices: { v: function () { return vInvoices(); }, perm: ['sell', 'money'], icon: 'file', t: ['nav_invoices', 'Invoices'], g: 'sell' },
  customers: { v: function () { return vCustomers(); }, perm: ['sell', 'money'], icon: 'users', t: ['nav_customers', 'Customers'], g: 'sell' },
  dues: { v: function () { return vDues(); }, perm: ['sell', 'money'], icon: 'wallet', t: ['nav_dues', 'Dues'], g: 'sell' },
  shift: { v: function () { return vShift(); }, perm: ['sell'], icon: 'clock', t: ['nav_shift', 'Shift'], g: 'sell' },
  items: { v: function () { return vItems(); }, perm: ['stock', 'purchase', 'sell', 'dealers'], icon: 'shirt', t: ['nav_items', 'Items'], g: 'stock' },
  lowstock: { v: function () { return vLow(); }, perm: ['stock', 'purchase'], icon: 'alert', t: ['nav_low', 'Low stock'], g: 'stock' },
  transfers: { v: function () { return vTransfers(); }, perm: ['stock'], icon: 'transfer', t: ['nav_transfers', 'Transfers'], g: 'stock' },
  purchases: { v: function () { return vPurchases(); }, perm: ['purchase', 'stock', 'money'], icon: 'building', t: ['nav_purchases', 'Purchases'], g: 'stock' },
  expenses: { v: function () { return vExpenses(); }, perm: ['money'], icon: 'calculator', t: ['nav_expenses', 'Expenses'], g: 'money' },
  cashbook: { v: function () { return vCashbook(); }, perm: ['money', 'sell'], icon: 'banknote', t: ['nav_cashbook', 'Cash book'], g: 'money' },
  reports: { v: function () { return vReports(); }, perm: ['money'], icon: 'chart', t: ['nav_reports', 'Reports'], g: 'money' },
  dealers: { v: function () { return vDealers(); }, perm: ['dealers'], icon: 'truck', t: ['nav_dealers', 'Dealers'], g: 'network' },
  staff: { v: function () { return vStaff(); }, perm: ['people'], icon: 'users', t: ['nav_staff', 'Staff'], g: 'network' },
  settings: { v: function () { return vSettings(); }, perm: ['settings'], icon: 'settings', t: ['nav_settings', 'Settings'], g: 'network' },
  more: { v: function () { return vMore(); }, perm: null, icon: 'grid', t: ['nav_more', 'More'], g: null }
};
var GROUPS = [['sell', 'grp_sell', 'Sell'], ['stock', 'grp_stock', 'Stock'], ['money', 'grp_money', 'Money'], ['network', 'grp_network', 'Network & team']];
function rt(r) { var x = ROUTES[r]; return t(x.t[0], x.t[1]); }
function allowed(r) { var x = ROUTES[r]; if (!x) return false; if (r === 'settings' && ME.role === 'auditor') return true; if (r === 'staff' && ME.role === 'auditor') return true; return canAny(x.perm); }
function badgeFor(r) {
  if (r === 'dues') { var n = vals(D.customers).filter(function (c) { return (+c.balance || 0) > 0.5; }).length; return n || ''; }
  if (r === 'lowstock') return lowList().length || '';
  if (r === 'dealers') return vals(D.dorders).filter(function (o) { return o.status === 'submitted'; }).length || '';
  if (r === 'staff') return vals(D.requests).filter(function (q) { return q.status === 'pending'; }).length || '';
  return '';
}

function viewRoot() {
  var g = computeGate();
  if (g !== 'app') return { app: gateView(g), layer: S.sheet ? sheetView() : '' };
  if (!allowed(S.route)) S.route = 'home';
  var r = ROUTES[S.route];
  var body = S.sub && SUBS[S.sub.k] ? SUBS[S.sub.k](S.sub) : r.v();
  var nobar = (r.nobar && !S.sub) || (S.sub && SUBS_NOBAR[S.sub.k]);
  return { app: shell(body, nobar), layer: S.sheet ? sheetView() : '' };
}
function computeGate() {
  if (MODE === 'connecting' || ME.gate === 'boot') return 'splash';
  if (ME.gate !== 'ready') return ME.gate;
  if (!D.loaded.store) return 'splash';
  if (!D.store) return ME.role === 'owner' || ME.role === 'admin' ? 'onboard' : 'nostore';
  return 'app';
}
function shell(body, nobar) {
  var st = storeV();
  var nav = GROUPS.map(function (g) {
    var items = Object.keys(ROUTES).filter(function (r) { return ROUTES[r].g === g[0] && allowed(r); });
    if (!items.length) return '';
    return '<div class="navg"><h6>' + esc(t(g[1], g[2])) + '</h6>' + items.map(function (r) {
      var b = badgeFor(r);
      return '<a class="navi' + (S.route === r ? ' on' : '') + '" href="#' + r + '" data-a="go" data-r="' + r + '"' + (S.route === r ? ' aria-current="page"' : '') + '>' + icon(ROUTES[r].icon, 19) + '<span>' + esc(rt(r)) + '</span>' + (b ? '<span class="cnt">' + b + '</span>' : '') + '</a>';
    }).join('') + '</div>';
  }).join('');
  var side = '<aside class="side" aria-label="' + esc(t('main_nav', 'Main navigation')) + '"><div class="brand">' + logo(30) + '<b>vastrenix</b></div>' +
    '<button class="storeSw" data-a="sheet" data-k="loc">' + (st.logo ? '<img class="av" src="' + esc(safeImg(st.logo)) + '" alt="' + esc(st.name || '') + '" style="object-fit:cover;border-radius:999px">' : '<span class="av">' + esc(initials(st.name)) + '</span>') + '<span class="grow"><b>' + esc(st.name || 'Vastrenix') + '</b><small>' + esc(locName(curLoc())) + '</small></span>' + icon('chevD', 16) + '</button>' +
    (allowed('bill') ? '<a class="btn primary block" href="#bill" data-a="go" data-r="bill" style="margin-bottom:16px">' + icon('plus', 18, 2.2) + esc(t('nav_bill', 'New bill')) + '</a>' : '') +
    nav + '<div class="sideFoot">' + syncLine() + '<div class="me">' + (ME.avatar ? '<img src="' + esc(safeImg(ME.avatar)) + '" alt="">' : avatarHtml(ME.name || 'You')) + '<span><b>' + esc(ME.name || t('you', 'You')) + '</b><small>' + esc(roleName(ME.role)) + '</small></span></div></div></aside>';
  var tabs = ['home', 'items', 'bill', 'invoices', 'dealers', 'more'].filter(allowed);
  if (tabs.length > 5) tabs = tabs.filter(function (x) { return x !== 'dealers'; });
  while (tabs.length > 5) tabs.splice(tabs.length - 2, 1);
  var moreOn = ['home', 'items', 'invoices', 'dealers', 'bill'].indexOf(S.route) < 0;
  var tabbar = nobar ? '' : '<nav class="tabbar" aria-label="' + esc(t('main_nav', 'Main navigation')) + '" style="grid-template-columns:repeat(' + tabs.length + ',minmax(0,1fr))">' + tabs.map(function (r) {
    if (r === 'bill') return '<a class="tab" href="#bill" data-a="go" data-r="bill" aria-label="' + esc(t('nav_bill', 'New bill')) + '"><span class="fab">' + icon('plus', 24, 2.2) + '</span></a>';
    var on = r === 'more' ? moreOn : S.route === r;
    return '<a class="tab' + (on ? ' on' : '') + '" href="#' + r + '" data-a="go" data-r="' + r + '"' + (on ? ' aria-current="page"' : '') + '>' + icon(ROUTES[r].icon, 24, on ? 2.1 : 1.75) + '<span>' + esc(rt(r)) + '</span></a>';
  }).join('') + '</nav>';
  document.body.classList.toggle('nobar', !!nobar);
  return '<div class="app' + (nobar ? ' nobar' : '') + '">' + side + '<main class="main" id="main">' + body + '</main>' + tabbar + '</div>';
}
function syncLine() {
  var k = MODE === 'local' ? ['warn', t('sync_local', 'Saved on this device only')] : D.sync === 'error' ? ['bad', t('sync_off', 'Disconnected — retrying')] : D.sync === 'syncing' ? ['acc', t('sync_syncing', 'Syncing…')] : ['', t('sync_on', 'Connected')];
  return '<div class="sync"><span class="dot ' + k[0] + '"></span>' + esc(k[1]) + '</div>';
}

/* ===================== GATES ===================== */
function gateView(g) {
  if (g === 'splash') {
    var s1 = MODE !== 'connecting', s2 = ME.gate !== 'boot', s3 = !!D.loaded.store;
    var ck = function (done, run) { return '<span class="ck ' + (done ? 'ok' : run ? 'run' : '') + '">' + (done ? icon('check', 13, 2.6) : '') + '</span>'; };
    return '<div class="gate dark" style="min-height:100vh;min-height:100dvh"><div class="box">' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:18px;padding:24px 0 12px">' + logo(80, true) + '<div style="text-align:center"><div style="font-size:34px;font-weight:700;letter-spacing:-.045em">vastrenix</div><div style="color:var(--hero-muted);font-size:14px;margin-top:4px">' + esc(t('tagline', 'Retail, wholesale and dealers — one thread.')) + '</div></div></div>' +
      '<div class="steps" role="status" aria-live="polite"><div>' + ck(s1, !s1) + esc(t('boot_server', 'Connecting to your store')) + '</div><div style="' + (s1 ? '' : 'opacity:.55') + '">' + ck(s2, s1 && !s2) + esc(t('boot_session', 'Restoring your session')) + '</div><div style="' + (s2 ? '' : 'opacity:.55') + '">' + ck(s3, s2 && !s3) + esc(t('boot_data', 'Syncing store data')) + '</div></div>' +
      (D.storeTimeout ?
        '<div style="background:rgba(200,40,60,0.18);border:1px solid #C8283C;border-radius:12px;padding:16px;margin:16px 0;text-align:left">' +
          '<div style="font-weight:700;color:#FFF;font-size:14px;margin-bottom:6px">⚠️ Cloud Firestore Database Not Created Yet</div>' +
          '<div style="color:#E5E7EB;font-size:13px;line-height:1.5">In Firebase Console, go to <b>Build → Firestore Database</b> and click <b>Create database</b> (select location <b>asia-south1 (Mumbai)</b>, Production mode). Once created, this screen will open automatically.</div>' +
          '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">' +
            '<button class="btn strong sm" data-a="reload">Retry Connection</button>' +
            '<button class="btn soft sm" data-a="useOfflineMode">Open Demo Store (Offline)</button>' +
          '</div>' +
        '</div>' : '') +
      '<p style="font-size:12px;color:var(--hero-muted);line-height:1.5">' + esc(t('boot_note', 'Sign-in appears only after the store is reachable. The first launch of the day can take a few seconds.')) + '</p></div></div>';
  }
  if (g === 'request') return gateRequest();
  if (g === 'pending' || g === 'rejected') return gatePending(g);
  if (g === 'blocked') return gateMsg('lock', t('blocked_t', 'Your access is paused'), t('blocked_b', 'An admin deactivated your account for this store. Ask them to reactivate it.'));
  if (g === 'nostore') return gateMsg('store', t('nostore_t', 'This store isn’t set up yet'), t('nostore_b', 'The owner needs to finish store setup first. This page updates on its own once they do.'));
  if (g === 'noid') return gateMsg('user', t('noid_t', 'Sign in to continue'), t('noid_b', 'Open this page while signed in to claude.ai with your work account, then request access.'));
  if (g === 'onboard') return vOnboard();
  return '';
}
function gateMsg(ic, title, body) { return '<div class="gate"><div class="box" style="align-items:center;text-align:center"><div class="empty" style="padding:0"><div class="ei">' + icon(ic, 26) + '</div></div><h1 style="font-size:26px">' + esc(title) + '</h1><p class="muted" style="font-size:15px;line-height:1.5">' + esc(body) + '</p></div></div>'; }
function gateRequest() {
  var f = S.f.req || (S.f.req = { name: ME.name || '', phone: '', role: 'cashier', branch: '' });
  var st = storeV(), err = S.f.reqErr || {};
  return '<div class="gate"><div class="box">' +
    '<div class="rowx">' + logo(36) + '<b style="font-size:20px;letter-spacing:-.04em">vastrenix</b></div>' +
    '<div class="stack sm"><h1 style="font-size:28px">' + esc(t('req_t', 'Request staff access')) + '</h1><p class="muted">' + esc(t('req_b', 'Your store owner approves every new account before you can use {store}.', { store: st.name || 'Vastrenix' })) + '</p></div>' +
    '<div class="stack">' + txtF(t('full_name', 'Full name'), 'f.req.name', 'autocomplete="name"', null, err.name) +
    txtF(t('mobile', 'Mobile number'), 'f.req.phone', 'inputmode="tel" autocomplete="tel"', null, err.phone) +
    fld(t('your_role', 'Your role'), '<div class="picks">' + ROLE_LIST.filter(function (r) { return r !== 'admin'; }).map(function (r) { return '<button type="button" class="pick' + (f.role === r ? ' on' : '') + '" data-a="set" data-k="f.req.role" data-v="' + r + '">' + esc(roleName(r)) + '</button>'; }).join('') + '</div>') +
    selF(t('branch', 'Branch'), 'f.req.branch', [['', t('any_branch', 'Any branch')]].concat(locs().map(function (l) { return [l.id, l.name]; }))) + '</div>' +
    busyBtn(t('send_request', 'Send request'), 'sendRequest', 'primary lg block') + '</div></div>';
}
function gatePending(g) {
  var q = ME.reqDoc || {};
  var rej = g === 'rejected';
  return '<div class="gate"><div class="box">' +
    '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center"><div class="empty" style="padding:0"><div class="ei" style="width:76px;height:76px;border-radius:24px;color:var(--accent-text)">' + icon(rej ? 'x' : 'clock', 34) + '</div></div>' +
    '<h1 style="font-size:26px">' + esc(rej ? t('rej_t', 'Request not approved') : t('pend_t', 'Waiting for approval')) + '</h1><p class="muted" style="line-height:1.5">' + esc(rej ? t('rej_b', 'The store admin declined this request. Check your details and send it again.') : t('pend_b', 'Your request is with the admins of {store}. This screen opens the app by itself once you’re approved.', { store: storeV().name || 'Vastrenix' })) + '</p></div>' +
    '<div class="list"><div class="li"><span class="tx"><small>' + esc(t('name', 'Name')) + '</small><b>' + esc(q.name) + '</b></span></div><div class="li"><span class="tx"><small>' + esc(t('role', 'Role')) + '</small><b>' + esc(roleName(q.role)) + '</b></span></div><div class="li"><span class="tx"><small>' + esc(t('sent', 'Sent')) + '</small><b>' + esc(fmtDY(q.at) + ', ' + fmtT(q.at)) + '</b></span></div></div>' +
    (rej ? '<button class="btn primary lg block" data-a="reRequest">' + esc(t('request_again', 'Request again')) + '</button>' : '<div class="note">' + icon('info', 17) + '<span>' + esc(t('pend_note', 'You can close this page. Your request stays pending until an admin reviews it.')) + '</span></div>') +
    '</div></div>';
}
A.sendRequest = async function () {
  var f = S.f.req, err = {};
  if (!String(f.name || '').trim()) err.name = t('err_name', 'Enter your name');
  if (phoneDigits(f.phone).length !== 10) err.phone = t('err_phone', 'Enter a 10-digit mobile number');
  S.f.reqErr = err; if (Object.keys(err).length) { schedule(); return; }
  if (!ME.id) { toast(t('noid_t', 'Sign in to continue'), 'bad'); return; }
  S.busy = 'req'; schedule();
  try { await put('requests/' + ME.id, { name: f.name.trim(), phone: phoneDigits(f.phone), role: f.role, branch: f.branch || '', at: Date.now(), status: 'pending' }); }
  catch (e) { toast(errText(e), 'bad'); }
  S.busy = null; schedule();
};
A.reRequest = function () { S.f.req = { name: (ME.reqDoc || {}).name || ME.name, phone: (ME.reqDoc || {}).phone || '', role: (ME.reqDoc || {}).role || 'cashier', branch: '' }; ME.gate = 'request'; schedule(); };

/* ===================== ONBOARDING ===================== */
function vOnboard() {
  var f = S.f.ob || (S.f.ob = { step: 0, name: '', city: '', phone: '', address: '', gstin: '', gst: '5', incl: true, multi: true, theme: 'modern', upi: '', prefix: '', footer: t('ob_footer_def', 'Thank you for shopping with us'), pay: 'cash', remind: true, demo: false });
  var steps = [t('ob_s1', 'Business'), t('ob_s2', 'Tax'), t('ob_s3', 'Invoice'), t('ob_s4', 'Payments'), t('ob_s5', 'Team')];
  var err = S.f.obErr || {}, body = '';
  if (f.step === 0) body = '<div class="stack sm"><h1 style="font-size:28px">' + esc(t('ob_h1', 'Set up your store')) + '</h1><p class="muted">' + esc(t('ob_p1', 'This appears on every invoice and on your team’s screens.')) + '</p></div><div class="stack">' + txtF(t('biz_name', 'Business name'), 'f.ob.name', 'autocomplete="organization"', null, err.name) + '<div class="g2">' + txtF(t('city', 'City'), 'f.ob.city', '', null, err.city) + txtF(t('phone', 'Phone'), 'f.ob.phone', 'inputmode="tel"') + '</div>' + txtF(t('address', 'Address'), 'f.ob.address') + '</div>';
  if (f.step === 1) {
    var gv = gstState(f.gstin);
    body = '<div class="stack sm"><h1 style="font-size:28px">' + esc(t('ob_h2', 'Tax & billing')) + '</h1><p class="muted">' + esc(t('ob_p2', 'Used for GST on every bill. You can change it later in Settings.')) + '</p></div><div class="stack">' +
      txtF(t('gstin', 'GSTIN'), 'f.ob.gstin', 'data-r autocapitalize="characters" maxlength="15" style="letter-spacing:.05em"', f.gstin ? (gv ? t('gst_state', 'State: {s}', { s: gv }) : '') : t('gst_opt', 'Optional — leave empty if not registered'), err.gstin) +
      fld(t('default_gst', 'Default GST on garments'), seg('f.ob.gst', [['0', '0%'], ['5', '5%'], ['12', '12%'], ['18', '18%']])) +
      '<div class="card" style="padding:2px 16px">' + togF(t('incl_t', 'Prices include GST'), t('incl_s', 'Tag prices (MRP) already contain tax'), 'f.ob.incl') + '<hr class="hr">' + togF(t('multi_t', 'Shop + godown'), t('multi_s', 'Track stock separately in two locations'), 'f.ob.multi') + '</div></div>';
  }
  if (f.step === 2) body = '<div class="stack sm"><h1 style="font-size:28px">' + esc(t('ob_h3', 'Invoice look')) + '</h1><p class="muted">' + esc(t('ob_p3', 'Pick a default theme. Cashiers can switch per bill.')) + '</p></div>' + themePicker('f.ob.theme') + '<div class="g2">' + txtF(t('upi_id', 'UPI ID'), 'f.ob.upi', 'placeholder="shop@okbank" autocapitalize="off"', t('upi_hint', 'Used for QR codes'), err.upi) + txtF(t('inv_prefix', 'Invoice prefix'), 'f.ob.prefix', 'maxlength="6" autocapitalize="characters" placeholder="' + esc(prefixFor(f.name)) + '"') + '</div>' + txtF(t('footer_note', 'Footer note'), 'f.ob.footer');
  if (f.step === 3) body = '<div class="stack sm"><h1 style="font-size:28px">' + esc(t('ob_h4', 'Payments')) + '</h1><p class="muted">' + esc(t('ob_p4', 'The default opens first at checkout.')) + '</p></div>' + fld(t('default_pay', 'Default payment mode'), seg('f.ob.pay', [['cash', payName('cash')], ['upi', payName('upi')], ['card', payName('card')]])) + '<div class="card" style="padding:2px 16px">' + togF(t('remind_t', 'Month-end credit reminders'), t('remind_s', 'Show customers to remind on the 28th–30th'), 'f.ob.remind') + '</div>';
  if (f.step === 4) body = '<div class="stack sm"><h1 style="font-size:28px">' + esc(t('ob_h5', 'Bring your team')) + '</h1><p class="muted">' + esc(t('ob_p5', 'Share this page with your staff from the Share menu. They open it, request access, and you approve them under Staff with the right role.')) + '</p></div>' +
    '<div class="list">' + ['cashier', 'inventory', 'accountant', 'dispatcher'].map(function (r) { return '<div class="li"><span class="ic">' + icon({ cashier: 'receipt', inventory: 'package', accountant: 'calculator', dispatcher: 'truck' }[r], 18) + '</span><span class="tx"><b>' + esc(roleName(r)) + '</b><small>' + esc(roleDesc(r)) + '</small></span></div>'; }).join('') + '</div>' +
    '<div class="card" style="padding:2px 16px">' + togF(t('demo_t', 'Start with demo data'), t('demo_s', 'Adds clearly marked sample garments, bills and customers. Remove them anytime in Settings.'), 'f.ob.demo') + '</div>';
  return '<div class="gate" style="align-items:flex-start"><div class="box" style="max-width:560px">' +
    '<div class="between"><div class="rowx">' + logo(32) + '<b style="font-size:19px;letter-spacing:-.04em">vastrenix</b></div><span class="small muted">' + esc(t('step_of', 'Step {a} of {b}', { a: f.step + 1, b: 5 })) + '</span></div>' +
    '<div class="stack sm"><div class="prog">' + steps.map(function (s, i) { return '<i class="' + (i <= f.step ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="prog xsmall muted">' + steps.map(function (s, i) { return '<span style="' + (i === f.step ? 'color:var(--accent-text);font-weight:700' : '') + '">' + esc(s) + '</span>'; }).join('') + '</div></div>' +
    body + '<div class="rowx" style="padding-top:6px">' + (f.step ? '<button class="btn line lg" data-a="obBack">' + esc(t('back', 'Back')) + '</button>' : '') + busyBtn(f.step === 4 ? t('finish_setup', 'Finish setup') : t('continue', 'Continue'), 'obNext', 'primary lg grow') + '</div></div></div>';
}
function roleDesc(r) { return t('rd_' + r, { admin: 'Everything, including settings', manager: 'Runs a branch: sales, stock, purchases, money', cashier: 'Billing, invoices, dues and shifts', inventory: 'Garments, receiving, transfers and counts', purchase: 'Suppliers, purchase orders and receiving', accountant: 'Expenses, cash book, dues and reports', dispatcher: 'Packs and dispatches dealer orders', auditor: 'Sees everything, changes nothing' }[r] || ''); }
var GST_STATES = { '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh' };
function gstValid(g) { return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(g || '').toUpperCase()); }
function gstState(g) { g = String(g || '').toUpperCase(); return gstValid(g) ? (GST_STATES[g.slice(0, 2)] || '') : ''; }
function prefixFor(name) { var p = String(name || '').trim().split(/\s+/).map(function (w) { return w[0] || ''; }).join('').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); return p.length >= 2 ? p : 'VX'; }
A.obBack = function () { S.f.ob.step = Math.max(0, S.f.ob.step - 1); S.f.obErr = {}; schedule(); };
A.obNext = async function () {
  var f = S.f.ob, err = {};
  if (f.step === 0) { if (!String(f.name).trim()) err.name = t('err_biz', 'Enter your business name'); if (!String(f.city).trim()) err.city = t('err_city', 'Enter the city'); }
  if (f.step === 1 && f.gstin && !gstValid(f.gstin)) err.gstin = t('err_gstin', 'GSTIN should be 15 characters, like 24AAPCO4821K1Z6');
  if (f.step === 2 && f.upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim())) err.upi = t('err_upi', 'UPI ID looks like name@bank');
  S.f.obErr = err; if (Object.keys(err).length) { schedule(); return; }
  if (f.step < 4) { f.step++; schedule(); window.scrollTo(0, 0); return; }
  S.busy = 'ob'; schedule();
  try {
    var locations = [{ id: 'shop', name: t('loc_shop', 'Shop floor'), type: 'shop' }];
    if (f.multi) locations.push({ id: 'godown', name: t('loc_godown', 'Godown'), type: 'godown' });
    var gst = String(f.gstin || '').toUpperCase().trim();
    await put('meta/store', {
      name: f.name.trim(), city: f.city.trim(), phone: phoneDigits(f.phone), address: String(f.address || '').trim(), gstin: gst, stateCode: gst ? gst.slice(0, 2) : '', state: gstState(gst),
      defaultGst: +f.gst, priceIncl: !!f.incl, locations: locations, upi: String(f.upi || '').trim(), prefix: (String(f.prefix || '').trim() || prefixFor(f.name)).toUpperCase(),
      invoice: { theme: f.theme, showLogo: true, showQr: true, footer: f.footer || '' }, defaultPay: f.pay, remind: !!f.remind,
      categories: ['Kurtas', 'Sarees', 'Dupattas', 'Bottoms', 'Menswear', 'Kidswear', 'Fabric'], code: 'VX-' + prefixFor(f.name) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0'),
      ownerId: ME.id || null, ownerName: ME.name || '', createdAt: Date.now()
    });
    // Create 7-day free trial subscription document for new business
    var existingSub = await fresh('meta/subscription');
    if (!existingSub) {
      var subNow = Date.now();
      var subDoc = {
        businessId: ME.id,
        status: 'trialing',
        trialStartedAt: subNow,
        trialEndsAt: subNow + 7 * 864e5,
        trialThreeDUsed: 0,
        trialThreeDLimit: 3,
        cycleId: null,
        gstin: gst || '',
        createdAt: subNow,
        updatedAt: subNow
      };
      await put('meta/subscription', subDoc);
      if (window.FS) {
        try { await window.FS.doc('subscriptions/' + ME.id).set(subDoc, { merge: true }); } catch (e) { console.warn('subscription mirror not created', e); }
      }
    }
    if (window.VX_onStoreCreated) {
      var sNow = await fresh('meta/store');
      for (var ci = 0; ci < 5 && !(await window.VX_onStoreCreated(sNow.code, sNow.name)); ci++) { sNow.code = 'VX-' + prefixFor(sNow.name) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0'); await put('meta/store', sNow); }
    }
    if (!(await fresh('meta/counters'))) await put('meta/counters', { inv: 0, cn: 0, po: 0, do: 0, tr: 0 });
    if (f.demo) await loadDemo();
    S.f.ob = null; toast(t('ob_done', 'Store is ready. Make your first bill.'));
  } catch (e) { toast(errText(e), 'bad'); }
  S.busy = null; schedule();
};

/* ===================== HOME ===================== */
function hourBars(key) {
  var d = dayDoc(key), b = []; for (var h = 9; h <= 21; h++) b.push(0);
  if (d) vals(d.inv).forEach(function (i) { var hr = new Date(i.at).getHours(); var ix = Math.max(0, Math.min(12, hr - 9)); b[ix] += invSign(i) * i.total; });
  var mx = Math.max.apply(null, b.concat([1])), cur = Math.max(0, Math.min(12, new Date().getHours() - 9));
  return '<div class="bars" aria-hidden="true">' + b.map(function (v, i) { return '<i class="' + (i === cur && key === dayKey(Date.now()) ? 'hi' : '') + '" style="height:' + Math.max(6, Math.round(Math.max(0, v) / mx * 100)) + '%;' + (i > cur && key === dayKey(Date.now()) ? 'opacity:.35' : '') + '"></i>'; }).join('') + '</div>';
}
function vHome() {
  var st = storeV(), now = Date.now(), today = dayKey(now), yk = dayKey(now - 864e5);
  var hr = new Date().getHours();
  var greet = hr < 12 ? t('gm', 'Good morning') : hr < 17 ? t('ga', 'Good afternoon') : t('ge', 'Good evening');
  var first = String(ME.name || '').split(' ')[0];
  var lo = D.loaded.ledger, ts = daySales(today), ys = daySales(yk);
  var delta = ys.total > 0 ? Math.round((ts.total - ys.total) / ys.total * 100) : null;
  var sh = openShift();
  var hero = !lo ? '<section class="hero" aria-busy="true"><div class="skel" style="height:14px;width:40%"></div><div class="skel" style="height:40px;width:60%"></div><div class="skel" style="height:44px"></div></section>' :
    '<section class="hero"><div class="between"><span class="lab">' + esc(t('todays_sales', 'Today’s sales')) + ' · ' + esc(fmtD(now, { weekday: 'short', day: 'numeric', month: 'short' })) + '</span>' +
    (allowed('shift') ? '<a class="chipd" href="#shift" data-a="go" data-r="shift"><span class="dot" style="' + (sh ? 'background:var(--hero-up)' : 'background:var(--hero-muted)') + '"></span>' + esc(sh ? t('shift_open', 'Shift open') : t('open_shift', 'Open shift')) + '</a>' : '') + '</div>' +
    '<div class="rowx" style="align-items:flex-end;gap:10px"><span class="big" data-count="heroSales" data-to="' + ts.total + '">' + inr(ts.total) + '</span>' + (delta != null ? '<span class="rowx ' + (delta >= 0 ? 'up' : '') + '" style="gap:3px;font-size:13px;font-weight:600;padding-bottom:4px;' + (delta < 0 ? 'color:var(--hero-muted)' : '') + '">' + icon(delta >= 0 ? 'trendUp' : 'trendDown', 15, 2) + Math.abs(delta) + '% ' + esc(t('vs_yday', 'vs yesterday')) + '</span>' : '') + '</div>' +
    hourBars(today) +
    '<div class="split"><div><b>' + nf(ts.bills) + '</b><small>' + esc(t('bills', 'Bills')) + '</small></div><div><b>' + inr(ts.bills ? ts.total / ts.bills : 0) + '</b><small>' + esc(t('avg_bill', 'Avg. bill')) + '</small></div><div><b>' + (sh ? inr(shiftExpected(sh)) : '—') + '</b><small>' + esc(t('cash_drawer', 'Cash in drawer')) + '</small></div></div></section>';
  var qa = '<div class="qa">' +
    (allowed('bill') ? '<a class="pri" href="#bill" data-a="go" data-r="bill">' + icon('receipt', 22) + esc(t('nav_bill', 'New bill')) + '</a>' : '') +
    (can('stock') ? '<button data-a="newProduct">' + icon('shirt', 22) + esc(t('add_item', 'Add garment')) + '</button>' : '') +
    (can('stock') || can('purchase') ? '<a href="#purchases" data-a="go" data-r="purchases">' + icon('package', 22) + esc(t('receive', 'Receive')) + '</a>' : '') +
    (can('money') ? '<button data-a="sheet" data-k="expense">' + icon('wallet', 22) + esc(t('expense', 'Expense')) + '</button>' : allowed('customers') ? '<a href="#customers" data-a="go" data-r="customers">' + icon('users', 22) + esc(t('nav_customers', 'Customers')) + '</a>' : '') + '</div>';
  var banners = '';
  if (MODE === 'local') banners += '<div class="banner warn">' + '<span class="ic warn">' + icon('cloud', 18) + '</span><span class="tx"><b>' + esc(t('local_t', 'Offline preview')) + '</b><small>' + esc(t('local_b2', 'Data is saved on this device only. Sign in with an online account to back it up and sync with your team.')) + '</small></span></div>';
  var reqs = vals(D.requests).filter(function (q) { return q.status === 'pending'; });
  if (reqs.length && allowed('staff')) banners += '<a class="banner" href="#staff" data-a="go" data-r="staff"><span class="ic acc">' + icon('userPlus', 18) + '</span><span class="tx"><b>' + esc(t('staff_req_n', '{n} staff waiting for approval', { n: reqs.length })) + '</b><small>' + esc(reqs.map(function (q) { return q.name + ' · ' + roleName(q.role); }).slice(0, 2).join(', ')) + '</small></span>' + icon('chevR', 18) + '</a>';
  var dueC = vals(D.customers).filter(function (c) { return (+c.balance || 0) > 0.5; });
  var dueT = sum(dueC, function (c) { return c.balance; });
  if (st.remind !== false && new Date().getDate() >= 28 && dueC.length && allowed('dues')) {
    var mk = monthKey(now), toRemind = dueC.filter(function (c) { return c.remindedMonth !== mk; }).length;
    if (toRemind) banners += '<a class="banner warn" href="#dues" data-a="go" data-r="dues"><span class="ic warn">' + icon('calendar', 18) + '</span><span class="tx"><b>' + esc(t('remind_due', 'Month-end reminders due')) + '</b><small>' + esc(t('remind_due_s', '{n} customers owe {amt} in store credit', { n: toRemind, amt: inr(dueT) })) + '</small></span>' + icon('chevR', 18) + '</a>';
  }
  var low = lowList(), newDo = vals(D.dorders).filter(function (o) { return o.status === 'submitted'; }), toPack = vals(D.dorders).filter(function (o) { return o.status === 'accepted' || o.status === 'partial'; });
  var openPo = vals(D.pos).filter(function (p) { return p.status === 'open' || p.status === 'partial'; });
  var sub = subState();
  var subBanner = '';
  if (sub.isExpired) {
    subBanner = '<div class="banner bad" style="margin-bottom:16px;padding:12px 16px;border-radius:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<span class="ic bad">' + icon('lock', 20) + '</span>' +
        '<div><b style="font-size:14.5px">' + esc(t('trial_ended_t', 'Your free trial has ended')) + '</b><div class="small muted">' + esc(t('trial_ended_b', 'Subscribe to create new bills, garments, and purchase orders. Your past data is safe.')) + '</div></div>' +
      '</div>' +
      '<button class="btn strong sm" data-a="openSubscribe">' + esc(t('subscribe_continue', 'Subscribe to continue')) + '</button>' +
    '</div>';
  } else if (sub.isTrial && !S.dismissTrialBanner) {
    subBanner = '<div class="banner between" style="margin-bottom:16px;border:1px solid var(--line);border-radius:14px;padding:10px 16px">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span class="ic acc" style="width:28px;height:28px;border-radius:999px;flex-shrink:0">' + icon('clock', 16) + '</span>' +
        '<span style="font-size:13.5px;font-weight:600;color:var(--fg)">' + esc(t('trial_banner_left', 'Free trial — {n} days left', { n: sub.daysLeft })) + '</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<button class="btn primary xs" data-a="openSubscribe" style="padding:4px 12px;font-size:12px">' + esc(t('subscribe', 'Subscribe')) + '</button>' +
        '<button class="ib plain xs" data-a="dismissTrialBanner" aria-label="Dismiss" style="color:var(--muted)">' + icon('x', 14) + '</button>' +
      '</div>' +
    '</div>';
  }
  var held = vals(D.held);
  var att = [];
  if (D.loaded.products && low.length && allowed('lowstock')) att.push(['lowstock', 'bad', 'alert', t('att_low', 'Low stock: {n} variants', { n: low.length }), t('att_low_s', '{n} out of stock', { n: low.filter(function (x) { return x.out; }).length })]);
  if (D.loaded.customers && dueC.length && allowed('dues')) att.push(['dues', 'warn', 'wallet', t('att_due', '{amt} store credit due', { amt: inr(dueT) }), t('att_due_s', '{n} customers', { n: dueC.length })]);
  if (D.loaded.dorders && (newDo.length || toPack.length) && allowed('dealers')) att.push(['dealers', 'acc', 'truck', t('att_do', '{n} new dealer orders', { n: newDo.length }), t('att_do_s', '{n} accepted orders to pack', { n: toPack.length })]);
  if (D.loaded.pos && openPo.length && allowed('purchases')) att.push(['purchases', '', 'package', t('att_po', '{n} purchase orders open', { n: openPo.length }), t('att_po_s', 'Stock rises when goods are received')]);
  if (held.length && allowed('bill')) att.push(['bill', '', 'pause', t('att_held', '{n} bills on hold', { n: held.length }), t('att_held_s', 'Resume from New bill')]);
  var attHtml = '<section class="stack sm"><div class="sect"><h2>' + esc(t('needs_attention', 'Needs attention')) + '</h2></div>' + (!D.loaded.products ? skelRows(3) : att.length ? '<div class="list">' + att.map(function (a) { return '<a class="li" href="#' + a[0] + '" data-a="go" data-r="' + a[0] + '"><span class="ic ' + a[1] + '">' + icon(a[2], 18) + '</span><span class="tx"><b>' + esc(a[3]) + '</b><small>' + esc(a[4]) + '</small></span>' + icon('chevR', 18) + '</a>'; }).join('') + '</div>' : '<div class="card pad rowx"><span class="ic ok">' + icon('checkCircle', 18) + '</span><span class="small">' + esc(t('all_clear', 'All clear. Nothing needs you right now.')) + '</span></div>') + '</section>';
  var recent = allInvoices().slice(0, 6);
  var recHtml = allowed('invoices') ? '<section class="stack sm"><div class="sect"><h2>' + esc(t('recent_bills', 'Recent bills')) + '</h2><a href="#invoices" data-a="go" data-r="invoices">' + esc(t('see_all', 'See all')) + '</a></div>' + (!lo ? skelRows(4) : recent.length ? '<div class="list">' + recent.map(invRow).join('') + '</div>' : '<div class="card">' + empty('receipt', t('no_bills', 'No bills yet'), t('no_bills_b', 'Your first sale will show up here.'), allowed('bill') ? '<a class="btn primary sm" href="#bill" data-a="go" data-r="bill">' + esc(t('nav_bill', 'New bill')) + '</a>' : '') + '</div>') + '</section>' : '';
  var week = []; for (var i = 6; i >= 0; i--) { var k = dayKey(now - i * 864e5); week.push({ label: fmtD(keyToTs(k), { weekday: 'narrow' }), v: daySales(k).total, hi: i === 0 }); }
  var weekHtml = allowed('reports') || allowed('invoices') ? '<section class="card pad stack"><div class="between"><b>' + esc(t('last7', 'Last 7 days')) + '</b><span class="b num">' + inr(sum(week, function (w) { return w.v; })) + '</span></div>' + (lo ? barChart(week, 120) : '<div class="skel" style="height:120px"></div>') + '</section>' : '';
  var head = '<header class="ph"><div class="ph-t"><p>' + esc(st.name || '') + ' · ' + esc(locName(curLoc())) + '</p><h1>' + esc(greet + (first ? ', ' + first : '')) + '</h1></div><div class="ph-a">' +
    '<button class="ib" data-a="sheet" data-k="search" aria-label="' + esc(t('search', 'Search')) + '">' + icon('search', 20) + '</button>' +
    '<button class="ib" data-a="sheet" data-k="alerts" aria-label="' + esc(t('alerts', 'Alerts')) + '">' + icon('bell', 20) + (att.length + reqs.length ? '<span class="bdg">' + (att.length + reqs.length) + '</span>' : '') + '</button></div></header>';
  return head + '<div class="cols"><div class="stack lg">' + subBanner + hero + qa + (banners ? '<div class="stack sm">' + banners + '</div>' : '') + attHtml + '</div><div class="stack lg">' + recHtml + weekHtml + '</div></div>';
}
function barChart(data, h) {
  var W = 320, H = h || 120, pad = 18, bw = (W - 8) / data.length, mx = Math.max.apply(null, data.map(function (d) { return d.v; }).concat([1]));
  var bars = data.map(function (d, i) { var bh = Math.max(2, (Math.max(0, d.v) / mx) * (H - pad - 8)); var x = 4 + i * bw + bw * 0.18; return '<rect class="' + (d.hi ? 'bar' : 'bar2') + '" x="' + x.toFixed(1) + '" y="' + (H - pad - bh).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4"><title>' + esc(d.label + ': ' + inr(d.v)) + '</title></rect><text x="' + (4 + i * bw + bw / 2).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(d.label) + '</text>'; }).join('');
  return '<svg class="svgc" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('sales_chart', 'Sales chart')) + '"><line class="grid" x1="0" x2="' + W + '" y1="' + (H - pad) + '" y2="' + (H - pad) + '"/>' + bars + '</svg>';
}
function invRow(i) {
  var cn = i.kind === 'cn', cr = i.pay && i.pay.mode === 'credit';
  var st = cn ? pill(t('credit_note', 'Credit note'), '') : i.void ? pill(t('void', 'Void'), 'bad') : cr ? pill(t('on_credit', 'On credit'), 'warn') : pill(t('paid', 'Paid'), 'ok');
  return '<button class="li" data-a="openInv" data-day="' + esc(i.day) + '" data-id="' + esc(i.id) + '"><span class="ic">' + icon(cn ? 'undo' : payIcon(i.pay && i.pay.mode), 18) + '</span><span class="tx"><b>' + esc((i.cust && i.cust.name) || t('walkin', 'Walk-in customer')) + '</b><small class="num">' + esc(i.no + ' · ' + fmtT(i.at) + ' · ' + (cn ? t('refund', 'Refund') + ' ' + payName(i.refund || 'cash') : payName(i.pay && i.pay.mode))) + '</small></span><span class="end"><b class="' + (cn ? 'bad-t' : '') + '">' + (cn ? '−' : '') + inr(i.total) + '</b>' + st + '</span></button>';
}

/* ===================== MORE ===================== */
function vMore() {
  var groups = GROUPS.map(function (g) {
    var items = Object.keys(ROUTES).filter(function (r) { return ROUTES[r].g === g[0] && allowed(r); });
    if (!items.length) return '';
    return '<section class="stack sm"><div class="sect"><h2>' + esc(t(g[1], g[2])) + '</h2></div><div class="qa">' + items.map(function (r) { var b = badgeFor(r); return '<a href="#' + r + '" data-a="go" data-r="' + r + '" style="position:relative">' + icon(ROUTES[r].icon, 22) + esc(rt(r)) + (b ? '<span class="pill acc" style="position:absolute;top:7px;right:7px;height:18px;padding:0 6px">' + b + '</span>' : '') + '</a>'; }).join('') + '</div></section>';
  }).join('');
  var sub = subState();
  var cycleLabel = sub.cycleId === 'annual' ? t('plan_annual', 'Annual') : (sub.cycleId === 'quarterly' ? t('plan_quarterly', '3 Months') : t('plan_monthly', 'Monthly'));
  var subTile = '<section class="stack sm"><div class="sect"><h2>' + esc(t('subscription_plan', 'Subscription & Plan')) + '</h2></div><div class="card pad stack">' +
    '<div class="between" style="align-items:flex-start;gap:12px">' +
      '<div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<b style="font-size:15px">' + esc(sub.isActive ? t('plan_active', 'Active Paid Plan') : (sub.isTrial ? t('plan_trial', '7-Day Free Trial') : t('plan_expired', 'Trial Expired'))) + '</b>' +
          '<span class="pill ' + (sub.isActive ? 'ok' : (sub.isTrial ? 'acc' : 'bad')) + '">' + esc(sub.isActive ? cycleLabel : (sub.isTrial ? sub.daysLeft + ' days left' : 'Expired')) + '</span>' +
        '</div>' +
        '<div class="small muted" style="margin-top:4px">' + esc(sub.isActive ? t('plan_active_desc', 'Unlimited bills, multi-counter sync & full business features') : (sub.isTrial ? t('trial_days_remaining', '{n} days left in your free trial · Full access', { n: sub.daysLeft }) : t('trial_ended_desc', 'Subscribe to create new bills, items and orders'))) + '</div>' +
      '</div>' +
      '<button class="btn ' + (sub.isActive ? 'line sm' : 'primary sm') + '" data-a="openSubscribe">' + esc(sub.isActive ? t('manage_plan', 'View Plan') : t('subscribe_now', 'Subscribe')) + '</button>' +
    '</div>' +
  '</div></section>';

  var helpGroup = '<section class="stack sm"><div class="sect"><h2>' + esc(t('help_custom_dev', 'Help & Resources')) + '</h2></div><div class="qa">' +
    '<button type="button" data-a="openSub" data-k="contact" data-target="card-support">' + icon('message', 22) + esc(t('help_support_btn', 'Support')) + '</button>' +
    '<button type="button" data-a="openSub" data-k="contact" data-target="card-cw">' + icon('layers', 22) + esc(t('custom_work_btn', 'Custom Work')) + '</button>' +
    '<button type="button" data-a="openSub" data-k="about">' + icon('info', 22) + esc(t('nav_about', 'About Us')) + '</button>' +
    '<button type="button" data-a="openSub" data-k="privacy">' + icon('shield', 22) + esc(t('nav_privacy', 'Privacy Policy')) + '</button>' +
  '</div></section>';

  var ownerBadge = sub.isActive
    ? '<span class="pill ok" style="font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;cursor:pointer" data-a="openSubscribe"><span class="dot" style="width:6px;height:6px"></span>' + esc(t('plan_active_badge', 'Active')) + '</span>'
    : (sub.isTrial
      ? '<span class="pill acc" style="font-size:11px;font-weight:700;cursor:pointer" data-a="openSubscribe">' + esc(t('trial_badge', '{n}d trial', { n: sub.daysLeft })) + '</span>'
      : (sub.isExpired
        ? '<span class="pill bad" style="font-size:11px;font-weight:700;cursor:pointer" data-a="openSubscribe">' + esc(t('plan_expired', 'Expired')) + '</span>'
        : ''));

  var profileCard = '<div class="card pad rowx">' +
    (ME.avatar ? '<img class="avatar" style="width:52px;height:52px;border-radius:16px" src="' + esc(safeImg(ME.avatar)) + '" alt="">' : '<span class="ic" style="width:52px;height:52px;border-radius:16px;background:var(--strong);color:var(--strong-fg);font-size:17px">' + esc(initials(ME.name || 'You')) + '</span>') +
    '<span class="grow"><span style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:17px">' + esc(ME.name || t('you', 'You')) + '</b>' + ownerBadge + '</span><br><span class="small muted">' + esc(roleName(ME.role) + ' · ' + (storeV().name || '')) + '</span></span>' +
    (allowed('settings') ? '<a class="ib" href="#settings" data-a="go" data-r="settings" aria-label="' + esc(t('nav_settings', 'Settings')) + '">' + icon('settings', 19) + '</a>' : '') +
  '</div>';

  return ph(t('nav_more', 'More')) + '<div class="stack lg" style="max-width:760px">' +
    profileCard +
    groups +
    helpGroup +
    (typeof vxExtraMore === 'function' ? vxExtraMore() : '') +
    subTile +
    '<section class="stack sm"><div class="sect"><h2>' + esc(t('this_device', 'This device')) + '</h2></div><div class="card pad stack">' + fld(t('language', 'Language'), langSeg()) + fld(t('appearance', 'Appearance'), themeSeg()) + '<button class="btn line" data-a="sheet" data-k="loc">' + icon('mapPin', 17) + esc(t('selling_from', 'Selling from: {l}', { l: locName(curLoc()) })) + '</button>' + syncLine() + '</div></section></div>';
}
A.openSub = function (d) { openSub(d.k, d); };
A.dismissTrialBanner = function () { S.dismissTrialBanner = true; schedule(); };
function langSeg() { return '<div class="seg" role="radiogroup" aria-label="' + esc(t('language', 'Language')) + '">' + [['en', 'English'], ['hi', 'हिन्दी'], ['gu', 'ગુજરાતી']].map(function (l) { return '<button type="button" role="radio" aria-checked="' + (LANG === l[0]) + '" class="' + (LANG === l[0] ? 'on' : '') + '" data-a="setLang" data-v="' + l[0] + '">' + l[1] + '</button>'; }).join('') + '</div>'; }
function themeSeg() { var v = lsGet('vx-theme') || 'system'; return '<div class="seg" role="radiogroup" aria-label="' + esc(t('appearance', 'Appearance')) + '">' + [['system', t('th_system', 'System')], ['light', t('th_light', 'Light')], ['dark', t('th_dark', 'Dark')]].map(function (l) { return '<button type="button" role="radio" aria-checked="' + (v === l[0]) + '" class="' + (v === l[0] ? 'on' : '') + '" data-a="setTheme" data-v="' + l[0] + '">' + esc(l[1]) + '</button>'; }).join('') + '</div>'; }
A.setLang = function (d) { LANG = d.v; lsSet('vx-lang', LANG); memoCache = {}; schedule(); };
A.setTheme = function (d) { lsSet('vx-theme', d.v === 'system' ? null : d.v); applyTheme(); schedule(); };
function applyTheme() { var v = lsGet('vx-theme'); if (v === 'light' || v === 'dark') document.documentElement.setAttribute('data-theme', v); else document.documentElement.removeAttribute('data-theme'); if (window.vxNativeUi) setTimeout(window.vxNativeUi, 0); }
