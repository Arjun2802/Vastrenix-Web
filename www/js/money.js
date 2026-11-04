/* ===================== INVOICE RENDERER (one source of truth: preview, thumbnails, PDF) ===================== */
var THEMES = [
  ['classic', 'Classic GST', 'Boxed, every tax column'], ['modern', 'Modern Minimal', 'Airy, one bold total'], ['boutique', 'Premium Boutique', 'Dark band, gold rule'],
  ['wholesale', 'Wholesale & Dealer', 'Dense, bulk quantities'], ['thermal', 'Compact Thermal', '80 mm receipt printers'], ['intl', 'International Commercial', 'Export-ready layout']
];
function themeName(id) { var x = THEMES.find(function (z) { return z[0] === id; }) || THEMES[1]; return t('th_' + x[0], x[1]); }
function paperW(theme) { return theme === 'thermal' ? 302 : 794; }
/* inv.theme comes from the database: only known theme ids may reach class names */
function safeTheme(th) { return THEMES.some(function (z) { return z[0] === th; }) ? th : 'modern'; }
var IVX_CSS = '.ivx{background:#fff;color:#16161C;font-family:Geist,"Noto Sans Devanagari","Noto Sans Gujarati",system-ui,sans-serif;font-size:12px;line-height:1.45;padding:40px 44px;box-sizing:border-box;text-align:left}' +
  '.ivx *{box-sizing:border-box}.ivx b{font-weight:700}.ivx .n{font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}' +
  '.ivx .iv-h{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.ivx .iv-brand{display:flex;gap:12px;align-items:flex-start}.ivx .iv-logo{width:44px;height:44px;border-radius:12px;background:#0E0E12;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0}.ivx img.iv-logo{background:transparent!important;object-fit:contain}' +
  '.ivx .iv-org{display:flex;flex-direction:column;gap:2px}.ivx .iv-org b{font-size:17px;letter-spacing:-.02em}.ivx .iv-org span{color:#55555F}.ivx .iv-meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px;text-align:right}.ivx .iv-kind{font-size:10px;letter-spacing:.16em;font-weight:700;color:#55555F}.ivx .iv-no{font-size:16px;font-weight:700}' +
  '.ivx .iv-p{display:flex;justify-content:space-between;gap:16px;margin:22px 0 14px;padding:12px 14px;border-radius:8px;background:#F4F4F7}.ivx .iv-p div{display:flex;flex-direction:column;gap:2px}.ivx .iv-p small{font-size:10px;letter-spacing:.1em;color:#6B6B76;font-weight:600;text-transform:uppercase}' +
  '.ivx table{width:100%;border-collapse:collapse}.ivx th{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B6B76;font-weight:600;text-align:left;padding:8px 6px;border-bottom:1px solid #DADAE2}.ivx td{padding:8px 6px;border-bottom:1px solid #EEEEF2;vertical-align:top}.ivx td small{display:block;color:#6B6B76;font-size:10.5px}' +
  '.ivx .iv-s{display:flex;justify-content:space-between;gap:24px;margin-top:16px;align-items:flex-start}.ivx .iv-l{display:flex;flex-direction:column;gap:6px;color:#3A3A44;max-width:52%}.ivx .iv-tot{min-width:250px;display:flex;flex-direction:column;gap:5px}.ivx .iv-tot div{display:flex;justify-content:space-between;gap:16px}.ivx .iv-tot .g{font-size:16px;font-weight:700;padding-top:8px;border-top:1px solid #DADAE2;margin-top:3px}' +
  '.ivx .iv-qr{display:flex;gap:10px;align-items:center;margin-top:6px}.ivx .iv-qr .qrc{width:86px;height:86px}.ivx .iv-qr .qrc img,.ivx .iv-qr .qrc canvas{width:86px!important;height:86px!important}' +
  '.ivx .iv-f{margin-top:26px;padding-top:12px;border-top:1px solid #EEEEF2;display:flex;justify-content:space-between;gap:16px;color:#6B6B76;font-size:10.5px}.ivx .iv-slab td,.ivx .iv-slab th{padding:5px 6px;font-size:10.5px}' +
  /* classic */
  '.th-classic{border:1.5px solid #16161C;padding:28px}.th-classic .iv-kind{font-size:13px;color:#16161C;letter-spacing:.2em}.th-classic .iv-p{background:none;border:1px solid #16161C;border-radius:0}.th-classic table{border:1px solid #16161C}.th-classic th,.th-classic td{border:1px solid #16161C;color:#16161C}.th-classic th{background:#F0F0F3}.th-classic .iv-tot{border:1px solid #16161C;padding:10px}.th-classic .iv-logo{border-radius:4px}' +
  /* modern */
  '.th-modern .iv-p{background:none;border-top:1px solid #16161C;border-bottom:1px solid #EEEEF2;border-radius:0;padding:12px 0}.th-modern th{border-bottom:1.5px solid #16161C;color:#16161C}.th-modern .iv-tot .g{font-size:22px;color:#5B3DF5;border-top:1.5px solid #16161C}.th-modern .iv-logo{background:#5B3DF5}' +
  /* boutique */
  '.th-boutique{padding:0}.th-boutique .iv-h{background:#17151F;color:#F4EEDF;padding:30px 44px 26px;border-bottom:3px solid #B08D2E}.th-boutique .iv-org span,.th-boutique .iv-kind{color:#CDBF9C}.th-boutique .iv-logo{background:#B08D2E;color:#17151F;border-radius:999px}.th-boutique .iv-org b{font-size:20px;letter-spacing:.06em;text-transform:uppercase}.th-boutique .iv-body{padding:8px 44px 36px}.th-boutique .iv-p{background:#FAF7EF}.th-boutique th{color:#8A6E22;border-bottom:1px solid #E6DCC0}.th-boutique .iv-tot .g{color:#8A6E22;border-top:1px solid #B08D2E;font-size:19px}' +
  /* wholesale */
  '.th-wholesale{padding:28px 30px;font-size:11px}.th-wholesale th{background:#EEEAFE;color:#2A1A8F;border-bottom:0}.th-wholesale td{padding:5px 6px}.th-wholesale .iv-p{background:#F7F5FF}.th-wholesale .iv-kind{color:#4A2FE0}' +
  /* thermal */
  '.th-thermal{width:302px;padding:16px 14px;font-family:"Geist Mono",ui-monospace,monospace;font-size:11px;text-align:center}.th-thermal .iv-h{flex-direction:column;align-items:center;gap:6px}.th-thermal .iv-brand{flex-direction:column;align-items:center;text-align:center;gap:4px}.th-thermal .iv-org{align-items:center}.th-thermal .iv-org b{font-size:14px}.th-thermal .iv-meta{align-items:center;text-align:center;border-top:1px dashed #999;border-bottom:1px dashed #999;padding:6px 0;width:100%}.th-thermal .iv-logo{display:none}.th-thermal .iv-p{flex-direction:column;background:none;padding:6px 0;margin:6px 0;border-bottom:1px dashed #999;border-radius:0;gap:2px;text-align:left}.th-thermal table{text-align:left}.th-thermal th{display:none}.th-thermal td{border-bottom:0;padding:3px 0}.th-thermal .iv-s{flex-direction:column;gap:8px;border-top:1px dashed #999;padding-top:8px}.th-thermal .iv-l{max-width:none;align-items:center;order:2;text-align:center}.th-thermal .iv-tot{min-width:0;width:100%}.th-thermal .iv-tot .g{font-size:14px;border-top:1px dashed #999}.th-thermal .iv-f{flex-direction:column;align-items:center;text-align:center;border-top:1px dashed #999}' +
  /* international */
  '.th-intl{padding:0}.th-intl .iv-h{background:#2F3A4A;color:#fff;padding:28px 44px}.th-intl .iv-org span,.th-intl .iv-kind{color:#C9D2DE}.th-intl .iv-logo{background:#fff;color:#2F3A4A}.th-intl .iv-body{padding:10px 44px 36px}.th-intl .iv-p{background:#F2F4F7}.th-intl th{color:#2F3A4A;border-bottom:1.5px solid #2F3A4A}.th-intl .iv-tot .g{color:#2F3A4A}';
