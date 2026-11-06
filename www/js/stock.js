/* ===================== ITEMS ===================== */
function vItems() {
  var q = S.q.items || '', f = S.q.itemsF || 'all', st = storeV();
  var all = products(), low = {};
  lowList().forEach(function (x) { low[x.p.id] = 1; });
  var list = matchProducts(q, f !== 'all' && f !== 'low' ? f : null).filter(function (p) { return f !== 'low' || low[p.id]; });
  var nv = sum(all, function (p) { return (p.variants || []).length; }), val = sum(all, function (p) { return pStock(p) * (+p.cost || 0); });
  var cats = (st.categories || []).filter(function (c) { return all.some(function (p) { return p.cat === c; }); });
  var acts = (can('stock') && locs().length > 1 ? '<a class="ib" href="#transfers" data-a="go" data-r="transfers" aria-label="' + esc(t('nav_transfers', 'Transfers')) + '">' + icon('transfer', 20) + '</a>' : '') +
    (can('stock') || can('purchase') ? '<a class="ib" href="#purchases" data-a="go" data-r="purchases" aria-label="' + esc(t('receive', 'Receive')) + '">' + icon('package', 20) + '</a>' : '') +
    (can('stock') ? '<button class="btn primary sm" data-a="newProduct">' + icon('plus', 16, 2.2) + '<span>' + esc(t('add', 'Add')) + '</span></button>' : '');
  var body;
  if (!D.loaded.products) body = skelRows(6);
  else if (!all.length) body = '<div class="card">' + empty('shirt', t('no_items', 'No garments yet'), t('no_items_b2', 'Add your first garment with its sizes, colours and prices. Stock starts at zero until goods are received or counted.'), can('stock') ? '<button class="btn primary" data-a="newProduct">' + esc(t('add_item', 'Add garment')) + '</button>' : '') + '</div>';
  else if (!list.length) body = '<div class="card">' + empty('search', t('no_match', 'No match for “{q}”', { q: q || '' }), '') + '</div>';
  else body = '<div class="list">' + list.map(function (p) {
    var a = pAvail(p), vs = p.variants || [], mn = Math.min.apply(null, vs.map(function (v) { return v.min != null ? +v.min : 3; }).concat([3]));
    var sizes = vs.map(function (v) { return v.size; }).filter(function (x, i, arr) { return x && arr.indexOf(x) === i; });
    return '<button class="li" data-a="openProduct" data-id="' + esc(p.id) + '">' + swatch(p) + '<span class="tx"><b>' + esc(p.name) + '</b><small>' + esc([(vs[0] || {}).sku ? vs[0].sku.split('-').slice(0, 3).join('-') : '', sizes.length ? sizes[0] + (sizes.length > 1 ? '–' + sizes[sizes.length - 1] : '') : '', p.fabric].filter(Boolean).join(' · ')) + '</small></span><span class="end"><b>' + inr((p.price || {}).retail) + '</b>' + stockPill(a, low[p.id] ? Infinity : mn) + '</span></button>';
  }).join('') + '</div>';
  return ph(t('nav_items', 'Items'), esc(t('items_sub', '{n} variants · {v} at cost', { n: nf(nv), v: inrS(val) })), acts) +
    '<div class="stack" style="max-width:980px">' + searchBox('q.items', t('search_items', 'Search kurta, SKU, fabric, colour…'), 'data-enter="itemsScan"') +
    chips('q.itemsF', [['all', t('all', 'All'), all.length], ['low', t('low_stock', 'Low stock'), Object.keys(low).length]].concat(cats.map(function (c) { return [c, c]; }))) + body + '</div>';
}
A.itemsScan = function () { var hit = findByCode(S.q.items); if (hit) { S.q.items = ''; openSub('product', { id: hit.p.id }); } };
A.openProduct = function (d) { openSub('product', { id: d.id }); };
A.newProduct = function () {
  if (subState().isExpired) {
    openSheet('subscribe');
    toast(t('trial_ended_toast', 'Your free trial has ended. Subscribe to continue.'), 'bad');
    return;
  }
  S.f.p = null; openSub('pform', {});
};

function subProduct(sub) {
  var p = D.products[sub.id];
  if (!p) return ph(t('not_found', 'Not found'), '', '', 'back') + (D.loaded.products ? empty('shirt', t('item_gone', 'This garment was removed')) : skelRows(3));
  var vs = p.variants || [], ls = locs(), pr = p.price || {};
  var tot = { st: pStock(p), res: sum(vs, function (v) { return v.reserved; }), dmg: sum(vs, function (v) { return v.damaged; }), tr: sum(vs, function (v) { return v.transit; }) };
  var av = tot.st - tot.res, base = Math.max(1, tot.st + tot.dmg + tot.tr);
  var margin = pr.retail && p.cost ? Math.round((1 - (+p.cost) / ((+pr.retail) / (storeV().priceIncl !== false ? 1 + (+p.gst || 0) / 100 : 1))) * 100) : null;
  var sup = p.supplierId && D.suppliers[p.supplierId];
  var head = ph(p.name, esc([p.cat, p.fabric, p.hsn ? 'HSN ' + p.hsn : ''].filter(Boolean).join(' · ')), can('stock') ? '<button class="ib" data-a="editProduct" data-id="' + esc(p.id) + '" aria-label="' + esc(t('edit', 'Edit')) + '">' + icon('edit', 19) + '</button><button class="ib" data-a="sheet" data-k="pmore" data-id="' + esc(p.id) + '" aria-label="' + esc(t('more_actions', 'More actions')) + '">' + icon('moreV', 19) + '</button>' : '', 'back');
  var top = '<section class="card" style="overflow:hidden"><div style="height:200px;background-color:' + colorOf((p.colors || [])[0] || p.name) + ';' + (p.img ? 'background-image:url(' + cssUrl(p.img) + ');background-size:cover;background-position:center' : '') + ';display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55)">' + (p.img ? '' : icon('shirt', 80, 1.1)) + '</div>' +
    '<div class="pad stack" style="padding:16px"><div class="g4">' + [['tier_retail', 'Retail', pr.retail], ['tier_wholesale', 'Wholesale', pr.wholesale], ['tier_dealer', 'Dealer', pr.dealer], ['cost', 'Cost', p.cost]].map(function (x) { return '<div class="kpi" style="padding:10px 12px"><small>' + esc(t(x[0], x[1])) + '</small><b style="font-size:16px">' + (x[2] ? inr(x[2]) : '—') + '</b></div>'; }).join('') + '</div>' +
    (margin != null ? '<span class="small muted">' + esc(t('margin', 'Margin on retail: {m}%', { m: margin })) + ' · GST ' + (+p.gst || 0) + '%</span>' : '') + '</div></section>';

  /* Fabric Drape Preview card (hidden per requirements) */
  var fabricCard = '';

  var stock = '<section class="card pad stack"><div class="between"><b>' + esc(t('stock', 'Stock')) + '</b><span class="small muted num">' + esc(t('stock_sub', '{a} on hand · {t} in transit', { a: tot.st, t: tot.tr })) + '</span></div>' +
    '<div class="sbar" aria-hidden="true"><i style="width:' + (Math.max(0, av) / base * 100) + '%;background:var(--strong)"></i><i style="width:' + (tot.res / base * 100) + '%;background:var(--accent)"></i><i style="width:' + (tot.tr / base * 100) + '%;background:var(--warn-solid)"></i><i style="width:' + (tot.dmg / base * 100) + '%;background:var(--bad-solid)"></i></div>' +
    '<div class="legend"><span><span><i style="background:var(--strong)"></i>' + esc(t('available', 'Available')) + '</span><b>' + av + '</b></span><span><span><i style="background:var(--accent)"></i>' + esc(t('reserved', 'Reserved')) + '</span><b>' + tot.res + '</b></span><span><span><i style="background:var(--warn-solid)"></i>' + esc(t('in_transit', 'In transit')) + '</span><b>' + tot.tr + '</b></span><span><span><i style="background:var(--bad-solid)"></i>' + esc(t('damaged', 'Damaged')) + '</span><b>' + tot.dmg + '</b></span></div>' +
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('variant', 'Variant')) + '</th>' + ls.map(function (l) { return '<th class="r">' + esc(l.name) + '</th>'; }).join('') + '<th class="r">' + esc(t('reserved', 'Reserved')) + '</th><th class="r">' + esc(t('available', 'Available')) + '</th><th class="r">' + esc(t('min', 'Min')) + '</th></tr></thead><tbody>' +
    vs.map(function (v) { var a = VXC.variantAvail(v), mn = v.min != null ? +v.min : 3; return '<tr><td><b>' + esc(variantLabel(v) || '—') + '</b><div class="xsmall muted mono">' + esc(v.sku) + ' · ' + esc(v.barcode || '') + '</div></td>' + ls.map(function (l) { return '<td class="r">' + (+((v.stock || {})[l.id]) || 0) + '</td>'; }).join('') + '<td class="r">' + (+v.reserved || 0) + '</td><td class="r"><span class="' + (a <= mn ? 'bad-t b' : 'b') + '">' + a + '</span></td><td class="r muted">' + mn + '</td></tr>'; }).join('') + '</tbody></table></div>' +
    (can('stock') || can('purchase') ? '<div class="rowx wrap">' + (can('stock') ? '<button class="btn line sm" data-a="sheet" data-k="count" data-id="' + esc(p.id) + '">' + icon('clipboard', 16) + esc(t('count_stock', 'Count stock')) + '</button>' : '') + (can('stock') && ls.length > 1 ? '<button class="btn line sm" data-a="newTransfer" data-pid="' + esc(p.id) + '">' + icon('transfer', 16) + esc(t('transfer', 'Transfer')) + '</button>' : '') + (can('purchase') || can('stock') ? '<button class="btn primary sm" data-a="reorder" data-pid="' + esc(p.id) + '">' + icon('file', 16) + esc(t('new_order', 'New restock order')) + '</button>' : '') + '</div>' : '') + '</section>';
  var info = '<section class="list">' + [[t('fabric', 'Fabric'), p.fabric], [t('supplier', 'Supplier'), sup ? sup.name : ''], [t('rack', 'Rack / shelf'), p.rack], [t('units_sold', 'Units sold'), nf(sum(vs, function (v) { return v.sold; }))], [t('added_on', 'Added'), p.createdAt ? fmtDY(p.createdAt) : '']].filter(function (x) { return x[1]; }).map(function (x) { return '<div class="li" style="min-height:48px"><span class="tx"><small>' + esc(x[0]) + '</small></span><b class="small">' + esc(x[1]) + '</b></div>'; }).join('') + '</section>';
  return head + '<div class="cols"><div class="stack lg">' + top + fabricCard + info + '</div><div class="stack lg">' + stock + '</div></div>';
}
A.editProduct = function (d) { S.f.p = null; openSub('pform', { id: d.id }); };
A.reorder = function (d) { var p = D.products[d.pid]; if (!p) return; S.f.po = { supplierId: p.supplierId || '', note: '', lines: (p.variants || []).filter(function (v) { return VXC.variantAvail(v) <= (v.min != null ? +v.min : 3); }).map(function (v) { return poLine(p, v, Math.max((v.min != null ? +v.min : 3) * 2 - VXC.variantAvail(v), 1)); }) }; if (!S.f.po.lines.length) S.f.po.lines = (p.variants || []).slice(0, 1).map(function (v) { return poLine(p, v, 10); }); openSub('poform', {}); };
function pmoreSheet(sh) {
  var p = D.products[sh.id]; if (!p) return '';
  return sheetWrap(p.name, '<div class="list"><button class="li" data-a="editProduct" data-id="' + esc(p.id) + '"><span class="ic">' + icon('edit', 18) + '</span><span class="tx"><b>' + esc(t('edit_item', 'Edit garment')) + '</b></span></button><button class="li" data-a="dupProduct" data-id="' + esc(p.id) + '"><span class="ic">' + icon('copy', 18) + '</span><span class="tx"><b>' + esc(t('duplicate', 'Duplicate')) + '</b><small>' + esc(t('dup_s', 'Same details, new SKUs, zero stock')) + '</small></span></button><button class="li" data-a="archiveProduct" data-id="' + esc(p.id) + '"><span class="ic bad">' + icon('archive', 18) + '</span><span class="tx"><b class="bad-t">' + esc(t('archive', 'Archive')) + '</b><small>' + esc(t('archive_s', 'Hides it from billing and lists. Past invoices stay.')) + '</small></span></button></div>', '');
}
A.archiveProduct = function (d) { openSheet('confirm', { title: t('archive', 'Archive'), msg: t('archive_q', 'Archive this garment? It disappears from billing; history is kept.'), yes: t('archive', 'Archive'), act: 'doArchive', arg: d.id, danger: true }); };
A.doArchive = async function (d) { var id = S.sheet.arg; closeSheet(); var ok = await tx('arch', async function () { var p = await fresh('products/' + id); if (!p) return 1; p.archived = true; p.updatedAt = Date.now(); await put('products/' + id, p); return 1; }); if (ok) { S.sub = null; toast(t('archived', 'Garment archived')); schedule(); } };
A.dupProduct = function (d) { var p = D.products[d.id]; if (!p) return; S.f.p = draftFrom(p); S.f.p.id = null; S.f.p.name = p.name + ' (' + t('copy_lc', 'copy') + ')'; openSub('pform', {}); };

