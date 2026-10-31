/* ===================== DEALERS / B2B ===================== */
var DO_FLOW = ['submitted', 'accepted', 'packed', 'dispatched', 'delivered', 'closed'];
function doStatus(o) { return { submitted: [t('st_new', 'New'), 'acc'], accepted: [t('st_accepted', 'Accepted'), 'warn'], partial: [t('st_partial_acc', 'Partly accepted'), 'warn'], packed: [t('st_packed', 'Packed'), 'warn'], dispatched: [t('st_dispatched', 'Dispatched'), 'ok'], delivered: [t('st_delivered', 'Delivered'), 'ok'], closed: [t('st_closed', 'Closed'), ''], rejected: [t('st_rejected', 'Rejected'), 'bad'] }[o.status] || [o.status, '']; }
function doLoc() { var g = locs().find(function (l) { return l.type === 'godown'; }); return g ? g.id : curLoc(); }
function doStep(o) { var s = o.status === 'partial' ? 'accepted' : o.status; return s === 'rejected' ? 1 : DO_FLOW.indexOf(s) + 1; }
function vDealers() {
  var tab = S.q.dlTab || 'orders';
  if (tab === 'network') return ph(t('nav_dealers', 'Dealers'), '', can('dealers') ? '<button class="btn primary sm" data-a="sheet" data-k="dealer">' + icon('plus', 16, 2.2) + esc(t('add_dealer', 'Add dealer')) + '</button>' : '') + '<div class="stack lg" style="max-width:860px">' + seg('q.dlTab', [['orders', t('dealer_orders', 'Orders')], ['network', t('network', 'Network')]]) + networkBody() + '</div>';
  var all = vals(D.dorders).sort(by(function (o) { return o.createdAt; }, true));
  var f = S.q.doF || 'submitted';
  var grp = { submitted: ['submitted'], accepted: ['accepted', 'partial'], packed: ['packed'], dispatched: ['dispatched'], done: ['delivered', 'closed', 'rejected'] };
  var cnt = function (k) { return all.filter(function (o) { return grp[k].indexOf(o.status) >= 0; }).length; };
  var list = all.filter(function (o) { return grp[f].indexOf(o.status) >= 0; });
  var body = !D.loaded.dorders ? skelRows(4) : !list.length ? '<div class="card">' + empty('truck', t('no_do', 'No orders here'), f === 'submitted' ? t('no_do_b', 'Record an order when a dealer sends one by phone or WhatsApp.') : '') + '</div>' :
    list.map(function (o) {
      var dl = D.dealers[o.dealerId], stt = doStatus(o), step = doStep(o), units = sum(o.lines, function (l) { return o.status === 'submitted' ? l.qty : (+l.acc || 0); });
      return '<section class="card pad stack"><button class="rowx" style="border:0;background:none;padding:0;text-align:left" data-a="openDO" data-id="' + esc(o.id) + '">' + avatarHtml(dl ? dl.name : '?', '') + '<span class="grow" style="min-width:0"><b style="display:block">' + esc(dl ? dl.name : t('dealer', 'Dealer')) + '</b><span class="xsmall muted num">' + esc(o.no + ' · ' + t('n_pcs', '{n} pcs', { n: units }) + (dl && dl.city ? ' · ' + dl.city : '')) + '</span></span><span class="end" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b class="num">' + inr(o.total) + '</b>' + pill(stt[0], stt[1]) + '</span></button>' +
        '<div aria-hidden="true" style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px">' + DO_FLOW.map(function (s, i) { return '<span style="height:4px;border-radius:999px;background:' + (o.status === 'rejected' ? (i === 0 ? 'var(--bad-solid)' : 'var(--line)') : i < step ? 'var(--strong)' : 'var(--line)') + '"></span>'; }).join('') + '</div>' +
        (o.status === 'submitted' && can('dealers') ? '<div class="rowx"><button class="btn line sm" data-a="openDO" data-id="' + esc(o.id) + '">' + esc(t('review', 'Review')) + '</button>' + busyBtn(t('accept_avail', 'Accept available'), 'acceptDO', 'primary sm grow', 'data-id="' + esc(o.id) + '" data-all="1"', 'do') + '</div>' : '') +
        (o.assignee ? '<span class="rowx xsmall muted">' + avatarHtml(who(o.assignee)).replace('class="ic round acc"', 'class="ic round acc" style="width:22px;height:22px;font-size:10px"') + esc(t('assigned_to', 'Assigned to {n}', { n: who(o.assignee) }) + (o.lr ? ' · LR ' + o.lr : '')) + '</span>' : '') + '</section>';
    }).join('');
  return ph(t('nav_dealers', 'Dealers'), esc(t('do_sub', 'Stock is reserved on acceptance and leaves on dispatch')), can('dealers') ? '<button class="btn primary sm" data-a="newDO">' + icon('plus', 16, 2.2) + esc(t('record_order', 'Record order')) + '</button>' : '') +
    '<div class="stack lg" style="max-width:860px">' + seg('q.dlTab', [['orders', t('dealer_orders', 'Orders')], ['network', t('network', 'Network')]]) + chips('q.doF', [['submitted', t('st_new', 'New'), cnt('submitted')], ['accepted', t('to_pack', 'To pack'), cnt('accepted')], ['packed', t('st_packed', 'Packed'), cnt('packed')], ['dispatched', t('st_dispatched', 'Dispatched'), cnt('dispatched')], ['done', t('done_lc', 'Done'), cnt('done')]]) + body + '</div>';
}
function networkBody() {
  var st = storeV(), ds = vals(D.dealers), pend = ds.filter(function (d) { return d.status === 'pending'; }), con = ds.filter(function (d) { return d.status === 'connected'; }).sort(by(function (d) { return d.name; }));
  return '<section class="hero"><div class="between"><div class="stack sm" style="gap:4px"><span class="lab">' + esc(t('biz_code', 'Your business code')) + '</span><span style="font-size:26px;font-weight:700;letter-spacing:.06em">' + esc(st.code || '—') + '</span></div><span class="chipd">' + icon('network', 16) + '</span></div><p style="font-size:13px;color:var(--hero-muted);line-height:1.5">' + esc(t('code_b', 'Dealers quote this code when they place orders. Each connected dealer gets the price tier you assign.')) + '</p><button class="btn" style="background:#fff;color:#0E0E12;align-self:flex-start" data-a="copy" data-v="' + esc(st.code || '') + '">' + icon('copy', 16) + esc(t('copy_code', 'Copy code')) + '</button></section>' +
    (pend.length ? '<div class="sect"><h2>' + esc(t('requests_n', 'Requests · {n}', { n: pend.length })) + '</h2></div><div class="list">' + pend.map(function (d) { return '<div class="li">' + avatarHtml(d.name, '') + '<span class="tx"><b>' + esc(d.name) + '</b><small>' + esc((d.city || '') + ' · ' + t('wants_tier', 'wants {t} access', { t: tierName(d.tier) })) + '</small></span>' + (can('dealers') ? '<button class="ib" data-a="dealerStatus" data-id="' + esc(d.id) + '" data-v="declined" aria-label="' + esc(t('decline', 'Decline')) + '">' + icon('x', 16) + '</button><button class="ib dark" data-a="dealerStatus" data-id="' + esc(d.id) + '" data-v="connected" aria-label="' + esc(t('approve', 'Approve')) + '">' + icon('check', 16, 2.4) + '</button>' : '') + '</div>'; }).join('') + '</div>' : '') +
    '<div class="sect"><h2>' + esc(t('connected_n', 'Connected · {n}', { n: con.length })) + '</h2></div>' + (con.length ? '<div class="list">' + con.map(function (d) { var n = vals(D.dorders).filter(function (o) { return o.dealerId === d.id; }).length; return '<button class="li" data-a="sheet" data-k="dealer" data-id="' + esc(d.id) + '">' + avatarHtml(d.name, '') + '<span class="tx"><b>' + esc(d.name) + '</b><small>' + esc([d.city, t('n_orders', '{n} orders', { n: n }), (+d.balance || 0) > 0.5 ? t('owes', 'owes {amt}', { amt: inr(d.balance) }) : ''].filter(Boolean).join(' · ')) + '</small></span>' + pill(tierName(d.tier), 'acc') + '</button>'; }).join('') + '</div>' : '<div class="card">' + empty('network', t('no_dealers', 'No dealers connected'), t('no_dealers_b', 'Add the shops and wholesalers who buy from you.')) + '</div>');
}
function tierName(x) { return x === 'wholesale' ? t('tier_wholesale', 'Wholesale') : t('tier_dealer', 'Dealer'); }
A.dealerStatus = async function (d) { var ok = await tx('dl', async function () { var o = await fresh('dealers/' + d.id); o.status = d.v; o.decidedAt = Date.now(); await put('dealers/' + d.id, o); return 1; }); if (ok) toast(d.v === 'connected' ? t('dealer_ok', 'Dealer connected') : t('dealer_no', 'Request declined')); };
function dealerSheet(sh) {
  if (!S.f.dl || S.f.dl.id !== (sh.id || null)) { var o = sh.id ? D.dealers[sh.id] : null; S.f.dl = { id: sh.id || null, name: o ? o.name : '', city: o ? o.city || '' : '', phone: o ? o.phone || '' : '', gstin: o ? o.gstin || '' : '', tier: o ? o.tier || 'dealer' : 'dealer', err: {} }; }
  var f = S.f.dl;
  return sheetWrap(f.id ? t('edit_dealer', 'Edit dealer') : t('add_dealer', 'Add dealer'), txtF(t('biz_name', 'Business name'), 'f.dl.name', '', null, f.err.name) + '<div class="g2">' + txtF(t('city', 'City'), 'f.dl.city') + txtF(t('phone', 'Phone'), 'f.dl.phone', 'inputmode="tel"') + '</div>' + txtF(t('gstin', 'GSTIN'), 'f.dl.gstin', 'autocapitalize="characters" maxlength="15"', t('optional', 'Optional')) + fld(t('price_tier', 'Price tier'), seg('f.dl.tier', [['dealer', t('tier_dealer', 'Dealer')], ['wholesale', t('tier_wholesale', 'Wholesale')]])), (f.id && can('dealers') ? '<button class="btn line" data-a="newDO" data-did="' + esc(f.id) + '">' + esc(t('record_order', 'Record order')) + '</button>' : '') + busyBtn(t('save', 'Save'), 'saveDealer', 'primary', '', 'dl'));
}
A.saveDealer = async function () {
  var f = S.f.dl; f.err = {}; if (!String(f.name).trim()) { f.err.name = t('err_name', 'Enter a name'); schedule(); return; }
  var ok = await tx('dl', async function () { var id = f.id || uid('d'); var o = (f.id && await fresh('dealers/' + f.id)) || { balance: 0, txns: [], status: 'connected', createdAt: Date.now() }; Object.assign(o, { name: f.name.trim(), city: String(f.city || '').trim(), phone: phoneDigits(f.phone), gstin: String(f.gstin || '').toUpperCase(), tier: f.tier }); await put('dealers/' + id, o); return 1; });
  if (ok) { S.f.dl = null; closeSheet(); toast(t('saved', 'Saved')); }
};
A.openDO = function (d) { openSub('dorder', { id: d.id }); };
A.newDO = function (d) { var ds = vals(D.dealers).filter(function (x) { return x.status === 'connected'; }); S.f.do = { dealerId: (d && d.did) || (ds[0] ? ds[0].id : ''), lines: [], q: '', note: '' }; openSub('doform', {}); };
function subDOform() {
  var f = S.f.do; if (!f) return ph(t('record_order', 'Record order'), '', '', 'back');
  var ds = vals(D.dealers).filter(function (x) { return x.status === 'connected'; }).sort(by(function (x) { return x.name; }));
  var dl = D.dealers[f.dealerId], tier = dl ? dl.tier || 'dealer' : 'dealer';
  f.lines.forEach(function (l) { var p = D.products[l.pid]; if (p && !l.manual) l.rate = tierPrice(p, tier); });
  var c = VXC.calcBill(f.lines, { incl: storeV().priceIncl !== false });
  if (!ds.length) return ph(t('record_order', 'Record order'), '', '', 'back', true) + '<div class="card">' + empty('network', t('no_dealers', 'No dealers connected'), t('no_dealers_b', 'Add the shops and wholesalers who buy from you.'), '<button class="btn primary sm" data-a="sheet" data-k="dealer">' + esc(t('add_dealer', 'Add dealer')) + '</button>') + '</div>';
  return ph(t('record_order', 'Record dealer order'), '', '', 'back', true) + '<div class="stack lg" style="max-width:820px"><section class="card pad">' + selF(t('dealer', 'Dealer'), 'f.do.dealerId', ds.map(function (x) { return [x.id, x.name + ' · ' + tierName(x.tier)]; })) + '</section>' +
    '<section class="card pad stack"><b>' + esc(t('items', 'Items')) + '</b>' + lineSearch('f.do.q', 'doAdd') +
    (f.lines.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('item', 'Item')) + '</th><th class="r">' + esc(t('qty', 'Qty')) + '</th><th class="r">' + esc(t('price_each', 'Price each')) + '</th><th class="r">' + esc(t('amount', 'Amount')) + '</th><th></th></tr></thead><tbody>' + f.lines.map(function (l, i) { return '<tr><td><b>' + esc(l.name) + '</b><div class="xsmall muted">' + esc(l.label) + '</div></td><td class="r"><input class="in" id="f-dol-q-' + i + '" data-m="f.do.lines.' + i + '.qty" data-num data-r inputmode="numeric" value="' + esc(l.qty) + '" aria-label="' + esc(t('qty', 'Qty')) + '"></td><td class="r">' + inr(l.rate) + '</td><td class="r b">' + inr(l.qty * l.rate) + '</td><td><button class="ib plain" data-a="doRm" data-i="' + i + '" aria-label="' + esc(t('remove', 'Remove')) + '">' + icon('trash', 16) + '</button></td></tr>'; }).join('') + '</tbody></table></div>' : '') +
    '<div class="sumrow tot"><span>' + esc(t('order_total', 'Order total at {t} price', { t: tierName(tier) })) + '</span><span>' + inr(c.grand) + '</span></div></section>' + txtF(t('note', 'Note'), 'f.do.note', 'placeholder="' + esc(t('do_note_ph', 'Received on WhatsApp')) + '"') +
    '<div class="rowx" style="justify-content:flex-end">' + busyBtn(t('save_order', 'Save order'), 'saveDO', 'primary lg', f.lines.length && f.dealerId ? '' : 'disabled', 'do') + '</div></div>';
}
A.doAdd = function (d) { var f = S.f.do, p = D.products[d.pid], v = p && p.variants.find(function (x) { return x.id === d.vid; }); if (!v) return; var ex = f.lines.find(function (l) { return l.vid === v.id; }); if (ex) ex.qty += 5; else f.lines.push({ pid: p.id, vid: v.id, name: p.name, label: variantLabel(v), sku: v.sku, hsn: p.hsn || '', gst: +p.gst || 0, qty: 10, rate: 0, acc: 0 }); f.q = ''; schedule(); };
A.doAddScan = function () { var h = findByCode(S.f.do.q); if (h) A.doAdd({ pid: h.p.id, vid: h.v.id }); };
A.doRm = function (d) { S.f.do.lines.splice(+d.i, 1); schedule(); };
A.saveDO = async function () {
  var f = S.f.do; f.lines = f.lines.filter(function (l) { return +l.qty > 0; }).map(function (l) { l.qty = Math.round(+l.qty); return l; });
  var c = VXC.calcBill(f.lines, { incl: storeV().priceIncl !== false });
  var id = await tx('do', async function () { var no = 'DO-' + VXC.pad(await nextNo('do'), 4), id = uid('o'), now = Date.now(); await put('dorders/' + id, { no: no, dealerId: f.dealerId, lines: f.lines, status: 'submitted', total: c.grand, note: f.note || '', createdAt: now, by: ME.id || '', timeline: [{ s: 'submitted', at: now, by: ME.id || '' }] }); return id; });
  if (id) { S.f.do = null; toast(t('do_saved', 'Order recorded')); S.sub = { k: 'dorder', id: id, prev: null }; schedule(); }
};
function subDO(sub) {
  var o = D.dorders[sub.id]; if (!o) return ph(t('not_found', 'Not found'), '', '', 'back') + skelRows(2);
  var dl = D.dealers[o.dealerId], stt = doStatus(o), loc = o.loc || curLoc();
  if (o.status === 'submitted') { if (!S.f.acc || S.f.acc.id !== o.id) S.f.acc = { id: o.id, loc: doLoc(), q: null }; loc = S.f.acc.loc; if (!S.f.acc.q || S.f.acc.qLoc !== loc) { S.f.acc.qLoc = loc; S.f.acc.q = o.lines.map(function (l) { var p = D.products[l.pid], v = p && p.variants.find(function (x) { return x.id === l.vid; }); return Math.min(l.qty, v ? availAt(v, loc) : 0); }); } }
  var acc = S.f.acc && S.f.acc.id === o.id ? S.f.acc : null;
  var tl = (o.timeline || []).reduce(function (m, x) { m[x.s] = x; return m; }, {});
  var flow = o.status === 'rejected' ? ['submitted', 'rejected'] : DO_FLOW;
  var cur = o.status === 'partial' ? 'accepted' : o.status, ci = flow.indexOf(cur);
  var sub2 = { submitted: t('tl_sub', 'Order received'), accepted: t('tl_acc', 'Stock reserved'), rejected: t('tl_rej', 'Order declined'), packed: t('tl_pack', 'Packed and ready'), dispatched: t('tl_disp', 'Stock leaves on dispatch'), delivered: t('tl_del', 'Dealer confirms receipt'), closed: t('tl_close', 'Invoice settled') };
  var timeline = '<section class="card pad timeline">' + flow.map(function (s, i) { var k = i < ci || (i === ci && (s === 'closed' || s === 'rejected')) ? 'done' : i === ci ? 'now' : 'next'; var e = tl[s] || (s === 'accepted' ? tl.partial : null); return '<div class="tl ' + k + '"><div class="rail"><span class="nd">' + (k === 'done' ? icon(s === 'rejected' ? 'x' : 'check', 12, 2.8) : '') + '</span>' + (i < flow.length - 1 ? '<span class="ln"></span>' : '') + '</div><div class="tc"><span><b>' + esc(doStatus({ status: s })[0]) + '</b><br><small>' + esc(e && e.note ? e.note : sub2[s]) + '</small></span><small class="num" style="white-space:nowrap">' + esc(e ? fmtD(e.at) + ', ' + fmtT(e.at) : '') + '</small></div></div>'; }).join('') + '</section>';
  var lines = '<section class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('item', 'Item')) + '</th><th class="r">' + esc(t('ordered', 'Ordered')) + '</th><th class="r">' + esc(o.status === 'submitted' ? t('available', 'Available') : t('accepted', 'Accepted')) + '</th>' + (o.status === 'submitted' ? '<th class="r">' + esc(t('accept', 'Accept')) + '</th>' : '') + '<th class="r">' + esc(t('amount', 'Amount')) + '</th></tr></thead><tbody>' + o.lines.map(function (l, i) { var p = D.products[l.pid], v = p && p.variants.find(function (x) { return x.id === l.vid; }), a = v ? availAt(v, loc) : 0; return '<tr><td><b>' + esc(l.name) + '</b><div class="xsmall muted">' + esc(l.label + ' · ' + inr(l.rate)) + '</div></td><td class="r">' + (+l.qty || 0) + '</td><td class="r ' + (o.status === 'submitted' && a < l.qty ? 'bad-t b' : '') + '">' + (o.status === 'submitted' ? a : (+l.acc || 0)) + '</td>' + (o.status === 'submitted' ? '<td class="r"><input class="in" id="f-acc-' + i + '" data-m="f.acc.q.' + i + '" data-num data-r inputmode="numeric" value="' + esc(acc ? acc.q[i] : 0) + '" aria-label="' + esc(t('accept', 'Accept')) + '"' + (can('dealers') ? '' : ' disabled') + '></td>' : '') + '<td class="r b">' + inr((o.status === 'submitted' ? l.qty : (+l.acc || 0)) * l.rate) + '</td></tr>'; }).join('') + '</tbody></table></section>';
  var staff = vals(D.staff).filter(function (s) { return s.status === 'active'; });
  var actions = '';
  if (can('dealers')) {
    if (o.status === 'submitted') actions = '<div class="stack sm">' + (locs().length > 1 ? selF(t('fulfil_from', 'Fulfil from'), 'f.acc.loc', locs().map(function (l) { return [l.id, l.name]; })) : '') + busyBtn(t('accept_sel', 'Accept selected quantities'), 'acceptDO', 'primary lg', 'data-id="' + esc(o.id) + '"', 'do') + '<button class="btn danger" data-a="sheet" data-k="rejectDO" data-id="' + esc(o.id) + '">' + esc(t('reject', 'Reject order')) + '</button></div>';
    if (o.status === 'accepted' || o.status === 'partial') actions = '<div class="stack sm">' + (staff.length ? selF(t('assign_to', 'Assign packing to'), 'f.asg', [['', t('unassigned', 'Unassigned')]].concat(staff.map(function (s) { return [s.id, s.name + ' · ' + roleName(s.role)]; })), 'data-change="assignDO" data-id="' + esc(o.id) + '"') : '') + busyBtn(t('mark_packed', 'Mark as packed'), 'advDO', 'primary lg', 'data-id="' + esc(o.id) + '" data-v="packed"', 'do') + '</div>';
    if (o.status === 'packed') actions = '<button class="btn primary lg" data-a="sheet" data-k="dispatch" data-id="' + esc(o.id) + '">' + icon('truck', 18) + esc(t('dispatch', 'Dispatch')) + '</button>';
    if (o.status === 'dispatched') actions = busyBtn(t('mark_delivered', 'Mark delivered'), 'advDO', 'primary lg', 'data-id="' + esc(o.id) + '" data-v="delivered"', 'do');
    if (o.status === 'delivered') actions = busyBtn(t('close_order', 'Close order'), 'advDO', 'strong lg', 'data-id="' + esc(o.id) + '" data-v="closed"', 'do');
  }
  if (S.f.asgFor !== o.id) { S.f.asg = o.assignee || ''; S.f.asgFor = o.id; }
  return ph(o.no, pill(stt[0], stt[1]) + ' · ' + esc(dl ? dl.name : ''), dl && dl.phone ? '<a class="ib" target="_blank" rel="noopener" href="' + esc(waLink(dl.phone, t('wa_do', 'Hi, update on your order {no}: {s}.', { no: o.no, s: stt[0] }))) + '" data-a="noop" aria-label="WhatsApp">' + icon('message', 19) + '</a>' : '', 'back') +
    '<div class="cols"><div class="stack lg"><section class="hero" style="padding:16px 18px"><div class="between"><div class="stack sm" style="gap:4px"><span class="lab">' + esc(t('dealer_price_n', '{t} price · {n} pcs', { t: tierName(dl && dl.tier), n: sum(o.lines, function (l) { return o.status === 'submitted' ? l.qty : (+l.acc || 0); }) })) + '</span><span class="big" style="font-size:30px">' + inr(o.total) + '</span></div>' + (o.reserved ? '<span class="chipd">' + icon('lock', 13) + esc(t('stock_reserved', 'Stock reserved')) + '</span>' : '') + '</div></section>' + lines + (o.invNo ? '<button class="li card" data-a="openInv" data-day="' + esc(o.invDay) + '" data-id="' + esc(o.invId) + '"><span class="ic">' + icon('file', 17) + '</span><span class="tx"><b>' + esc(t('invoice_no', 'Invoice {no}', { no: o.invNo })) + '</b><small>' + esc(t('th_wholesale', 'Wholesale & Dealer')) + '</small></span>' + icon('chevR', 18) + '</button>' : '') + (o.note ? '<div class="note">' + icon('info', 16) + '<span>' + esc(o.note) + '</span></div>' : '') + '</div><div class="stack lg">' + timeline + actions + '</div></div>';
}
A.assignDO = async function (d, el) { try { await patch('dorders/' + el.getAttribute('data-id'), { assignee: el.value || '' }); toast(t('assigned', 'Assigned')); } catch (e) { toast(errText(e), 'bad'); } };
A.acceptDO = async function (d) {
  var o0 = D.dorders[d.id]; if (!o0) return;
  var useLoc = d.all || !(S.f.acc && S.f.acc.id === d.id) ? doLoc() : (S.f.acc.loc || doLoc());
  var qs = d.all || !(S.f.acc && S.f.acc.id === d.id) ? o0.lines.map(function (l) { var p = D.products[l.pid], v = p && p.variants.find(function (x) { return x.id === l.vid; }); return Math.min(l.qty, v ? availAt(v, useLoc) : 0); }) : S.f.acc.q;
  var ok = await tx('do', async function () {
    var o = await fresh('dorders/' + d.id), now = Date.now(), loc = useLoc; if (o.status !== 'submitted') return 1;
    var byP = {};
    o.lines.forEach(function (l, i) { var q = Math.max(0, Math.min(l.qty, Math.round(+qs[i] || 0))); l.acc = q; if (q) (byP[l.pid] = byP[l.pid] || []).push({ vid: l.vid, q: q, name: l.name + ' ' + l.label }); });
    var accTotal = sum(o.lines, function (l) { return l.acc; });
    if (!accTotal) throw fail(t('err_accept0', 'Nothing to accept. Reject the order instead.'));
    for (var pid in byP) { var p = await fresh('products/' + pid); byP[pid].forEach(function (x) { var v = p.variants.find(function (y) { return y.id === x.vid; }); var a = v ? availAt(v, loc) : 0; if (a < x.q) throw fail(t('err_reserve', 'Only {n} of {x} can be reserved at {l}.', { n: a, x: x.name, l: locName(loc) })); v.reserved = (+v.reserved || 0) + x.q; }); p.updatedAt = now; await put('products/' + pid, p); }
    var partial = o.lines.some(function (l) { return l.acc < l.qty; });
    o.status = partial ? 'partial' : 'accepted'; o.loc = loc; o.reserved = true;
    o.total = VXC.calcBill(o.lines.map(function (l) { return { qty: l.acc, rate: l.rate, gst: l.gst }; }), { incl: storeV().priceIncl !== false }).grand;
    o.timeline = (o.timeline || []).concat([{ s: o.status, at: now, by: ME.id || '', note: partial ? t('tl_partial', '{a} of {b} pcs accepted', { a: accTotal, b: sum(o.lines, function (l) { return l.qty; }) }) : '' }]);
    await put('dorders/' + d.id, o); return 1;
  });
  if (ok) { S.f.acc = null; toast(t('do_accepted', 'Order accepted. Stock reserved.')); }
};
function rejectSheet(sh) { if (!S.f.rej || S.f.rej.id !== sh.id) S.f.rej = { id: sh.id, reason: '' }; return sheetWrap(t('reject', 'Reject order'), txtF(t('reason', 'Reason'), 'f.rej.reason', 'placeholder="' + esc(t('rej_ph', 'Out of stock this season')) + '"'), busyBtn(t('reject', 'Reject order'), 'doReject', 'danger lg', '', 'do')); }
A.doReject = async function () { var f = S.f.rej; var ok = await tx('do', async function () { var o = await fresh('dorders/' + f.id); if (o.status !== 'submitted') return 1; o.status = 'rejected'; o.timeline = (o.timeline || []).concat([{ s: 'rejected', at: Date.now(), by: ME.id || '', note: f.reason || '' }]); await put('dorders/' + f.id, o); return 1; }); if (ok) { S.f.rej = null; closeSheet(); toast(t('do_rejected', 'Order rejected')); } };
function dispatchSheet(sh) { if (!S.f.dsp || S.f.dsp.id !== sh.id) S.f.dsp = { id: sh.id, carrier: '', lr: '' }; return sheetWrap(t('dispatch', 'Dispatch'), '<div class="g2">' + txtF(t('carrier', 'Transporter'), 'f.dsp.carrier', 'placeholder="VRL Logistics"') + txtF(t('lr_no', 'LR / docket no.'), 'f.dsp.lr') + '</div><div class="note">' + icon('info', 17) + '<span>' + esc(t('dsp_note', 'Reserved stock leaves inventory now, a Wholesale & Dealer invoice is created and the amount is added to the dealer’s balance.')) + '</span></div>', busyBtn(t('dispatch_now', 'Dispatch now'), 'doDispatch', 'primary lg', '', 'do')); }
A.doDispatch = async function () {
  var f = S.f.dsp;
  var ok = await tx('do', async function () {
    var o = await fresh('dorders/' + f.id), now = Date.now(); if (o.status !== 'packed') return 1;
    var loc = o.loc || curLoc(), dl = await fresh('dealers/' + o.dealerId), st = storeV();
    var lines = o.lines.filter(function (l) { return +l.acc > 0; });
    for (var i = 0; i < lines.length; i++) { var l = lines[i], p = await fresh('products/' + l.pid); if (!p) continue; var v = p.variants.find(function (y) { return y.id === l.vid; }); if (v) { v.stock = v.stock || {}; v.stock[loc] = Math.max(0, (+v.stock[loc] || 0) - l.acc); v.reserved = Math.max(0, (+v.reserved || 0) - l.acc); v.sold = (+v.sold || 0) + l.acc; } p.updatedAt = now; await put('products/' + l.pid, p); }
    var c = VXC.calcBill(lines.map(function (l) { return { qty: l.acc, rate: l.rate, gst: l.gst }; }), { incl: st.priceIncl !== false });
    var day = dayKey(now); await ensureDay(day);
    var no = (st.prefix || 'VX') + '-' + VXC.pad(await nextNo('inv'), 4), iid = uid('i');
    var inv = { no: no, at: now, kind: 'sale', loc: loc, by: ME.id || '', theme: 'wholesale', tier: dl && dl.tier || 'dealer', cust: { id: '', name: dl ? dl.name : '', phone: dl ? dl.phone : '', dealerId: o.dealerId }, lines: c.lines.map(function (x, i) { var s = lines[i]; return { pid: s.pid, vid: s.vid, name: s.name, label: s.label, sku: s.sku || '', hsn: s.hsn || '', qty: s.acc, rate: s.rate, gst: s.gst, taxable: x.taxable, tax: x.tax, total: x.total }; }), gross: c.gross, disc: 0, taxable: c.taxable, tax: c.tax, cgst: c.cgst, sgst: c.sgst, round: c.round, total: c.grand, incl: st.priceIncl !== false, pay: { mode: 'credit', cash: 0, upi: 0, card: 0, credit: c.grand, dealer: o.dealerId, due: now + 30 * 864e5 }, note: o.no };
    var u = {}; u[iid] = inv; await patch('ledger/' + day, { inv: u });
    if (dl) { dl.balance = r2((+dl.balance || 0) + c.grand); dl.txns = (dl.txns || []).concat([{ t: 'credit', amt: c.grand, at: now, ref: no + ' / ' + o.no }]).slice(-80); await put('dealers/' + o.dealerId, dl); }
    o.status = 'dispatched'; o.carrier = f.carrier || ''; o.lr = f.lr || ''; o.reserved = false; o.invNo = no; o.invDay = day; o.invId = iid; o.total = c.grand;
    o.timeline = (o.timeline || []).concat([{ s: 'dispatched', at: now, by: ME.id || '', note: [f.carrier, f.lr ? 'LR ' + f.lr : ''].filter(Boolean).join(' · ') }]);
    await put('dorders/' + f.id, o); return 1;
  });
  if (ok) { S.f.dsp = null; closeSheet(); toast(t('do_dispatched', 'Dispatched. Invoice created.')); }
};
A.advDO = async function (d) { var ok = await tx('do', async function () { var o = await fresh('dorders/' + d.id); o.status = d.v; o.timeline = (o.timeline || []).concat([{ s: d.v, at: Date.now(), by: ME.id || '' }]); await put('dorders/' + d.id, o); return 1; }); if (ok) toast(doStatus({ status: d.v })[0]); };