function renderInvoice(inv, theme) { var keep = LANG; LANG = 'en'; try { return renderInvoiceEn(inv, theme); } finally { LANG = keep; } }
function renderInvoiceEn(inv, theme) {
  var st = storeV(), cfg = st.invoice || {}, th = safeTheme(theme || inv.theme || cfg.theme || 'modern'), cn = inv.kind === 'cn';
  var pay = inv.pay || {}, cust = inv.cust;
  var kind = cn ? t('iv_cn', 'CREDIT NOTE') : th === 'intl' ? t('iv_commercial', 'COMMERCIAL INVOICE') : t('iv_tax', 'TAX INVOICE');
  var addr = [st.address, st.city].filter(Boolean).join(', ');
  var logoEl = (cfg.showLogo !== false) ? (st.logo ? '<img class="iv-logo" src="' + esc(safeImg(st.logo)) + '" alt="' + esc(st.name || '') + '" style="width:48px;height:48px;object-fit:contain;border-radius:8px;background:transparent">' : '<div class="iv-logo">' + esc(initials(st.name)) + '</div>') : '';
  var head = '<header class="iv-h"><div class="iv-brand">' + logoEl + '<div class="iv-org"><b>' + esc(st.name || '') + '</b>' + (addr ? '<span>' + esc(addr) + '</span>' : '') + '<span>' + esc([st.gstin ? 'GSTIN ' + st.gstin : '', st.phone ? '+91 ' + fmtPhone(st.phone) : ''].filter(Boolean).join(' · ')) + '</span></div></div>' +
    '<div class="iv-meta"><span class="iv-kind">' + esc(kind) + '</span><span class="iv-no">' + esc(inv.no) + '</span><span>' + esc(fmtDY(inv.at) + ', ' + fmtT(inv.at)) + '</span>' + (cn && inv.ref ? '<span>' + esc(t('against_inv', 'Against {no}', { no: inv.ref.no })) + '</span>' : '') + '</div></header>';
  var parties = '<section class="iv-p"><div><small>' + esc(t('iv_billto', 'Bill to')) + '</small><b>' + esc((cust && cust.name) || t('walkin', 'Walk-in customer')) + '</b>' + (cust && cust.phone ? '<span>+91 ' + esc(fmtPhone(cust.phone)) + '</span>' : '') + '</div>' +
    '<div><small>' + esc(t('iv_pos', 'Place of supply')) + '</small><b>' + esc(st.state || st.city || '—') + '</b>' + (th === 'intl' ? '<span>' + esc(t('iv_origin', 'Country of origin: India · Currency: INR')) + '</span>' : '') + '</div>' +
    '<div style="text-align:right"><small>' + esc(cn ? t('iv_refund', 'Refund') : t('iv_payment', 'Payment')) + '</small><b>' + esc(cn ? payName(inv.refund || 'cash') : payName(pay.mode)) + '</b>' + (pay.utr ? '<span>UTR ' + esc(pay.utr) + '</span>' : pay.last4 ? '<span>•••• ' + esc(pay.last4) + '</span>' : '') + '</div></section>';
  /* numeric fields are coerced so a tampered ledger entry can't inject markup through qty/gst */
  var L = (Array.isArray(inv.lines) ? inv.lines : []).map(function (l) { return Object.assign({}, l, { qty: +l.qty || 0, gst: +l.gst || 0, rate: +l.rate || 0, taxable: +l.taxable || 0, tax: +l.tax || 0, total: +l.total || 0 }); }), rows;
  var hasGst = (+inv.tax > 0) || ((+inv.cgst || 0) + (+inv.sgst || 0) > 0);
  if (th === 'classic') {
    if (hasGst) {
      rows = '<table><thead><tr><th>#</th><th>' + esc(t('iv_item', 'Item')) + '</th><th>HSN</th><th class="n">' + esc(t('qty', 'Qty')) + '</th><th class="n">' + esc(t('iv_rate', 'Rate')) + '</th><th class="n">' + esc(t('iv_taxable', 'Taxable')) + '</th><th class="n">CGST</th><th class="n">SGST</th><th class="n">' + esc(t('amount', 'Amount')) + '</th></tr></thead><tbody>' + L.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(l.name) + '<small>' + esc([l.label, l.sku].filter(Boolean).join(' · ')) + '</small></td><td>' + esc(l.hsn || '') + '</td><td class="n">' + l.qty + '</td><td class="n">' + NF2.format(l.rate) + '</td><td class="n">' + NF2.format(l.taxable) + '</td><td class="n">' + NF2.format(l.tax / 2) + '<small>' + (l.gst / 2) + '%</small></td><td class="n">' + NF2.format(l.tax / 2) + '<small>' + (l.gst / 2) + '%</small></td><td class="n">' + NF2.format(l.total) + '</td></tr>'; }).join('') + '</tbody></table>';
    } else {
      rows = '<table><thead><tr><th>#</th><th>' + esc(t('iv_item', 'Item')) + '</th><th>HSN</th><th class="n">' + esc(t('qty', 'Qty')) + '</th><th class="n">' + esc(t('iv_rate', 'Rate')) + '</th><th class="n">' + esc(t('amount', 'Amount')) + '</th></tr></thead><tbody>' + L.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(l.name) + '<small>' + esc([l.label, l.sku].filter(Boolean).join(' · ')) + '</small></td><td>' + esc(l.hsn || '') + '</td><td class="n">' + l.qty + '</td><td class="n">' + NF2.format(l.rate) + '</td><td class="n">' + NF2.format(l.total) + '</td></tr>'; }).join('') + '</tbody></table>';
    }
  } else if (th === 'wholesale') {
    if (hasGst) {
      rows = '<table><thead><tr><th>#</th><th>' + esc(t('iv_item', 'Item')) + '</th><th>SKU</th><th>HSN</th><th class="n">' + esc(t('qty', 'Qty')) + '</th><th class="n">' + esc(t('iv_rate', 'Rate')) + '</th><th class="n">GST</th><th class="n">' + esc(t('amount', 'Amount')) + '</th></tr></thead><tbody>' + L.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(l.name) + (l.label ? ' · ' + esc(l.label) : '') + '</td><td>' + esc(l.sku || '') + '</td><td>' + esc(l.hsn || '') + '</td><td class="n">' + l.qty + '</td><td class="n">' + NF2.format(l.rate) + '</td><td class="n">' + l.gst + '%</td><td class="n">' + NF2.format(l.total) + '</td></tr>'; }).join('') + '<tr><td></td><td><b>' + esc(t('total_qty', 'Total quantity')) + '</b></td><td></td><td></td><td class="n"><b>' + sum(L, function (l) { return l.qty; }) + '</b></td><td></td><td></td><td></td></tr></tbody></table>';
    } else {
      rows = '<table><thead><tr><th>#</th><th>' + esc(t('iv_item', 'Item')) + '</th><th>SKU</th><th>HSN</th><th class="n">' + esc(t('qty', 'Qty')) + '</th><th class="n">' + esc(t('iv_rate', 'Rate')) + '</th><th class="n">' + esc(t('amount', 'Amount')) + '</th></tr></thead><tbody>' + L.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(l.name) + (l.label ? ' · ' + esc(l.label) : '') + '</td><td>' + esc(l.sku || '') + '</td><td>' + esc(l.hsn || '') + '</td><td class="n">' + l.qty + '</td><td class="n">' + NF2.format(l.rate) + '</td><td class="n">' + NF2.format(l.total) + '</td></tr>'; }).join('') + '<tr><td></td><td><b>' + esc(t('total_qty', 'Total quantity')) + '</b></td><td></td><td></td><td class="n"><b>' + sum(L, function (l) { return l.qty; }) + '</b></td><td></td><td></td></tr></tbody></table>';
    }
  } else if (th === 'thermal') {
    rows = '<table><tbody>' + L.map(function (l) { return '<tr><td>' + esc(l.name) + (l.label ? '<small>' + esc(l.label) + '</small>' : '') + '<small>' + l.qty + ' × ' + NF2.format(l.rate) + '</small></td><td class="n">' + NF2.format(l.total) + '</td></tr>'; }).join('') + '</tbody></table>';
  } else if (th === 'intl') {
    rows = '<table><thead><tr><th>#</th><th>' + esc(t('iv_desc', 'Description of goods')) + '</th><th>HSN</th><th class="n">' + esc(t('qty', 'Qty')) + '</th><th class="n">' + esc(t('iv_unit', 'Unit price (INR)')) + '</th><th class="n">' + esc(t('iv_amt_inr', 'Amount (INR)')) + '</th></tr></thead><tbody>' + L.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(l.name) + '<small>' + esc([l.label, l.sku].filter(Boolean).join(' · ')) + '</small></td><td>' + esc(l.hsn || '') + '</td><td class="n">' + l.qty + ' pcs</td><td class="n">' + NF2.format(l.rate) + '</td><td class="n">' + NF2.format(l.total) + '</td></tr>'; }).join('') + '</tbody></table>';
  } else {
    rows = '<table><thead><tr><th>' + esc(t('iv_item', 'Item')) + '</th><th class="n">' + esc(t('qty', 'Qty')) + '</th>' + (th === 'boutique' ? '' : '<th class="n">' + esc(t('iv_rate', 'Rate')) + '</th>') + '<th class="n">' + esc(t('amount', 'Amount')) + '</th></tr></thead><tbody>' + L.map(function (l) {
      var prod = l.productId && D.products && D.products[l.productId];
      var thumb = l.fabricThumbnailImage || (prod && (prod.fabricThumbnailImage || prod.fabricPreviewImage));
      var thumbHtml = thumb ? '<img src="' + esc(safeImg(thumb)) + '" style="width:28px;height:28px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:8px;border:1px solid #DADAE2;display:inline-block;flex-shrink:0" alt="">' : '';
      return '<tr><td><div style="display:flex;align-items:center">' + thumbHtml + '<div><b style="font-weight:600">' + esc(l.name) + '</b><small style="display:block">' + esc([l.label, th === 'boutique' ? '' : l.sku, (+l.gst > 0 ? 'GST ' + l.gst + '%' : '')].filter(Boolean).join(' · ')) + '</small></div></div></td><td class="n">' + l.qty + '</td>' + (th === 'boutique' ? '' : '<td class="n">' + NF2.format(l.rate) + '</td>') + '<td class="n">' + NF2.format(l.total) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  var due = !cn && pay.mode === 'credit' ? (+pay.credit || 0) : 0;
  var upi = st.upi && cfg.showQr !== false && due > 0 ? 'upi://pay?pa=' + encodeURIComponent(st.upi) + '&pn=' + encodeURIComponent(st.name || '') + '&am=' + due.toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(inv.no) : '';
  var left = '<div class="iv-l">' + (th === 'classic' || th === 'wholesale' || th === 'intl' ? '<span><b>' + esc(t('iv_words', 'Amount in words')) + ':</b> ' + esc(VXC.words(inv.total)) + '</span>' : '') +
    (cn ? '<span>' + esc(t('iv_cn_note', 'Goods returned and stock restored.')) + (inv.reason ? ' ' + esc(inv.reason) : '') + '</span>' : '') +
    (due > 0 ? '<span><b>' + esc(t('iv_due', 'Store credit due: {amt}', { amt: inr(due, 1) })) + '</b>' + (pay.due ? ' · ' + esc(t('iv_by', 'by {d}', { d: fmtDY(pay.due) })) : '') + (pay.cash ? '<br>' + esc(t('iv_paid_cash', 'Paid now in cash: {amt}', { amt: inr(pay.cash, 1) })) : '') + '</span>' : '') +
    (pay.mode === 'split' ? '<span>' + esc(['cash', 'upi', 'card'].filter(function (m) { return +pay[m] > 0; }).map(function (m) { return payName(m) + ' ' + inr(pay[m], 1); }).join(' · ')) + '</span>' : '') +
    (upi ? '<div class="iv-qr"><div class="qrc" data-qr="' + esc(upi) + '"></div><span>' + esc(t('iv_scan_pay', 'Scan to pay {amt} via UPI', { amt: inr(due) })) + '<br><b>' + esc(st.upi) + '</b></span></div>' : '') + '</div>';
  var totals = '<div class="iv-tot">' +
    (inv.disc ? '<div><span>' + esc(t('iv_gross', 'Gross')) + '</span><span class="n">' + NF2.format(inv.gross) + '</span></div><div><span>' + esc(t('discount', 'Discount')) + '</span><span class="n">−' + NF2.format(inv.disc) + '</span></div>' : '') +
    (hasGst ? '<div><span>' + esc(t('iv_taxable', 'Taxable')) + '</span><span class="n">' + NF2.format(inv.taxable) + '</span></div><div><span>CGST</span><span class="n">' + NF2.format(inv.cgst) + '</span></div><div><span>SGST</span><span class="n">' + NF2.format(inv.sgst) + '</span></div>' : '') +
    (inv.round ? '<div><span>' + esc(t('round_off', 'Round off')) + '</span><span class="n">' + (inv.round > 0 ? '+' : '−') + NF2.format(Math.abs(inv.round)) + '</span></div>' : '') +
    '<div class="g"><span>' + esc(cn ? t('iv_refund_total', 'Refund total') : t('total', 'Total')) + '</span><span class="n">₹' + NF2.format(inv.total) + '</span></div></div>';
  var slabs = {};
  if (hasGst) {
    L.forEach(function (l) { if (+l.gst > 0) { var k = l.gst; slabs[k] = slabs[k] || { tv: 0, tx: 0 }; slabs[k].tv += l.taxable; slabs[k].tx += l.tax; } });
  }
  var slabT = ((th === 'classic' || th === 'wholesale') && hasGst && Object.keys(slabs).length) ? '<table class="iv-slab" style="margin-top:14px;width:60%"><thead><tr><th>' + esc(t('iv_gst_rate', 'GST rate')) + '</th><th class="n">' + esc(t('iv_taxable', 'Taxable')) + '</th><th class="n">CGST</th><th class="n">SGST</th></tr></thead><tbody>' + Object.keys(slabs).map(function (k) { return '<tr><td>' + k + '%</td><td class="n">' + NF2.format(slabs[k].tv) + '</td><td class="n">' + NF2.format(slabs[k].tx / 2) + '</td><td class="n">' + NF2.format(slabs[k].tx / 2) + '</td></tr>'; }).join('') + '</tbody></table>' : '';
  var foot = '<footer class="iv-f"><span>' + esc(cfg.footer || '') + '</span><span>' + esc(t('iv_computer', 'Computer-generated invoice · {by}', { by: 'Vastrenix' })) + '</span></footer>';
  var inner = parties + rows + '<section class="iv-s">' + left + totals + '</section>' + slabT + foot;
  return '<div class="ivx th-' + th + '" style="width:' + paperW(th) + 'px">' + head + (th === 'boutique' || th === 'intl' ? '<div class="iv-body">' + inner + '</div>' : inner) + '</div>';
}
function paperHtml(inv, theme, fixedW) { var th = safeTheme(theme || inv.theme || 'modern'); return '<div class="paperwrap" data-pw="' + paperW(th) + '"' + (fixedW ? ' data-fixed="' + fixedW + '"' : '') + '>' + renderInvoice(inv, th) + '</div>'; }
function sampleInvoice() { var c = VXC.calcBill([{ qty: 1, rate: 2450, gst: 5 }, { qty: 2, rate: 790, gst: 5 }], { incl: true }); return { no: (storeV().prefix || 'VX') + '-0001', at: Date.now(), kind: 'sale', cust: { name: 'Meera Shah', phone: '9898022145' }, lines: [{ name: 'Chanderi silk kurta', label: 'M · Indigo', sku: 'VX-KUR-0001-M', hsn: '6204', qty: 1, rate: 2450, gst: 5, taxable: c.lines[0].taxable, tax: c.lines[0].tax, total: c.lines[0].total }, { name: 'Cotton palazzo', label: 'L · Rust', sku: 'VX-BOT-0002-L', hsn: '6204', qty: 2, rate: 790, gst: 5, taxable: c.lines[1].taxable, tax: c.lines[1].tax, total: c.lines[1].total }], gross: c.gross, disc: 0, taxable: c.taxable, tax: c.tax, cgst: c.cgst, sgst: c.sgst, round: c.round, total: c.grand, pay: { mode: 'upi', upi: c.grand } }; }
function themePicker(model) {
  var v = getPath(S, model), inv = sampleInvoice();
  return '<div class="thumbs" role="radiogroup" aria-label="' + esc(t('invoice_theme', 'Invoice theme')) + '">' + THEMES.map(function (th) { var on = v === th[0]; return '<button type="button" role="radio" aria-checked="' + on + '" class="thumb' + (on ? ' on' : '') + '" data-a="set" data-k="' + model + '" data-v="' + th[0] + '"><span class="tv">' + paperHtml(inv, th[0], th[0] === 'thermal' ? 92 : 128) + '</span><span><b>' + esc(t('th_' + th[0], th[1])) + '</b><small>' + esc(t('thd_' + th[0], th[2])) + '</small></span></button>'; }).join('') + '</div>';
}
var LIBS = { h2c: ['vendor/html2canvas.min.js'], pdf: ['vendor/jspdf.umd.min.js'] }, libP = {}; /* bundled only — no third-party CDNs */
function loadLib(srcs) { if (typeof srcs === 'string') return loadOne(srcs); var p = (window.claude && window.claude.use) ? loadOne(srcs[srcs.length - 1]) : loadOne(srcs[0]); for (var i = 1; i < srcs.length; i++) (function (s) { p = p.catch(function () { return loadOne(s); }); })(srcs[i]); return p; }
function loadOne(src) { if (libP[src]) return libP[src]; libP[src] = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { delete libP[src]; rej(new Error('load')); }; document.head.appendChild(s); }); return libP[src]; }
async function invoicePdf(inv, theme) {
  var th = safeTheme(theme || inv.theme || 'modern');
  if (!DL) { toast(t('dl_unavail', 'Downloads aren’t available in this view. Use WhatsApp or copy the invoice text.'), 'bad'); return; }
  S.busy = 'pdf'; schedule();
  try {
    await Promise.all([loadLib(LIBS.h2c), loadLib(LIBS.pdf)]);
    var holder = document.createElement('div'); holder.style.cssText = 'position:fixed;left:-12000px;top:0;background:#fff';
    holder.innerHTML = renderInvoice(inv, th); document.body.appendChild(holder);
    holder.querySelectorAll('[data-qr]').forEach(fillQR);
    await sleep(60); if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var canvas = await window.html2canvas(holder.firstElementChild, { scale: 2, backgroundColor: '#ffffff', logging: false });
    holder.remove();
    var jsPDF = window.jspdf.jsPDF, pdf;
    if (th === 'thermal') { var w = 226.77, h = canvas.height * w / canvas.width; pdf = new jsPDF({ unit: 'pt', format: [w, h] }); pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h); }
    else {
      pdf = new jsPDF({ unit: 'pt', format: 'a4' }); var pw = pdf.internal.pageSize.getWidth(), phh = pdf.internal.pageSize.getHeight(), ih = canvas.height * pw / canvas.width, img = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(img, 'JPEG', 0, 0, pw, ih);
      for (var off = phh; off < ih - 2; off += phh) { pdf.addPage(); pdf.addImage(img, 'JPEG', 0, -off, pw, ih); }
    }
    await DL.save({ filename: inv.no + '.pdf', data: pdf.output('blob') });
  } catch (e) {
    if (e && e.code === 'declined') { } else if (e && e.message === 'load') toast(t('pdf_offline', 'Couldn’t load the PDF tools. Check your connection.'), 'bad'); else if (e && e.code) toast(errText(e), 'bad'); else toast(t('pdf_fail', 'PDF couldn’t be created. Try again.'), 'bad');
  }
  S.busy = null; schedule();
}
function getInv(day, id) { var d = dayDoc(day); var i = d && d.inv && d.inv[id]; return i ? Object.assign({ day: day, id: id }, i) : null; }
A.pdf = function (d) { var i = getInv(d.day, d.id); if (i) invoicePdf(i, d.theme); };
A.openInv = function (d) { closeSheet(); openSub('invoice', { day: d.day, id: d.id }); };

