/* ===================== POS BILLING ===================== */
function newBill() { var st = storeV(); return { id: uid('i'), lines: [], cust: null, disc: { type: 'amt', v: 0 }, theme: (st.invoice && st.invoice.theme) || 'modern', tier: 'retail', note: '' }; }
function bill() { if (!S.bill) S.bill = newBill(); return S.bill; }
function availAt(v, loc) { var s = +((v.stock || {})[loc]) || 0; return Math.max(0, Math.min(s, VXC.variantAvail(v))); }
function tierPrice(p, tier) { var pr = p.price || {}; return +(pr[tier] || pr.retail || 0); }
function billCalc(b) { var st = storeV(); return VXC.calcBill(b.lines.map(function (l) { return { qty: l.qty, rate: l.rate, gst: l.gst }; }), { incl: st.priceIncl !== false, disc: b.disc }); }
function addToBill(p, v) {
  var b = bill(), loc = curLoc(), max = availAt(v, loc);
  var ex = b.lines.find(function (l) { return l.vid === v.id && l.pid === p.id; });
  var have = ex ? ex.qty : 0;
  if (have + 1 > max) { toast(max <= 0 ? t('none_here', 'No stock of {x} at {l}', { x: p.name + ' ' + variantLabel(v), l: locName(loc) }) : t('only_n', 'Only {n} available at {l}', { n: max, l: locName(loc) }), 'bad'); return; }
  if (ex) ex.qty++;
  else b.lines.push({ key: uid('l'), pid: p.id, vid: v.id, name: p.name, label: variantLabel(v), sku: v.sku, hsn: p.hsn || '', qty: 1, rate: tierPrice(p, b.tier), gst: p.gst != null ? +p.gst : (+storeV().defaultGst || 5) });
  schedule();
}
function findByCode(code) {
  code = String(code || '').trim().toUpperCase(); if (!code) return null;
  var hit = null;
  products().some(function (p) { return (p.variants || []).some(function (v) { if (String(v.barcode || '').toUpperCase() === code || String(v.sku || '').toUpperCase() === code) { hit = { p: p, v: v }; return true; } return false; }); });
  return hit;
}
function matchProducts(q, cat) {
  q = String(q || '').toLowerCase().trim();
  return products().filter(function (p) {
    if (cat && cat !== 'all' && p.cat !== cat) return false;
    if (!q) return true;
    var hay = (p.name + ' ' + (p.cat || '') + ' ' + (p.fabric || '') + ' ' + (p.variants || []).map(function (v) { return v.sku + ' ' + v.barcode + ' ' + v.color + ' ' + v.size; }).join(' ')).toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  });
}
function vBill() {
  if (subState().isExpired) {
    return ph(t('nav_bill', 'New bill'), '', '', 'goHome') +
      '<div class="card pad stack" style="max-width:540px;margin:32px auto;text-align:center;align-items:center;padding:36px 20px;gap:16px">' +
        '<div style="width:64px;height:64px;border-radius:999px;background:var(--bad-soft);display:flex;align-items:center;justify-content:center;color:var(--bad)">' + icon('lock', 32) + '</div>' +
        '<div class="stack xs">' +
          '<h2 style="font-size:22px">' + esc(t('trial_expired_bill_t', 'Your 7-day trial has ended')) + '</h2>' +
          '<p class="muted" style="font-size:14px;line-height:1.5">' + esc(t('trial_expired_bill_b', 'Subscribe to Vastrenix to continue making bills, managing inventory, and tracking dues. Your past bills and records are safely preserved.')) + '</p>' +
        '</div>' +
        '<button class="btn primary lg block" data-a="openSubscribe">' + esc(t('view_plans_subscribe', 'View plans & Subscribe')) + '</button>' +
      '</div>';
  }
  syncTier();
  var b = bill(), st = storeV(), c = billCalc(b), loc = curLoc();
  var q = S.q.bill || '', cat = S.q.billCat || 'all';
  var list = matchProducts(q, cat), shown = list.slice(0, S.ui.billAll || q ? 80 : 12);
  var cats = [['all', t('all', 'All')]].concat((st.categories || []).filter(function (x) { return products().some(function (p) { return p.cat === x; }); }).map(function (x) { return [x, x]; }));
  var held = vals(D.held);
  var catalog = '<section class="stack">' +
    '<div class="rowx">' + '<div class="grow">' + searchBox('q.bill', t('search_scan', 'Search or scan barcode'), 'data-enter="scanAdd" enterkeyhint="search"') + '</div>' + '<button class="ib dark" data-a="focusScan" aria-label="' + esc(t('scan', 'Scan barcode')) + '">' + icon('scan', 20) + '</button></div>' +
    (cats.length > 1 ? chips('q.billCat', cats) : '') +
    (!D.loaded.products ? '<div class="tiles">' + [1, 2, 3, 4, 5, 6].map(function () { return '<div class="tile"><div class="skel" style="height:92px"></div><div class="skel" style="height:12px;width:70%"></div></div>'; }).join('') + '</div>' :
      !products().length ? '<div class="card">' + empty('shirt', t('no_items', 'No garments yet'), t('no_items_b', 'Add garments to start billing. You can still bill a custom item.'), can('stock') ? '<button class="btn primary sm" data-a="newProduct">' + esc(t('add_item', 'Add garment')) + '</button>' : '') + '</div>' :
        !list.length ? '<div class="card">' + empty('search', t('no_match', 'No match for “{q}”', { q: q }), t('no_match_b', 'Check the spelling or add it as a custom item.'), '<button class="btn line sm" data-a="sheet" data-k="custom">' + esc(t('custom_item', 'Custom item')) + '</button>') + '</div>' :
          '<div class="tiles">' + shown.map(function (p) {
            var a = sum(p.variants || [], function (v) { return availAt(v, loc); });
            return '<button class="tile" data-a="tapProduct" data-id="' + esc(p.id) + '"' + (a <= 0 ? ' style="opacity:.55"' : '') + '><span class="ph2" style="background-color:' + colorOf((p.colors || [])[0] || p.name) + ';' + (p.img ? 'background-image:url(' + cssUrl(p.img) + ')' : '') + '">' + (p.img ? '' : icon('shirt', 30, 1.3)) + (a <= 3 ? pill(a <= 0 ? t('out', 'Out') : t('n_left', '{n} left', { n: a }), 'bad') : '') + '</span><b>' + esc(p.name) + '</b><span class="pr"><span class="b num">' + inr(tierPrice(p, b.tier)) + '</span><span class="xsmall muted">' + esc((p.variants || []).length > 1 ? t('n_var', '{n} sizes', { n: (p.variants || []).length }) : variantLabel((p.variants || [])[0] || {})) + '</span></span></button>';
          }).join('') + '</div>' + (list.length > shown.length ? '<button class="btn line block" data-a="set" data-k="ui.billAll" data-v="true">' + esc(t('show_all_n', 'Show all {n}', { n: list.length })) + '</button>' : '')) +
    '</section>';
  var lines = b.lines.length ? b.lines.map(function (l) {
    var cl = c.lines[b.lines.indexOf(l)];
    return '<div class="cline"><span class="sw" style="background-color:' + colorOf((l.label || '').split(' · ')[1] || l.name) + '">' + icon(l.custom ? 'tag' : 'shirt', 16) + '</span><button class="grow" data-a="sheet" data-k="line" data-key="' + esc(l.key) + '" style="border:0;background:none;text-align:left;padding:0;min-width:0"><b style="display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(l.name) + '</b><span class="xsmall muted" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc([l.label, l.sku].filter(Boolean).join(' · ') || t('custom_item', 'Custom item')) + (l.qty > 1 ? ' · ' + inr(l.rate) + ' ' + esc(t('each', 'each')) : '') + '</span><span class="b num" style="font-size:14px">' + inr(l.qty * l.rate) + '</span></button>' + stepper('data-a="lineQty" data-key="' + esc(l.key) + '" data-d="-1"', 'data-a="lineQty" data-key="' + esc(l.key) + '" data-d="1"', l.qty, l.name) + '</div>';
  }).join('') : '<div style="padding:22px 16px;text-align:center" class="small muted">' + icon('receipt', 22) + '<div style="margin-top:6px">' + esc(t('cart_empty', 'Tap a garment or scan a barcode to add it.')) + '</div></div>';
  var cust = b.cust ? '<button class="li" data-a="sheet" data-k="custPick" style="border:1px solid var(--line);border-radius:16px;min-height:56px"><span class="ic round acc">' + esc(initials(b.cust.name)) + '</span><span class="tx"><b>' + esc(b.cust.name || t('customer', 'Customer')) + '</b><small>' + esc(fmtPhone(b.cust.phone) + (custDue(b.cust) ? ' · ' + t('owes', 'owes {amt}', { amt: inr(custDue(b.cust)) }) : '')) + '</small></span>' + icon('edit', 16) + '</button>' :
    '<button class="li" data-a="sheet" data-k="custPick" style="border:1px dashed var(--line2);border-radius:16px;min-height:56px"><span class="ic round">' + icon('user', 17) + '</span><span class="tx"><b>' + esc(t('add_customer', 'Add customer')) + '</b><small>' + esc(t('add_customer_s', 'Optional · needed for store credit')) + '</small></span>' + icon('plus', 18) + '</button>';
  var totals = '<div class="stack sm" style="padding:14px 16px">' +
    '<div class="sumrow"><span>' + esc(t('subtotal_n', 'Subtotal · {n} items', { n: c.qty })) + '</span><span class="num">' + inr(c.gross, 1) + '</span></div>' +
    '<div class="sumrow"><span>' + esc(t('discount', 'Discount')) + '</span><button class="btn ghost xs" data-a="sheet" data-k="disc" style="height:auto;padding:0">' + (c.disc ? '−' + inr(c.disc, 1) : esc(t('add', 'Add'))) + '</button></div>' +
    '<div class="sumrow"><span>' + esc(st.priceIncl !== false ? t('gst_incl', 'GST included (CGST + SGST)') : t('gst_added', 'GST (CGST + SGST)')) + '</span><span class="num">' + inr(c.tax, 1) + '</span></div>' +
    (c.round ? '<div class="sumrow"><span>' + esc(t('round_off', 'Round off')) + '</span><span class="num">' + (c.round > 0 ? '+' : '−') + inr(Math.abs(c.round), 1) + '</span></div>' : '') +
    '<div class="sumrow tot"><span>' + esc(t('total', 'Total')) + '</span><span class="num">' + inr(c.grand) + '</span></div>' +
    '<button class="rowx small" data-a="sheet" data-k="billTheme" style="border:0;background:none;padding:6px 0 0;color:var(--muted)">' + icon('palette', 16) + esc(t('invoice_theme', 'Invoice')) + ': <b class="acc-t">' + esc(themeName(b.theme)) + '</b></button></div>';
  var dp = st.defaultPay || 'cash';
  var charge = '<button class="paybtn" data-a="checkout"' + (!b.lines.length ? ' disabled' : '') + '><span>' + esc(t('charge', 'Charge')) + ' ' + inr(c.grand) + '</span><span class="pm">' + icon(payIcon(dp), 16) + esc(payName(dp)) + icon('chevR', 15) + '</span></button>';
  var cart = '<section class="cart stack">' + cust +
    seg('bill.tier', [['retail', t('tier_retail', 'Retail')], ['wholesale', t('tier_wholesale', 'Wholesale')]], t('price_tier', 'Price tier')) +
    '<div class="card" style="overflow:hidden"><div class="between" style="padding:12px 16px 4px"><b>' + esc(t('bill_items', 'Items')) + '</b><button class="btn ghost xs" data-a="sheet" data-k="custom">' + icon('plus', 15) + esc(t('custom_item', 'Custom item')) + '</button></div>' + lines + totals + '</div>' +
    '<div class="deskpay">' + charge + '</div></section>';
  var head = ph(t('nav_bill', 'New bill'), esc(locName(loc)) + ' · ' + esc(st.priceIncl !== false ? t('prices_incl', 'Prices include GST') : t('prices_excl', 'GST added on top')),
    (held.length ? '<button class="btn line sm" data-a="sheet" data-k="held">' + icon('pause', 15) + esc(t('held_n', 'Held · {n}', { n: held.length })) + '</button>' : '') +
    (b.lines.length ? '<button class="btn line sm" data-a="holdBill">' + esc(t('hold', 'Hold')) + '</button><button class="ib" data-a="clearBill" aria-label="' + esc(t('clear_bill', 'Clear bill')) + '">' + icon('trash', 18) + '</button>' : ''), 'goHome');
  return head + '<div class="pos">' + catalog + cart + '</div><div class="paybar"><button class="between small" data-a="toCart" style="border:0;background:none;padding:0;width:100%;color:inherit"><span class="muted">' + esc(t('n_items', '{n} items', { n: c.qty })) + (b.cust ? ' · ' + esc(b.cust.name) : '') + '</span><span class="acc-t b rowx" style="gap:4px">' + esc(t('view_bill', 'View bill')) + icon('chevD', 15) + '</span></button>' + charge + '</div>';
}
function custDue(c) { if (!c || !c.id || !D.customers[c.id]) return 0; return +D.customers[c.id].balance || 0; }
A.goHome = function () { go('home'); };
A.toCart = function () { var el = document.querySelector('.cart'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
A.focusScan = function () { var el = document.getElementById('f-q-bill'); if (el) { el.focus(); el.select(); } toast(t('scan_hint', 'Scan with a USB/Bluetooth barcode scanner, or type the code and press Enter.')); };
A.scanAdd = function () {
  var q = S.q.bill, hit = findByCode(q);
  if (hit) { addToBill(hit.p, hit.v); S.q.bill = ''; schedule(); return; }
  var m = matchProducts(q, 'all');
  if (m.length === 1) A.tapProduct({ id: m[0].id });
};
A.tapProduct = function (d) {
  var p = D.products[d.id]; if (!p) return;
  var vs = (p.variants || []);
  if (vs.length === 1) { addToBill(p, vs[0]); return; }
  openSheet('variant', { pid: p.id });
};
A.lineQty = function (d) {
  var b = bill(), l = b.lines.find(function (x) { return x.key === d.key; }); if (!l) return;
  var nq = l.qty + (+d.d);
  if (nq <= 0) { b.lines = b.lines.filter(function (x) { return x !== l; }); schedule(); return; }
  if (!l.custom) { var p = D.products[l.pid], v = p && (p.variants || []).find(function (x) { return x.id === l.vid; }); var mx = v ? availAt(v, curLoc()) : 0; if (nq > mx) { toast(t('only_n', 'Only {n} available at {l}', { n: mx, l: locName(curLoc()) }), 'bad'); return; } }
  l.qty = nq; schedule();
};
A.clearBill = function () { openSheet('confirm', { title: t('clear_bill', 'Clear bill'), msg: t('clear_bill_q', 'Remove all items from this bill?'), yes: t('clear', 'Clear'), act: 'doClearBill', danger: true }); };
A.doClearBill = function () { S.bill = newBill(); closeSheet(); };
A.holdBill = async function () {
  var b = bill(); if (!b.lines.length) return;
  try { await put('held/' + b.id, { bill: clone(b), at: Date.now(), by: ME.id, total: billCalc(b).grand, loc: curLoc() }); S.bill = newBill(); toast(t('held_ok', 'Bill put on hold')); } catch (e) { toast(errText(e), 'bad'); }
};
A.resumeHeld = async function (d) {
  var h = D.held[d.id]; if (!h) return;
  if (bill().lines.length) await A.holdBill();
  S.bill = clone(h.bill); closeSheet();
  try { await del('held/' + d.id); } catch (e) { }
};
A.dropHeld = async function (d) { try { await del('held/' + d.id); } catch (e) { toast(errText(e), 'bad'); } };
A.setTier = function () { };
/* re-price lines when the tier changes */
var lastTier = null;
function syncTier() { var b = S.bill; if (!b) return; if (lastTier !== null && lastTier !== b.tier) { b.lines.forEach(function (l) { if (!l.custom && D.products[l.pid]) l.rate = tierPrice(D.products[l.pid], b.tier); }); } lastTier = b.tier; }

/* ----- checkout ----- */
A.checkout = function () {
  if (subState().isExpired) {
    openSheet('subscribe');
    toast(t('trial_ended_toast', 'Your free trial has ended. Subscribe to continue.'), 'bad');
    return;
  }
  var b = bill(); if (!b.lines.length) return;
  var st = storeV(), c = billCalc(b);
  S.co = { mode: st.defaultPay || 'cash', tendered: c.grand, last4: '', split: { cash: '', upi: '', card: '' }, credit: { name: b.cust ? b.cust.name : '', phone: b.cust ? b.cust.phone : '', paid: '', due: new Date(VXC.monthEnd(Date.now())).toISOString().slice(0, 10) }, utr: '', step: 'pay', err: {} };
  openSheet('checkout');
};
function coView() {
  var b = bill(), c = billCalc(b), co = S.co, st = storeV(), g = c.grand;
  if (!co) return '';
  if (co.step === 'upi') {
    var upi = st.upi;
    var link = 'upi://pay?pa=' + encodeURIComponent(upi || '') + '&pn=' + encodeURIComponent(st.name || 'Store') + '&am=' + g.toFixed(2) + '&cu=INR&tn=' + encodeURIComponent('Bill ' + (st.prefix || 'VX'));
    var body = '<div style="text-align:center" class="stack sm"><span class="small muted">' + esc(t('collect_exactly', 'Collect exactly')) + '</span><span class="bigamt">' + inr(g, 1) + '</span></div>' +
      (upi ? '<div class="qrbox"><div class="qr" data-qr="' + esc(link) + '" role="img" aria-label="' + esc(t('upi_qr_for', 'UPI QR code for {amt}', { amt: inr(g) })) + '"></div><span class="upi">' + esc(upi) + '<button class="btn soft xs" data-a="copy" data-v="' + esc(upi) + '">' + icon('copy', 14) + esc(t('copy', 'Copy')) + '</button></span><small>' + esc(t('scan_any', 'Scan with GPay, PhonePe, Paytm or any UPI app')) + '</small></div>' :
        '<div class="banner warn"><span class="ic warn">' + icon('alert', 18) + '</span><span class="tx"><b>' + esc(t('no_upi', 'Add your UPI ID to show a QR')) + '</b><small>' + esc(t('no_upi_s', 'Settings → Billing. You can still mark this bill as paid by UPI.')) + '</small></span></div>');
    return sheetWrap(t('upi_payment', 'UPI payment'), body, '<button class="btn line" data-a="coStep" data-v="pay">' + esc(t('change_method', 'Change method')) + '</button><button class="btn primary" data-a="coStep" data-v="utr">' + icon('check', 18, 2.2) + esc(t('cust_paid', 'Customer has paid')) + '</button>');
  }
  if (co.step === 'utr') {
    return sheetWrap(t('utr_t', 'Add UTR reference?'), '<p class="muted small">' + esc(t('utr_b', 'Optional. The 12-digit UTR from the customer’s payment screen helps match this bill with your bank.')) + '</p>' + txtF(t('utr', 'UTR / reference no.'), 'co.utr', 'inputmode="numeric" maxlength="22" autocomplete="off" style="letter-spacing:.05em"'),
      busyBtn(t('skip', 'Skip'), 'completeSale', 'line', 'data-skip="1"', 'sale') + busyBtn(t('save_finish', 'Save & finish'), 'completeSale', 'primary', '', 'sale'));
  }
  var modes = ['cash', 'upi', 'card', 'split', 'credit'];
  var m = co.mode, err = co.err || {}, extra = '';
  if (m === 'cash') {
    var change = r2((+co.tendered || 0) - g);
    var quick = [g, Math.ceil(g / 100) * 100, Math.ceil(g / 500) * 500, Math.ceil(g / 2000) * 2000].filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 4);
    extra = moneyF(t('cash_received', 'Cash received'), 'co.tendered', 'data-r class="in big"', null, err.tendered) +
      '<div class="picks">' + quick.map(function (x, i) { return '<button type="button" class="pick' + (+co.tendered === x ? ' on' : '') + '" data-a="set" data-k="co.tendered" data-v="' + x + '">' + (i === 0 ? esc(t('exact', 'Exact')) : inr(x)) + '</button>'; }).join('') + '</div>' +
      '<div class="banner ' + (change >= 0 ? 'ok' : 'bad') + '"><span class="tx"><b>' + esc(change >= 0 ? t('return_change', 'Return change') : t('still_due', 'Still due')) + '</b></span><b class="num" style="font-size:20px">' + inr(Math.abs(change)) + '</b></div>';
  }
  if (m === 'upi') extra = '<div class="note">' + icon('qr', 18) + '<span>' + esc(t('upi_next', 'A QR for exactly {amt} opens next. The customer scans it with any UPI app.', { amt: inr(g) })) + '</span></div>';
  if (m === 'card') extra = txtF(t('card_last4', 'Card last 4 digits (optional)'), 'co.last4', 'inputmode="numeric" maxlength="4" placeholder="4821"');
  if (m === 'split') {
    var paid = r2((+co.split.cash || 0) + (+co.split.upi || 0) + (+co.split.card || 0)), left = r2(g - paid);
    extra = '<div class="g3">' + moneyF(payName('cash'), 'co.split.cash', 'data-r') + moneyF(payName('upi'), 'co.split.upi', 'data-r') + moneyF(payName('card'), 'co.split.card', 'data-r') + '</div>' +
      '<div class="banner ' + (Math.abs(left) < 0.5 ? 'ok' : 'warn') + '"><span class="tx"><b>' + esc(Math.abs(left) < 0.5 ? t('split_ok', 'Amounts match the bill') : left > 0 ? t('left_to_assign', 'Left to assign') : t('over_by', 'Over by')) + '</b></span><b class="num">' + inr(Math.abs(left)) + '</b></div>' + (err.split ? '<span class="err small bad-t">' + esc(err.split) + '</span>' : '');
  }
  if (m === 'credit') {
    extra = '<div class="g2">' + txtF(t('cust_name', 'Customer name'), 'co.credit.name', 'autocomplete="off"', null, err.cname) + txtF(t('mobile', 'Mobile number'), 'co.credit.phone', 'inputmode="tel"', null, err.cphone) + '</div>' +
      '<div class="g2">' + moneyF(t('paid_now', 'Paid now in cash'), 'co.credit.paid', 'data-r', t('optional', 'Optional')) + fld(t('due_date', 'Due date'), '<input class="in" type="date" id="f-co-credit-due" data-m="co.credit.due" value="' + esc(co.credit.due) + '">', null, null, 'f-co-credit-due') + '</div>' +
      '<div class="banner warn"><span class="ic warn">' + icon('calendar', 18) + '</span><span class="tx"><b>' + esc(t('credit_due', '{amt} added to store credit', { amt: inr(Math.max(0, g - (+co.credit.paid || 0))) })) + '</b><small>' + esc(t('credit_rem', 'Shown in Dues. Month-end reminder on the 28th–30th.')) + '</small></span></div>';
  }
  var cta = { cash: t('complete_sale', 'Complete sale · {amt}', { amt: inr(g) }), upi: t('show_qr', 'Show UPI QR'), card: t('confirm_card', 'Confirm card payment'), split: t('complete_split', 'Complete split payment'), credit: t('add_credit', 'Add to store credit') }[m];
  var body = '<div class="between" style="align-items:flex-end"><div class="stack sm" style="gap:4px"><span class="small muted">' + esc(t('amount_due', 'Amount due')) + (b.cust ? ' · ' + esc(b.cust.name) : '') + '</span><span class="bigamt">' + inr(g) + '</span></div><button class="btn ghost sm" data-a="close">' + esc(t('edit_bill', 'Edit bill')) + '</button></div>' +
    '<div class="modes" role="radiogroup" aria-label="' + esc(t('pay_method', 'Payment method')) + '">' + modes.map(function (x) { return '<button type="button" role="radio" aria-checked="' + (m === x) + '" class="mode' + (m === x ? ' on' : '') + '" data-a="set" data-k="co.mode" data-v="' + x + '">' + icon(payIcon(x), 20) + '<span>' + esc(x === 'credit' ? t('pay_credit_s', 'Credit') : payName(x)) + '</span></button>'; }).join('') + '</div>' + extra;
  return sheetWrap(t('checkout', 'Checkout'), body, busyBtn(cta, m === 'upi' ? 'coUpi' : 'completeSale', 'primary lg', '', 'sale'));
}
A.coStep = function (d) { S.co.step = d.v; schedule(); };
A.coUpi = function () { S.co.step = 'upi'; schedule(); };
A.copy = function (d) { try { navigator.clipboard.writeText(d.v).then(function () { toast(t('copied', 'Copied')); }, function () { toast(d.v); }); } catch (e) { toast(d.v); } };
A.completeSale = async function (d) {
  var b = bill(), co = S.co, c = billCalc(b), g = c.grand, err = {};
  if (d && d.skip) co.utr = '';
  var pay = { mode: co.mode, cash: 0, upi: 0, card: 0, credit: 0 };
  if (co.mode === 'cash') { if ((+co.tendered || 0) < g - 0.001) err.tendered = t('err_tender', 'Cash received is less than the total'); pay.cash = g; pay.tendered = +co.tendered || g; pay.change = r2(pay.tendered - g); }
  if (co.mode === 'upi') { pay.upi = g; pay.utr = String(co.utr || '').replace(/\s/g, ''); }
  if (co.mode === 'card') { pay.card = g; pay.last4 = String(co.last4 || '').slice(-4); }
  if (co.mode === 'split') { pay.cash = Math.max(0, +co.split.cash || 0); pay.upi = Math.max(0, +co.split.upi || 0); pay.card = Math.max(0, +co.split.card || 0); if (Math.abs(pay.cash + pay.upi + pay.card - g) > 0.5 || (+co.split.cash || 0) < 0 || (+co.split.upi || 0) < 0 || (+co.split.card || 0) < 0) err.split = t('err_split', 'Split amounts must add up to {amt}', { amt: inr(g) }); }
  if (co.mode === 'credit') {
    if (!String(co.credit.name || '').trim()) err.cname = t('err_cname', 'Customer name is required for store credit');
    if (phoneDigits(co.credit.phone).length !== 10) err.cphone = t('err_phone', 'Enter a 10-digit mobile number');
    var paidNow = Math.max(0, Math.min(g, +co.credit.paid || 0));
    pay.cash = paidNow; pay.credit = r2(g - paidNow); pay.due = co.credit.due ? new Date(co.credit.due + 'T20:00:00').getTime() : VXC.monthEnd(Date.now());
  }
  co.err = err; if (Object.keys(err).length) { schedule(); return; }
  var cust = b.cust ? clone(b.cust) : null;
  if (co.mode === 'credit') { cust = cust || {}; cust.name = co.credit.name.trim(); cust.phone = phoneDigits(co.credit.phone); }
  var res = await tx('sale', function () { return postSale(b, c, pay, cust); });
  if (!res) return;
  S.lastSale = res; S.bill = newBill(); S.co = null;
  openSheet('saleDone', { day: res.day, id: res.id });
};
async function postSale(b, c, pay, cust) {
  var now = Date.now(), day = dayKey(now), loc = curLoc(), st = storeV();
  /* a resumed held bill comes from the database: re-validate every line before it can move stock or money */
  if (!b.lines.length || b.lines.some(function (l) { return !(Number.isInteger(+l.qty) && +l.qty > 0 && +l.qty <= 100000) || !(+l.rate >= 0 && +l.rate < 1e8) || [0, 5, 12, 18, 28].indexOf(+l.gst) < 0; })) throw fail(t('err_bad_line', 'A line on this bill has an invalid quantity, price or GST rate. Fix it and try again.'));
  var dd = await ensureDay(day);
  if (dd.inv && dd.inv[b.id]) return { day: day, id: b.id };
  /* stock check against fresh product documents */
  var need = {};
  b.lines.forEach(function (l) { if (!l.custom) { need[l.pid] = need[l.pid] || {}; need[l.pid][l.vid] = (need[l.pid][l.vid] || 0) + l.qty; } });
  var prods = {};
  for (var pid in need) {
    var p = await fresh('products/' + pid);
    if (!p) throw fail(t('err_gone', 'An item in this bill was deleted. Remove it and try again.'));
    for (var vid in need[pid]) {
      var v = (p.variants || []).find(function (x) { return x.id === vid; });
      var a = v ? availAt(v, loc) : 0;
      if (!v || a < need[pid][vid]) throw fail(t('err_stock', 'Only {n} of {x} left at {l}. Another counter may have just sold it.', { n: a, x: p.name + ' ' + (v ? variantLabel(v) : ''), l: locName(loc) }));
      v.stock[loc] = (+v.stock[loc] || 0) - need[pid][vid];
      v.sold = (+v.sold || 0) + need[pid][vid];
      v.lastSoldAt = now;
    }
    prods[pid] = p;
  }
  /* customer */
  var custId = null, custRef = null;
  if (cust && (cust.name || cust.phone)) {
    var existing = cust.id ? await fresh('customers/' + cust.id) : null;
    if (!existing && cust.phone) { var match = vals(D.customers).find(function (x) { return phoneDigits(x.phone) === phoneDigits(cust.phone); }); if (match) { existing = await fresh('customers/' + match.id); cust.id = match.id; } }
    custId = cust.id || uid('c');
    custRef = existing || { name: cust.name || '', phone: phoneDigits(cust.phone), balance: 0, spent: 0, visits: 0, createdAt: now, recent: [], txns: [] };
    if (cust.name) custRef.name = cust.name;
  }
  var no = (st.prefix || 'VX') + '-' + VXC.pad(await nextNo('inv'), 4);
  var inv = {
    no: no, at: now, kind: 'sale', loc: loc, by: ME.id || '', theme: b.theme, tier: b.tier,
    cust: custId ? { id: custId, name: custRef.name, phone: custRef.phone } : null,
    lines: c.lines.map(function (l, i) { var s = b.lines[i]; return { pid: s.pid || '', vid: s.vid || '', name: s.name, label: s.label || '', sku: s.sku || '', hsn: s.hsn || '', qty: s.qty, rate: s.rate, gst: s.gst, taxable: l.taxable, tax: l.tax, total: l.total, custom: !!s.custom }; }),
    gross: c.gross, disc: c.disc, taxable: c.taxable, tax: c.tax, cgst: c.cgst, sgst: c.sgst, round: c.round, total: c.grand, incl: st.priceIncl !== false,
    pay: pay, note: b.note || ''
  };
  var upd = {}; upd[b.id] = inv;
  await patch('ledger/' + day, { inv: upd });
  for (var k in prods) { prods[k].updatedAt = now; await put('products/' + k, prods[k]); }
  if (custId) {
    custRef.spent = r2((+custRef.spent || 0) + c.grand); custRef.visits = (+custRef.visits || 0) + 1; custRef.lastAt = now;
    custRef.recent = [{ day: day, id: b.id, no: no, total: c.grand, mode: pay.mode, at: now }].concat(custRef.recent || []).slice(0, 40);
    if (pay.credit > 0) { custRef.balance = r2((+custRef.balance || 0) + pay.credit); custRef.txns = (custRef.txns || []).concat([{ t: 'credit', amt: pay.credit, at: now, ref: no, due: pay.due }]).slice(-80); }
    await put('customers/' + custId, custRef);
  }
  return { day: day, id: b.id };
}
function doneView(sh) {
  var d = dayDoc(sh.day), i = d && d.inv && d.inv[sh.id];
  if (!i) return sheetWrap(t('sale_done', 'Sale complete'), '<div class="empty"><span class="spin"></span></div>', '');
  var inv = Object.assign({ day: sh.day, id: sh.id }, i), p = inv.pay || {};
  var body = '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding-top:6px"><span style="width:76px;height:76px;border-radius:999px;background:var(--ok-soft);display:flex;align-items:center;justify-content:center"><span style="width:52px;height:52px;border-radius:999px;background:var(--ok-solid);color:#fff;display:flex;align-items:center;justify-content:center">' + icon('check', 28, 2.6) + '</span></span><span class="small muted">' + esc(p.mode === 'credit' ? t('added_credit', 'Added to store credit') : t('pay_received', 'Payment received')) + '</span><span class="bigamt">' + inr(inv.total) + '</span><span class="small">' + esc(payName(p.mode) + ' · ' + fmtT(inv.at) + ' · ' + inv.no) + '</span>' + (p.change ? '<span class="pill ok">' + esc(t('give_change', 'Give change {amt}', { amt: inr(p.change) })) + '</span>' : '') + '</div>' +
    '<div class="g3">' + '<button class="btn soft" data-a="openInv" data-day="' + esc(inv.day) + '" data-id="' + esc(inv.id) + '">' + icon('file', 18) + esc(t('view_invoice', 'View invoice')) + '</button>' +
    '<a class="btn soft" target="_blank" rel="noopener" href="' + esc(waLink(inv.cust && inv.cust.phone, invText(inv))) + '" data-a="noop">' + icon('message', 18) + 'WhatsApp</a>' +
    '<button class="btn soft" data-a="pdf" data-day="' + esc(inv.day) + '" data-id="' + esc(inv.id) + '">' + icon('download', 18) + 'PDF</button></div>' +
    '<div class="note">' + icon('package', 17) + '<span>' + esc(t('stock_updated', 'Stock updated · {n} sold from {l}', { n: sum(inv.lines, function (l) { return l.custom ? 0 : l.qty; }), l: locName(inv.loc) })) + '</span></div>';
  return sheetWrap(t('sale_done', 'Sale complete'), body, '<button class="btn strong lg" data-a="nextBill">' + icon('plus', 18, 2.2) + esc(t('next_bill', 'Next bill')) + '</button>');
}
A.nextBill = function () { closeSheet(); go('bill'); };
function invText(i) {
  var st = storeV();
  return t('wa_inv', 'Hi {name}, thank you for shopping at {store}. Invoice {no} for {amt} dated {date}.', { name: (i.cust && i.cust.name) || '', store: st.name || '', no: i.no, amt: inr(i.total), date: fmtDY(i.at) }) + '\n' + i.lines.map(function (l) { return '• ' + l.name + (l.label ? ' (' + l.label + ')' : '') + ' × ' + l.qty + ' = ' + inr(l.total); }).join('\n') + (i.pay && i.pay.mode === 'credit' ? '\n' + t('wa_due', 'Store credit due: {amt} by {date}', { amt: inr(i.pay.credit), date: fmtD(i.pay.due) }) : '');
}

/* ----- bill sheets ----- */
function variantSheet(sh) {
  var p = D.products[sh.pid]; if (!p) return '';
  var loc = curLoc(), b = bill();
  var body = '<div class="rowx">' + swatch(p) + '<div class="grow"><b>' + esc(p.name) + '</b><div class="small muted">' + inr(tierPrice(p, b.tier)) + ' · ' + esc(p.fabric || p.cat || '') + '</div></div></div>' +
    '<div class="list">' + (p.variants || []).map(function (v) { var a = availAt(v, loc); var inCart = (b.lines.find(function (l) { return l.vid === v.id; }) || {}).qty || 0; return '<button class="li" data-a="addVar" data-pid="' + esc(p.id) + '" data-vid="' + esc(v.id) + '"' + (a - inCart <= 0 ? ' disabled style="opacity:.5"' : '') + '><span class="ic" style="background:' + colorOf(v.color) + ';color:#fff;font-size:12px">' + esc(v.size || '—') + '</span><span class="tx"><b>' + esc(variantLabel(v) || p.name) + '</b><small class="num">' + esc(v.sku || '') + (inCart ? ' · ' + t('in_bill_n', '{n} in bill', { n: inCart }) : '') + '</small></span><span class="end">' + stockPill(a - inCart, v.min) + '</span></button>'; }).join('') + '</div>' +
    (sum(p.variants || [], function (v) { return availAt(v, loc); }) <= 0 ? '<div class="note">' + icon('info', 17) + '<span>' + esc(t('none_here_s', 'Nothing at {l}. Check other locations on the garment page.', { l: locName(loc) })) + '</span></div>' : '');
  return sheetWrap(t('pick_size', 'Pick size & colour'), body, '<button class="btn line" data-a="close">' + esc(t('done', 'Done')) + '</button>');
}
A.addVar = function (d) { var p = D.products[d.pid], v = p && (p.variants || []).find(function (x) { return x.id === d.vid; }); if (p && v) { addToBill(p, v); } };
function lineSheet(sh) {
  var b = bill(), l = b.lines.find(function (x) { return x.key === sh.key; }); if (!l) return '';
  if (!S.f.line || S.f.line.key !== l.key) S.f.line = { key: l.key, rate: l.rate, qty: l.qty, name: l.name };
  var body = (l.custom ? txtF(t('item_name', 'Item name'), 'f.line.name') : '<div><b>' + esc(l.name) + '</b><div class="small muted">' + esc(l.label + ' · ' + l.sku) + '</div></div>') +
    '<div class="g2">' + moneyF(t('price_each', 'Price each'), 'f.line.rate', '', can('settings') || ME.role === 'manager' || l.custom ? '' : t('price_hint', 'Price changes are recorded on the invoice')) + numF(t('qty', 'Quantity'), 'f.line.qty', 'inputmode="numeric"') + '</div>';
  return sheetWrap(t('edit_line', 'Edit item'), body, '<button class="btn danger" data-a="removeLine">' + icon('trash', 17) + esc(t('remove', 'Remove')) + '</button><button class="btn primary" data-a="saveLine">' + esc(t('save', 'Save')) + '</button>');
}
A.removeLine = function () { var b = bill(); b.lines = b.lines.filter(function (x) { return x.key !== S.f.line.key; }); closeSheet(); };
A.saveLine = function () {
  var b = bill(), f = S.f.line, l = b.lines.find(function (x) { return x.key === f.key; }); if (!l) return closeSheet();
  var q = Math.max(1, Math.round(+f.qty || 1));
  if (!l.custom) { var p = D.products[l.pid], v = p && p.variants.find(function (x) { return x.id === l.vid; }); var mx = v ? availAt(v, curLoc()) : 0; if (q > mx) { toast(t('only_n', 'Only {n} available at {l}', { n: mx, l: locName(curLoc()) }), 'bad'); return; } }
  l.qty = q; l.rate = Math.max(0, +f.rate || 0); if (l.custom) l.name = f.name || l.name; closeSheet();
};
function customSheet() {
  var f = S.f.custom || (S.f.custom = { name: '', rate: '', qty: 1, gst: String(storeV().defaultGst != null ? storeV().defaultGst : 5), err: {} });
  var body = txtF(t('item_name', 'Item name'), 'f.custom.name', 'placeholder="' + esc(t('custom_ph', 'e.g. Alteration, Fall & pico')) + '"', null, f.err.name) +
    '<div class="g2">' + moneyF(t('price_each', 'Price each'), 'f.custom.rate', '', null, f.err.rate) + numF(t('qty', 'Quantity'), 'f.custom.qty', 'inputmode="numeric"') + '</div>' + fld(t('gst_rate', 'GST rate'), seg('f.custom.gst', [['0', '0%'], ['5', '5%'], ['12', '12%'], ['18', '18%']]));
  return sheetWrap(t('custom_item', 'Custom item'), body, '<button class="btn primary lg" data-a="addCustom">' + esc(t('add_to_bill', 'Add to bill')) + '</button>');
}
A.addCustom = function () {
  var f = S.f.custom; f.err = {};
  if (!String(f.name).trim()) f.err.name = t('err_item', 'Enter an item name');
  if (!(+f.rate > 0)) f.err.rate = t('err_price', 'Enter a price');
  if (Object.keys(f.err).length) { schedule(); return; }
  bill().lines.push({ key: uid('l'), custom: true, pid: '', vid: '', name: f.name.trim(), label: '', sku: '', qty: Math.max(1, Math.round(+f.qty || 1)), rate: +f.rate, gst: +f.gst });
  S.f.custom = null; closeSheet();
};
function discSheet() {
  var b = bill(), c = billCalc(b);
  if (!S.f.disc) S.f.disc = { type: b.disc.type, v: b.disc.v || '' };
  var preview = VXC.calcBill(b.lines, { incl: storeV().priceIncl !== false, disc: { type: S.f.disc.type, v: +S.f.disc.v || 0 } });
  var body = seg('f.disc.type', [['amt', t('disc_amt', 'Amount ₹')], ['pct', t('disc_pct', 'Percent %')]]) + numF(S.f.disc.type === 'pct' ? t('disc_pct_l', 'Discount %') : t('disc_amt_l', 'Discount amount'), 'f.disc.v', 'data-r class="in big"') +
    '<div class="picks">' + (S.f.disc.type === 'pct' ? [5, 10, 15, 20] : [50, 100, 200, 500]).map(function (x) { return '<button type="button" class="pick" data-a="set" data-k="f.disc.v" data-v="' + x + '">' + (S.f.disc.type === 'pct' ? x + '%' : inr(x)) + '</button>'; }).join('') + '</div>' +
    '<div class="card tight stack sm"><div class="sumrow"><span>' + esc(t('was', 'Was')) + '</span><span class="num">' + inr(c.grand) + '</span></div><div class="sumrow tot"><span>' + esc(t('new_total', 'New total')) + '</span><span class="num">' + inr(preview.grand) + '</span></div></div>';
  return sheetWrap(t('discount', 'Discount'), body, '<button class="btn line" data-a="clearDisc">' + esc(t('remove', 'Remove')) + '</button><button class="btn primary" data-a="applyDisc">' + esc(t('apply', 'Apply')) + '</button>');
}
A.applyDisc = function () { bill().disc = { type: S.f.disc.type, v: Math.max(0, +S.f.disc.v || 0) }; S.f.disc = null; closeSheet(); };
A.clearDisc = function () { bill().disc = { type: 'amt', v: 0 }; S.f.disc = null; closeSheet(); };
function custPickSheet() {
  var q = S.q.cust || '', ql = q.toLowerCase(), qd = phoneDigits(q);
  var list = vals(D.customers).filter(function (c) { return !q || (c.name || '').toLowerCase().indexOf(ql) >= 0 || (qd && phoneDigits(c.phone).indexOf(qd) >= 0); }).sort(by(function (c) { return c.lastAt || 0; }, true)).slice(0, 8);
  var f = S.f.nc || (S.f.nc = { name: '', phone: '' });
  var body = searchBox('q.cust', t('search_cust', 'Search name or mobile')) +
    (list.length ? '<div class="list">' + list.map(function (c) { return '<button class="li" data-a="pickCust" data-id="' + esc(c.id) + '">' + avatarHtml(c.name) + '<span class="tx"><b>' + esc(c.name) + '</b><small>' + esc(fmtPhone(c.phone) + ' · ' + t('visits_n', '{n} visits', { n: c.visits || 0 })) + '</small></span><span class="end">' + ((+c.balance || 0) > 0.5 ? pill(t('owes', 'owes {amt}', { amt: inr(c.balance) }), 'warn') : '') + '</span></button>'; }).join('') + '</div>' : (q ? '<p class="small muted">' + esc(t('no_cust', 'No customer found. Add them below.')) + '</p>' : '')) +
    '<div class="sect"><h3>' + esc(t('new_customer', 'New customer')) + '</h3></div><div class="g2">' + txtF(t('name', 'Name'), 'f.nc.name') + txtF(t('mobile', 'Mobile number'), 'f.nc.phone', 'inputmode="tel"') + '</div>';
  return sheetWrap(t('customer', 'Customer'), body, (bill().cust ? '<button class="btn line" data-a="unpickCust">' + esc(t('walkin', 'Walk-in customer')) + '</button>' : '') + '<button class="btn primary" data-a="useNewCust">' + esc(t('use_customer', 'Use this customer')) + '</button>');
}
A.pickCust = function (d) { var c = D.customers[d.id]; if (c) bill().cust = { id: c.id, name: c.name, phone: c.phone }; S.q.cust = ''; closeSheet(); };
A.unpickCust = function () { bill().cust = null; closeSheet(); };
A.useNewCust = function () {
  var f = S.f.nc; if (!String(f.name).trim() && !f.phone) { toast(t('err_name_or_phone', 'Enter a name or mobile number'), 'bad'); return; }
  var ex = f.phone && vals(D.customers).find(function (c) { return phoneDigits(c.phone) === phoneDigits(f.phone); });
  bill().cust = ex ? { id: ex.id, name: ex.name, phone: ex.phone } : { id: null, name: String(f.name).trim(), phone: phoneDigits(f.phone) };
  S.f.nc = null; closeSheet();
};
function heldSheet() {
  var h = vals(D.held).sort(by(function (x) { return x.at; }, true));
  var body = h.length ? '<div class="list">' + h.map(function (x) { return '<div class="li"><span class="ic">' + icon('pause', 17) + '</span><span class="tx"><b>' + esc((x.bill.cust && x.bill.cust.name) || t('walkin', 'Walk-in customer')) + '</b><small>' + esc(t('n_items', '{n} items', { n: sum(x.bill.lines, function (l) { return l.qty; }) }) + ' · ' + fmtT(x.at) + ' · ' + who(x.by)) + '</small></span><b class="num">' + inr(x.total) + '</b><button class="btn primary xs" data-a="resumeHeld" data-id="' + esc(x.id) + '">' + esc(t('resume', 'Resume')) + '</button><button class="ib plain" data-a="dropHeld" data-id="' + esc(x.id) + '" aria-label="' + esc(t('remove', 'Remove')) + '">' + icon('trash', 16) + '</button></div>'; }).join('') + '</div>' : empty('pause', t('no_held', 'No bills on hold'));
  return sheetWrap(t('held_bills', 'Held bills'), body, '');
}