/* ===================== STAFF ===================== */
function vStaff() {
  var st = storeV(), reqs = vals(D.requests).filter(function (q) { return q.status === 'pending'; }).sort(by(function (q) { return q.at; }));
  var team = vals(D.staff).sort(by(function (s) { return (s.status === 'active' ? 0 : 1) + (s.name || ''); }));
  var canW = ME.canEdit || MODE === 'local';
  if (!S.f.appr) S.f.appr = {};
  var body = '';
  if (!canW) body += '<div class="note">' + icon('lock', 16) + '<span>' + esc(t('staff_ro', 'Only the store owner (or someone with edit access to this page) can approve staff and change roles.')) + '</span></div>';
  if (reqs.length) body += '<div class="sect"><h2>' + esc(t('waiting_n', 'Waiting for approval · {n}', { n: reqs.length })) + '</h2></div>' + reqs.map(function (q) { if (!S.f.appr[q.id]) S.f.appr[q.id] = q.role || 'cashier'; return '<section class="card pad stack" style="border-color:var(--accent-ring)"><div class="rowx">' + avatarHtml(q.name) + '<span class="grow"><b>' + esc(q.name) + '</b><br><span class="small muted">' + esc(fmtPhone(q.phone) + ' · ' + (q.branch ? locName(q.branch) : t('any_branch', 'Any branch')) + ' · ' + ago(q.at)) + '</span></span></div>' + selF(t('role', 'Role'), 'f.appr.' + q.id, ROLE_LIST.map(function (r) { return [r, roleName(r) + ' — ' + roleDesc(r)]; })) + '<div class="rowx"><button class="btn danger" data-a="rejectStaff" data-id="' + esc(q.id) + '"' + (canW ? '' : ' disabled') + '>' + esc(t('reject_s', 'Reject')) + '</button><button class="btn primary grow" data-a="approveStaff" data-id="' + esc(q.id) + '"' + (canW ? '' : ' disabled') + '>' + icon('check', 16, 2.4) + esc(t('approve', 'Approve')) + '</button></div></section>'; }).join('');
  body += '<div class="sect"><h2>' + esc(t('team_n', 'Team · {n}', { n: team.length + 1 })) + '</h2></div><div class="list"><div class="li">' + avatarHtml(st.ownerId === ME.id ? (ME.name || t('you', 'You')) : who(st.ownerId) || 'Owner', '') + '<span class="tx"><b>' + esc(st.ownerId === ME.id ? (ME.name || t('you', 'You')) : who(st.ownerId) || t('role_owner', 'Owner')) + '</b><small>' + esc(t('all_branches', 'All branches')) + '</small></span>' + pill(roleName('owner'), 'dark') + '</div>' +
    team.map(function (s) { var on = s.status === 'active'; return '<div class="li wrapm" style="' + (on ? '' : 'opacity:.6') + '">' + avatarHtml(s.name, '') + '<span class="tx"><b>' + esc(s.name) + (s.id === ME.id ? ' · ' + esc(t('you', 'You')) : '') + '</b><small>' + esc((s.branch ? locName(s.branch) : t('any_branch', 'Any branch')) + ' · ' + (on ? fmtPhone(s.phone) : t('deactivated_on', 'Deactivated {d}', { d: fmtD(s.offAt || s.at) }))) + '</small></span>' + (canW ? '<span class="acts"><select class="in sm" style="width:auto;max-width:180px" aria-label="' + esc(t('role', 'Role')) + '" data-change="staffRole" data-id="' + esc(s.id) + '">' + ROLE_LIST.map(function (r) { return '<option value="' + r + '"' + (s.role === r ? ' selected' : '') + '>' + esc(roleName(r)) + '</option>'; }).join('') + '</select><button class="btn ' + (on ? 'danger' : 'line') + ' xs" data-a="staffToggle" data-id="' + esc(s.id) + '">' + esc(on ? t('deactivate', 'Deactivate') : t('reactivate', 'Reactivate')) + '</button></span>' : pill(roleName(s.role), '')) + '</div>'; }).join('') + '</div>' +
    '<div class="note">' + icon('share', 16) + '<span>' + esc(t('invite_how', 'To add someone, share this page with them from the Share menu. They open it, request access, and appear above for approval.')) + '</span></div>';
  return ph(t('nav_staff', 'Staff'), esc(t('staff_sub', 'Approvals are checked by the server. Roles decide what each person sees.'))) + '<div class="stack lg" style="max-width:820px">' + body + '</div>';
}
A.approveStaff = async function (d) {
  var q = D.requests[d.id]; if (!q) return; var role = S.f.appr[d.id] || q.role || 'cashier';
  try { var sd = { name: q.name, phone: q.phone, role: role, branch: q.branch || '', status: 'active', at: Date.now(), by: ME.id || '' }; if (q.sample) sd.sample = true; await put('staff/' + d.id, sd); await del('requests/' + d.id); toast(t('approved_x', '{n} approved as {r}', { n: q.name, r: roleName(role) })); } catch (e) { toast(errText(e), 'bad'); }
};
A.rejectStaff = async function (d) { try { await patch('requests/' + d.id, { status: 'rejected', decidedAt: Date.now() }); toast(t('req_rejected', 'Request rejected')); } catch (e) { toast(errText(e), 'bad'); } };
A.staffRole = async function (d, el) { try { await patch('staff/' + el.getAttribute('data-id'), { role: el.value }); toast(t('role_changed', 'Role updated')); } catch (e) { toast(errText(e), 'bad'); } };
A.staffToggle = async function (d) { var s = D.staff[d.id]; if (!s) return; try { await patch('staff/' + d.id, s.status === 'active' ? { status: 'inactive', offAt: Date.now() } : { status: 'active' }); toast(s.status === 'active' ? t('deactivated', 'Access paused') : t('reactivated', 'Access restored')); } catch (e) { toast(errText(e), 'bad'); } };