/* ===================== INVOICES ===================== */
function vInvoices() {
  var q = (S.q.inv || '').toLowerCase().trim(), f = S.q.invF || 'all';
  var list = allInvoices().filter(function (i) {
    if (f === 'credit' && !(i.kind === 'sale' && i.pay && i.pay.mode === 'credit')) return false;
    if (f === 'cn' && i.kind !== 'cn') return false;
    if (f === 'upi' && !(i.kind === 'sale' && i.pay && (+i.pay.upi > 0) && !i.pay.utr)) return false;
    if (!q) return true;
    return [i.no, i.cust && i.cust.name, i.cust && i.cust.phone, i.pay && i.pay.utr].join(' ').toLowerCase().indexOf(q) >= 0;
  });
  var groups = {}; list.forEach(function (i) { (groups[i.day] = groups[i.day] || []).push(i); });
  var body = !D.loaded.ledger ? skelRows(6) : !list.length ? '<div class="card">' + empty('file', q ? t('no_match', 'No match for “{q}”', { q: q }) : t('no_bills', 'No bills yet'), q ? '' : t('no_bills_b', 'Your first sale will show up here.')) + '</div>' :
    Object.keys(groups).sort().reverse().map(function (k) { var g = groups[k], tot = sum(g, function (i) { return invSign(i) * i.total; }); return '<section class="stack sm"><div class="sect"><h2>' + esc(fmtDay(k)) + '</h2><span class="small muted num">' + esc(inr(tot) + ' · ' + t('n_bills', '{n} bills', { n: g.filter(function (i) { return i.kind !== 'cn'; }).length })) + '</span></div><div class="list">' + g.map(invRow).join('') + '</div></section>'; }).join('');
  var oldest = allDays().length ? allDays()[allDays().length - 1].day : null;
  return ph(t('nav_invoices', 'Invoices'), esc(t('inv_sub', 'Posted invoices are locked. Corrections go through a credit note.')), (DL && list.length ? '<button class="btn line sm" data-a="exportInv">' + icon('download', 16) + esc(t('export_csv', 'Export CSV')) + '</button>' : '') + '<button class="ib" data-a="refresh" aria-label="' + esc(t('refresh', 'Refresh')) + '">' + icon('refresh', 18) + '</button>') +
    '<div class="stack lg" style="max-width:900px">' + searchBox('q.inv', t('search_inv', 'Invoice no., customer, phone, UTR')) +
    chips('q.invF', [['all', t('all', 'All')], ['credit', t('on_credit', 'On credit')], ['cn', t('credit_notes', 'Credit notes')], ['upi', t('upi_no_utr', 'UPI without UTR')]]) + body +
    (D.loaded.ledger && oldest && !S.noOlder ? busyBtn(t('load_older', 'Load older invoices'), 'loadOlder', 'line block', '', 'older') : '') + '</div>';
}
A.refresh = function () { toast(t('refreshed', 'Up to date — invoices sync live')); };
A.loadOlder = async function () {
  var days = allDays(); if (!days.length) return; var oldest = days[days.length - 1].day;
  S.busy = 'older'; schedule();
  try { var snap = await DB.collection('ledger').where('day', '<', oldest).orderBy('day', 'desc').limit(31).get(); var m = Object.assign({}, D.ledgerOld); snap.docs.forEach(function (d) { var o = d.data(); if (o) { o.id = d.id; m[d.id] = o; } }); if (snap.empty) S.noOlder = true; D.ledgerOld = m; }
  catch (e) { toast(errText(e), 'bad'); }
  S.busy = null; schedule();
};
async function loadRange(fromKey, toKey) { try { var snap = await DB.collection('ledger').where('day', '>=', fromKey).where('day', '<', toKey).orderBy('day', 'desc').limit(62).get(); var m = Object.assign({}, D.ledgerOld); snap.docs.forEach(function (d) { var o = d.data(); if (o && !D.ledger[d.id]) { o.id = d.id; m[d.id] = o; } }); D.ledgerOld = m; schedule(); } catch (e) { } }
A.exportInv = async function () {
  var rows = [['Invoice', 'Date', 'Time', 'Type', 'Customer', 'Phone', 'Payment', 'Taxable', 'CGST', 'SGST', 'Total', 'UTR']];
  allInvoices().forEach(function (i) { rows.push([i.no, dayKey(i.at), fmtT(i.at), i.kind === 'cn' ? 'Credit note' : 'Sale', (i.cust && i.cust.name) || '', (i.cust && i.cust.phone) || '', i.kind === 'cn' ? 'Refund ' + (i.refund || '') : (i.pay && i.pay.mode) || '', invSign(i) * i.taxable, invSign(i) * i.cgst, invSign(i) * i.sgst, invSign(i) * i.total, (i.pay && i.pay.utr) || '']); });
  await saveCsv('vastrenix-invoices-' + dayKey(Date.now()) + '.csv', rows);
};
async function saveCsv(name, rows) {
  if (!DL) { toast(t('dl_unavail', 'Downloads aren’t available in this view. Use WhatsApp or copy the invoice text.'), 'bad'); return; }
  var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
  try { await DL.save({ filename: name, data: csv }); } catch (e) { if (e && e.code !== 'declined') toast(errText(e), 'bad'); }
}
function subInvoice(sub) {
  var inv = getInv(sub.day, sub.id);
  if (!inv) return ph(t('nav_invoices', 'Invoices'), '', '', 'back') + skelRows(3);
  var cn = inv.kind === 'cn', pv = safeTheme(sub.theme || inv.theme || 'modern'), pay = inv.pay || {};
  var ret = inv.ret || {}, canRet = !cn && inv.lines.some(function (l, i) { return !l.custom && l.qty - (+ret[i] || 0) > 0; });
  var status = cn ? pill(t('credit_note', 'Credit note'), '') : pay.mode === 'credit' ? pill(t('on_credit', 'On credit'), 'warn') : pill(t('paid', 'Paid'), 'ok');
  var acts = '<a class="ib" target="_blank" rel="noopener" href="' + esc(waLink(inv.cust && inv.cust.phone, invText(inv))) + '" data-a="noop" aria-label="WhatsApp">' + icon('message', 19) + '</a>' + '<button class="ib" data-a="copyInv" aria-label="' + esc(t('copy_text', 'Copy as text')) + '">' + icon('copy', 18) + '</button>';
  var side = '<div class="stack lg"><section class="card pad stack"><div class="between"><span class="small muted">' + esc(cn ? t('iv_refund_total', 'Refund total') : t('total', 'Total')) + '</span>' + status + '</div><span class="bigamt">' + (cn ? '−' : '') + inr(inv.total) + '</span><span class="small muted">' + esc([fmtDY(inv.at), fmtT(inv.at), locName(inv.loc), who(inv.by)].filter(Boolean).join(' · ')) + '</span>' +
    busyBtn(t('download_pdf', 'Download PDF'), 'pdf', 'primary', 'data-day="' + esc(inv.day) + '" data-id="' + esc(inv.id) + '" data-theme="' + esc(pv) + '"', 'pdf') +
    (!cn && +pay.upi > 0 && !pay.utr && can('sell') ? '<button class="btn line" data-a="sheet" data-k="utr" data-day="' + esc(inv.day) + '" data-id="' + esc(inv.id) + '">' + icon('qr', 17) + esc(t('add_utr', 'Add UTR reference')) + '</button>' : '') +
    (canRet && can('sell') ? '<button class="btn line" data-a="sheet" data-k="cn" data-day="' + esc(inv.day) + '" data-id="' + esc(inv.id) + '">' + icon('undo', 17) + esc(t('issue_cn', 'Return items · credit note')) + '</button>' : '') + '</section>' +
    '<section class="stack sm"><div class="sect"><h3>' + esc(t('preview_theme', 'Preview in theme')) + '</h3></div><div class="picks">' + THEMES.map(function (th) { return '<button type="button" class="pick' + (pv === th[0] ? ' on' : '') + '" data-a="invTheme" data-v="' + th[0] + '">' + esc(t('th_' + th[0], th[1])) + '</button>'; }).join('') + '</div></section>' +
    (inv.cust && inv.cust.id && D.customers[inv.cust.id] ? '<button class="li card" data-a="openCust" data-id="' + esc(inv.cust.id) + '">' + avatarHtml(inv.cust.name) + '<span class="tx"><b>' + esc(inv.cust.name) + '</b><small>' + esc(fmtPhone(inv.cust.phone)) + '</small></span>' + icon('chevR', 18) + '</button>' : '') +
    '<div class="note">' + icon('lock', 16) + '<span>' + esc(cn ? t('cn_locked', 'Credit notes are final.') : t('inv_locked', 'Posted invoices can’t be edited. To correct one, return the items with a credit note.')) + '</span></div></div>';
  return ph(inv.no, status, acts, 'back') + '<div class="cols"><div style="background:var(--surface3);border-radius:20px;padding:16px;min-width:0">' + paperHtml(inv, pv) + '</div>' + side + '</div>';
}
A.invTheme = function (d) { S.sub.theme = d.v; schedule(); };
A.copyInv = function () { var i = getInv(S.sub.day, S.sub.id); if (i) A.copy({ v: invText(i) }); };
function utrSheet(sh) {
  if (!S.f.utr || S.f.utr.id !== sh.id) S.f.utr = { id: sh.id, day: sh.day, v: '' };
  return sheetWrap(t('add_utr', 'Add UTR reference'), '<p class="small muted">' + esc(t('utr_b', 'Optional. The 12-digit UTR from the customer’s payment screen helps match this bill with your bank.')) + '</p>' + txtF(t('utr', 'UTR / reference no.'), 'f.utr.v', 'inputmode="numeric" maxlength="22"'), busyBtn(t('save', 'Save'), 'saveUtr', 'primary lg', '', 'utr'));
}
A.saveUtr = async function () {
  var f = S.f.utr, v = String(f.v || '').replace(/\s/g, ''); if (!v) { toast(t('err_utr', 'Enter the UTR'), 'bad'); return; }
  var ok = await tx('utr', async function () { var u = {}; u[f.id] = { pay: { utr: v } }; await patch('ledger/' + f.day, { inv: u }); return 1; });
  if (ok) { S.f.utr = null; closeSheet(); toast(t('utr_saved', 'UTR saved')); }
};
function cnSheet(sh) {
  var inv = getInv(sh.day, sh.id); if (!inv) return '';
  if (!S.f.cn || S.f.cn.id !== sh.id) S.f.cn = { id: sh.id, day: sh.day, q: {}, refund: inv.pay && inv.pay.mode === 'credit' ? 'credit' : 'cash', reason: '' };
  var f = S.f.cn, ret = inv.ret || {};
  var total = r2(sum(inv.lines, function (l, i) { return (l.total / l.qty) * (+f.q[i] || 0); }));
  var body = '<div class="list">' + inv.lines.map(function (l, i) { var mx = l.custom ? 0 : l.qty - (+ret[i] || 0); return '<div class="li"><span class="tx"><b>' + esc(l.name) + '</b><small>' + esc([l.label, t('sold_n', '{n} sold', { n: l.qty }), ret[i] ? t('ret_n', '{n} returned', { n: ret[i] }) : ''].filter(Boolean).join(' · ')) + '</small></span>' + (mx > 0 ? stepper('data-a="cnQty" data-i="' + i + '" data-d="-1" data-mx="' + mx + '"', 'data-a="cnQty" data-i="' + i + '" data-d="1" data-mx="' + mx + '"', +f.q[i] || 0) : pill(l.custom ? t('custom', 'Custom') : t('all_returned', 'All returned'), '')) + '</div>'; }).join('') + '</div>' +
    fld(t('refund_via', 'Refund via'), seg('f.cn.refund', [['cash', payName('cash')], ['upi', payName('upi')]].concat(inv.cust && inv.cust.id ? [['credit', t('adjust_credit', 'Adjust store credit')]] : []))) +
    txtF(t('reason', 'Reason'), 'f.cn.reason', 'placeholder="' + esc(t('reason_ph', 'Size exchange, defect…')) + '"') +
    '<div class="sumrow tot"><span>' + esc(t('refund_total', 'Refund')) + '</span><span class="num">' + inr(total, 1) + '</span></div><span class="xsmall muted">' + esc(t('cn_restock', 'Returned units go back into stock at {l}.', { l: locName(curLoc()) })) + '</span>';
  return sheetWrap(t('issue_cn_t', 'Credit note for {no}', { no: inv.no }), body, busyBtn(t('create_cn', 'Create credit note'), 'saveCN', 'primary lg', total > 0 ? '' : 'disabled', 'cn'));
}
A.cnQty = function (d) { var q = S.f.cn.q; q[d.i] = Math.max(0, Math.min(+d.mx, (+q[d.i] || 0) + (+d.d))); schedule(); };
A.saveCN = async function () {
  var f = S.f.cn;
  var res = await tx('cn', async function () {
    var od = await fresh('ledger/' + f.day), orig = od && od.inv && od.inv[f.id]; if (!orig) throw fail(t('err_gone_inv', 'Original invoice not found.'));
    var ret = orig.ret || {}, now = Date.now(), loc = curLoc(), lines = [], byP = {};
    orig.lines.forEach(function (l, i) { var q = Math.min(+f.q[i] || 0, l.qty - (+ret[i] || 0)); if (q <= 0) return; var k = q / l.qty; lines.push({ pid: l.pid, vid: l.vid, name: l.name, label: l.label, sku: l.sku, hsn: l.hsn, qty: q, rate: l.rate, gst: l.gst, taxable: r2(l.taxable * k), tax: r2(l.tax * k), total: r2(l.total * k), i: i }); ret[i] = (+ret[i] || 0) + q; if (l.pid) (byP[l.pid] = byP[l.pid] || []).push({ vid: l.vid, q: q }); });
    if (!lines.length) throw fail(t('err_nothing_ret', 'Pick at least one item to return.'));
    var total = r2(sum(lines, function (l) { return l.total; })), tax = r2(sum(lines, function (l) { return l.tax; })), cg = r2(tax / 2);
    var no = 'CN-' + VXC.pad(await nextNo('cn'), 4), id = uid('n'), day = dayKey(now);
    await ensureDay(day);
    var cn = { no: no, at: now, kind: 'cn', loc: loc, by: ME.id || '', theme: orig.theme, cust: orig.cust || null, ref: { day: f.day, id: f.id, no: orig.no }, lines: lines, gross: total, disc: 0, taxable: r2(sum(lines, function (l) { return l.taxable; })), tax: tax, cgst: cg, sgst: r2(tax - cg), round: 0, total: total, refund: f.refund, reason: f.reason || '', pay: { mode: f.refund } };
    var u = {}; u[id] = cn; await patch('ledger/' + day, { inv: u });
    var o = {}; o[f.id] = { ret: ret }; await patch('ledger/' + f.day, { inv: o });
    for (var pid in byP) { var p = await fresh('products/' + pid); if (!p) continue; byP[pid].forEach(function (x) { var v = p.variants.find(function (y) { return y.id === x.vid; }); if (v) { v.stock = v.stock || {}; v.stock[loc] = (+v.stock[loc] || 0) + x.q; v.sold = Math.max(0, (+v.sold || 0) - x.q); } }); p.updatedAt = now; await put('products/' + pid, p); }
    if (orig.cust && orig.cust.id) { var c = await fresh('customers/' + orig.cust.id); if (c) { c.spent = r2((+c.spent || 0) - total); if (f.refund === 'credit') { c.balance = r2(Math.max(0, (+c.balance || 0) - total)); c.txns = (c.txns || []).concat([{ t: 'pay', amt: total, at: now, ref: no, mode: 'return' }]).slice(-80); } c.recent = [{ day: day, id: id, no: no, total: -total, mode: 'cn', at: now }].concat(c.recent || []).slice(0, 40); await put('customers/' + orig.cust.id, c); } }
    return { day: day, id: id, no: no };
  });
  if (res) { S.f.cn = null; closeSheet(); toast(t('cn_done', '{no} created. Stock restored.', { no: res.no })); S.sub = { k: 'invoice', day: res.day, id: res.id, prev: S.sub }; schedule(); }
};