/* ----- garment form ----- */
var PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free size', '28', '30', '32', '34', '36', '38', '40', '42', '44'];
function draftFrom(p) {
  var st = storeV();
  if (!p) return { id: null, img: '', name: '', cat: (st.categories || [])[0] || '', newCat: '', fabric: '', hsn: '6204', gst: String(st.defaultGst != null ? st.defaultGst : 5), colors: [], colorIn: '', sizes: ['S', 'M', 'L', 'XL'], sizeIn: '', cost: '', retail: '', wholesale: '', dealer: '', min: 3, supplierId: '', rack: '', err: {} };
  var vs = p.variants || [];
  return { id: p.id, img: p.img || '', name: p.name, cat: p.cat || '', newCat: '', fabric: p.fabric || '', hsn: p.hsn || '', gst: String(p.gst != null ? p.gst : 5), colors: (p.colors || []).slice(), colorIn: '', sizes: (p.sizes || vs.map(function (v) { return v.size; })).filter(function (x, i, a) { return x && a.indexOf(x) === i; }), sizeIn: '', cost: p.cost || '', retail: (p.price || {}).retail || '', wholesale: (p.price || {}).wholesale || '', dealer: (p.price || {}).dealer || '', min: vs.length && vs[0].min != null ? vs[0].min : 3, supplierId: p.supplierId || '', rack: p.rack || '', err: {} };
}
function subPform(sub) {
  if (!S.f.p) S.f.p = draftFrom(sub.id ? D.products[sub.id] : null);
  var f = S.f.p, st = storeV(), err = f.err || {};
  var cats = (st.categories || []).map(function (c) { return [c, c]; }).concat([['__new', t('new_category', '+ New category')]]);
  var nVar = Math.max(1, f.sizes.length) * Math.max(1, f.colors.length);
  var sups = [['', t('none', 'None')]].concat(vals(D.suppliers).sort(by(function (s) { return s.name; })).map(function (s) { return [s.id, s.name]; }));
  var photo = '<div class="rowx">' +
    '<button type="button" class="btn line" style="height:96px;width:84px;flex-direction:column;gap:6px;border-style:dashed;font-size:12px;cursor:pointer" data-a="triggerUpload" data-for="f-pimg">' + icon('camera', 22) + esc(t('photo', 'Photo')) + '</button>' +
    '<input type="file" id="f-pimg" accept="image/*" class="sr" data-change="pickImg">' +
    (f.img ? '<span class="sw" style="width:84px;height:96px;border-radius:14px;background-image:url(' + cssUrl(f.img) + ')"></span><button class="btn ghost sm" data-a="set" data-k="f.p.img" data-v="">' + esc(t('remove', 'Remove')) + '</button>' : '<span class="small muted" style="max-width:26ch">' + esc(t('photo_hint', 'Optional. Compressed to keep the app fast.')) + '</span>') + '</div>';
  var colors = fld(t('colours', 'Colours'), '<div class="picks">' + f.colors.map(function (c, i) { return '<button type="button" class="pick" data-a="rmColor" data-i="' + i + '"><span style="width:16px;height:16px;border-radius:999px;background:' + colorOf(c) + '"></span>' + esc(c) + '<span class="x">' + icon('x', 13) + '</span></button>'; }).join('') + '</div><div class="rowx"><input class="in grow" id="f-colorIn" data-m="f.p.colorIn" value="' + esc(f.colorIn) + '" placeholder="' + esc(t('colour_ph', 'e.g. Indigo, Rust, Ivory')) + '" data-enter="addColor"><button class="btn line" data-a="addColor">' + esc(t('add', 'Add')) + '</button></div>', t('colour_hint', 'Leave empty for a single-colour garment'));
  var sizes = fld(t('sizes', 'Sizes'), '<div class="picks">' + PRESET_SIZES.concat(f.sizes.filter(function (s) { return PRESET_SIZES.indexOf(s) < 0; })).map(function (s) { var on = f.sizes.indexOf(s) >= 0; return '<button type="button" class="pick' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-a="togSize" data-v="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div><div class="rowx"><input class="in grow" id="f-sizeIn" data-m="f.p.sizeIn" value="' + esc(f.sizeIn) + '" placeholder="' + esc(t('size_ph', 'Custom size, e.g. 2-3Y')) + '" data-enter="addSize"><button class="btn line" data-a="addSize">' + esc(t('add', 'Add')) + '</button></div>', null, err.sizes);
  var body = '<div class="cols even"><div class="stack lg"><section class="card pad stack">' + photo + txtF(t('garment_name', 'Garment name'), 'f.p.name', '', null, err.name) +
    '<div class="g2">' + selF(t('category', 'Category'), 'f.p.cat', cats) + txtF(t('fabric', 'Fabric'), 'f.p.fabric', 'placeholder="' + esc(t('fabric_ph', 'Cotton, Chanderi…')) + '"') + '</div>' +
    (f.cat === '__new' ? txtF(t('new_category_n', 'New category name'), 'f.p.newCat', '', null, err.cat) : '') +
    txtF('HSN', 'f.p.hsn', 'inputmode="numeric" maxlength="8"') + fld(t('gst_rate', 'GST rate'), seg('f.p.gst', [['0', '0%'], ['5', '5%'], ['12', '12%'], ['18', '18%']])) + '</section>' +
    '<section class="card pad stack">' + colors + sizes + '<div class="note">' + icon('layers', 17) + '<span>' + esc(t('var_count', '{n} variants, each with its own SKU and barcode.', { n: nVar })) + '</span></div></section></div>' +
    '<div class="stack lg"><section class="card pad stack"><b>' + esc(t('pricing', 'Pricing')) + '</b><div class="g2">' + moneyF(t('cost', 'Cost'), 'f.p.cost') + moneyF(t('tier_retail', 'Retail') + ' (MRP)', 'f.p.retail', '', null, err.retail) + moneyF(t('tier_wholesale', 'Wholesale'), 'f.p.wholesale') + moneyF(t('tier_dealer', 'Dealer'), 'f.p.dealer') + '</div><span class="hint small muted">' + esc(st.priceIncl !== false ? t('prices_incl_h', 'Prices include GST (change in Settings)') : t('prices_excl_h', 'GST is added on top of these prices')) + '</span></section>' +
    '<section class="card pad stack"><b>' + esc(t('stock_rules', 'Stock')) + '</b><div class="g2">' + numF(t('min_stock', 'Low-stock alert at'), 'f.p.min', 'inputmode="numeric"', t('per_variant', 'Per variant')) + txtF(t('rack', 'Rack / shelf'), 'f.p.rack', 'placeholder="R-03 · B"') + '</div>' + selF(t('supplier', 'Supplier'), 'f.p.supplierId', sups) + '<div class="note">' + icon('info', 17) + '<span>' + esc(t('stock_zero', 'Stock starts at 0. It rises when you receive a purchase order or count stock.')) + '</span></div></section></div></div>';
  return ph(f.id ? t('edit_item', 'Edit garment') : t('add_item', 'Add garment'), '', '', 'back', true) + body + '<div class="rowx" style="margin-top:16px;justify-content:flex-end"><button class="btn line lg" data-a="back">' + esc(t('cancel', 'Cancel')) + '</button>' + busyBtn(f.id ? t('save_changes', 'Save changes') : t('create_n_var', 'Create {n} variants', { n: nVar }), 'saveProduct', 'primary lg', '', 'prod') + '</div>';
}
A.addColor = function () { var f = S.f.p, c = String(f.colorIn || '').trim(); if (c && f.colors.map(function (x) { return x.toLowerCase(); }).indexOf(c.toLowerCase()) < 0) f.colors.push(c.charAt(0).toUpperCase() + c.slice(1)); f.colorIn = ''; schedule(); };
A.rmColor = function (d) { S.f.p.colors.splice(+d.i, 1); schedule(); };
A.togSize = function (d) { var s = S.f.p.sizes, i = s.indexOf(d.v); if (i >= 0) s.splice(i, 1); else { s.push(d.v); var ord = PRESET_SIZES; s.sort(function (a, b) { var x = ord.indexOf(a), y = ord.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); }); } schedule(); };
A.addSize = function () { var f = S.f.p, s = String(f.sizeIn || '').trim(); if (s && f.sizes.indexOf(s) < 0) f.sizes.push(s); f.sizeIn = ''; schedule(); };
A.pickImg = function (d, el) {
  if (!el) el = document.getElementById('f-pimg');
  var file = el && el.files && el.files[0];
  if (!file) return;
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () {
      var max = 540, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var url = cv.toDataURL('image/jpeg', 0.75);
      if (url.length > 120000) url = cv.toDataURL('image/jpeg', 0.58);
      if (!S.f.p) S.f.p = draftFrom(null);
      S.f.p.img = url;
      schedule();
    };
    img.onerror = function () { toast(t('err_img', 'That file isn’t an image we can read.'), 'bad'); };
    img.src = rd.result;
  };
  rd.onerror = function () { toast(t('err_img', 'Could not read file.'), 'bad'); };
  rd.readAsDataURL(file);
  if (el) el.value = '';
};
function ean13(base12) { var s = 0; for (var i = 0; i < 12; i++) s += (+base12[i]) * (i % 2 ? 3 : 1); return base12 + ((10 - (s % 10)) % 10); }
function newBarcode() { var b = '890'; for (var i = 0; i < 9; i++) b += Math.floor(Math.random() * 10); return ean13(b); }
function catCode(c) { var x = String(c || 'GEN').toUpperCase().replace(/[^A-Z]/g, ''); return (x.slice(0, 3) || 'GEN').padEnd(3, 'X'); }
A.saveProduct = async function () {
  if (subState().isExpired) {
    openSheet('subscribe');
    toast(t('trial_ended_toast', 'Your free trial has ended. Subscribe to continue.'), 'bad');
    return;
  }
  var f = S.f.p, err = {};
  if (!String(f.name).trim()) err.name = t('err_gname', 'Enter the garment name');
  if (!(+f.retail > 0)) err.retail = t('err_price', 'Enter a price');
  if (!f.sizes.length) err.sizes = t('err_sizes', 'Pick at least one size');
  if (f.cat === '__new' && !String(f.newCat).trim()) err.cat = t('err_cat', 'Name the new category');
  f.err = err; if (Object.keys(err).length) { schedule(); return; }
  var cat = f.cat === '__new' ? String(f.newCat).trim() : f.cat;
  var res = await tx('prod', async function () {
    var now = Date.now(), st = clone(storeV());
    if (cat && (st.categories || []).indexOf(cat) < 0) { var s2 = await fresh('meta/store'); s2.categories = (s2.categories || []).concat([cat]); await put('meta/store', s2); }
    var id = f.id || uid('p'), old = f.id ? await fresh('products/' + f.id) : null;
    var seq = old && old.seq ? old.seq : await nextNo('sku');
    var colors = f.colors.length ? f.colors : [''];
    var vs = [], kept = [], warn = 0;
    colors.forEach(function (c) {
      f.sizes.forEach(function (s) {
        var ex = old && (old.variants || []).find(function (v) { return (v.size || '') === s && (v.color || '') === c; });
        if (ex) { ex.min = +f.min; vs.push(ex); kept.push(ex.id); return; }
        var sku = 'VX-' + catCode(cat) + '-' + VXC.pad(seq, 4) + '-' + String(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) + (c ? '-' + c.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) : '');
        vs.push({ id: uid('v'), sku: sku, barcode: newBarcode(), size: s, color: c, stock: {}, reserved: 0, damaged: 0, transit: 0, min: +f.min, sold: 0 });
      });
    });
    if (old) (old.variants || []).forEach(function (v) { if (kept.indexOf(v.id) < 0) { if (VXC.variantStock(v) || v.reserved || v.transit) { vs.push(v); warn++; } } });
    var p = Object.assign(old || { createdAt: now }, {
      name: String(f.name).trim(), cat: cat, fabric: String(f.fabric || '').trim(), hsn: String(f.hsn || '').trim(), gst: +f.gst, cost: +f.cost || 0,
      price: { retail: +f.retail || 0, wholesale: +f.wholesale || 0, dealer: +f.dealer || 0 }, supplierId: f.supplierId || '', rack: String(f.rack || '').trim(), img: f.img || '',
      colors: f.colors.slice(), sizes: f.sizes.slice(), variants: vs, seq: seq, updatedAt: now, archived: false
    });
    await put('products/' + id, p);
    return { id: id, warn: warn };
  });
  if (!res) return;
  if (res.warn) toast(t('kept_var', '{n} removed variants still hold stock, so they were kept.', { n: res.warn }));
  else toast(f.id ? t('saved', 'Saved') : t('item_created', 'Garment created'));
  S.f.p = null; S.sub = { k: 'product', id: res.id, prev: null }; schedule();
};