/* ===================== SETTINGS ===================== */
function vSettings() {
  var st = storeV();
  if (!S.f.set) S.f.set = { name: st.name || '', logo: st.logo || '', city: st.city || '', address: st.address || '', phone: st.phone || '', gstin: st.gstin || '', upi: st.upi || '', prefix: st.prefix || '', defaultGst: String(st.defaultGst != null ? st.defaultGst : 5), priceIncl: st.priceIncl !== false, defaultPay: st.defaultPay || 'cash', theme: (st.invoice || {}).theme || 'modern', showLogo: (st.invoice || {}).showLogo !== false, showQr: (st.invoice || {}).showQr !== false, footer: (st.invoice || {}).footer || '', remind: st.remind !== false, locations: clone(locs()), categories: (st.categories || []).slice(), catIn: '', locIn: '', locType: 'godown', err: {} };
  var f = S.f.set, ro = !can('settings') || readOnly(), err = f.err || {};
  var sec = function (title, inner) { return '<section class="card pad stack"><b style="font-size:16px">' + esc(title) + '</b>' + inner + '</section>'; };
  var hasDemo = products().some(function (p) { return p.sample; }) || vals(D.customers).some(function (c) { return c.sample; });
  var logoPicker = '<div class="fld"><label>' + esc(t('store_logo', 'Store logo')) + '</label>' +
    '<div style="display:flex;align-items:center;gap:14px;margin-top:6px">' +
      (f.logo ? '<img src="' + esc(safeImg(f.logo)) + '" alt="Logo" style="width:56px;height:56px;object-fit:contain;border-radius:12px;border:1px solid var(--line);background:var(--surface);padding:2px">' : '<div style="width:56px;height:56px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;justify-content:center;color:var(--muted);font-weight:700;font-size:18px">' + esc(initials(f.name || 'Store')) + '</div>') +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        (ro ? '' : '<label class="btn line sm" style="cursor:pointer;margin:0;display:inline-flex;align-items:center;gap:6px">' + icon('upload', 16) + '<span>' + esc(f.logo ? t('change_logo', 'Change logo') : t('upload_logo', 'Upload logo')) + '</span><input type="file" accept="image/*" style="display:none" data-change="uploadLogo"></label>') +
        (f.logo && !ro ? '<button type="button" class="btn soft sm" data-a="removeLogo" style="color:var(--bad)">' + icon('trash', 16) + esc(t('remove', 'Remove')) + '</button>' : '') +
      '</div>' +
    '</div>' +
    '<span class="xsmall muted" style="margin-top:4px;display:block">' + esc(t('logo_hint', 'PNG or JPG. Shown on invoices, receipts and store header.')) + '</span></div>';
  var left = sec(t('store_profile', 'Store profile'), logoPicker + txtF(t('biz_name', 'Business name'), 'f.set.name', '', null, err.name) + '<div class="g2">' + txtF(t('city', 'City'), 'f.set.city') + txtF(t('phone', 'Phone'), 'f.set.phone', 'inputmode="tel"') + '</div>' + txtF(t('address', 'Address'), 'f.set.address') + txtF(t('gstin', 'GSTIN'), 'f.set.gstin', 'data-r autocapitalize="characters" maxlength="15"', gstState(f.gstin) ? t('gst_state', 'State: {s}', { s: gstState(f.gstin) }) : '', err.gstin)) +
    sec(t('billing', 'Billing'), fld(t('default_pay', 'Default payment mode'), seg('f.set.defaultPay', [['cash', payName('cash')], ['upi', payName('upi')], ['card', payName('card')]])) + fld(t('default_gst', 'Default GST on garments'), seg('f.set.defaultGst', [['0', '0%'], ['5', '5%'], ['12', '12%'], ['18', '18%']])) + '<div class="g2">' + txtF(t('upi_id', 'UPI ID'), 'f.set.upi', 'autocapitalize="off" placeholder="shop@okbank"', null, err.upi) + txtF(t('inv_prefix', 'Invoice prefix'), 'f.set.prefix', 'maxlength="6" autocapitalize="characters"') + '</div>' + togF(t('incl_t', 'Prices include GST'), t('incl_s', 'Tag prices (MRP) already contain tax'), 'f.set.priceIncl') + togF(t('remind_t', 'Month-end credit reminders'), t('remind_s', 'Show customers to remind on the 28th–30th'), 'f.set.remind')) +
    sec(t('locations', 'Locations'), '<div class="list">' + f.locations.map(function (l, i) { return '<div class="li"><span class="ic">' + icon(l.type === 'godown' ? 'warehouse' : 'store', 17) + '</span><input class="in sm grow" id="f-loc-' + i + '" data-m="f.set.locations.' + i + '.name" value="' + esc(l.name) + '" aria-label="' + esc(t('location', 'Location')) + '"><span class="pill">' + esc(l.type === 'godown' ? t('loc_godown', 'Godown') : t('loc_shop_t', 'Shop')) + '</span></div>'; }).join('') + '</div><div class="rowx"><input class="in grow" id="f-locIn" data-m="f.set.locIn" placeholder="' + esc(t('new_loc_ph', 'New location, e.g. Kalawad Rd branch')) + '"><select class="in" style="width:auto" id="f-locType" data-m="f.set.locType" aria-label="' + esc(t('type', 'Type')) + '"><option value="shop"' + (f.locType === 'shop' ? ' selected' : '') + '>' + esc(t('loc_shop_t', 'Shop')) + '</option><option value="godown"' + (f.locType === 'godown' ? ' selected' : '') + '>' + esc(t('loc_godown', 'Godown')) + '</option></select><button class="btn line" data-a="addLoc">' + esc(t('add', 'Add')) + '</button></div>') +
    sec(t('categories', 'Categories'), '<div class="picks">' + f.categories.map(function (c, i) { return '<button type="button" class="pick" data-a="rmCat" data-i="' + i + '">' + esc(c) + '<span class="x">' + icon('x', 13) + '</span></button>'; }).join('') + '</div><div class="rowx"><input class="in grow" id="f-catIn" data-m="f.set.catIn" placeholder="' + esc(t('new_category_n', 'New category name')) + '" data-enter="addCat"><button class="btn line" data-a="addCat">' + esc(t('add', 'Add')) + '</button></div>');
  var right = sec(t('invoice_branding', 'Invoice branding'), themePicker('f.set.theme') + togF(t('show_logo', 'Show logo mark'), t('show_logo_s', 'Your initials in a badge at the top'), 'f.set.showLogo') + togF(t('show_qr', 'UPI QR on credit invoices'), t('show_qr_s', 'Customers can scan to pay what they owe'), 'f.set.showQr') + txtF(t('footer_note', 'Footer note'), 'f.set.footer')) +
    sec(t('this_device', 'This device'), fld(t('language', 'Language'), langSeg()) + fld(t('appearance', 'Appearance'), themeSeg()) + '<button class="btn line" data-a="sheet" data-k="loc">' + icon('mapPin', 17) + esc(t('selling_from', 'Selling from: {l}', { l: locName(curLoc()) })) + '</button>') +
    sec(t('data', 'Data'), '<div class="between"><span class="small">' + esc(t('server', 'Server')) + '</span>' + syncLine() + '</div>' + (DL ? '<button class="btn line" data-a="exportAll">' + icon('download', 17) + esc(t('export_all', 'Export all data (JSON)')) + '</button><button class="btn line" data-a="exportItems">' + icon('download', 17) + esc(t('export_items', 'Export stock list (CSV)')) + '</button>' : '') + (hasDemo && !ro ? busyBtn(t('remove_demo', 'Remove demo data'), 'askClearDemo', 'danger', '', 'demo') : !ro ? busyBtn(t('load_demo', 'Load demo data'), 'askLoadDemo', 'line', '', 'demo') : '') + '<span class="xsmall muted">Vastrenix 2.4.0 · ' + esc(MODE === 'local' ? t('sync_local', 'Saved on this device only') : t('sync_cloud', 'Synced across your team in real time')) + '</span>');
  return ph(t('nav_settings', 'Settings'), '', ro ? '' : busyBtn(t('save_changes', 'Save changes'), 'saveSettings', 'primary sm', '', 'set')) + (ro ? '<div class="note" style="margin-bottom:12px">' + icon('lock', 16) + '<span>' + esc(t('settings_ro', 'You can view settings. Only owners and admins can change them.')) + '</span></div>' : '') + '<div class="cols even"><div class="stack lg">' + left + '</div><div class="stack lg">' + right + '</div></div>' + (ro ? '' : '<div class="rowx" style="justify-content:flex-end;margin-top:16px">' + busyBtn(t('save_changes', 'Save changes'), 'saveSettings', 'primary lg', '', 'set') + '</div>');
}
window.uploadStoreLogo = function (input) {
  if (!input || !input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      var max = 256;
      var w = img.width, h = img.height;
      if (w > max || h > max) {
        if (w > h) { h = Math.round(h * max / w); w = max; }
        else { w = Math.round(w * max / h); h = max; }
      }
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var dataUrl = canvas.toDataURL('image/png', 0.9);
      if (S.f.set) { S.f.set.logo = dataUrl; schedule(); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};
A.uploadLogo = function (d, el) { window.uploadStoreLogo(el); };
A.removeLogo = function () {
  if (S.f.set) { S.f.set.logo = ''; schedule(); }
};
A.addLoc = function () { var f = S.f.set, n = String(f.locIn || '').trim(); if (!n) return; f.locations.push({ id: uid('l'), name: n, type: f.locType || 'shop' }); f.locIn = ''; schedule(); };
A.addCat = function () { var f = S.f.set, n = String(f.catIn || '').trim(); if (n && f.categories.indexOf(n) < 0) f.categories.push(n); f.catIn = ''; schedule(); };
A.rmCat = function (d) { S.f.set.categories.splice(+d.i, 1); schedule(); };
A.saveSettings = async function () {
  var f = S.f.set; f.err = {};
  if (!String(f.name).trim()) f.err.name = t('err_biz', 'Enter your business name');
  if (f.gstin && !gstValid(f.gstin)) f.err.gstin = t('err_gstin', 'GSTIN should be 15 characters, like 24AAPCO4821K1Z6');
  if (f.upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(String(f.upi).trim())) f.err.upi = t('err_upi', 'UPI ID looks like name@bank');
  if (Object.keys(f.err).length) { schedule(); window.scrollTo(0, 0); return; }
  var ok = await tx('set', async function () {
    var s = (await fresh('meta/store')) || {}; var g = String(f.gstin || '').toUpperCase().trim();
    Object.assign(s, { name: f.name.trim(), logo: f.logo || '', city: String(f.city || '').trim(), address: String(f.address || '').trim(), phone: phoneDigits(f.phone), gstin: g, stateCode: g.slice(0, 2), state: gstState(g), upi: String(f.upi || '').trim(), prefix: (String(f.prefix || '').trim() || prefixFor(f.name)).toUpperCase(), defaultGst: +f.defaultGst, priceIncl: !!f.priceIncl, defaultPay: f.defaultPay, remind: !!f.remind, locations: f.locations.filter(function (l) { return String(l.name).trim(); }), categories: f.categories, invoice: { theme: f.theme, showLogo: !!f.showLogo, showQr: !!f.showQr, footer: f.footer || '' }, updatedAt: Date.now() });
    await put('meta/store', s); return 1;
  });
  if (ok) { S.f.set = null; toast(t('settings_saved', 'Settings saved')); }
};
A.exportAll = async function () { if (!DL) return; var out = { exportedAt: new Date().toISOString(), store: D.store, products: D.products, customers: D.customers, suppliers: D.suppliers, dealers: D.dealers, staff: D.staff, purchaseOrders: D.pos, dealerOrders: D.dorders, transfers: D.transfers, shifts: D.shifts, ledger: Object.assign({}, D.ledgerOld, D.ledger) }; try { await DL.save({ filename: 'vastrenix-backup-' + dayKey(Date.now()) + '.json', data: JSON.stringify(out, null, 1) }); } catch (e) { if (e && e.code !== 'declined') toast(errText(e), 'bad'); } };
A.exportItems = async function () { var ls = locs(), rows = [['Garment', 'Category', 'Fabric', 'SKU', 'Barcode', 'Size', 'Colour'].concat(ls.map(function (l) { return l.name; })).concat(['Reserved', 'Damaged', 'In transit', 'Available', 'Cost', 'Retail', 'Wholesale', 'Dealer'])]; products().forEach(function (p) { (p.variants || []).forEach(function (v) { rows.push([p.name, p.cat, p.fabric, v.sku, v.barcode, v.size, v.color].concat(ls.map(function (l) { return +((v.stock || {})[l.id]) || 0; })).concat([+v.reserved || 0, +v.damaged || 0, +v.transit || 0, VXC.variantAvail(v), p.cost, (p.price || {}).retail, (p.price || {}).wholesale, (p.price || {}).dealer])); }); }); await saveCsv('vastrenix-stock-' + dayKey(Date.now()) + '.csv', rows); };
A.askClearDemo = function () { openSheet('confirm', { title: t('remove_demo', 'Remove demo data'), msg: t('remove_demo_q', 'Delete all demo garments, customers, bills and orders? Your own records stay.'), yes: t('remove', 'Remove'), act: 'clearDemo', danger: true }); };
A.askLoadDemo = function () { openSheet('confirm', { title: t('load_demo', 'Load demo data'), msg: t('load_demo_q', 'Add clearly marked sample garments, bills, customers and orders so you can try every screen? You can remove them later.'), yes: t('load', 'Load'), act: 'doLoadDemo' }); };
A.doLoadDemo = async function () { closeSheet(); S.busy = 'demo'; schedule(); try { await loadDemo(); toast(t('demo_loaded', 'Demo data added')); } catch (e) { toast(errText(e), 'bad'); } S.busy = null; schedule(); };
async function loadDemo() {
  var res = await fetch('demo.json'); if (!res.ok) throw fail(t('err_demo', 'Couldn’t load demo data.'));
  var demo = await res.json(), base = demo.base, now = Date.now();
  var shift = (keyToTs(dayKey(now)) - keyToTs(dayKey(base)));
  var TS = { at: 1, openAt: 1, closeAt: 1, createdAt: 1, lastAt: 1, updatedAt: 1, due: 1, lastSoldAt: 1, recvAt: 1, decidedAt: 1, closedAt: 1, remindedAt: 1, offAt: 1 };
  function fix(o) { if (Array.isArray(o)) return o.map(fix); if (o && typeof o === 'object') { var r = {}; Object.keys(o).forEach(function (k) { var v = o[k]; if (TS[k] && typeof v === 'number') r[k] = v + shift; else if ((k === 'day' || k === 'invDay') && typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v)) r[k] = dayKey(keyToTs(v) + shift + 3600e3); else r[k] = fix(v); }); return r; } return o; }
  var st = clone(storeV()), ls = locs(), shop = (ls.find(function (l) { return l.type === 'shop'; }) || ls[0]).id, gd = (ls.find(function (l) { return l.type === 'godown'; }) || ls[0]).id;
  var docs = demo.docs.map(function (d) { var path = d.path, body = fix(d.body); if (/^ledger\//.test(path)) { var k = dayKey(keyToTs(path.slice(7)) + shift + 3600e3); path = 'ledger/' + k; body.day = k; } return { path: path, body: JSON.parse(JSON.stringify(body).replace(/"@shop"/g, JSON.stringify(shop)).replace(/"@godown"/g, JSON.stringify(gd)).replace(/@PFX-/g, (st.prefix || 'VX') + '-')) }; });
  var cats = st.categories || []; (demo.categories || []).forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); });
  await withLock(async function () {
    for (var i = 0; i < docs.length; i += 4) {
      await Promise.all(docs.slice(i, i + 4).map(function (d) { return retry(function () { return DB.doc(d.path).get().then(function (s) { if (/^ledger\//.test(d.path) && s.exists) { var cur = s.data(); return DB.doc(d.path).update({ inv: d.body.inv || {}, exp: d.body.exp || {}, cash: d.body.cash || {}, sample: true }); } return DB.doc(d.path).set(d.body); }); }).catch(async function (e) { if (e && e.code === 'resource_exhausted') { await sleep(1200); return DB.doc(d.path).set(d.body); } throw e; }); }));
    }
    var c = (await fresh('meta/counters')) || {}; Object.keys(demo.counters).forEach(function (k) { c[k] = Math.max(+c[k] || 0, demo.counters[k]); }); await put('meta/counters', c);
    var s2 = await fresh('meta/store'); s2.categories = cats; s2.hasDemo = true; await put('meta/store', s2);
  });
}
A.clearDemo = async function () {
  closeSheet(); S.busy = 'demo'; schedule();
  try {
    await withLock(async function () {
      var colls = ['products', 'customers', 'suppliers', 'dealers', 'pos', 'dorders', 'transfers', 'shifts', 'held', 'staff', 'requests'];
      for (var i = 0; i < colls.length; i++) { var snap = await DB.collection(colls[i]).where('sample', '==', true).get(); for (var j = 0; j < snap.docs.length; j++) await del(colls[i] + '/' + snap.docs[j].id); }
      var ls = await DB.collection('ledger').where('sample', '==', true).get();
      for (var k = 0; k < ls.docs.length; k++) {
        var d = ls.docs[k].data(), keep = false, u = { inv: {}, exp: {}, cash: {}, sample: false };
        ['inv', 'exp', 'cash'].forEach(function (m) { Object.keys(d[m] || {}).forEach(function (id) { var x = d[m][id]; if (x && x.sample) u[m][id] = null; else if (x) keep = true; }); });
        if (keep) await patch('ledger/' + ls.docs[k].id, u); else await del('ledger/' + ls.docs[k].id);
      }
      var s2 = await fresh('meta/store'); if (s2) { s2.hasDemo = false; await put('meta/store', s2); }
    });
    toast(t('demo_removed', 'Demo data removed'));
  } catch (e) { toast(errText(e), 'bad'); }
  S.busy = null; schedule();
};

/* ===================== GLOBAL SHEETS ===================== */
function locSheet() { return sheetWrap(t('selling_from_t', 'This device sells from'), '<p class="small muted">' + esc(t('loc_b', 'Sales deduct stock from this location. Each device remembers its own.')) + '</p><div class="list">' + locs().map(function (l) { var on = l.id === curLoc(); return '<button class="li" data-a="setLoc" data-v="' + esc(l.id) + '"><span class="ic ' + (on ? 'acc' : '') + '">' + icon(l.type === 'godown' ? 'warehouse' : 'store', 18) + '</span><span class="tx"><b>' + esc(l.name) + '</b><small>' + esc(l.type === 'godown' ? t('loc_godown', 'Godown') : t('loc_shop_t', 'Shop')) + '</small></span>' + (on ? icon('check', 18, 2.4) : '') + '</button>'; }).join('') + '</div>', ''); }
A.setLoc = function (d) { S.loc = d.v; lsSet('vx-loc', d.v); closeSheet(); toast(t('loc_set', 'Now selling from {l}', { l: locName(d.v) })); };
function searchSheet() {
  var q = (S.q.g || '').trim(), ql = q.toLowerCase(), out = '';
  if (q) {
    var ps = matchProducts(q, null).slice(0, 5), cs = vals(D.customers).filter(function (c) { return (c.name || '').toLowerCase().indexOf(ql) >= 0 || (phoneDigits(q).length >= 3 && phoneDigits(c.phone).indexOf(phoneDigits(q)) >= 0); }).slice(0, 5), is = allInvoices().filter(function (i) { return (i.no || '').toLowerCase().indexOf(ql) >= 0 || ((i.pay || {}).utr || '').indexOf(q) >= 0; }).slice(0, 5);
    out = (ps.length && allowed('items') ? '<div class="sect"><h3>' + esc(t('nav_items', 'Items')) + '</h3></div><div class="list">' + ps.map(function (p) { return '<button class="li" data-a="gOpen" data-k="product" data-id="' + esc(p.id) + '">' + swatch(p, [36, 42]) + '<span class="tx"><b>' + esc(p.name) + '</b><small>' + esc(t('n_avail', '{n} available', { n: pAvail(p) })) + '</small></span></button>'; }).join('') + '</div>' : '') +
      (cs.length && allowed('customers') ? '<div class="sect"><h3>' + esc(t('nav_customers', 'Customers')) + '</h3></div><div class="list">' + cs.map(function (c) { return '<button class="li" data-a="gOpen" data-k="customer" data-id="' + esc(c.id) + '">' + avatarHtml(c.name) + '<span class="tx"><b>' + esc(c.name) + '</b><small>' + esc(fmtPhone(c.phone)) + '</small></span></button>'; }).join('') + '</div>' : '') +
      (is.length && allowed('invoices') ? '<div class="sect"><h3>' + esc(t('nav_invoices', 'Invoices')) + '</h3></div><div class="list">' + is.map(invRow).join('') + '</div>' : '') || '<p class="small muted">' + esc(t('no_match', 'No match for “{q}”', { q: q })) + '</p>';
  }
  return sheetWrap(t('search', 'Search'), searchBox('q.g', t('search_all', 'Garments, customers, invoice numbers'), 'autofocus') + out, '');
}
A.gOpen = function (d) { closeSheet(); S.q.g = ''; openSub(d.k, { id: d.id }); };
function alertsSheet() {
  var items = [], reqs = vals(D.requests).filter(function (q) { return q.status === 'pending'; });
  if (reqs.length && allowed('staff')) items.push(['staff', 'acc', 'userPlus', t('staff_req_n', '{n} staff waiting for approval', { n: reqs.length })]);
  var low = lowList(); if (low.length && allowed('lowstock')) items.push(['lowstock', 'bad', 'alert', t('att_low', 'Low stock: {n} variants', { n: low.length })]);
  var nd = vals(D.dorders).filter(function (o) { return o.status === 'submitted'; }).length; if (nd && allowed('dealers')) items.push(['dealers', 'acc', 'truck', t('att_do', '{n} new dealer orders', { n: nd })]);
  var dc = vals(D.customers).filter(function (c) { return (+c.balance || 0) > 0.5; }); if (dc.length && allowed('dues')) items.push(['dues', 'warn', 'wallet', t('att_due', '{amt} store credit due', { amt: inr(sum(dc, function (c) { return c.balance; })) })]);
  var tr = vals(D.transfers).filter(function (x) { return x.status === 'transit'; }).length; if (tr && allowed('transfers')) items.push(['transfers', 'warn', 'transfer', t('att_tr', '{n} transfers in transit', { n: tr })]);
  return sheetWrap(t('alerts', 'Alerts'), items.length ? '<div class="list">' + items.map(function (a) { return '<button class="li" data-a="gGo" data-r="' + a[0] + '"><span class="ic ' + a[1] + '">' + icon(a[2], 18) + '</span><span class="tx"><b>' + esc(a[3]) + '</b></span>' + icon('chevR', 18) + '</button>'; }).join('') + '</div>' : empty('checkCircle', t('all_clear', 'All clear. Nothing needs you right now.')), '');
}
A.gGo = function (d) { closeSheet(); go(d.r); };
function confirmSheet(sh) { return sheetWrap(sh.title, '<p style="font-size:15px;line-height:1.5">' + esc(sh.msg) + '</p>', '<button class="btn line" data-a="close">' + esc(t('cancel', 'Cancel')) + '</button><button class="btn ' + (sh.danger ? 'danger' : 'primary') + '" data-a="' + sh.act + '">' + esc(sh.yes) + '</button>'); }
function billThemeSheet() { return sheetWrap(t('invoice_theme', 'Invoice theme'), themePicker('bill.theme'), '<button class="btn primary lg" data-a="close">' + esc(t('done', 'Done')) + '</button>', true); }

var SHEETS = { checkout: coView, saleDone: doneView, variant: variantSheet, line: lineSheet, custom: customSheet, disc: discSheet, custPick: custPickSheet, held: heldSheet, billTheme: billThemeSheet, pmore: pmoreSheet, count: countSheet, supplier: supplierSheet, supPay: supPaySheet, utr: utrSheet, cn: cnSheet, collect: collectSheet, custEdit: custEditSheet, expense: expenseSheet, cashEntry: cashEntrySheet, dealer: dealerSheet, dispatch: dispatchSheet, rejectDO: rejectSheet, loc: locSheet, search: searchSheet, alerts: alertsSheet, confirm: confirmSheet, subscribe: subSheet, fabricDrape: fabricDrapeSheet };
function sheetView() { var f = SHEETS[S.sheet.k]; if (!f) return ''; try { return f(S.sheet) || ''; } catch (e) { console.error(e); return sheetWrap(t('err_render', 'This screen hit a problem.'), '<p class="small muted">' + esc(e.message) + '</p>', ''); } }
A.sheet = function (d) { var o = {}; Object.keys(d).forEach(function (k) { o[k] = d[k]; }); openSheet(d.k, o); };
var SUBS = { product: subProduct, pform: subPform, tform: subTform, poform: subPOform, po: subPO, receive: subReceive, supplier: subSupplier, invoice: subInvoice, customer: subCustomer, doform: subDOform, dorder: subDO, contact: subContact, about: subAbout, privacy: subPrivacy };
var SUBS_NOBAR = { pform: 1, tform: 1, poform: 1, receive: 1, doform: 1 };

/* ===================== SUBSCRIPTION SHEET =====================
   Payment never activates a plan on the device. The owner pays the platform UPI ID, submits the UTR,
   and a platform admin verifies it in the admin console, which is the only place a plan can be activated
   (enforced by firestore.rules). */
var PLANS = {
  monthly: { amount: 699, days: 30, label: ['sub_monthly', 'Monthly'], per: ['per_mo', '/ month'], desc: ['sub_monthly_desc', 'Billed every month. Cancel anytime.'] },
  quarterly: { amount: 1899, days: 90, label: ['sub_quarterly', '3 Months'], per: ['per_3mo', '/ 3 months'], desc: ['sub_quarterly_desc', '₹633/mo · Billed ₹1,899 every 3 months.'], tag: ['sub_popular', 'POPULAR · SAVE 10%'] },
  annual: { amount: 6999, days: 365, label: ['sub_annual', 'Annual'], per: ['per_yr', '/ year'], desc: ['sub_annual_desc', '₹583/mo · 2 months free.'], tag: ['sub_best_val', 'BEST VALUE · SAVE 17%'] }
};
function platformBilling() { return (window.VX_CONFIG && window.VX_CONFIG.billing) || {}; }
function subReqDoc() { return D.subRequest || null; }
function watchSubRequest() {
  if (S.subReqWatch || !window.FS || !ME.isOwner) return;
  var sid = ME.id; if (!sid) return;
  S.subReqWatch = window.FS.doc('subscriptionRequests/' + sid).onSnapshot(function (s) { D.subRequest = s.exists ? s.data() : null; schedule(); }, function () { });
}
function planCard(key, sel) {
  var p = PLANS[key], on = sel === key;
  return '<button type="button" class="plan' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-a="setSubCycle" data-v="' + key + '">' +
    (p.tag ? '<span class="pill ok plan-tag">' + esc(t(p.tag[0], p.tag[1])) + '</span>' : '') +
    '<span class="stack xs"><b>' + esc(t(p.label[0], p.label[1])) + '</b><span class="xsmall muted">' + esc(t(p.desc[0], p.desc[1])) + '</span></span>' +
    '<span class="plan-price"><b class="num">' + inr(p.amount) + '</b><span class="xsmall muted">' + esc(t(p.per[0], p.per[1])) + '</span></span>' +
    '<span class="plan-dot" aria-hidden="true">' + (on ? icon('check', 14, 3) : '') + '</span></button>';
}
function upiPayUrl(amount, note) {
  var b = platformBilling(); if (!b.upiId) return '';
  return 'upi://pay?pa=' + encodeURIComponent(b.upiId) + '&pn=' + encodeURIComponent(b.payeeName || 'Vastrenix') + '&am=' + amount.toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(note);
}
function subSheet() {
  watchSubRequest();
  var sub = subState(), sel = S.subCycle || 'quarterly', plan = PLANS[sel] || PLANS.quarterly;
  var req = subReqDoc(), step = S.subStep || 'plan';
  var head = '<div class="sub-head">' + logo(44) + '<b>vastrenix</b><p class="muted small">' + esc(t('sub_subtitle', 'Retail, wholesale and multi-branch management for garments.')) + '</p></div>';
  if (sub.isActive) {
    return sheetWrap(t('sub_title', 'Vastrenix Subscription'), '<div class="stack lg">' + head +
      '<div class="banner ok"><span class="ic ok">' + icon('checkCircle', 18) + '</span><span class="tx"><b>' + esc(t('plan_active', 'Active Paid Plan')) + '</b><small>' + esc(t('plan_renews', 'Valid until {d}', { d: fmtDY(D.subscription.expiresAt) })) + '</small></span></div>' +
      '<p class="small muted">' + esc(t('plan_renew_note', 'To renew early or change plan, contact support from More → Help.')) + '</p></div>', '<button class="btn primary lg" data-a="close">' + esc(t('done', 'Done')) + '</button>');
  }
  if (MODE === 'local' || !window.FS) {
    return sheetWrap(t('sub_title', 'Vastrenix Subscription'), '<div class="stack lg">' + head +
      '<div class="note">' + icon('cloud', 16) + '<span>' + esc(t('sub_need_account', 'Subscriptions are linked to an online store account. Sign in with email to subscribe and keep your data backed up.')) + '</span></div></div>', '');
  }
  if (!ME.isOwner) {
    return sheetWrap(t('sub_title', 'Vastrenix Subscription'), '<div class="stack lg">' + head +
      '<div class="note">' + icon('lock', 16) + '<span>' + esc(t('sub_owner_only', 'Only the store owner can change the subscription. Ask them to subscribe from More → Subscription.')) + '</span></div></div>', '');
  }
  if (req && req.status === 'pending') {
    var pp = PLANS[req.cycle] || plan;
    return sheetWrap(t('sub_title', 'Vastrenix Subscription'), '<div class="stack lg">' + head +
      '<div class="banner acc"><span class="ic acc">' + icon('clock', 18) + '</span><span class="tx"><b>' + esc(t('sub_verifying', 'Payment under verification')) + '</b><small>' + esc(t('sub_verifying_b', '{p} · {a} · UTR {u}. Usually verified within a few hours. Your store keeps working meanwhile.', { p: t(pp.label[0], pp.label[1]), a: inr(req.amount), u: req.utr })) + '</small></span></div></div>',
      '<button class="btn line" data-a="subEditReq">' + esc(t('sub_fix_utr', 'Correct UTR')) + '</button><button class="btn primary" data-a="close">' + esc(t('done', 'Done')) + '</button>');
  }
  var rejected = req && req.status === 'rejected' ? '<div class="banner bad"><span class="ic bad">' + icon('alert', 18) + '</span><span class="tx"><b>' + esc(t('sub_rejected', 'We could not verify your last payment')) + '</b><small>' + esc(req.adminNote || t('sub_rejected_b', 'Check the UTR and submit again, or contact support.')) + '</small></span></div>' : '';
  if (step === 'pay') {
    var b = platformBilling(), f = S.f.subPay || (S.f.subPay = { utr: '', err: '' });
    var note = 'Vastrenix ' + sel + ' ' + (storeV().code || '');
    var url = upiPayUrl(plan.amount, note);
    var payBlock = url
      ? '<div class="payqr"><div class="qrbox" data-qr="' + esc(url) + '"></div><div class="stack xs" style="text-align:center"><b class="num" style="font-size:22px">' + inr(plan.amount) + '</b><span class="xsmall muted">' + esc(t('sub_pay_to', 'Pay to {u}', { u: b.upiId })) + '</span></div>' +
        '<a class="btn soft block" href="' + esc(url) + '">' + icon('qr', 17) + esc(t('sub_open_upi', 'Open UPI app')) + '</a></div>'
      : '<div class="note">' + icon('info', 16) + '<span>' + esc(t('sub_no_upi', 'Online payment is not configured yet. Contact support to pay, then enter the reference below.')) + '</span></div>';
    return sheetWrap(t('sub_pay_t', 'Pay {a}', { a: inr(plan.amount) }), '<div class="stack lg">' + payBlock +
      '<ol class="steps-list small"><li>' + esc(t('sub_s1', 'Scan the QR or tap Open UPI app and pay the exact amount.')) + '</li><li>' + esc(t('sub_s2', 'Copy the 12-digit UTR / UPI reference from your payment app.')) + '</li><li>' + esc(t('sub_s3', 'Enter it below. We activate your plan once the payment is verified.')) + '</li></ol>' +
      txtF(t('utr_ref', 'UTR / UPI reference'), 'f.subPay.utr', 'inputmode="numeric" autocomplete="off" maxlength="22" placeholder="e.g. 431298765432"', null, f.err) + '</div>',
      '<button class="btn line" data-a="subBack">' + esc(t('back', 'Back')) + '</button>' + busyBtn(t('sub_submit', 'Submit for verification'), 'doSubscribe', 'primary', '', 'sub'));
  }
  return sheetWrap(t('sub_title', 'Vastrenix Subscription'),
    '<div class="stack lg">' + head + rejected +
      '<div class="stack sm" role="radiogroup" aria-label="' + esc(t('choose_plan', 'Choose a plan')) + '">' + planCard('monthly', sel) + planCard('quarterly', sel) + planCard('annual', sel) + '</div>' +
      '<div class="feats">' + [
        t('feat_1', 'Unlimited bills & WhatsApp invoices'),
        t('feat_2', 'Multi-location inventory (Shop + Godowns)'),
        t('feat_3', 'Customer Khata & UPI QR on bills'),
        t('feat_4', 'GST invoicing, thermal receipts & barcode scan'),
        t('feat_5', 'Real-time multi-counter sync & cloud backup')
      ].map(function (feat) { return '<div>' + icon('check', 15, 2.5) + '<span>' + esc(feat) + '</span></div>'; }).join('') + '</div>' +
      '<span class="xsmall muted" style="text-align:center;display:block">' + esc(t('sub_guarantee2', 'Pay by any UPI app · Activated after verification · GST invoice on request')) + '</span>' +
    '</div>',
    '<button class="btn primary lg" data-a="subToPay">' + esc(t('sub_continue', 'Continue — {a} {p}', { a: inr(plan.amount), p: t(plan.per[0], plan.per[1]) })) + '</button>'
  );
}
A.setSubCycle = function (d) { if (PLANS[d.v]) S.subCycle = d.v; schedule(); };
A.subToPay = function () { S.subStep = 'pay'; S.f.subPay = { utr: '', err: '' }; schedule(); };
A.subBack = function () { S.subStep = 'plan'; schedule(); };
A.subEditReq = function () { var r = subReqDoc(); S.subCycle = (r && PLANS[r.cycle]) ? r.cycle : S.subCycle; S.subStep = 'pay'; S.f.subPay = { utr: (r && r.utr) || '', err: '' }; D.subRequest = Object.assign({}, r, { status: 'editing' }); schedule(); };
A.openSubscribe = function () { S.subStep = 'plan'; openSheet('subscribe'); };
A.doSubscribe = async function () {
  var cycle = PLANS[S.subCycle] ? S.subCycle : 'quarterly', plan = PLANS[cycle];
  var f = S.f.subPay || {}; f.err = '';
  var utr = String(f.utr || '').replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z0-9]{8,22}$/.test(utr)) { f.err = t('utr_err', 'Enter the UTR / reference exactly as shown in your payment app (8–22 letters or digits).'); schedule(); return; }
  if (!window.FS || !ME.isOwner) { toast(t('sub_owner_only', 'Only the store owner can change the subscription.'), 'bad'); return; }
  S.busy = 'sub'; schedule();
  try {
    var st = storeV();
    await window.FS.doc('subscriptionRequests/' + ME.id).set({
      businessId: ME.id, storeName: String(st.name || '').slice(0, 120), storeCode: String(st.code || '').slice(0, 40),
      email: (window.FB_USER && FB_USER.email) || '', phone: String(st.phone || '').slice(0, 20),
      cycle: cycle, amount: plan.amount, utr: utr, status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    S.subStep = 'plan';
    toast(t('sub_submitted', 'Payment submitted. We’ll activate your plan once it’s verified.'));
  } catch (e) {
    toast(errText(e), 'bad');
  }
  S.busy = null; schedule();
};

/* ===================== CONTACT US & CUSTOM WORK ===================== */
function subContact() {
  var st = storeV();
  var sf = S.f.support || (S.f.support = { name: ME.name || '', bizName: st.name || '', cat: 'bug', msg: '', err: '' });
  var cf = S.f.customWork || (S.f.customWork = { name: ME.name || '', bizName: st.name || '', phone: st.phone || '', what: '', msg: '', err: '' });

  var supportCard = '<section class="card pad stack" id="card-support">' +
    '<div class="rowx" style="align-items:flex-start;gap:12px">' +
      '<span class="ic acc" style="width:40px;height:40px;border-radius:12px;background:var(--accent-soft);color:var(--accent)">' + icon('message', 20) + '</span>' +
      '<div class="grow">' +
        '<b style="font-size:17px">' + esc(t('contact_help_t', 'Need help?')) + '</b>' +
        '<p class="small muted" style="margin-top:2px">' + esc(t('contact_help_b', 'For bugs, account issues, billing questions, and general support.')) + '</p>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:10px;padding:8px 0">' +
      '<span class="small muted">' + esc(t('direct_email', 'Email us directly:')) + '</span>' +
      '<a class="btn line sm" href="mailto:contact@vastrenix.com?subject=Support%20Request%20-%20' + encodeURIComponent(st.name || '') + '">' + icon('mail', 15) + 'contact@vastrenix.com</a>' +
    '</div>' +
    '<hr class="hr">' +
    '<div class="stack sm">' +
      '<b style="font-size:14px">' + esc(t('send_ticket', 'Or send an in-app message')) + '</b>' +
      '<div class="g2">' +
        txtF(t('your_name', 'Your name'), 'f.support.name') +
        txtF(t('biz_name', 'Business name'), 'f.support.bizName') +
      '</div>' +
      selF(t('issue_category', 'Category'), 'f.support.cat', [
        ['bug', t('cat_bug', 'Bug / Something is broken')],
        ['billing', t('cat_billing', 'Billing / Subscription')],
        ['account', t('cat_account', 'Account / Login issue')],
        ['other', t('cat_other', 'General inquiry / Other')]
      ]) +
      fld(t('message', 'Message'), '<textarea class="in" rows="3" data-m="f.support.msg" placeholder="' + esc(t('support_msg_ph', 'Describe what happened or what you need help with…')) + '">' + esc(sf.msg) + '</textarea>', null, sf.err) +
      '<div class="rowx" style="justify-content:flex-end">' +
        busyBtn(t('send_support_msg', 'Send support message'), 'sendSupportRequest', 'primary sm', '', 'sup') +
      '</div>' +
    '</div>' +
  '</section>';

  var customWorkCard = '<section class="card pad stack" id="card-cw" style="border:1.5px solid var(--accent);background:var(--surface)">' +
    '<div class="rowx" style="align-items:flex-start;gap:12px">' +
      '<span class="ic" style="width:40px;height:40px;border-radius:12px;background:var(--accent);color:#FFF">' + icon('sparkles', 20) + '</span>' +
      '<div class="grow">' +
        '<div class="between"><b style="font-size:17px">' + esc(t('contact_cw_t', 'Want something built for your business?')) + '</b><span class="pill acc" style="font-size:10.5px">' + esc(t('custom_dev', 'Custom Dev')) + '</span></div>' +
        '<p class="small" style="margin-top:4px;line-height:1.5;color:var(--fg)">' + esc(t('contact_cw_b', 'Want a dedicated website for your store, or a custom feature added just for your business? We can build that — additional charges apply. Reach out and we’ll discuss what you need.')) + '</p>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:10px;padding:8px 0">' +
      '<span class="small muted">' + esc(t('direct_email', 'Email us directly:')) + '</span>' +
      '<a class="btn line sm" href="mailto:contact@vastrenix.com?subject=Custom%20Work%20Inquiry%20-%20' + encodeURIComponent(st.name || '') + '">' + icon('mail', 15) + 'contact@vastrenix.com</a>' +
    '</div>' +
    '<hr class="hr">' +
    '<div class="stack sm">' +
      '<b style="font-size:14px">' + esc(t('submit_cw_inquiry', 'Tell us what you would like built')) + '</b>' +
      '<div class="g2">' +
        txtF(t('your_name', 'Your name'), 'f.customWork.name') +
        txtF(t('biz_name', 'Business name'), 'f.customWork.bizName') +
      '</div>' +
      txtF(t('phone', 'Phone / WhatsApp'), 'f.customWork.phone', 'inputmode="tel"') +
      txtF(t('what_to_build', 'What would you like built?'), 'f.customWork.what', 'placeholder="' + esc(t('what_to_build_ph', 'e.g. Online storefront, wholesale portal, specific export report')) + '"', null, cf.err) +
      fld(t('project_details', 'Details / Specific requirements'), '<textarea class="in" rows="3" data-m="f.customWork.msg" placeholder="' + esc(t('cw_msg_ph', 'Any specific ideas, timeline, or workflow requirements…')) + '">' + esc(cf.msg) + '</textarea>') +
      '<div class="rowx" style="justify-content:flex-end">' +
        busyBtn(t('send_cw_inquiry', 'Submit inquiry'), 'sendCustomWorkInquiry', 'strong sm', '', 'cw') +
      '</div>' +
    '</div>' +
  '</section>';

  return ph(t('nav_contact_us', 'Contact Us'), '', '', 'back') +
    '<div class="stack lg" style="max-width:740px">' +
      supportCard +
      customWorkCard +
    '</div>';
}

A.sendSupportRequest = async function () {
  var f = S.f.support || {};
  f.err = '';
  if (!String(f.msg || '').trim()) {
    f.err = t('err_enter_msg', 'Please enter your message');
    schedule();
    return;
  }
  var st = storeV(), sid = (st && st.ownerId) || ME.id || '';
  var docData = {
    type: 'support',
    uid: ME.id || '',
    category: String(f.cat || 'bug').slice(0, 40),
    name: String(f.name || ME.name || '').trim().slice(0, 120),
    businessId: sid,
    businessName: String(f.bizName || (st && st.name) || '').trim().slice(0, 160),
    email: (window.FB_USER && window.FB_USER.email) || '',
    phone: (st && st.phone) || '',
    message: String(f.msg || '').trim().slice(0, 4000),
    createdAt: Date.now(),
    status: 'open'
  };
  S.busy = 'sup'; schedule();
  try {
    if (window.FS) {
      await window.FS.collection('supportRequests').add(docData);
    } else {
      await DB.collection('supportRequests').add(docData);
    }
    S.f.support = null;
    toast(t('support_sent', 'Support message sent. We’ll get back to you shortly.'));
  } catch (e) {
    toast(errText(e), 'bad');
  }
  S.busy = null; schedule();
};

A.sendCustomWorkInquiry = async function () {
  var f = S.f.customWork || {};
  f.err = '';
  if (!String(f.what || '').trim()) {
    f.err = t('err_what_to_build', 'Please specify what you would like built');
    schedule();
    return;
  }
  var st = storeV(), sid = (st && st.ownerId) || ME.id || '';
  var docData = {
    type: 'custom_work_inquiry',
    uid: ME.id || '',
    name: String(f.name || ME.name || '').trim().slice(0, 120),
    businessId: sid,
    businessName: String(f.bizName || (st && st.name) || '').trim().slice(0, 160),
    phone: String(f.phone || (st && st.phone) || '').trim().slice(0, 20),
    email: (window.FB_USER && window.FB_USER.email) || '',
    whatToBuild: String(f.what || '').trim().slice(0, 4000),
    message: String(f.msg || '').trim().slice(0, 4000),
    createdAt: Date.now(),
    status: 'open'
  };
  S.busy = 'cw'; schedule();
  try {
    if (window.FS) {
      await window.FS.collection('supportRequests').add(docData);
    } else {
      await DB.collection('supportRequests').add(docData);
    }
    S.f.customWork = null;
    toast(t('cw_sent', 'Custom work inquiry submitted! We’ll reach out to discuss your project.'));
  } catch (e) {
    toast(errText(e), 'bad');
  }
  S.busy = null; schedule();
};

/* ===================== ABOUT US & PRIVACY POLICY ===================== */
function subAbout() {
  return ph(t('nav_about', 'About Us'), '', '', 'back') +
    '<div class="stack lg" style="max-width:760px;margin:0 auto;padding-bottom:32px">' +
      '<section class="card pad stack" style="text-align:center;align-items:center;padding:32px 20px;gap:12px">' +
        logo(56) +
        '<b style="font-size:24px;letter-spacing:-0.03em;color:var(--fg)">vastrenix</b>' +
        '<span class="pill ok" style="font-size:12px;font-weight:700">' + esc(t('tagline', 'Retail, wholesale and dealer — one thread.')) + '</span>' +
        '<p style="max-width:560px;line-height:1.6;font-size:15px;color:var(--fg);margin-top:6px">' +
          esc(t('about_intro', 'Built specifically for India’s clothing stores, boutiques, manufacturers, and textile wholesalers. We combine fast counter billing, multi-location stock, customer Khata, and dealer orders into one clean, seamless system.')) +
        '</p>' +
      '</section>' +

      '<section class="stack sm">' +
        '<div class="sect"><h2>' + esc(t('about_why_title', 'Why Vastrenix?')) + '</h2></div>' +
        '<div class="g2" style="gap:12px">' +
          '<div class="card pad stack" style="gap:8px">' +
            '<div class="rowx" style="gap:8px;color:var(--accent)">' + icon('receipt', 20) + '<b style="color:var(--fg);font-size:15px">' + esc(t('about_f1_t', 'Tailored for Garments')) + '</b></div>' +
            '<p class="small muted" style="margin:0;line-height:1.5">' + esc(t('about_f1_b', 'Engineered for apparel nuances: size charts, color swatches, fabric varieties, and three-tier pricing (Retail, Wholesale, Dealer).')) + '</p>' +
          '</div>' +
          '<div class="card pad stack" style="gap:8px">' +
            '<div class="rowx" style="gap:8px;color:var(--accent)">' + icon('warehouse', 20) + '<b style="color:var(--fg);font-size:15px">' + esc(t('about_f2_t', 'Store + Godowns')) + '</b></div>' +
            '<p class="small muted" style="margin:0;line-height:1.5">' + esc(t('about_f2_b', 'Seamless inventory control across shop counters and separate warehouses with fast transfer challans.')) + '</p>' +
          '</div>' +
          '<div class="card pad stack" style="gap:8px">' +
            '<div class="rowx" style="gap:8px;color:var(--accent)">' + icon('network', 20) + '<b style="color:var(--fg);font-size:15px">' + esc(t('about_f3_t', 'B2B Dealer Network')) + '</b></div>' +
            '<p class="small muted" style="margin:0;line-height:1.5">' + esc(t('about_f3_b', 'Connect with your authorized dealers, receive purchase orders digitally, and track dispatches without phone confusion.')) + '</p>' +
          '</div>' +
          '<div class="card pad stack" style="gap:8px">' +
            '<div class="rowx" style="gap:8px;color:var(--accent)">' + icon('cloud', 20) + '<b style="color:var(--fg);font-size:15px">' + esc(t('about_f4_t', 'Cloud Synced & Reliable')) + '</b></div>' +
            '<p class="small muted" style="margin:0;line-height:1.5">' + esc(t('about_f4_b', 'Protected by Google Cloud and Firebase enterprise infrastructure with multi-counter real-time sync.')) + '</p>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="card pad stack" style="gap:14px">' +
        '<div class="sect"><h2 style="margin:0">' + esc(t('about_connect_t', 'Get in Touch')) + '</h2></div>' +
        '<p class="small muted" style="margin:0;line-height:1.5">' + esc(t('about_connect_b', 'Have questions, need technical support, or want custom features built specifically for your retail chain?')) + '</p>' +
        '<div class="rowx wrap" style="gap:10px">' +
          '<button class="btn primary sm" data-a="openSub" data-k="contact" data-target="card-support">' + icon('message', 16) + esc(t('help_support_btn', 'Contact Support')) + '</button>' +
          '<button class="btn line sm" data-a="openSub" data-k="contact" data-target="card-cw">' + icon('layers', 16) + esc(t('custom_work_btn', 'Custom Development')) + '</button>' +
          '<a href="mailto:contact@vastrenix.com" class="btn ghost sm" style="text-decoration:none">' + icon('mail', 16) + 'contact@vastrenix.com</a>' +
        '</div>' +
      '</section>' +
    '</div>';
}

function subPrivacy() {
  return ph(t('nav_privacy', 'Privacy Policy'), '', '<button class="btn line sm" data-a="copyPrivacyUrl">' + icon('copy', 15) + esc(t('copy_link', 'Copy Link')) + '</button>', 'back') +
    '<div class="stack lg" style="max-width:760px;margin:0 auto;padding-bottom:32px">' +
      '<div class="card pad stack" style="background:var(--accent-soft);border:1px solid var(--line);gap:10px">' +
        '<div class="between">' +
          '<div class="rowx" style="gap:8px">' + icon('shield', 20) + '<b style="font-size:15px">' + esc(t('privacy_badge', 'DPDPA 2023 & Play Store Compliant')) + '</b></div>' +
          '<span class="pill ok">' + esc(t('privacy_status', 'October 2026')) + '</span>' +
        '</div>' +
        '<p class="small" style="margin:0;line-height:1.5">' + esc(t('privacy_notice_top', 'Vastrenix is committed to transparent, lawful, and secure handling of data for garment retail and wholesale businesses. This policy outlines what data is collected, why, where it is stored, and your rights under Indian data protection law.')) + '</p>' +
        '<div class="rowx wrap" style="gap:8px;margin-top:2px">' +
          '<button class="btn primary sm" data-a="copyPrivacyUrl">' + icon('share', 15) + esc(t('view_online_policy', 'Copy Public URL')) + '</button>' +
          '<a href="https://arjun2802.github.io/vastrenix-fabric-engine/privacy.html" target="_blank" rel="noopener" class="btn line sm" style="text-decoration:none">' + icon('globe', 15) + esc(t('open_browser', 'Open in Browser')) + '</a>' +
        '</div>' +
      '</div>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s1_t', '1. Scope & Application')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">' + esc(t('p_s1_b', 'Vastrenix (“we”, “our”, or “us”) operates the Vastrenix mobile application, Point-of-Sale (POS) and inventory platform. This Privacy Policy applies to shop owners, authorized staff members, and dealers who access or use our services. By using Vastrenix, you acknowledge and agree to the data collection and practices described herein.')) + '</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s2_t', '2. Categories of Data Collected')) + '</h3>' +
        '<div class="stack sm" style="gap:8px;font-size:13px;line-height:1.5">' +
          '<div><b>• Staff & Account Information:</b> Name, mobile number, email address, assigned role (Owner, Manager, Biller, Inventory Stockist), and designated shop/branch location.</div>' +
          '<div><b>• Customer Information:</b> Customer name, phone number, purchase history, store credit / Khata ledger, dues balance, and payment status.</div>' +
          '<div><b>• Business Profile:</b> Business trading name, GSTIN (Goods & Services Tax Identification Number), registered shop and godown addresses, contact phone numbers, and business logo.</div>' +
          '<div><b>• Transaction & Invoicing Data:</b> Sales invoices, item descriptions, quantities, prices, payment modes (Cash, UPI, Card, Split, Store Credit), and 12-digit UPI UTR transaction reference numbers.</div>' +
          '<div><b>• Uploaded Media:</b> Garment catalog photos, merchant UPI QR code images, and shop logos uploaded voluntarily by the business owner.</div>' +
        '</div>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s3_t', '3. Purpose & Legal Basis for Processing')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">We process collected data strictly for legitimate business purposes: (a) generating GST-compliant tax invoices, receipts, and WhatsApp delivery notices; (b) managing multi-location garment inventory and stock transfer challans; (c) tracking customer credit (Khata) and dues reminders; (d) fulfilling B2B dealer purchase orders; and (e) providing customer technical support.</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s4_t', '4. Storage, Hosting & Infrastructure')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">All business records and databases are hosted on Google Cloud Platform and Firebase infrastructure (Cloud Firestore, Firebase Authentication, and Firebase Storage). Data is encrypted in transit using TLS 1.3/HTTPS and at rest using AES-256 bit encryption. Google Cloud complies with ISO 27001, SOC 1/2/3, and standard Data Processing Agreements (<a href="https://cloud.google.com/terms/data-processing-terms" target="_blank" rel="noopener" style="color:var(--accent)">Google Terms</a>).</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s5_t', '5. Payment Processing & Subscriptions')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">Vastrenix plan subscriptions are processed through Razorpay Software Private Limited. Vastrenix does NOT collect, handle, or store debit/credit card numbers, CVVs, net banking credentials, or UPI MPINs. All payments are processed through Razorpay’s PCI-DSS Level 1 certified payment gateway (<a href="https://razorpay.com/privacy/" target="_blank" rel="noopener" style="color:var(--accent)">Razorpay Privacy Policy</a>).</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px;border-left:3px solid var(--accent)">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s6_t', '6. Dealer Network Data Sharing (Specific Disclosure)')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">When a business opts into the Dealer Network and approves a connection with another merchant or wholesaler, order-specific data (products ordered, quantities, agreed wholesale/dealer tier pricing, and fulfillment status) is shared strictly between the two connected parties. Connected businesses cannot access your internal retail bills, customer Khata, overall revenues, or unconnected branch stock.</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px;border-left:3px solid var(--ok)">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s7_t', '7. Statutory Data Retention & GST Compliance')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">Under Section 36 of the Central Goods and Services Tax (CGST) Act, 2017, registered businesses are legally obligated to maintain invoices, credit/debit notes, and books of account for at least <b>72 months (6 years)</b> from the due date of furnishing the annual return for the relevant year. To ensure our users remain compliant with tax authorities, sales invoices and transaction logs are retained for this mandatory statutory period.</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s8_t', '8. User Rights under DPDPA 2023')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">Under India’s Digital Personal Data Protection Act (DPDPA), 2023, you have the right to: (a) request access to a summary of your personal data processed; (b) request correction or updating of inaccurate data; (c) request deletion of personal data (subject to mandatory GST record-keeping obligations); and (d) seek grievance redressal by contacting contact@vastrenix.com. We acknowledge requests within 48 hours and resolve verifiable requests within 30 days.</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s9_t', '9. Children’s Privacy')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">Vastrenix is exclusively a commercial B2B software tool for registered businesses and retail professionals. The app is not intended for or directed towards individuals under 18 years of age.</p>' +
      '</section>' +

      '<section class="card pad stack" style="gap:10px">' +
        '<h3 style="margin:0;font-size:16px">' + esc(t('p_s10_t', '10. Contact & Grievance Officer')) + '</h3>' +
        '<p class="small muted" style="margin:0;line-height:1.6">For questions, data access/deletion requests, or grievances regarding this Privacy Policy, please email our Data Grievance Desk at <a href="mailto:contact@vastrenix.com" style="color:var(--accent)">contact@vastrenix.com</a>.</p>' +
      '</section>' +
    '</div>';
}

A.copyPrivacyUrl = function () {
  var url = 'https://arjun2802.github.io/vastrenix-fabric-engine/privacy.html';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () {
      toast(t('policy_copied', 'Privacy policy URL copied!'));
    }).catch(function () {
      prompt(t('copy_url', 'Copy URL:'), url);
    });
  } else {
    prompt(t('copy_url', 'Copy URL:'), url);
  }
};

/* ===================== BOOT ===================== */
function evalIdentity() {
  if (ME.isOwner) { ME.role = 'owner'; ME.gate = 'ready'; }
  else if (!D.loaded.myStaff || !D.loaded.myReq) return;
  else {
    var s = ME.staffDoc;
    if (s && s.status === 'active') { ME.role = s.role || 'cashier'; ME.gate = 'ready'; if (s.branch && !lsGet('vx-loc')) S.loc = s.branch; }
    else if (s && s.status === 'inactive') { ME.gate = 'blocked'; }
    else if (ME.reqDoc && ME.reqDoc.status === 'pending') ME.gate = 'pending';
    else if (ME.reqDoc && ME.reqDoc.status === 'rejected') ME.gate = 'rejected';
    else ME.gate = 'request';
  }
  if (ME.gate === 'ready') startData();
  schedule();
}
async function boot() {
  applyTheme();
  var st = document.createElement('style'); st.textContent = IVX_CSS; document.head.appendChild(st);
  var h = (location.hash || '').slice(1); if (h && ROUTES[h]) S.route = h;
  render();
  var db = null, user = null;
  try {
    if (window.claude && window.claude.use) {
      var r = await Promise.all([window.claude.use('db'), window.claude.use('user'), window.claude.use('downloads')]);
      db = r[0]; user = r[1]; DL = r[2];
    }
  } catch (e) { }
  if (db) { DB = db; MODE = 'live'; } else { DB = makeLocalDB(); MODE = 'local'; }
  USER = user; schedule();
  watchDoc('store', DB.doc('meta/store'));
  if (MODE === 'local' || !USER) { ME.isOwner = true; ME.canEdit = true; ME.role = 'owner'; ME.gate = 'ready'; if (USER) { try { var m0 = await USER.me(); ME.id = m0.id; ME.name = m0.name; ME.avatar = m0.avatarUrl; } catch (e) { } } startData(); schedule(); return; }
  var me = await USER.me();
  ME.id = me.id; ME.name = me.name || ''; ME.avatar = me.avatarUrl || ''; ME.isOwner = !!me.isOwner; ME.canEdit = !!me.canEdit;
  if (ME.isOwner) { evalIdentity(); return; }
  if (!ME.id) { ME.gate = 'noid'; schedule(); return; }
  watchDoc('myStaff', DB.doc('staff/' + ME.id), function (d) { ME.staffDoc = d; evalIdentity(); });
  watchDoc('myReq', DB.doc('requests/' + ME.id), function (d) { ME.reqDoc = d; evalIdentity(); });
}