/* ===================== DUES ===================== */
function vDues() {
  var tab = S.q.dTab || 'collect', now = Date.now(), mk = monthKey(now), st = storeV();
  var cs = vals(D.customers).filter(function (c) { return (+c.balance || 0) > 0.5; }).sort(by(function (c) { return -c.balance; }));
  var ds = vals(D.dealers).filter(function (d) { return (+d.balance || 0) > 0.5; });
  var sup = vals(D.suppliers).filter(function (s) { return (+s.payable || 0) > 0.5; }).sort(by(function (s) { return -s.payable; }));
  var recv = sum(cs, function (c) { return c.balance; }) + sum(ds, function (d) { return d.balance; }), pay = sum(sup, function (s) { return s.payable; });
  var body;
  if (tab === 'collect') {
    var ag = { a: 0, b: 0, c: 0 }; cs.forEach(function (c) { var x = VXC.aging(c.txns, now); ag.a += x.a; ag.b += x.b; ag.c += x.c; });
    var tot = Math.max(1, ag.a + ag.b + ag.c), endMonth = new Date().getDate() >= 28;
    var pending = cs.filter(function (c) { return c.remindedMonth !== mk; });
    body = '<section class="card pad stack"><div class="stack sm" style="gap:4px"><span class="small muted">' + esc(t('credit_out', 'Store credit outstanding')) + '</span><span class="bigamt">' + inr(recv) + '</span></div>' +
      '<div class="sbar" aria-hidden="true"><i style="width:' + (ag.a / tot * 100) + '%;background:var(--strong)"></i><i style="width:' + (ag.b / tot * 100) + '%;background:var(--warn-solid)"></i><i style="width:' + (ag.c / tot * 100) + '%;background:var(--bad-solid)"></i></div>' +
      '<div class="g3" style="grid-template-columns:repeat(3,minmax(0,1fr))"><span class="small"><span class="muted">' + esc(t('d0_30', '0–30 days')) + '</span><br><b class="num">' + inr(ag.a) + '</b></span><span class="small"><span class="muted">' + esc(t('d31_60', '31–60 days')) + '</span><br><b class="num">' + inr(ag.b) + '</b></span><span class="small"><span class="muted">' + esc(t('d60', '60+ days')) + '</span><br><b class="num bad-t">' + inr(ag.c) + '</b></span></div></section>' +
      (st.remind !== false && cs.length ? '<div class="banner' + (endMonth ? ' warn' : '') + '"><span class="ic ' + (endMonth ? 'warn' : 'acc') + '">' + icon('calendar', 18) + '</span><span class="tx"><b>' + esc(endMonth ? t('remind_now', 'Month-end reminders · {n} to send', { n: pending.length }) : t('remind_next', 'Next reminders on the 28th')) + '</b><small>' + esc(t('remind_how', 'Tap WhatsApp to open a prefilled message, then mark it sent.')) + '</small></span></div>' : '') +
      (!D.loaded.customers ? skelRows(4) : !cs.length && !ds.length ? '<div class="card">' + empty('checkCircle', t('no_dues', 'No one owes you'), t('no_dues_b', 'Store credit sales appear here until they’re paid.')) + '</div>' :
        '<div class="list">' + cs.map(function (c) { var x = VXC.aging(c.txns, now), days = x.oldest ? Math.floor((now - x.oldest) / 864e5) : 0, done = c.remindedMonth === mk; return '<div class="li wrapm"><button class="rowx grow" style="border:0;background:none;padding:0;text-align:left;min-width:0" data-a="openCust" data-id="' + esc(c.id) + '">' + avatarHtml(c.name) + '<span class="tx"><b>' + esc(c.name) + '</b><small class="' + (days > 60 ? 'bad-t' : '') + '">' + esc(t('days_old', '{n} days old', { n: days }) + (done ? ' · ' + t('reminded', 'Reminded') : '')) + '</small></span></button><b class="num">' + inr(c.balance) + '</b><span class="acts"><a class="ib" target="_blank" rel="noopener" href="' + esc(waLink(c.phone, remindText(c))) + '" data-a="noop" aria-label="' + esc(t('remind_x', 'Remind {n} on WhatsApp', { n: c.name })) + '">' + icon('message', 17) + '</a>' + (!done ? '<button class="ib" data-a="markReminded" data-id="' + esc(c.id) + '" aria-label="' + esc(t('mark_sent', 'Mark reminder sent')) + '">' + icon('check', 17) + '</button>' : '') + (can('sell') || can('money') ? '<button class="btn strong xs" data-a="sheet" data-k="collect" data-cid="' + esc(c.id) + '">' + esc(t('collect', 'Collect')) + '</button>' : '') + '</span></div>'; }).join('') +
        ds.map(function (d) { return '<div class="li"><span class="ic">' + icon('truck', 17) + '</span><span class="tx"><b>' + esc(d.name) + '</b><small>' + esc(t('dealer', 'Dealer') + ' · ' + (d.city || '')) + '</small></span><b class="num">' + inr(d.balance) + '</b>' + (can('money') || can('dealers') ? '<button class="btn strong xs" data-a="sheet" data-k="collect" data-did="' + esc(d.id) + '">' + esc(t('collect', 'Collect')) + '</button>' : '') + '</div>'; }).join('') + '</div>');
  } else {
    body = '<section class="card pad stack sm"><span class="small muted">' + esc(t('you_owe', 'You owe suppliers')) + '</span><span class="bigamt">' + inr(pay) + '</span></section>' + (!sup.length ? '<div class="card">' + empty('checkCircle', t('no_payables', 'Nothing to pay'), '') + '</div>' : '<div class="list">' + sup.map(function (s) { var lastBill = (s.txns || []).filter(function (x) { return x.t === 'bill'; }).slice(-1)[0]; return '<div class="li"><button class="rowx grow" style="border:0;background:none;padding:0;text-align:left;min-width:0" data-a="openSupplier" data-id="' + esc(s.id) + '">' + avatarHtml(s.name, '') + '<span class="tx"><b>' + esc(s.name) + '</b><small>' + esc(lastBill ? t('last_bill', 'Last goods {d}', { d: fmtD(lastBill.at) }) : (s.city || '')) + '</small></span></button><b class="num">' + inr(s.payable) + '</b>' + (can('money') || can('purchase') ? '<button class="btn strong xs" data-a="sheet" data-k="supPay" data-id="' + esc(s.id) + '">' + esc(t('pay', 'Pay')) + '</button>' : '') + '</div>'; }).join('') + '</div>');
  }
  return ph(t('nav_dues', 'Dues')) + '<div class="stack lg" style="max-width:860px">' + seg('q.dTab', [['collect', t('to_collect', 'To collect · {a}', { a: inrS(recv) })], ['pay', t('to_pay', 'To pay · {a}', { a: inrS(pay) })]]) + body + '</div>';
}
function remindText(c) { var st = storeV(); return t('wa_remind', 'Hi {name}, a gentle reminder from {store}: your store credit balance is {amt}. You can pay at the store or by UPI to {upi}. Thank you!', { name: c.name, store: st.name || '', amt: inr(c.balance), upi: st.upi || '' }); }
A.markReminded = async function (d) { try { await patch('customers/' + d.id, { remindedMonth: monthKey(Date.now()), remindedAt: Date.now() }); toast(t('marked', 'Marked as reminded')); } catch (e) { toast(errText(e), 'bad'); } };
function collectSheet(sh) {
  var c = sh.cid ? D.customers[sh.cid] : null, dl = sh.did ? D.dealers[sh.did] : null, who2 = c || dl; if (!who2) return '';
  var key = sh.cid || sh.did;
  if (!S.f.col || S.f.col.key !== key) S.f.col = { key: key, amt: who2.balance, mode: 'cash', note: '' };
  return sheetWrap(t('collect_from', 'Collect from {n}', { n: who2.name }), '<div class="small muted">' + esc(t('outstanding', 'Outstanding')) + ': <b>' + inr(who2.balance) + '</b></div>' + moneyF(t('amount', 'Amount'), 'f.col.amt', 'class="in big"') + fld(t('received_via', 'Received via'), seg('f.col.mode', [['cash', payName('cash')], ['upi', payName('upi')], ['card', payName('card')]])) + txtF(t('note', 'Note'), 'f.col.note', 'placeholder="' + esc(t('note_ph', 'Optional')) + '"'),
    busyBtn(t('record_collection', 'Record {amt}', { amt: inr(+S.f.col.amt || 0) }), 'saveCollect', 'primary lg', 'data-cid="' + esc(sh.cid || '') + '" data-did="' + esc(sh.did || '') + '"', 'col'));
}
A.saveCollect = async function (d) {
  var f = S.f.col, amt = r2(+f.amt || 0); if (amt <= 0) { toast(t('err_amt', 'Enter an amount'), 'bad'); return; }
  var ok = await tx('col', async function () {
    var path = d.cid ? 'customers/' + d.cid : 'dealers/' + d.did, o = await fresh(path), now = Date.now();
    if (amt > (+o.balance || 0) + 0.5) throw fail(t('err_over', 'That’s more than the {amt} outstanding.', { amt: inr(o.balance) }));
    o.balance = r2(Math.max(0, (+o.balance || 0) - amt)); o.txns = (o.txns || []).concat([{ t: 'pay', amt: amt, at: now, mode: f.mode, note: f.note || '' }]).slice(-80); await put(path, o);
    var day = dayKey(now); await ensureDay(day);
    var c = {}; c[uid('x')] = { at: now, dir: f.mode === 'cash' ? 'in' : 'info', mode: f.mode, amt: amt, note: t('due_from', 'Dues from {n}', { n: o.name }), kind: 'due', loc: curLoc(), by: ME.id || '' };
    await patch('ledger/' + day, { cash: c });
    return 1;
  });
  if (ok) { S.f.col = null; closeSheet(); toast(t('collected', '{amt} collected', { amt: inr(amt) })); }
};