/* ----- physical count ----- */
function countSheet(sh) {
  var p = D.products[sh.id]; if (!p) return '';
  if (!S.f.cnt || S.f.cnt.pid !== p.id) { S.f.cnt = { pid: p.id, loc: curLoc(), q: {} }; }
  var f = S.f.cnt;
  (p.variants || []).forEach(function (v) { if (f.q[v.id] == null) f.q[v.id] = +((v.stock || {})[f.loc]) || 0; });
  var body = (locs().length > 1 ? selF(t('location', 'Location'), 'f.cnt.loc', locs().map(function (l) { return [l.id, l.name]; }), 'data-change="cntLoc"') : '') +
    '<p class="small muted">' + esc(t('count_b', 'Enter what you physically counted. Differences are saved as an adjustment.')) + '</p>' +
    '<div class="list">' + (p.variants || []).map(function (v) { var cur = +((v.stock || {})[f.loc]) || 0, nv = +f.q[v.id] || 0, df = nv - cur; return '<div class="li"><span class="tx"><b>' + esc(variantLabel(v) || p.name) + '</b><small>' + esc(t('system_n', 'System: {n}', { n: cur })) + (df ? ' · <span class="' + (df > 0 ? 'ok-t' : 'bad-t') + '">' + (df > 0 ? '+' : '') + df + '</span>' : '') + '</small></span><input class="in sm num" style="width:84px;text-align:center" id="f-cnt-' + esc(v.id) + '" data-m="f.cnt.q.' + esc(v.id) + '" data-num data-r inputmode="numeric" value="' + esc(f.q[v.id]) + '" aria-label="' + esc(t('counted', 'Counted') + ' ' + variantLabel(v)) + '"></div>'; }).join('') + '</div>';
  return sheetWrap(t('count_stock', 'Count stock') + ' · ' + p.name, body, busyBtn(t('save_count', 'Save count'), 'saveCount', 'primary lg', '', 'cnt'));
}
A.cntLoc = function () { S.f.cnt.q = {}; schedule(); };
A.saveCount = async function () {
  var f = S.f.cnt;
  var ok = await tx('cnt', async function () {
    var now = Date.now(), p = await fresh('products/' + f.pid), ch = [];
    (p.variants || []).forEach(function (v) { v.stock = v.stock || {}; var cur = +v.stock[f.loc] || 0, nv = Math.max(0, Math.round(+f.q[v.id] || 0)); if (nv !== cur) { ch.push({ vid: v.id, label: variantLabel(v), from: cur, to: nv }); v.stock[f.loc] = nv; } });
    if (!ch.length) return 'none';
    p.updatedAt = now; await put('products/' + f.pid, p);
    var day = dayKey(now); await ensureDay(day); var a = {}; a[uid('a')] = { at: now, kind: 'count', pid: f.pid, name: p.name, loc: f.loc, changes: ch, by: ME.id || '' }; await patch('ledger/' + day, { adj: a });
    return ch.length;
  });
  if (ok) { S.f.cnt = null; closeSheet(); toast(ok === 'none' ? t('count_same', 'Count matches the system') : (ok === 1 ? t('count_saved1', 'Stock updated for 1 item') : t('count_saved', 'Stock updated for {n} variants', { n: ok }))); }
};