/* ===================== CUSTOMERS ===================== */
function vCustomers() {
  var q = (S.q.cust2 || '').toLowerCase(), qd = phoneDigits(S.q.cust2), f = S.q.custF || 'all';
  var all = vals(D.customers), list = all.filter(function (c) { if (f === 'due' && !((+c.balance || 0) > 0.5)) return false; if (!q) return true; return (c.name || '').toLowerCase().indexOf(q) >= 0 || (qd.length >= 3 && phoneDigits(c.phone).indexOf(qd) >= 0); });
  list.sort(f === 'top' ? by(function (c) { return -(+c.spent || 0); }) : by(function (c) { return -(c.lastAt || 0); }));
  var thisMonth = all.filter(function (c) { return c.lastAt && monthKey(c.lastAt) === monthKey(Date.now()); }).length;
  return ph(t('nav_customers', 'Customers'), esc(t('cust_sub', '{n} people · {m} this month', { n: nf(all.length), m: thisMonth })), can('sell') || can('money') ? '<button class="btn primary sm" data-a="sheet" data-k="custEdit">' + icon('userPlus', 16) + esc(t('add', 'Add')) + '</button>' : '') +
    '<div class="stack" style="max-width:860px">' + searchBox('q.cust2', t('search_cust', 'Search name or mobile')) + chips('q.custF', [['all', t('all', 'All')], ['due', t('with_dues', 'With dues'), all.filter(function (c) { return (+c.balance || 0) > 0.5; }).length], ['top', t('top_spenders', 'Top spenders')]]) +
    (!D.loaded.customers ? skelRows(6) : !list.length ? '<div class="card">' + empty('users', q ? t('no_match', 'No match for “{q}”', { q: q }) : t('no_cust_yet', 'No customers yet'), q ? '' : t('no_cust_b', 'Customers are saved when you add them to a bill.')) + '</div>' :
      '<div class="list">' + list.slice(0, 200).map(function (c) { return '<button class="li" data-a="openCust" data-id="' + esc(c.id) + '">' + avatarHtml(c.name) + '<span class="tx"><b>' + esc(c.name || fmtPhone(c.phone)) + '</b><small>' + esc(fmtPhone(c.phone) + ' · ' + ago(c.lastAt)) + '</small></span><span class="end"><b>' + inr(c.spent || 0) + '</b>' + ((+c.balance || 0) > 0.5 ? pill(t('due_amt', '{amt} due', { amt: inr(c.balance) }), 'warn') : '') + '</span></button>'; }).join('') + '</div>') + '</div>';
}
A.openCust = function (d) { closeSheet(); openSub('customer', { id: d.id }); };
function subCustomer(sub) {
  var c = D.customers[sub.id]; if (!c) return ph(t('not_found', 'Not found'), '', '', 'back');
  var bal = +c.balance || 0, ag = VXC.aging(c.txns, Date.now());
  return ph(c.name || fmtPhone(c.phone), esc('+91 ' + fmtPhone(c.phone) + (c.createdAt ? ' · ' + t('since', 'since {y}', { y: new Date(c.createdAt).getFullYear() }) : '')), (can('sell') || can('money') ? '<button class="ib" data-a="sheet" data-k="custEdit" data-id="' + esc(c.id) + '" aria-label="' + esc(t('edit', 'Edit')) + '">' + icon('edit', 18) + '</button>' : ''), 'back') +
    '<div class="cols"><div class="stack lg"><div class="rowx wrap"><a class="btn line sm" target="_blank" rel="noopener" href="' + esc(waLink(c.phone, '')) + '" data-a="noop">' + icon('message', 16) + 'WhatsApp</a><button class="btn line sm" data-a="copy" data-v="' + esc(c.phone) + '">' + icon('phone', 16) + esc(fmtPhone(c.phone)) + '</button>' + (allowed('bill') ? '<button class="btn strong sm" data-a="billFor" data-id="' + esc(c.id) + '">' + icon('receipt', 16) + esc(t('nav_bill', 'New bill')) + '</button>' : '') + '</div>' +
    '<div class="g3"><div class="kpi"><small>' + esc(t('lifetime', 'Lifetime')) + '</small><b>' + inrS(c.spent || 0) + '</b></div><div class="kpi"><small>' + esc(t('visits', 'Visits')) + '</small><b>' + nf(c.visits || 0) + '</b></div><div class="kpi"><small>' + esc(t('last_visit', 'Last visit')) + '</small><b style="font-size:16px">' + esc(ago(c.lastAt)) + '</b></div></div>' +
    (bal > 0.5 ? '<section class="card pad stack" style="background:var(--warn-soft);border-color:transparent"><div class="between"><div><span class="small b warn-t">' + esc(t('credit_due_t', 'Store credit due')) + '</span><div class="bigamt" style="font-size:30px">' + inr(bal) + '</div></div><span class="small warn-t" style="text-align:right">' + esc(ag.c > 0 ? t('d60_amt', '{amt} over 60 days', { amt: inr(ag.c) }) : '') + '</span></div><div class="rowx"><a class="btn line" target="_blank" rel="noopener" href="' + esc(waLink(c.phone, remindText(c))) + '" data-a="noop">' + icon('message', 16) + esc(t('remind', 'Remind')) + '</a>' + (can('sell') || can('money') ? '<button class="btn strong grow" data-a="sheet" data-k="collect" data-cid="' + esc(c.id) + '">' + esc(t('collect_payment', 'Collect payment')) + '</button>' : '') + '</div></section>' : '') +
    (c.note || c.size ? '<div class="card pad small">' + esc([c.size ? t('usual_size', 'Usual size: {s}', { s: c.size }) : '', c.note].filter(Boolean).join(' · ')) + '</div>' : '') + '</div>' +
    '<div class="stack lg"><section class="stack sm"><div class="sect"><h3>' + esc(t('activity', 'Activity')) + '</h3></div>' + ((c.recent || []).length || (c.txns || []).some(function (x) { return x.t === 'pay'; }) ? '<div class="list">' + custActivity(c).slice(0, 30).map(function (a) { return a.inv ? '<button class="li" data-a="openInv" data-day="' + esc(a.day) + '" data-id="' + esc(a.id) + '"><span class="ic">' + icon(a.mode === 'cn' ? 'undo' : payIcon(a.mode), 16) + '</span><span class="tx"><b>' + esc(a.no) + '</b><small>' + esc(fmtDY(a.at) + ' · ' + (a.mode === 'cn' ? t('credit_note', 'Credit note') : payName(a.mode))) + '</small></span><b class="num ' + (a.total < 0 ? 'bad-t' : '') + '">' + inr(a.total) + '</b></button>' : '<div class="li"><span class="ic ok">' + icon('arrowDL', 16) + '</span><span class="tx"><b>' + esc(t('payment_recd', 'Payment received')) + '</b><small>' + esc(fmtDY(a.at) + ' · ' + payName(a.mode || 'cash')) + '</small></span><b class="num ok-t">+' + inr(a.amt) + '</b></div>'; }).join('') + '</div>' : '<div class="card pad small muted">' + esc(t('no_txn', 'No entries yet')) + '</div>') + '</section></div></div>';
}
function custActivity(c) { var a = (c.recent || []).map(function (r) { return Object.assign({ inv: 1 }, r); }); (c.txns || []).forEach(function (x) { if (x.t === 'pay' && x.mode !== 'return') a.push({ at: x.at, amt: x.amt, mode: x.mode }); }); return a.sort(by(function (x) { return x.at; }, true)); }
A.billFor = function (d) { var c = D.customers[d.id]; S.bill = newBill(); if (c) S.bill.cust = { id: c.id, name: c.name, phone: c.phone }; go('bill'); };
function custEditSheet(sh) {
  if (!S.f.ce || S.f.ce.id !== (sh.id || null)) { var c = sh.id ? D.customers[sh.id] : null; S.f.ce = { id: sh.id || null, name: c ? c.name : '', phone: c ? c.phone : '', size: c ? c.size || '' : '', note: c ? c.note || '' : '', err: {} }; }
  var f = S.f.ce;
  return sheetWrap(f.id ? t('edit_customer', 'Edit customer') : t('new_customer', 'New customer'), txtF(t('name', 'Name'), 'f.ce.name', '', null, f.err.name) + txtF(t('mobile', 'Mobile number'), 'f.ce.phone', 'inputmode="tel"', null, f.err.phone) + '<div class="g2">' + txtF(t('usual_size_l', 'Usual size'), 'f.ce.size', 'placeholder="M"') + txtF(t('note', 'Note'), 'f.ce.note', 'placeholder="' + esc(t('note_ph', 'Optional')) + '"') + '</div>', busyBtn(t('save', 'Save'), 'saveCust', 'primary lg', '', 'ce'));
}
A.saveCust = async function () {
  var f = S.f.ce; f.err = {};
  if (!String(f.name).trim()) f.err.name = t('err_name', 'Enter a name');
  if (phoneDigits(f.phone).length !== 10) f.err.phone = t('err_phone', 'Enter a 10-digit mobile number');
  var dup = vals(D.customers).find(function (c) { return c.id !== f.id && phoneDigits(c.phone) === phoneDigits(f.phone); });
  if (dup) f.err.phone = t('err_dup_phone', '{n} already uses this number', { n: dup.name });
  if (Object.keys(f.err).length) { schedule(); return; }
  var id = await tx('ce', async function () { var id = f.id || uid('c'); var c = (f.id && await fresh('customers/' + f.id)) || { balance: 0, spent: 0, visits: 0, recent: [], txns: [], createdAt: Date.now() }; Object.assign(c, { name: f.name.trim(), phone: phoneDigits(f.phone), size: f.size || '', note: f.note || '' }); await put('customers/' + id, c); return id; });
  if (id) { S.f.ce = null; closeSheet(); toast(t('saved', 'Saved')); }
};

/* ===================== EXPENSES ===================== */
function monthDays(mk) { return allDays().filter(function (d) { return d.day.slice(0, 7) === mk; }); }
function vExpenses() {
  var mk = S.q.expM || monthKey(Date.now()), p = mk.split('-'), mts = new Date(+p[0], +p[1] - 1, 1).getTime();
  var prevK = monthKey(new Date(+p[0], +p[1] - 2, 1).getTime()), nextK = monthKey(new Date(+p[0], +p[1], 1).getTime());
  if (!S.loadedM) S.loadedM = {};
  [mk, prevK].forEach(function (k) { if (!S.loadedM[k] && D.loaded.ledger) { S.loadedM[k] = 1; var q = k.split('-'); loadRange(k + '-01', monthKey(new Date(+q[0], +q[1], 1).getTime()) + '-01'); } });
  var items = []; monthDays(mk).forEach(function (d) { vals(d.exp).forEach(function (x) { if (x) items.push(Object.assign({ day: d.day }, x)); }); });
  items.sort(by(function (x) { return x.at; }, true));
  var prevT = 0; monthDays(prevK).forEach(function (d) { prevT += sum(vals(d.exp), function (x) { return x.amt; }); });
  var total = sum(items, function (x) { return x.amt; }), byCat = {};
  items.forEach(function (x) { byCat[x.cat] = (byCat[x.cat] || 0) + x.amt; });
  var cats = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }), mx = Math.max.apply(null, cats.map(function (c) { return byCat[c]; }).concat([1]));
  var ch = prevT ? Math.round((total - prevT) / prevT * 100) : null;
  var future = nextK > monthKey(Date.now());
  return ph(t('nav_expenses', 'Expenses'), '', can('money') ? '<button class="btn primary sm" data-a="sheet" data-k="expense">' + icon('plus', 16, 2.2) + esc(t('add_expense', 'Add expense')) + '</button>' : '') +
    '<div class="stack lg" style="max-width:860px"><div class="between"><button class="ib" data-a="set" data-k="q.expM" data-v="' + prevK + '" aria-label="' + esc(t('prev_month', 'Previous month')) + '">' + icon('chevL', 20) + '</button><b style="font-size:16px">' + esc(fmtD(mts, { month: 'long', year: 'numeric' })) + '</b><button class="ib" data-a="set" data-k="q.expM" data-v="' + nextK + '" aria-label="' + esc(t('next_month', 'Next month')) + '"' + (future ? ' disabled style="opacity:.4"' : '') + '>' + icon('chevR', 20) + '</button></div>' +
    '<section class="card pad stack"><div class="between" style="align-items:flex-end"><div class="stack sm" style="gap:4px"><span class="small muted">' + esc(t('spent_month', 'Spent this month')) + '</span><span class="bigamt">' + inr(total) + '</span></div>' + (ch != null ? '<span class="rowx small b ' + (ch <= 0 ? 'ok-t' : 'warn-t') + '" style="gap:3px">' + icon(ch <= 0 ? 'trendDown' : 'trendUp', 14, 2) + esc(t('vs_prev', '{p}% vs last month', { p: Math.abs(ch) })) + '</span>' : '') + '</div>' +
    (cats.length ? '<div class="stack sm">' + cats.map(function (c, i) { return '<div class="stack sm" style="gap:5px"><div class="between small"><span>' + esc(catName(c)) + '</span><b class="num">' + inr(byCat[c]) + '</b></div><div style="height:6px;border-radius:999px;background:var(--surface2)"><div style="height:6px;border-radius:999px;width:' + (byCat[c] / mx * 100) + '%;background:' + (i === 0 ? 'var(--accent)' : 'var(--strong)') + '"></div></div></div>'; }).join('') + '</div>' : '') + '</section>' +
    '<div class="sect"><h2>' + esc(t('entries', 'Entries')) + '</h2>' + (allowed('cashbook') ? '<a href="#cashbook" data-a="go" data-r="cashbook">' + esc(t('nav_cashbook', 'Cash book')) + '</a>' : '') + '</div>' +
    (!items.length ? '<div class="card">' + empty('calculator', t('no_exp', 'No expenses this month'), t('no_exp_b', 'Rent, salaries, courier and tea all go here. Cash expenses come out of the drawer.')) + '</div>' :
      '<div class="list">' + items.map(function (x) { return '<div class="li"><span class="ic">' + icon(x.cat === 'logistics' ? 'truck' : x.cat === 'rent' ? 'building' : x.cat === 'salaries' ? 'users' : 'wallet', 17) + '</span><span class="tx"><b>' + esc(catName(x.cat) + (x.note ? ' — ' + x.note : '')) + '</b><small>' + esc(fmtD(x.at) + ' · ' + (x.mode === 'cash' ? payName('cash') : x.mode === 'upi' ? payName('upi') : t('pay_bank', 'Bank / NEFT')) + ' · ' + who(x.by)) + '</small></span><b class="num">' + inr(x.amt) + '</b>' + (can('money') ? '<button class="ib plain" data-a="delExp" data-day="' + esc(x.day) + '" data-id="' + esc(x.id) + '" aria-label="' + esc(t('delete', 'Delete')) + '">' + icon('trash', 16) + '</button>' : '') + '</div>'; }).join('') + '</div>') + '</div>';
}
function expenseSheet() {
  if (!S.f.exp) S.f.exp = { amt: '', cat: 'other', mode: 'cash', note: '', date: dayKey(Date.now()) };
  var f = S.f.exp;
  return sheetWrap(t('add_expense', 'Add expense'), moneyF(t('amount', 'Amount'), 'f.exp.amt', 'class="in big"') + fld(t('category', 'Category'), '<div class="picks">' + EXP_CATS.map(function (c) { return '<button type="button" class="pick' + (f.cat === c ? ' on' : '') + '" data-a="set" data-k="f.exp.cat" data-v="' + c + '">' + esc(catName(c)) + '</button>'; }).join('') + '</div>') + fld(t('paid_via', 'Paid via'), seg('f.exp.mode', [['cash', t('from_drawer', 'Cash drawer')], ['upi', payName('upi')], ['bank', t('pay_bank', 'Bank / NEFT')]])) + '<div class="g2">' + fld(t('date', 'Date'), '<input class="in" type="date" id="f-exp-date" data-m="f.exp.date" max="' + dayKey(Date.now()) + '" value="' + esc(f.date) + '">', null, null, 'f-exp-date') + txtF(t('note', 'Note'), 'f.exp.note', 'placeholder="' + esc(t('exp_note_ph', 'Courier to Ahmedabad')) + '"') + '</div>', busyBtn(t('save_expense', 'Save expense'), 'saveExp', 'primary lg', '', 'exp'));
}
A.saveExp = async function () {
  var f = S.f.exp, amt = r2(+f.amt || 0); if (amt <= 0) { toast(t('err_amt', 'Enter an amount'), 'bad'); return; }
  var ok = await tx('exp', async function () { var day = f.date || dayKey(Date.now()), now = Date.now(), at = day === dayKey(now) ? now : keyToTs(day) + 12 * 36e5; await ensureDay(day); var e = {}; var id = uid('e'); e[id] = { id: id, at: at, cat: f.cat, amt: amt, mode: f.mode, note: f.note || '', loc: curLoc(), by: ME.id || '' }; await patch('ledger/' + day, { exp: e }); return 1; });
  if (ok) { S.f.exp = null; closeSheet(); toast(t('exp_saved', 'Expense saved')); }
};
A.delExp = function (d) { openSheet('confirm', { title: t('delete_exp', 'Delete expense'), msg: t('delete_exp_q', 'Delete this expense entry?'), yes: t('delete', 'Delete'), act: 'doDelExp', arg: d.day + '|' + d.id, danger: true }); };
A.doDelExp = async function () { var a = S.sheet.arg.split('|'); closeSheet(); var ok = await tx('exp', async function () { var e = {}; e[a[1]] = null; await patch('ledger/' + a[0], { exp: e }); return 1; }); if (ok) toast(t('deleted', 'Deleted')); };