/* ===================== LOW STOCK ===================== */
function vLow() {
  var low = lowList();
  if (!S.f.low) S.f.low = { sel: {}, qty: {} };
  var f = S.f.low, groups = {};
  low.forEach(function (x) { var k = x.p.supplierId || ''; (groups[k] = groups[k] || []).push(x); var key = x.p.id + ':' + x.v.id; if (f.sel[key] == null) f.sel[key] = true; if (f.qty[key] == null) f.qty[key] = x.sugg; });
  var selN = low.filter(function (x) { return f.sel[x.p.id + ':' + x.v.id]; });
  var supN = selN.map(function (x) { return x.p.supplierId || ''; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).length;
  var reorder = sum(selN, function (x) { return (+f.qty[x.p.id + ':' + x.v.id] || 0) * (+x.p.cost || 0); });
  var body = !D.loaded.products ? skelRows(5) : !low.length ? '<div class="card">' + empty('checkCircle', t('low_none', 'Everything is above its minimum'), t('low_none_b', 'Variants appear here when available stock drops to their low-stock level.')) + '</div>' :
    '<section class="hero" style="padding:16px 18px"><div class="split" style="border:0;padding:0"><div><b>' + low.length + '</b><small>' + esc(t('below_min', 'Below minimum')) + '</small></div><div><b style="color:#FF9AA6">' + low.filter(function (x) { return x.out; }).length + '</b><small>' + esc(t('out_of_stock', 'Out of stock')) + '</small></div><div><b>' + inrS(reorder) + '</b><small>' + esc(t('to_reorder', 'To reorder')) + '</small></div></div></section>' +
    Object.keys(groups).map(function (sid) {
      var s = D.suppliers[sid], g = groups[sid];
      return '<section class="list"><div class="li" style="background:var(--surface2)"><span class="ic">' + esc(initials(s ? s.name : '?')) + '</span><span class="tx"><b>' + esc(s ? s.name : t('no_supplier', 'No supplier set')) + '</b><small>' + esc(s ? (s.city || '') : t('no_supplier_s', 'Set a supplier on the garment to reorder')) + '</small></span></div>' +
        g.map(function (x) { var key = x.p.id + ':' + x.v.id, on = !!f.sel[key]; return '<div class="li"><button class="ic" style="border:0;' + (on ? 'background:var(--accent);color:#fff' : '') + '" data-a="lowTog" data-key="' + esc(key) + '" aria-pressed="' + on + '" aria-label="' + esc(t('select', 'Select')) + '">' + (on ? icon('check', 16, 2.6) : '') + '</button><button class="tx" style="border:0;background:none;text-align:left;padding:0" data-a="openProduct" data-id="' + esc(x.p.id) + '"><b>' + esc(x.p.name + ' · ' + variantLabel(x.v)) + '</b><small class="' + (x.out ? 'bad-t' : '') + '">' + esc(x.out ? t('out_min', 'Out of stock · min {m}', { m: x.min }) : t('left_min', '{n} left · min {m}', { n: x.avail, m: x.min })) + '</small></button>' + stepper('data-a="lowQty" data-key="' + esc(key) + '" data-d="-1"', 'data-a="lowQty" data-key="' + esc(key) + '" data-d="1"', f.qty[key]) + '</div>'; }).join('') + '</section>';
    }).join('');
  var foot = low.length && (can('purchase') || can('stock')) ? '<div class="rowx" style="justify-content:flex-end;margin-top:16px"><span class="small muted grow">' + esc(t('low_foot', '{n} items · {s} suppliers · {amt} at cost', { n: selN.length, s: supN, amt: inr(reorder) })) + '</span>' + busyBtn(t('create_pos', 'Create {n} purchase orders', { n: supN }), 'lowCreate', 'primary', selN.length ? '' : 'disabled', 'po') + '</div>' : '';
  return ph(t('nav_low', 'Low stock'), esc(t('low_sub', 'Reorder suggestions bring each variant back to twice its minimum'))) + '<div class="stack" style="max-width:860px">' + body + foot + '</div>';
}
A.lowTog = function (d) { S.f.low.sel[d.key] = !S.f.low.sel[d.key]; schedule(); };
A.lowQty = function (d) { var q = S.f.low.qty; q[d.key] = Math.max(1, (+q[d.key] || 0) + (+d.d)); schedule(); };
A.lowCreate = async function () {
  var f = S.f.low, groups = {};
  lowList().forEach(function (x) { var key = x.p.id + ':' + x.v.id; if (!f.sel[key]) return; var sid = x.p.supplierId || ''; (groups[sid] = groups[sid] || []).push(poLine(x.p, x.v, +f.qty[key] || x.sugg)); });
  var made = await tx('po', async function () { var n = 0; for (var sid in groups) { await createPO(sid, groups[sid], t('from_low', 'Created from low-stock suggestions')); n++; } return n; });
  if (made) { S.f.low = null; toast(t('pos_made', '{n} purchase orders created', { n: made })); go('purchases'); }
};

/* ===================== TRANSFERS ===================== */
function vTransfers() {
  var ls = locs(), list = vals(D.transfers).sort(by(function (x) { return x.at; }, true));
  if (ls.length < 2) return ph(t('nav_transfers', 'Transfers')) + '<div class="card">' + empty('warehouse', t('one_loc', 'You have one location'), t('one_loc_b', 'Add a godown or second branch in Settings to move stock between them.'), allowed('settings') ? '<a class="btn primary sm" href="#settings" data-a="go" data-r="settings">' + esc(t('nav_settings', 'Settings')) + '</a>' : '') + '</div>';
  var transit = list.filter(function (x) { return x.status === 'transit'; }), done = list.filter(function (x) { return x.status !== 'transit'; });
  var row = function (x) { var units = sum(x.lines, function (l) { return l.qty; }); return '<div class="li"><span class="ic ' + (x.status === 'transit' ? 'warn' : 'ok') + '">' + icon(x.status === 'transit' ? 'truck' : 'check', 18) + '</span><span class="tx"><b>' + esc(locName(x.from) + ' → ' + locName(x.to)) + '</b><small>' + esc(x.no + ' · ' + t('n_units', '{n} units', { n: units }) + ' · ' + fmtD(x.at) + ' · ' + who(x.by) + (x.note ? ' · ' + x.note : '')) + '</small></span>' + (x.status === 'transit' && can('stock') ? busyBtn(t('mark_received', 'Mark received'), 'recvTransfer', 'strong sm', 'data-id="' + esc(x.id) + '"', 'tr') : pill(t('received', 'Received'), 'ok')) + '</div>'; };
  return ph(t('nav_transfers', 'Transfers'), esc(t('tr_sub', 'Stock shows as in transit until the other side confirms')), can('stock') ? '<button class="btn primary sm" data-a="newTransfer">' + icon('plus', 16, 2.2) + esc(t('new_transfer', 'New transfer')) + '</button>' : '') +
    '<div class="stack" style="max-width:860px">' + (!D.loaded.transfers ? skelRows(3) : !list.length ? '<div class="card">' + empty('transfer', t('no_tr', 'No transfers yet'), t('no_tr_b', 'Move stock from the godown to the shop floor, or between branches.')) + '</div>' :
      (transit.length ? '<div class="sect"><h2>' + esc(t('in_transit', 'In transit')) + '</h2></div><div class="list">' + transit.map(row).join('') + '</div>' : '') + (done.length ? '<div class="sect"><h2>' + esc(t('completed', 'Completed')) + '</h2></div><div class="list">' + done.slice(0, 40).map(row).join('') + '</div>' : '')) + '</div>';
}
A.newTransfer = function (d) {
  var ls = locs(), from = ls.find(function (l) { return l.type === 'godown'; }) || ls[1] || ls[0], to = ls.find(function (l) { return l.id !== from.id; }) || ls[0];
  S.f.tr = { from: from.id, to: to.id, note: '', lines: [], q: '' };
  if (d && d.pid) { var p = D.products[d.pid]; if (p) (p.variants || []).forEach(function (v) { if ((+((v.stock || {})[from.id]) || 0) > 0) S.f.tr.lines.push({ pid: p.id, vid: v.id, name: p.name, label: variantLabel(v), qty: 1 }); }); }
  openSub('tform', {});
};
function lineSearch(model, act, loc) {
  var q = getPath(S, model) || '';
  var hits = q ? [] : null;
  if (q) matchProducts(q, null).slice(0, 6).forEach(function (p) { (p.variants || []).forEach(function (v) { hits.push({ p: p, v: v }); }); });
  return searchBox(model, t('add_item_search', 'Search a garment or scan to add'), 'data-enter="' + act + 'Scan"') + (hits ? '<div class="list" style="max-height:300px;overflow:auto">' + (hits.length ? hits.slice(0, 24).map(function (h) { var have = loc ? (+((h.v.stock || {})[loc]) || 0) : VXC.variantAvail(h.v); return '<button class="li" data-a="' + act + '" data-pid="' + esc(h.p.id) + '" data-vid="' + esc(h.v.id) + '"><span class="tx"><b>' + esc(h.p.name + ' · ' + variantLabel(h.v)) + '</b><small class="mono">' + esc(h.v.sku) + '</small></span><span class="pill">' + esc(loc ? t('n_at', '{n} at {l}', { n: have, l: locName(loc) }) : t('n_avail', '{n} available', { n: have })) + '</span></button>'; }).join('') : '<div class="li"><span class="small muted">' + esc(t('no_match', 'No match for “{q}”', { q: q })) + '</span></div>') + '</div>' : '');
}
function subTform() {
  var f = S.f.tr; if (!f) return ph(t('new_transfer', 'New transfer'), '', '', 'back');
  var ls = locs().map(function (l) { return [l.id, l.name]; });
  var units = sum(f.lines, function (l) { return l.qty; });
  var body = '<div class="stack lg" style="max-width:760px"><section class="card pad stack"><div class="g2">' + selF(t('from', 'From'), 'f.tr.from', ls) + selF(t('to', 'To'), 'f.tr.to', ls) + '</div>' + (f.from === f.to ? '<span class="small bad-t">' + esc(t('err_same_loc', 'Pick two different locations')) + '</span>' : '') + '</section>' +
    '<section class="card pad stack"><b>' + esc(t('items_n_units', 'Items · {n} units', { n: units })) + '</b>' + lineSearch('f.tr.q', 'trAdd', f.from) +
    (f.lines.length ? '<div class="list">' + f.lines.map(function (l, i) { var p = D.products[l.pid], v = p && p.variants.find(function (x) { return x.id === l.vid; }), have = v ? (+((v.stock || {})[f.from]) || 0) : 0; return '<div class="li"><span class="tx"><b>' + esc(l.name + ' · ' + l.label) + '</b><small class="' + (l.qty > have ? 'bad-t' : '') + '">' + esc(t('n_at', '{n} at {l}', { n: have, l: locName(f.from) })) + '</small></span>' + stepper('data-a="trQty" data-i="' + i + '" data-d="-1"', 'data-a="trQty" data-i="' + i + '" data-d="1"', l.qty) + '</div>'; }).join('') + '</div>' : '') + '</section>' +
    txtF(t('note_receiver', 'Note for receiver'), 'f.tr.note', 'placeholder="' + esc(t('note_ph', 'Optional')) + '"') + '</div>';
  return ph(t('new_transfer', 'New transfer'), '', '', 'back', true) + body + '<div class="rowx" style="justify-content:flex-end;margin-top:16px;max-width:760px">' + busyBtn(t('send_n_units', 'Send {n} units', { n: units }), 'sendTransfer', 'primary lg', units && f.from !== f.to ? '' : 'disabled', 'tr') + '</div>';
}
A.trAdd = function (d) { var f = S.f.tr, p = D.products[d.pid], v = p && p.variants.find(function (x) { return x.id === d.vid; }); if (!v) return; var ex = f.lines.find(function (l) { return l.vid === v.id; }); if (ex) ex.qty++; else f.lines.push({ pid: p.id, vid: v.id, name: p.name, label: variantLabel(v), qty: 1 }); f.q = ''; schedule(); };
A.trAddScan = function () { var h = findByCode(S.f.tr.q); if (h) A.trAdd({ pid: h.p.id, vid: h.v.id }); };
A.trQty = function (d) { var l = S.f.tr.lines[+d.i]; l.qty += +d.d; if (l.qty <= 0) S.f.tr.lines.splice(+d.i, 1); schedule(); };
A.sendTransfer = async function () {
  var f = S.f.tr;
  var ok = await tx('tr', async function () {
    var now = Date.now(), byP = {};
    f.lines.forEach(function (l) { (byP[l.pid] = byP[l.pid] || []).push(l); });
    var prods = {};
    for (var pid in byP) { var p = await fresh('products/' + pid); byP[pid].forEach(function (l) { var v = p.variants.find(function (x) { return x.id === l.vid; }); var have = +((v.stock || {})[f.from]) || 0; if (l.qty > have) throw fail(t('err_tr_stock', 'Only {n} of {x} at {l}', { n: have, x: l.name + ' ' + l.label, l: locName(f.from) })); v.stock[f.from] = have - l.qty; v.transit = (+v.transit || 0) + l.qty; }); p.updatedAt = now; prods[pid] = p; }
    var no = 'TR-' + VXC.pad(await nextNo('tr'), 4);
    for (var k in prods) await put('products/' + k, prods[k]);
    await put('transfers/' + uid('t'), { no: no, from: f.from, to: f.to, lines: f.lines, note: f.note || '', status: 'transit', at: now, by: ME.id || '' });
    return no;
  });
  if (ok) { S.f.tr = null; toast(t('tr_sent', '{no} sent. It shows in transit until received.', { no: ok })); go('transfers'); }
};
A.recvTransfer = async function (d) {
  var ok = await tx('tr', async function () {
    var tr = await fresh('transfers/' + d.id); if (!tr || tr.status !== 'transit') return 1;
    var now = Date.now(), byP = {};
    tr.lines.forEach(function (l) { (byP[l.pid] = byP[l.pid] || []).push(l); });
    for (var pid in byP) { var p = await fresh('products/' + pid); if (!p) continue; byP[pid].forEach(function (l) { var v = p.variants.find(function (x) { return x.id === l.vid; }); if (!v) return; v.stock = v.stock || {}; v.transit = Math.max(0, (+v.transit || 0) - l.qty); v.stock[tr.to] = (+v.stock[tr.to] || 0) + l.qty; }); p.updatedAt = now; await put('products/' + pid, p); }
    tr.status = 'received'; tr.recvAt = now; tr.recvBy = ME.id || ''; await put('transfers/' + d.id, tr);
    return 1;
  });
  if (ok) toast(t('tr_recv', 'Transfer received. Stock added.'));
};

/* ===================== PURCHASES & SUPPLIERS ===================== */
function poLine(p, v, qty) { return { pid: p.id, vid: v.id, name: p.name, label: variantLabel(v), sku: v.sku, qty: qty, cost: +p.cost || 0, recd: 0, dmg: 0 }; }
async function createPO(sid, lines, note) {
  var no = 'PO-' + VXC.pad(await nextNo('po'), 4), now = Date.now();
  var id = uid('po');
  await put('pos/' + id, { no: no, supplierId: sid || '', lines: lines, status: 'open', note: note || '', createdAt: now, by: ME.id || '', receipts: [], value: r2(sum(lines, function (l) { return l.qty * l.cost; })) });
  return id;
}
function poStatus(po) { return { open: [t('st_open', 'Open'), 'acc'], partial: [t('st_partial', 'Partly received'), 'warn'], received: [t('st_received', 'Received'), 'ok'], closed: [t('st_closed', 'Closed'), ''] }[po.status] || [po.status, '']; }
function vPurchases() {
  var tab = S.q.pTab || 'orders';
  var acts = can('purchase') || can('stock') ? (tab === 'orders' ? '<button class="btn primary sm" data-a="newPO">' + icon('plus', 16, 2.2) + esc(t('new_po', 'New PO')) + '</button>' : '<button class="btn primary sm" data-a="sheet" data-k="supplier">' + icon('plus', 16, 2.2) + esc(t('add_supplier', 'Add supplier')) + '</button>') : '';
  var body;
  if (tab === 'orders') {
    var f = S.q.poF || 'active', list = vals(D.pos).sort(by(function (p) { return p.createdAt; }, true)).filter(function (p) { return f === 'all' || (f === 'active' ? (p.status === 'open' || p.status === 'partial') : p.status === f); });
    body = chips('q.poF', [['active', t('active', 'Active')], ['received', t('st_received', 'Received')], ['closed', t('st_closed', 'Closed')], ['all', t('all', 'All')]]) + (!D.loaded.pos ? skelRows(4) : !list.length ? '<div class="card">' + empty('file', t('no_po', 'No purchase orders here'), t('no_po_b', 'Create a restock order. Stock goes up only when you receive it.')) + '</div>' :
      '<div class="list">' + list.map(function (po) { var s = D.suppliers[po.supplierId], o = sum(po.lines, function (l) { return l.qty; }), r = sum(po.lines, function (l) { return (+l.recd || 0) + (+l.dmg || 0); }), stt = poStatus(po); return '<button class="li" data-a="openPO" data-id="' + esc(po.id) + '"><span class="ic">' + icon('file', 18) + '</span><span class="tx"><b>' + esc((s ? s.name : t('no_supplier', 'No supplier set')) + ' · ' + po.no) + '</b><small>' + esc(t('po_prog', '{r} of {o} units received', { r: r, o: o }) + ' · ' + fmtD(po.createdAt)) + '</small></span><span class="end"><b>' + inr(po.value) + '</b>' + pill(stt[0], stt[1]) + '</span></button>'; }).join('') + '</div>');
  } else {
    var sl = vals(D.suppliers).sort(by(function (s) { return -(+s.payable || 0); }));
    var owe = sum(sl, function (s) { return s.payable; });
    body = '<div class="kpi"><small>' + esc(t('you_owe', 'You owe suppliers')) + '</small><b style="font-size:26px">' + inr(owe) + '</b></div>' + (!D.loaded.suppliers ? skelRows(3) : !sl.length ? '<div class="card">' + empty('building', t('no_sup', 'No suppliers yet'), t('no_sup_b', 'Add the mills and wholesalers you buy from.')) + '</div>' :
      '<div class="list">' + sl.map(function (s) { var open = vals(D.pos).filter(function (p) { return p.supplierId === s.id && (p.status === 'open' || p.status === 'partial'); }).length; return '<button class="li" data-a="openSupplier" data-id="' + esc(s.id) + '">' + avatarHtml(s.name, '') + '<span class="tx"><b>' + esc(s.name) + '</b><small>' + esc([s.city, open ? t('n_open_po', '{n} open POs', { n: open }) : ''].filter(Boolean).join(' · ')) + '</small></span><span class="end"><b>' + inr(s.payable || 0) + '</b>' + ((+s.payable || 0) > 0 ? pill(t('payable', 'Payable'), 'warn') : pill(t('settled', 'Settled'), 'ok')) + '</span></button>'; }).join('') + '</div>');
  }
  return ph(t('nav_purchases', 'Purchases'), '', acts) + '<div class="stack" style="max-width:900px">' + seg('q.pTab', [['orders', t('purchase_orders', 'Purchase orders')], ['suppliers', t('suppliers', 'Suppliers')]]) + body + '</div>';
}
A.openPO = function (d) { openSub('po', { id: d.id }); };
A.openSupplier = function (d) { openSub('supplier', { id: d.id }); };
A.newPO = function () { S.f.po = { supplierId: '', note: '', lines: [], q: '' }; openSub('poform', {}); };
function subPOform() {
  var f = S.f.po; if (!f) return ph(t('new_po', 'New PO'), '', '', 'back');
  f.q = f.q || '';
  var sups = [['', t('choose_sup', 'Choose supplier')]].concat(vals(D.suppliers).sort(by(function (s) { return s.name; })).map(function (s) { return [s.id, s.name]; }));
  var val = sum(f.lines, function (l) { return l.qty * l.cost; });
  return ph(t('new_po', 'New purchase order'), '', '', 'back', true) + '<div class="stack lg" style="max-width:820px"><section class="card pad stack"><div class="rowx" style="align-items:flex-end"><div class="grow">' + selF(t('supplier', 'Supplier'), 'f.po.supplierId', sups) + '</div><button class="btn line" data-a="sheet" data-k="supplier">' + icon('plus', 16) + esc(t('new', 'New')) + '</button></div></section>' +
    '<section class="card pad stack"><b>' + esc(t('items', 'Items')) + '</b>' + lineSearch('f.po.q', 'poAdd') +
    (f.lines.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('item', 'Item')) + '</th><th class="r">' + esc(t('qty', 'Qty')) + '</th><th class="r">' + esc(t('cost_each', 'Cost each')) + '</th><th class="r">' + esc(t('amount', 'Amount')) + '</th><th></th></tr></thead><tbody>' + f.lines.map(function (l, i) { return '<tr><td><b>' + esc(l.name) + '</b><div class="xsmall muted">' + esc(l.label) + '</div></td><td class="r"><input class="in" id="f-pol-q-' + i + '" data-m="f.po.lines.' + i + '.qty" data-num data-r inputmode="numeric" value="' + esc(l.qty) + '" aria-label="' + esc(t('qty', 'Qty')) + '"></td><td class="r"><input class="in" id="f-pol-c-' + i + '" data-m="f.po.lines.' + i + '.cost" data-num data-r inputmode="decimal" value="' + esc(l.cost) + '" aria-label="' + esc(t('cost_each', 'Cost each')) + '"></td><td class="r b">' + inr(l.qty * l.cost) + '</td><td><button class="ib plain" data-a="poRm" data-i="' + i + '" aria-label="' + esc(t('remove', 'Remove')) + '">' + icon('trash', 16) + '</button></td></tr>'; }).join('') + '</tbody></table></div>' : '') +
    '<div class="sumrow tot"><span>' + esc(t('po_value', 'Order value at cost')) + '</span><span>' + inr(val) + '</span></div></section>' + txtF(t('note', 'Note'), 'f.po.note', 'placeholder="' + esc(t('note_ph', 'Optional')) + '"') +
    '<div class="rowx" style="justify-content:flex-end">' + busyBtn(t('create_po', 'Create purchase order'), 'savePO', 'primary lg', f.lines.length && f.supplierId ? '' : 'disabled', 'po') + '</div></div>';
}
A.poAdd = function (d) { var f = S.f.po, p = D.products[d.pid], v = p && p.variants.find(function (x) { return x.id === d.vid; }); if (!v) return; var ex = f.lines.find(function (l) { return l.vid === v.id; }); if (ex) ex.qty++; else f.lines.push(poLine(p, v, 10)); if (!f.supplierId && p.supplierId) f.supplierId = p.supplierId; f.q = ''; schedule(); };
A.poAddScan = function () { var h = findByCode(S.f.po.q); if (h) A.poAdd({ pid: h.p.id, vid: h.v.id }); };
A.poRm = function (d) { S.f.po.lines.splice(+d.i, 1); schedule(); };
A.savePO = async function () {
  var f = S.f.po; f.lines = f.lines.filter(function (l) { return +l.qty > 0; }).map(function (l) { l.qty = Math.round(+l.qty); l.cost = +l.cost || 0; return l; });
  var id = await tx('po', function () { return createPO(f.supplierId, f.lines, f.note); });
  if (id) { S.f.po = null; toast(t('po_created', 'Purchase order created')); S.sub = { k: 'po', id: id, prev: null }; schedule(); }
};
function subPO(sub) {
  var po = D.pos[sub.id]; if (!po) return ph(t('not_found', 'Not found'), '', '', 'back') + skelRows(3);
  var s = D.suppliers[po.supplierId], stt = poStatus(po);
  var o = sum(po.lines, function (l) { return l.qty; }), r = sum(po.lines, function (l) { return (+l.recd || 0) + (+l.dmg || 0); }), dmg = sum(po.lines, function (l) { return (+l.dmg || 0) - (+l.ret || 0); });
  var active = po.status === 'open' || po.status === 'partial';
  var steps = [[t('created', 'Created'), fmtD(po.createdAt), 'done'], [t('receiving', 'Receiving'), r + ' / ' + o, po.status === 'open' ? 'now' : 'done'], [t('st_received', 'Received'), po.status === 'received' || po.status === 'closed' ? fmtD((po.receipts || []).slice(-1)[0] ? po.receipts.slice(-1)[0].at : po.createdAt) : '', po.status === 'partial' ? 'now' : po.status === 'open' ? 'next' : 'done'], [t('st_closed', 'Closed'), po.closedAt ? fmtD(po.closedAt) : '', po.status === 'closed' ? 'done' : 'next']];
  return ph(po.no, pill(stt[0], stt[1]), '', 'back') + '<div class="cols"><div class="stack lg">' +
    '<section class="card pad rowx">' + avatarHtml(s ? s.name : '?', '') + '<span class="grow"><b>' + esc(s ? s.name : t('no_supplier', 'No supplier set')) + '</b><br><span class="small muted">' + esc([s && s.gstin ? 'GSTIN ' + s.gstin : '', s && s.city].filter(Boolean).join(' · ')) + '</span></span>' + (s && s.phone ? '<span class="small mono">' + esc(fmtPhone(s.phone)) + '</span>' : '') + '</section>' +
    '<section class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('item', 'Item')) + '</th><th class="r">' + esc(t('ordered', 'Ordered')) + '</th><th class="r">' + esc(t('received', 'Received')) + '</th><th class="r">' + esc(t('damaged', 'Damaged')) + '</th><th class="r">' + esc(t('open', 'Open')) + '</th></tr></thead><tbody>' + po.lines.map(function (l) { var op = Math.max(0, l.qty - (+l.recd || 0) - (+l.dmg || 0)); return '<tr><td><b>' + esc(l.name) + '</b><div class="xsmall muted">' + esc(l.label + ' · ' + inr(l.cost)) + '</div></td><td class="r">' + (+l.qty || 0) + '</td><td class="r">' + (+l.recd || 0) + '</td><td class="r ' + ((+l.dmg || 0) ? 'bad-t' : '') + '">' + (+l.dmg || 0) + ((+l.ret || 0) ? ' <span class="xsmall muted">(' + esc(t('ret_n', '{n} returned', { n: l.ret })) + ')</span>' : '') + '</td><td class="r ' + (op && active ? 'warn-t b' : 'muted') + '">' + op + '</td></tr>'; }).join('') + '</tbody></table></section>' +
    '<section class="card pad stack sm"><div class="sumrow"><span>' + esc(t('po_value', 'Order value at cost')) + '</span><span>' + inr(po.value) + '</span></div><div class="sumrow"><span>' + esc(t('recd_value', 'Received value (added to payable)')) + '</span><span>' + inr(sum(po.lines, function (l) { return ((+l.recd || 0) + (+l.dmg || 0) - (+l.ret || 0)) * l.cost; })) + '</span></div>' + (po.note ? '<p class="small muted">' + esc(po.note) + '</p>' : '') + '</section></div>' +
    '<div class="stack lg"><section class="card pad timeline">' + steps.map(function (x, i) { return '<div class="tl ' + x[2] + '"><div class="rail"><span class="nd">' + (x[2] === 'done' ? icon('check', 12, 2.8) : '') + '</span>' + (i < steps.length - 1 ? '<span class="ln"></span>' : '') + '</div><div class="tc"><b>' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></div></div>'; }).join('') + '</section>' +
    ((po.receipts || []).length ? '<section class="stack sm"><div class="sect"><h3>' + esc(t('receipts', 'Goods receipts')) + '</h3></div><div class="list">' + po.receipts.map(function (rc) { return '<div class="li"><span class="ic ok">' + icon('package', 17) + '</span><span class="tx"><b>' + esc(t('n_units', '{n} units', { n: rc.units }) + (rc.dmg ? ' · ' + t('n_damaged', '{n} damaged', { n: rc.dmg }) : '')) + '</b><small>' + esc(fmtDY(rc.at) + ' · ' + locName(rc.loc) + (rc.inv ? ' · ' + rc.inv : '') + ' · ' + who(rc.by)) + '</small></span></div>'; }).join('') + '</div></section>' : '') +
    (can('purchase') || can('stock') ? '<div class="stack sm">' + (active ? '<button class="btn primary lg" data-a="openReceive" data-id="' + esc(po.id) + '">' + icon('package', 18) + esc(t('receive_goods', 'Receive goods')) + '</button>' : '') + (dmg > 0 ? busyBtn(t('return_dmg', 'Return {n} damaged to supplier', { n: dmg }), 'returnDmg', 'line', 'data-id="' + esc(po.id) + '"', 'po') : '') + (po.status === 'partial' ? '<button class="btn line" data-a="closePO" data-id="' + esc(po.id) + '">' + esc(t('close_po', 'Close PO, cancel the rest')) + '</button>' : '') + '</div>' : '') + '</div></div>';
}
A.openReceive = function (d) { var po = D.pos[d.id]; S.f.rc = { id: d.id, loc: (locs().find(function (l) { return l.type === 'godown'; }) || locs()[0]).id, inv: '', lines: po.lines.map(function (l) { return { recd: Math.max(0, l.qty - (+l.recd || 0) - (+l.dmg || 0)), dmg: 0 }; }) }; openSub('receive', { id: d.id }); };
function subReceive(sub) {
  var po = D.pos[sub.id], f = S.f.rc; if (!po || !f) return ph(t('receive_goods', 'Receive goods'), '', '', 'back');
  var units = sum(f.lines, function (l) { return +l.recd || 0; }), dm = sum(f.lines, function (l) { return +l.dmg || 0; }), all = sum(po.lines, function (l) { return Math.max(0, l.qty - (+l.recd || 0) - (+l.dmg || 0)); });
  var s = D.suppliers[po.supplierId];
  return ph(t('receive_goods', 'Receive goods'), esc(t('against', 'Against {no} · {s}', { no: po.no, s: s ? s.name : '' })), '', 'back', true) + '<div class="stack lg" style="max-width:820px">' +
    '<section class="card pad stack"><div class="between"><b>' + esc(t('arrived', '{a} of {b} open units arriving', { a: units + dm, b: all })) + '</b>' + ((units + dm) < all ? pill(t('partial_receipt', 'Partial receipt'), 'warn') : pill(t('complete', 'Complete'), 'ok')) + '</div><div class="g2">' + txtF(t('sup_invoice', 'Supplier invoice no.'), 'f.rc.inv') + selF(t('put_away', 'Put away at'), 'f.rc.loc', locs().map(function (l) { return [l.id, l.name]; })) + '</div></section>' +
    '<section class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('item', 'Item')) + '</th><th class="r">' + esc(t('open', 'Open')) + '</th><th class="r">' + esc(t('good', 'Good')) + '</th><th class="r">' + esc(t('damaged', 'Damaged')) + '</th></tr></thead><tbody>' + po.lines.map(function (l, i) { var op = Math.max(0, l.qty - (+l.recd || 0) - (+l.dmg || 0)); return '<tr><td><b>' + esc(l.name) + '</b><div class="xsmall muted">' + esc(l.label) + '</div></td><td class="r">' + op + '</td><td class="r"><input class="in" id="f-rc-r-' + i + '" data-m="f.rc.lines.' + i + '.recd" data-num data-r inputmode="numeric" value="' + esc(f.lines[i].recd) + '" aria-label="' + esc(t('good', 'Good')) + '"' + (op ? '' : ' disabled') + '></td><td class="r"><input class="in" id="f-rc-d-' + i + '" data-m="f.rc.lines.' + i + '.dmg" data-num data-r inputmode="numeric" value="' + esc(f.lines[i].dmg) + '" aria-label="' + esc(t('damaged', 'Damaged')) + '"' + (op ? '' : ' disabled') + '></td></tr>'; }).join('') + '</tbody></table></section>' +
    '<div class="note">' + icon('info', 17) + '<span>' + esc(t('rc_note', 'Good units are added to {l}. Damaged units are tracked separately and can be returned to the supplier. Open units stay on the PO.', { l: locName(f.loc) })) + '</span></div>' +
    '<div class="rowx" style="justify-content:flex-end"><span class="small muted grow">' + esc(t('adds_stock', 'Adds {a} available · {d} damaged', { a: units, d: dm })) + '</span>' + busyBtn(t('post_receipt', 'Post goods receipt'), 'postReceipt', 'primary lg', units + dm ? '' : 'disabled', 'rc') + '</div></div>';
}
A.postReceipt = async function () {
  var f = S.f.rc;
  var ok = await tx('rc', async function () {
    var po = await fresh('pos/' + f.id), now = Date.now(); if (!po) throw fail(t('err_gone_po', 'This purchase order no longer exists.'));
    var byP = {}, units = 0, dmg = 0, value = 0;
    po.lines.forEach(function (l, i) {
      var op = Math.max(0, l.qty - (+l.recd || 0) - (+l.dmg || 0));
      var rcv = Math.min(op, Math.max(0, Math.round(+f.lines[i].recd || 0))), dm = Math.min(op - rcv, Math.max(0, Math.round(+f.lines[i].dmg || 0)));
      if (!rcv && !dm) return;
      l.recd = (+l.recd || 0) + rcv; l.dmg = (+l.dmg || 0) + dm; units += rcv; dmg += dm; value += (rcv + dm) * l.cost;
      (byP[l.pid] = byP[l.pid] || []).push({ vid: l.vid, rcv: rcv, dm: dm });
    });
    if (!units && !dmg) throw fail(t('err_nothing', 'Enter at least one received unit.'));
    for (var pid in byP) { var p = await fresh('products/' + pid); if (!p) continue; byP[pid].forEach(function (x) { var v = p.variants.find(function (y) { return y.id === x.vid; }); if (!v) return; v.stock = v.stock || {}; v.stock[f.loc] = (+v.stock[f.loc] || 0) + x.rcv; v.damaged = (+v.damaged || 0) + x.dm; }); p.updatedAt = now; await put('products/' + pid, p); }
    var left = sum(po.lines, function (l) { return Math.max(0, l.qty - (+l.recd || 0) - (+l.dmg || 0)); });
    po.status = left ? 'partial' : 'received';
    po.receipts = (po.receipts || []).concat([{ at: now, by: ME.id || '', units: units, dmg: dmg, loc: f.loc, inv: f.inv || '', value: r2(value) }]);
    await put('pos/' + f.id, po);
    if (po.supplierId) { var s = await fresh('suppliers/' + po.supplierId); if (s) { s.payable = r2((+s.payable || 0) + value); s.txns = (s.txns || []).concat([{ t: 'bill', amt: r2(value), at: now, ref: po.no + (f.inv ? ' / ' + f.inv : '') }]).slice(-80); await put('suppliers/' + po.supplierId, s); } }
    return { units: units, left: left };
  });
  if (ok) { S.f.rc = null; toast(ok.left ? t('rc_partial', '{n} units added. {l} still open on the PO.', { n: ok.units, l: ok.left }) : t('rc_done', '{n} units added to stock', { n: ok.units })); backSub(); }
};
A.returnDmg = async function (d) {
  var ok = await tx('po', async function () {
    var po = await fresh('pos/' + d.id), now = Date.now(), value = 0, n = 0;
    for (var i = 0; i < po.lines.length; i++) {
      var l = po.lines[i], r = (+l.dmg || 0) - (+l.ret || 0); if (r <= 0) continue;
      var p = await fresh('products/' + l.pid); if (p) { var v = p.variants.find(function (x) { return x.id === l.vid; }); if (v) { v.damaged = Math.max(0, (+v.damaged || 0) - r); p.updatedAt = now; await put('products/' + l.pid, p); } }
      l.ret = (+l.ret || 0) + r; value += r * l.cost; n += r;
    }
    await put('pos/' + d.id, po);
    if (po.supplierId && value) { var s = await fresh('suppliers/' + po.supplierId); if (s) { s.payable = r2((+s.payable || 0) - value); s.txns = (s.txns || []).concat([{ t: 'return', amt: r2(value), at: now, ref: po.no }]).slice(-80); await put('suppliers/' + po.supplierId, s); } }
    return n;
  });
  if (ok) toast(t('dmg_returned', '{n} damaged units returned. Payable reduced.', { n: ok }));
};
A.closePO = function (d) { openSheet('confirm', { title: t('close_po_t', 'Close purchase order'), msg: t('close_po_q', 'Units not yet received will be cancelled. Received stock is not affected.'), yes: t('close_po_y', 'Close PO'), act: 'doClosePO', arg: d.id }); };
A.doClosePO = async function () { var id = S.sheet.arg; closeSheet(); var ok = await tx('po', async function () { var po = await fresh('pos/' + id); po.status = 'closed'; po.closedAt = Date.now(); await put('pos/' + id, po); return 1; }); if (ok) toast(t('po_closed', 'Purchase order closed')); };
function subSupplier(sub) {
  var s = D.suppliers[sub.id]; if (!s) return ph(t('not_found', 'Not found'), '', '', 'back');
  var ps = vals(D.pos).filter(function (p) { return p.supplierId === s.id; }).sort(by(function (p) { return p.createdAt; }, true));
  return ph(s.name, esc([s.city, s.gstin ? 'GSTIN ' + s.gstin : ''].filter(Boolean).join(' · ')), can('purchase') || can('money') ? '<button class="ib" data-a="sheet" data-k="supplier" data-id="' + esc(s.id) + '" aria-label="' + esc(t('edit', 'Edit')) + '">' + icon('edit', 18) + '</button>' : '', 'back') +
    '<div class="cols"><div class="stack lg"><section class="hero"><span class="lab">' + esc(t('you_owe_s', 'You owe {s}', { s: s.name })) + '</span><span class="big">' + inr(s.payable || 0) + '</span>' + (can('money') || can('purchase') ? '<button class="btn" style="background:#fff;color:#0E0E12;align-self:flex-start" data-a="sheet" data-k="supPay" data-id="' + esc(s.id) + '">' + icon('send', 16) + esc(t('record_payment', 'Record payment')) + '</button>' : '') + '</section>' +
    '<section class="stack sm"><div class="sect"><h3>' + esc(t('purchase_orders', 'Purchase orders')) + '</h3></div>' + (ps.length ? '<div class="list">' + ps.slice(0, 20).map(function (po) { var stt = poStatus(po); return '<button class="li" data-a="openPO" data-id="' + esc(po.id) + '"><span class="tx"><b>' + esc(po.no) + '</b><small>' + esc(fmtDY(po.createdAt)) + '</small></span><span class="end"><b>' + inr(po.value) + '</b>' + pill(stt[0], stt[1]) + '</span></button>'; }).join('') + '</div>' : '<div class="card pad small muted">' + esc(t('no_po', 'No purchase orders here')) + '</div>') + '</section></div>' +
    '<div class="stack lg"><section class="stack sm"><div class="sect"><h3>' + esc(t('ledger', 'Ledger')) + '</h3></div>' + ((s.txns || []).length ? '<div class="list">' + (s.txns || []).slice().reverse().slice(0, 30).map(function (x) { var neg = x.t !== 'bill'; return '<div class="li"><span class="ic ' + (neg ? 'ok' : '') + '">' + icon(x.t === 'pay' ? 'send' : x.t === 'return' ? 'undo' : 'package', 17) + '</span><span class="tx"><b>' + esc(x.t === 'pay' ? t('payment_made', 'Payment made') + (x.mode ? ' · ' + payName(x.mode) : '') : x.t === 'return' ? t('goods_returned', 'Goods returned') : t('goods_recd', 'Goods received')) + '</b><small>' + esc(fmtDY(x.at) + (x.ref ? ' · ' + x.ref : '')) + '</small></span><b class="num ' + (neg ? 'ok-t' : '') + '">' + (neg ? '−' : '+') + inr(x.amt) + '</b></div>'; }).join('') + '</div>' : '<div class="card pad small muted">' + esc(t('no_txn', 'No entries yet')) + '</div>') + '</section>' +
    (s.phone ? '<div class="card pad between"><span class="small muted">' + esc(t('phone', 'Phone')) + '</span><span class="mono b" style="user-select:all">' + esc(fmtPhone(s.phone)) + '</span></div>' : '') + '</div></div>';
}
function supplierSheet(sh) {
  if (!S.f.sup || S.f.sup.id !== (sh.id || null)) { var s = sh.id ? D.suppliers[sh.id] : null; S.f.sup = { id: sh.id || null, name: s ? s.name : '', city: s ? s.city || '' : '', phone: s ? s.phone || '' : '', gstin: s ? s.gstin || '' : '', err: {} }; }
  var f = S.f.sup;
  return sheetWrap(f.id ? t('edit_supplier', 'Edit supplier') : t('add_supplier', 'Add supplier'), txtF(t('name', 'Name'), 'f.sup.name', '', null, f.err.name) + '<div class="g2">' + txtF(t('city', 'City'), 'f.sup.city') + txtF(t('phone', 'Phone'), 'f.sup.phone', 'inputmode="tel"') + '</div>' + txtF(t('gstin', 'GSTIN'), 'f.sup.gstin', 'autocapitalize="characters" maxlength="15"', t('optional', 'Optional'), f.err.gstin), busyBtn(t('save', 'Save'), 'saveSupplier', 'primary lg', '', 'sup'));
}
A.saveSupplier = async function () {
  var f = S.f.sup; f.err = {};
  if (!String(f.name).trim()) f.err.name = t('err_name', 'Enter a name');
  if (f.gstin && !gstValid(f.gstin)) f.err.gstin = t('err_gstin', 'GSTIN should be 15 characters, like 24AAPCO4821K1Z6');
  if (Object.keys(f.err).length) { schedule(); return; }
  var id = await tx('sup', async function () { var id = f.id || uid('s'); var s = (f.id && await fresh('suppliers/' + f.id)) || { payable: 0, txns: [], createdAt: Date.now() }; Object.assign(s, { name: f.name.trim(), city: String(f.city || '').trim(), phone: phoneDigits(f.phone), gstin: String(f.gstin || '').toUpperCase().trim() }); await put('suppliers/' + id, s); return id; });
  if (id) { if (S.f.po && !S.f.po.supplierId) S.f.po.supplierId = id; S.f.sup = null; closeSheet(); toast(t('saved', 'Saved')); }
};
function supPaySheet(sh) {
  var s = D.suppliers[sh.id]; if (!s) return '';
  if (!S.f.sp || S.f.sp.id !== s.id) S.f.sp = { id: s.id, amt: +s.payable > 0 ? s.payable : '', mode: 'bank', ref: '' };
  return sheetWrap(t('pay_sup', 'Pay {s}', { s: s.name }), '<div class="small muted">' + esc(t('outstanding', 'Outstanding')) + ': <b>' + inr(s.payable || 0) + '</b></div>' + moneyF(t('amount', 'Amount'), 'f.sp.amt', 'class="in big"') + fld(t('paid_via', 'Paid via'), seg('f.sp.mode', [['bank', t('pay_bank', 'Bank / NEFT')], ['upi', payName('upi')], ['cash', payName('cash')]])) + (S.f.sp.mode === 'cash' ? '<div class="note">' + icon('banknote', 17) + '<span>' + esc(t('cash_from_drawer', 'Cash payments are taken out of the cash drawer.')) + '</span></div>' : '') + txtF(t('reference', 'Reference'), 'f.sp.ref', 'placeholder="' + esc(t('ref_ph', 'UTR, cheque no.')) + '"'), busyBtn(t('record_payment', 'Record payment'), 'saveSupPay', 'primary lg', '', 'sp'));
}
A.saveSupPay = async function () {
  var f = S.f.sp, amt = +f.amt || 0; if (amt <= 0) { toast(t('err_amt', 'Enter an amount'), 'bad'); return; }
  var ok = await tx('sp', async function () {
    var s = await fresh('suppliers/' + f.id), now = Date.now();
    s.payable = r2((+s.payable || 0) - amt); s.txns = (s.txns || []).concat([{ t: 'pay', amt: amt, at: now, mode: f.mode, ref: f.ref || '' }]).slice(-80); await put('suppliers/' + f.id, s);
    if (f.mode === 'cash') { var day = dayKey(now); await ensureDay(day); var c = {}; c[uid('x')] = { at: now, dir: 'out', amt: amt, note: t('paid_to', 'Paid to {s}', { s: s.name }), kind: 'supplier', loc: curLoc(), by: ME.id || '' }; await patch('ledger/' + day, { cash: c }); }
    return 1;
  });
  if (ok) { S.f.sp = null; closeSheet(); toast(t('pay_recorded', 'Payment recorded')); }
};

/* ===================== FABRIC PREVIEW DRAPE ACTIONS & SHEET ===================== */
A.openFabricDrape = function (d) {
  var p = D.products[d.pid];
  if (!p) return;
  S.f.drape = {
    productId: p.id,
    template: p.fabricTemplateId || 'kurta',
    sourceType: (p.img ? 'product' : 'custom'),
    customImg: ''
  };
  openSheet('fabricDrape', { productId: p.id });
};

A.removeFabricPreview = async function (d) {
  var id = d.pid;
  await tx('pdel', async function () {
    var p = await fresh('products/' + id);
    if (!p) return 1;
    delete p.fabricPreviewImage;
    delete p.fabricThumbnailImage;
    delete p.fabricTemplateId;
    p.updatedAt = Date.now();
    await put('products/' + id, p);
    return 1;
  });
  toast(t('preview_removed', 'Fabric preview removed'));
  schedule();
};

function fabricDrapeSheet(sh) {
  var p = D.products[sh.productId];
  if (!p) return '';
  if (!S.f.drape || S.f.drape.productId !== p.id) {
    S.f.drape = { productId: p.id, template: p.fabricTemplateId || 'kurta', sourceType: (p.img ? 'product' : 'custom'), customImg: '' };
  }
  var f = S.f.drape;
  var sub = subState();
  var templates = [
    { id: 'kurta', name: t('template_kurta', 'Kurta & Kurti'), icon: 'shirt', desc: t('template_kurta_s', 'A-line & Straight') },
    { id: 'saree', name: t('template_saree', 'Saree & Pallu'), icon: 'layers', desc: t('template_saree_s', 'Pleats & Draped pallu') },
    { id: 'shirt', name: t('template_shirt', 'Menswear Shirt'), icon: 'box', desc: t('template_shirt_s', 'Collar & Sleeve drape') },
    { id: 'palazzo', name: t('template_palazzo', 'Palazzo Pants'), icon: 'layers', desc: t('template_palazzo_s', 'Wide-leg flare & flow') },
    { id: 'nehru_jacket', name: t('template_nehru_jacket', 'Nehru Jacket'), icon: 'shirt', desc: t('template_nehru_jacket_s', 'Mandarin collar vest') }
  ];

  var tplHtml = '<div class="g2" style="gap:10px">' + templates.map(function (tpl) {
    var sel = f.template === tpl.id;
    return '<button type="button" class="card pad sm stack" data-a="set" data-k="f.drape.template" data-v="' + tpl.id + '" style="cursor:pointer;text-align:left;border:2px solid ' + (sel ? 'var(--accent)' : 'var(--line)') + ';background:' + (sel ? 'var(--accent-soft)' : 'var(--surface2)') + ';border-radius:12px;transition:all .15s ease">' +
      '<div class="between"><b>' + esc(tpl.name) + '</b>' + (sel ? '<span style="color:var(--accent-text)">' + icon('check', 16, 2.5) + '</span>' : '') + '</div>' +
      '<span class="xsmall muted">' + esc(tpl.desc) + '</span>' +
    '</button>';
  }).join('') + '</div>';

  var sourceHtml = '<div class="stack sm">' +
    (p.img ? '<div class="rowx" style="gap:10px">' +
      '<button type="button" class="btn ' + (f.sourceType === 'product' ? 'primary' : 'line') + ' sm" data-a="set" data-k="f.drape.sourceType" data-v="product">' + esc(t('use_product_photo', 'Use product photo')) + '</button>' +
      '<button type="button" class="btn ' + (f.sourceType === 'custom' ? 'primary' : 'line') + ' sm" data-a="set" data-k="f.drape.sourceType" data-v="custom">' + esc(t('upload_new_swatch', 'Upload new swatch')) + '</button>' +
    '</div>' : '') +
    (f.sourceType === 'custom' || !p.img ?
      '<div class="rowx" style="margin-top:8px">' +
        '<button type="button" class="btn line" style="height:80px;width:80px;flex-direction:column;gap:4px;border-style:dashed;font-size:11px;cursor:pointer" data-a="triggerUpload" data-for="f-drape-img">' + icon('camera', 20) + esc(t('photo', 'Photo')) + '</button>' +
        '<input type="file" id="f-drape-img" accept="image/*" class="sr" data-change="pickDrapeImg">' +
        (f.customImg ? '<span class="sw" style="width:80px;height:80px;border-radius:12px;background-image:url(' + cssUrl(f.customImg) + ');background-size:cover;background-position:center"></span>' : '<span class="small muted" style="max-width:24ch">' + esc(t('photo_hint', 'Fabric roll or flat swatch photo.')) + '</span>') +
      '</div>' :
      '<div class="rowx" style="margin-top:8px">' +
        '<span class="sw" style="width:80px;height:80px;border-radius:12px;background-image:url(' + cssUrl(p.img) + ');background-size:cover;background-position:center"></span>' +
        '<span class="small muted">' + esc(t('using_item_photo', 'Using existing garment photo')) + '</span>' +
      '</div>') +
  '</div>';

  var allowanceNotice = '';
  if (sub.isTrial) {
    allowanceNotice = '<div class="note" style="border-radius:10px;padding:8px 12px">' + icon('sparkles', 16) + '<span>' + esc(t('trial_3d_allowance_note', '3 free 3D previews included ({used}/3 used)', { used: sub.trialThreeDUsed })) + '</span></div>';
  }

  return sheetWrap(t('drape_garment_btn', 'Drape Fabric Preview'),
    '<div class="stack lg">' +
      '<div class="stack sm"><label class="b small">' + esc(t('choose_template', '1. Choose garment silhouette')) + '</label>' + tplHtml + '</div>' +
      '<div class="stack sm"><label class="b small">' + esc(t('choose_fabric_source', '2. Fabric swatch photo')) + '</label>' + sourceHtml + '</div>' +
      allowanceNotice +
    '</div>',
    busyBtn(t('generate_preview_btn', 'Generate Drape Preview'), 'submitFabricDrape', 'primary lg', '', 'drape')
  );
}

A.pickDrapeImg = function (d, el) {
  if (!el) el = document.getElementById('f-drape-img');
  var file = el && el.files && el.files[0];
  if (!file) return;
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () {
      var max = 800, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      var url = cv.toDataURL('image/jpeg', 0.85);
      if (!S.f.drape) S.f.drape = {};
      S.f.drape.customImg = url;
      S.f.drape.sourceType = 'custom';
      schedule();
    };
    img.onerror = function () { toast(t('err_img', 'That file isn’t an image we can read.'), 'bad'); };
    img.src = rd.result;
  };
  rd.onerror = function () { toast(t('err_img', 'Could not read file.'), 'bad'); };
  rd.readAsDataURL(file);
  if (el) el.value = '';
};

A.submitFabricDrape = async function () {
  var f = S.f.drape;
  if (!f || !f.productId) return;
  var p = D.products[f.productId];
  if (!p) return;
  var imgUrl = (f.sourceType === 'product' && p.img) ? p.img : f.customImg;
  if (!imgUrl) {
    toast(t('err_img', 'Please upload or select a fabric photo.'), 'bad');
    return;
  }
  var bid = S.bizId || (storeV() && storeV().id) || 'default';
  var check = await checkAndConsume3DAllowance(bid, { productId: p.id, garmentTemplateId: f.template });
  if (!check.allowed) {
    closeSheet();
    openSheet('subscribe');
    toast(check.message, 'bad');
    return;
  }

  var ok = await tx('drape', async function () {
    var jobId = uid('fj');
    await DB.collection('fabricJobs').doc(jobId).set({
      businessId: bid,
      productId: p.id,
      garmentTemplateId: f.template,
      sourcePhotoUrl: imgUrl,
      status: 'queued',
      attempts: 0,
      queuedAt: Date.now()
    });
    return 1;
  });

  if (ok) {
    closeSheet();
    toast(t('preview_queued_toast', 'Fabric preview job queued! Generating drape mockup…'));
    schedule();
  }
};