/* ===================== CASH BOOK ===================== */
function vCashbook() {
  var key = S.q.cbDay || dayKey(Date.now()), ts = keyToTs(key), loc = curLoc();
  var from = ts, to = ts + 864e5 - 1;
  var moves = cashMoves(from, to, loc).filter(function (m) { return m.dir === 'in' || m.dir === 'out'; });
  var shifts = vals(D.shifts).filter(function (s) { return s.loc === loc && s.openAt >= from && s.openAt <= to; });
  var flt = sum(shifts, function (s) { return s.float; });
  var cin = sum(moves, function (m) { return m.dir === 'in' ? m.amt : 0; }), cout = sum(moves, function (m) { return m.dir === 'out' ? m.amt : 0; });
  var d = dayDoc(key), upis = d ? vals(d.inv).filter(function (i) { return i.kind === 'sale' && +((i.pay || {}).upi) > 0; }) : [], noUtr = upis.filter(function (i) { return !i.pay.utr; });
  var running = flt, rows = moves.slice().reverse().map(function (m) { running += m.dir === 'in' ? m.amt : -m.amt; return Object.assign({ bal: running }, m); }).reverse();
  var isToday = key === dayKey(Date.now());
  return ph(t('nav_cashbook', 'Cash book'), esc(locName(loc)), can('money') || can('sell') ? '<button class="btn line sm" data-a="sheet" data-k="cashEntry" data-dir="out">' + icon('arrowUR', 16) + esc(t('cash_out', 'Cash out')) + '</button><button class="btn strong sm" data-a="sheet" data-k="cashEntry" data-dir="in">' + icon('arrowDL', 16) + esc(t('cash_in', 'Cash in')) + '</button>' : '') +
    '<div class="stack lg" style="max-width:860px"><div class="between"><button class="ib" data-a="set" data-k="q.cbDay" data-v="' + dayKey(ts - 864e5) + '" aria-label="' + esc(t('prev_day', 'Previous day')) + '">' + icon('chevL', 20) + '</button><b style="font-size:16px">' + esc(fmtDay(key)) + '</b><button class="ib" data-a="set" data-k="q.cbDay" data-v="' + dayKey(ts + 864e5 + 3600e3) + '" aria-label="' + esc(t('next_day', 'Next day')) + '"' + (isToday ? ' disabled style="opacity:.4"' : '') + '>' + icon('chevR', 20) + '</button></div>' +
    '<section class="hero"><span class="lab">' + esc(t('expected_close', 'Expected closing cash')) + '</span><span class="big">' + inr(flt + cin - cout) + '</span><div class="split"><div><b>' + inr(flt) + '</b><small>' + esc(t('opening_float', 'Opening float')) + '</small></div><div><b class="up">+' + inr(cin) + '</b><small>' + esc(t('cash_in', 'Cash in')) + '</small></div><div><b style="color:#FF9AA6">−' + inr(cout) + '</b><small>' + esc(t('cash_out', 'Cash out')) + '</small></div></div></section>' +
    (upis.length ? '<div class="banner ' + (noUtr.length ? 'warn' : 'ok') + '"><span class="ic ' + (noUtr.length ? 'warn' : 'ok') + '">' + icon('qr', 18) + '</span><span class="tx"><b>' + esc(t('upi_recon', 'UPI reconciliation')) + '</b><small>' + esc(t('upi_recon_s', '{a} of {b} UPI bills have a UTR · {amt} by UPI', { a: upis.length - noUtr.length, b: upis.length, amt: inr(sum(upis, function (i) { return i.pay.upi; })) })) + '</small></span>' + (noUtr.length ? '<button class="btn line xs" data-a="cbUtr">' + esc(t('review', 'Review')) + '</button>' : '') + '</div>' : '') +
    (!D.loaded.ledger ? skelRows(5) : !rows.length ? '<div class="card">' + empty('banknote', t('no_cash', 'No cash movement on this day'), '') + '</div>' :
      '<div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>' + esc(t('entry', 'Entry')) + '</th><th class="r">' + esc(t('amount', 'Amount')) + '</th><th class="r">' + esc(t('balance', 'Balance')) + '</th></tr></thead><tbody>' + rows.map(function (m) { return '<tr><td><div class="rowx"><span class="ic ' + (m.dir === 'in' ? 'ok' : 'bad') + '" style="width:28px;height:28px;border-radius:9px">' + icon(m.dir === 'in' ? 'arrowDL' : 'arrowUR', 14, 2.2) + '</span><span style="min-width:0"><b style="font-size:13px;display:block">' + esc(m.what) + '</b><span class="xsmall muted">' + esc(fmtT(m.at) + (m.by ? ' · ' + who(m.by) : '')) + '</span></span></div></td><td class="r b ' + (m.dir === 'in' ? 'ok-t' : 'bad-t') + '">' + (m.dir === 'in' ? '+' : '−') + inr(m.amt) + '</td><td class="r muted">' + inr(m.bal) + '</td></tr>'; }).join('') + '</tbody></table></div>') + '</div>';
}
A.cbUtr = function () { S.q.invF = 'upi'; go('invoices'); };
function cashEntrySheet(sh) {
  if (!S.f.ce2 || S.f.ce2.dir !== sh.dir) S.f.ce2 = { dir: sh.dir, amt: '', note: '' };
  return sheetWrap(sh.dir === 'in' ? t('cash_in', 'Cash in') : t('cash_out', 'Cash out'), moneyF(t('amount', 'Amount'), 'f.ce2.amt', 'class="in big"') + txtF(t('note', 'Note'), 'f.ce2.note', 'placeholder="' + esc(sh.dir === 'in' ? t('cin_ph', 'Change from bank') : t('cout_ph', 'Tailor advance')) + '"'), busyBtn(t('save', 'Save'), 'saveCashEntry', 'primary lg', '', 'cash'));
}
A.saveCashEntry = async function () {
  var f = S.f.ce2, amt = r2(+f.amt || 0); if (amt <= 0) { toast(t('err_amt', 'Enter an amount'), 'bad'); return; }
  var ok = await tx('cash', async function () { var now = Date.now(), day = dayKey(now); await ensureDay(day); var c = {}; c[uid('x')] = { at: now, dir: f.dir, amt: amt, note: f.note || '', kind: 'manual', loc: curLoc(), by: ME.id || '' }; await patch('ledger/' + day, { cash: c }); return 1; });
  if (ok) { S.f.ce2 = null; closeSheet(); toast(t('saved', 'Saved')); }
};

/* ===================== SHIFT ===================== */
var DENOMS = [500, 200, 100, 50, 20, 10, 5, 2, 1];
function vShift() {
  var sh = openShift(), loc = curLoc();
  var hist = vals(D.shifts).filter(function (s) { return s.status === 'closed' && s.loc === loc; }).sort(by(function (s) { return s.closeAt; }, true)).slice(0, 12);
  var histHtml = hist.length ? '<section class="stack sm"><div class="sect"><h3>' + esc(t('past_shifts', 'Past shifts')) + '</h3></div><div class="list">' + hist.map(function (s) { var df = r2(s.diff || 0); return '<div class="li"><span class="ic">' + icon('clock', 17) + '</span><span class="tx"><b>' + esc(fmtD(s.openAt) + ' · ' + fmtT(s.openAt) + '–' + fmtT(s.closeAt)) + '</b><small>' + esc(who(s.by) + ' · ' + t('counted_amt', 'Counted {amt}', { amt: inr(s.counted) }) + (s.note ? ' · ' + s.note : '')) + '</small></span>' + (Math.abs(df) < 1 ? pill(t('exact', 'Exact'), 'ok') : df > 0 ? pill(t('excess_amt', 'Excess {amt}', { amt: inr(df) }), 'warn') : pill(t('short_amt', 'Short {amt}', { amt: inr(-df) }), 'bad')) + '</div>'; }).join('') + '</div></section>' : '';
  if (!sh) {
    if (!S.f.os) { var last = hist[0]; S.f.os = { float: last ? Math.min(last.counted, 5000) : 2000 }; }
    return ph(t('nav_shift', 'Shift'), esc(locName(loc))) + '<div class="stack lg" style="max-width:640px"><section class="card pad stack"><div class="rowx"><span class="ic acc">' + icon('clock', 18) + '</span><div class="grow"><b>' + esc(t('no_shift', 'No shift open at {l}', { l: locName(loc) })) + '</b><div class="small muted">' + esc(t('no_shift_b', 'Open a shift with the cash already in the drawer. It’s reconciled when you close.')) + '</div></div></div>' + moneyF(t('opening_float', 'Opening float'), 'f.os.float', 'class="in big"') + busyBtn(t('open_shift', 'Open shift'), 'openShiftA', 'primary lg', can('sell') ? '' : 'disabled', 'shift') + '</section>' + histHtml + '</div>';
  }
  if (!S.f.cs || S.f.cs.id !== sh.id) { S.f.cs = { id: sh.id, d: {}, note: '' }; }
  var f = S.f.cs, counted = sum(DENOMS, function (dn) { return dn * (+f.d[dn] || 0); }), exp = shiftExpected(sh), diff = r2(counted - exp);
  var m = cashMoves(sh.openAt, Date.now() + 1, sh.loc), inv = []; allDays().forEach(function (d) { vals(d.inv).forEach(function (i) { if (i.at >= sh.openAt && i.loc === sh.loc) inv.push(i); }); });
  var upi = sum(inv, function (i) { return i.kind === 'sale' ? (+(i.pay || {}).upi || 0) : 0; }), card = sum(inv, function (i) { return i.kind === 'sale' ? (+(i.pay || {}).card || 0) : 0; }), cred = sum(inv, function (i) { return i.kind === 'sale' ? (+(i.pay || {}).credit || 0) : 0; });
  var touched = Object.keys(f.d).some(function (k) { return f.d[k] !== '' && f.d[k] != null; });
  return ph(t('close_shift', 'Close shift'), esc(who(sh.by) + ' · ' + locName(sh.loc) + ' · ' + t('since_t', 'since {t}', { t: fmtT(sh.openAt) }))) + '<div class="cols"><div class="stack lg">' +
    '<section class="card" style="padding:4px 16px">' + [[t('opening_float', 'Opening float'), inr(sh.float)], [t('cash_in', 'Cash in'), '+' + inr(sum(m, function (x) { return x.dir === 'in' ? x.amt : 0; }))], [t('cash_out', 'Cash out'), '−' + inr(sum(m, function (x) { return x.dir === 'out' ? x.amt : 0; }))]].map(function (x) { return '<div class="sumrow" style="padding:11px 0;border-bottom:1px solid var(--line)"><span>' + esc(x[0]) + '</span><span class="num">' + x[1] + '</span></div>'; }).join('') + '<div class="sumrow" style="padding:12px 0;font-weight:700"><span style="color:var(--fg)">' + esc(t('expected_drawer', 'Expected in drawer')) + '</span><span class="num">' + inr(exp) + '</span></div></section>' +
    '<div class="g3"><div class="kpi"><small>' + esc(t('upi_collected', 'UPI collected')) + '</small><b>' + inr(upi) + '</b></div><div class="kpi"><small>' + esc(t('card_collected', 'Card collected')) + '</small><b>' + inr(card) + '</b></div><div class="kpi"><small>' + esc(t('on_credit', 'On credit')) + '</small><b>' + inr(cred) + '</b></div></div></div>' +
    '<div class="stack lg"><section class="card pad stack"><div class="between"><b>' + esc(t('count_drawer', 'Count the drawer')) + '</b><span class="small muted">' + esc(t('by_denom', 'By denomination')) + '</span></div><div class="g3" style="grid-template-columns:repeat(3,minmax(0,1fr))">' + DENOMS.map(function (dn) { return '<label class="kpi" style="padding:8px 10px;background:var(--surface2);border-color:transparent" for="f-cs-' + dn + '"><small>₹' + dn + (dn < 10 ? ' ' + esc(t('coin', 'coin')) : '') + '</small><span class="rowx" style="gap:4px"><span class="xsmall muted">×</span><input id="f-cs-' + dn + '" class="num" data-m="f.cs.d.' + dn + '" data-num data-r inputmode="numeric" value="' + esc(f.d[dn] == null ? '' : f.d[dn]) + '" placeholder="0" style="border:0;background:none;width:100%;min-width:0;font:600 17px var(--font);padding:0;outline:none"></span></label>'; }).join('') + '</div>' +
    '<div class="between" style="padding-top:10px;border-top:1px solid var(--line)"><b>' + esc(t('counted', 'Counted')) + '</b><span class="bigamt" style="font-size:24px">' + inr(counted) + '</span></div>' +
    (touched ? '<div class="banner ' + (Math.abs(diff) < 1 ? 'ok' : diff > 0 ? 'warn' : 'bad') + '"><span class="ic ' + (Math.abs(diff) < 1 ? 'ok' : diff > 0 ? 'warn' : 'bad') + '">' + icon(Math.abs(diff) < 1 ? 'checkCircle' : 'alert', 18) + '</span><span class="tx"><b>' + esc(Math.abs(diff) < 1 ? t('drawer_exact', 'Drawer matches exactly') : diff > 0 ? t('excess_amt', 'Excess {amt}', { amt: inr(diff) }) : t('short_amt', 'Short {amt}', { amt: inr(-diff) })) + '</b><small>' + esc(Math.abs(diff) < 1 ? t('drawer_exact_s', 'Nice work.') : t('add_note_mgr', 'Add a note — your manager will see it.')) + '</small></span></div>' + txtF(t('note', 'Note'), 'f.cs.note') : '') +
    busyBtn(t('close_print', 'Close shift'), 'closeShiftA', 'strong lg', touched ? '' : 'disabled', 'shift') + '</section>' + histHtml + '</div></div>';
}
A.openShiftA = async function () {
  var fl = r2(+S.f.os.float || 0);
  var ok = await tx('shift', async function () { var loc = curLoc(); var ex = await DB.collection('shifts').where('loc', '==', loc).where('status', '==', 'open').limit(1).get(); if (!ex.empty) throw fail(t('err_shift_open', 'A shift is already open at {l}.', { l: locName(loc) })); await put('shifts/' + uid('sh'), { loc: loc, by: ME.id || '', openAt: Date.now(), float: fl, status: 'open' }); return 1; });
  if (ok) { S.f.os = null; toast(t('shift_opened', 'Shift opened')); }
};
A.closeShiftA = async function () {
  var f = S.f.cs, sh = D.shifts[f.id]; if (!sh) return;
  var counted = sum(DENOMS, function (dn) { return dn * (+f.d[dn] || 0); });
  var ok = await tx('shift', async function () { var s = await fresh('shifts/' + f.id); if (!s || s.status !== 'open') return 1; var now = Date.now(); s.closeAt = now; var exp = shiftExpected(Object.assign({}, s)); s.expected = exp; s.counted = counted; s.diff = r2(counted - exp); s.denoms = f.d; s.note = f.note || ''; s.status = 'closed'; s.closedBy = ME.id || ''; await put('shifts/' + f.id, s); return 1; });
  if (ok) { S.f.cs = null; toast(t('shift_closed', 'Shift closed')); }
};

/* ===================== REPORTS ===================== */
function vReports() {
  var per = S.q.rp || '7', now = Date.now(), n = per === 'month' ? new Date().getDate() : +per;
  var keys = []; for (var i = n - 1; i >= 0; i--) keys.push(dayKey(now - i * 864e5));
  var inv = []; keys.forEach(function (k) { var d = dayDoc(k); if (d) vals(d.inv).forEach(function (x) { inv.push(x); }); });
  var sales = inv.filter(function (x) { return x.kind === 'sale'; }), cns = inv.filter(function (x) { return x.kind === 'cn'; });
  var net = sum(sales, function (x) { return x.total; }) - sum(cns, function (x) { return x.total; });
  var tax = sum(sales, function (x) { return x.tax; }) - sum(cns, function (x) { return x.tax; });
  var mix = { cash: 0, upi: 0, card: 0, credit: 0 }; sales.forEach(function (x) { var p = x.pay || {}; mix.cash += +p.cash || 0; mix.upi += +p.upi || 0; mix.card += +p.card || 0; mix.credit += +p.credit || 0; });
  var mixT = Math.max(1, mix.cash + mix.upi + mix.card + mix.credit);
  var top = {}; sales.forEach(function (x) { x.lines.forEach(function (l) { var k = l.name; top[k] = top[k] || { q: 0, v: 0 }; top[k].q += l.qty; top[k].v += l.total; }); });
  var topL = Object.keys(top).sort(function (a, b) { return top[b].v - top[a].v; }).slice(0, 8);
  var cost = 0; sales.forEach(function (x) { x.lines.forEach(function (l) { var p = D.products[l.pid]; if (p) cost += (+p.cost || 0) * l.qty; }); });
  var taxable = sum(sales, function (x) { return x.taxable; }) - sum(cns, function (x) { return x.taxable; });
  var slabs = {}; sales.forEach(function (x) { x.lines.forEach(function (l) { slabs[l.gst] = slabs[l.gst] || { tv: 0, tx: 0 }; slabs[l.gst].tv += l.taxable; slabs[l.gst].tx += l.tax; }); }); cns.forEach(function (x) { x.lines.forEach(function (l) { slabs[l.gst] = slabs[l.gst] || { tv: 0, tx: 0 }; slabs[l.gst].tv -= l.taxable; slabs[l.gst].tx -= l.tax; }); });
  var chart = keys.map(function (k, i) { return { label: n <= 7 ? fmtD(keyToTs(k), { weekday: 'narrow' }) : (i % Math.ceil(n / 8) === 0 ? String(+k.slice(8)) : ''), v: daySales(k).total, hi: k === dayKey(now) }; });
  var exp = 0; keys.forEach(function (k) { var d = dayDoc(k); if (d) exp += sum(vals(d.exp), function (x) { return x.amt; }); });
  return ph(t('nav_reports', 'Reports'), '', DL ? '<button class="btn line sm" data-a="exportInv">' + icon('download', 16) + esc(t('export_csv', 'Export CSV')) + '</button>' : '') + '<div class="stack lg">' + seg('q.rp', [['7', t('last7', 'Last 7 days')], ['30', t('last30', 'Last 30 days')], ['month', t('this_month', 'This month')]]) +
    '<div class="g4" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + [[t('net_sales', 'Net sales'), inrS(net)], [t('bills', 'Bills'), nf(sales.length)], [t('avg_bill', 'Avg. bill'), inr(sales.length ? net / sales.length : 0)], [t('gross_margin', 'Gross margin (est.)'), taxable ? Math.round((taxable - cost) / taxable * 100) + '%' : '—'], [t('gst_collected', 'GST collected'), inr(tax)], [t('nav_expenses', 'Expenses'), inr(exp)]].map(function (x) { return '<div class="kpi"><small>' + esc(x[0]) + '</small><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>' +
    '<div class="cols"><section class="card pad stack"><b>' + esc(t('daily_sales', 'Daily sales')) + '</b>' + barChart(chart, 150) + '</section>' +
    '<section class="card pad stack"><b>' + esc(t('pay_mix', 'Payment mix')) + '</b>' + ['cash', 'upi', 'card', 'credit'].map(function (m) { return '<div class="stack sm" style="gap:5px"><div class="between small"><span class="rowx" style="gap:6px">' + icon(payIcon(m), 15) + esc(payName(m)) + '</span><span><b class="num">' + inr(mix[m]) + '</b> <span class="muted">' + Math.round(mix[m] / mixT * 100) + '%</span></span></div><div style="height:8px;border-radius:999px;background:var(--surface2)"><div style="height:8px;border-radius:999px;width:' + (mix[m] / mixT * 100) + '%;background:' + (m === 'credit' ? 'var(--warn-solid)' : m === 'upi' ? 'var(--accent)' : 'var(--strong)') + '"></div></div></div>'; }).join('') + '</section></div>' +
    '<div class="cols"><section class="stack sm"><div class="sect"><h3>' + esc(t('top_items', 'Top garments')) + '</h3></div>' + (topL.length ? '<div class="list">' + topL.map(function (k, i) { return '<div class="li"><span class="ic">' + (i + 1) + '</span><span class="tx"><b>' + esc(k) + '</b><small>' + esc(t('n_units', '{n} units', { n: top[k].q })) + '</small></span><b class="num">' + inr(top[k].v) + '</b></div>'; }).join('') + '</div>' : '<div class="card pad small muted">' + esc(t('no_sales_period', 'No sales in this period')) + '</div>') + '</section>' +
    '<section class="stack sm"><div class="sect"><h3>' + esc(t('gst_summary', 'GST summary')) + '</h3></div><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>' + esc(t('iv_gst_rate', 'GST rate')) + '</th><th class="r">' + esc(t('iv_taxable', 'Taxable')) + '</th><th class="r">CGST</th><th class="r">SGST</th></tr></thead><tbody>' + (Object.keys(slabs).length ? Object.keys(slabs).sort().map(function (k) { return '<tr><td>' + esc(k) + '%</td><td class="r">' + inr(slabs[k].tv, 1) + '</td><td class="r">' + inr(slabs[k].tx / 2, 1) + '</td><td class="r">' + inr(slabs[k].tx / 2, 1) + '</td></tr>'; }).join('') : '<tr><td colspan="4" class="muted">' + esc(t('no_sales_period', 'No sales in this period')) + '</td></tr>') + '</tbody></table></div><span class="xsmall muted">' + esc(t('gst_note', 'Net of credit notes. Intra-state supply (CGST + SGST).')) + '</span></section></div></div>';
}
