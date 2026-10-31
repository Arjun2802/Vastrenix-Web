/* ===== Pure business logic (also used to build demo data) ===== */
var VXC = (function () {
  function r2(n) { return Math.round((+n + Number.EPSILON) * 100) / 100; }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function monthKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2); }

  /* lines: [{qty, rate, gst}] ; opts: {incl:boolean, disc:{type:'amt'|'pct', v:number}} */
  function calcBill(lines, opts) {
    opts = opts || {};
    var gross = r2(lines.reduce(function (s, l) { return s + (+l.qty || 0) * (+l.rate || 0); }, 0));
    var d = 0;
    if (opts.disc && +opts.disc.v > 0) {
      d = opts.disc.type === 'pct' ? gross * Math.min(100, +opts.disc.v) / 100 : Math.min(gross, +opts.disc.v);
    }
    d = r2(d);
    var f = gross ? (gross - d) / gross : 1;
    var taxable = 0, tax = 0, total = 0, qty = 0, slabs = {};
    var out = lines.map(function (l) {
      var amt = (+l.qty || 0) * (+l.rate || 0) * f, g = (+l.gst || 0) / 100, tv, tx, lt;
      if (opts.incl) { tv = amt / (1 + g); tx = amt - tv; lt = amt; } else { tv = amt; tx = amt * g; lt = amt + tx; }
      taxable += tv; tax += tx; total += lt; qty += (+l.qty || 0);
      var k = String(+l.gst || 0);
      slabs[k] = slabs[k] || { taxable: 0, tax: 0 };
      slabs[k].taxable += tv; slabs[k].tax += tx;
      var o = {}; for (var key in l) o[key] = l[key];
      o.taxable = r2(tv); o.tax = r2(tx); o.total = r2(lt);
      return o;
    });
    Object.keys(slabs).forEach(function (k) { slabs[k].taxable = r2(slabs[k].taxable); slabs[k].tax = r2(slabs[k].tax); });
    total = r2(total);
    var grand = Math.round(total);
    tax = r2(tax);
    var cgst = r2(tax / 2);
    return { lines: out, gross: gross, disc: d, taxable: r2(taxable), tax: tax, cgst: cgst, sgst: r2(tax - cgst), total: total, round: r2(grand - total), grand: grand, slabs: slabs, qty: qty };
  }

  function variantStock(v) { var s = 0, st = v.stock || {}; for (var k in st) s += (+st[k] || 0); return s; }
  function variantAvail(v) { return variantStock(v) - (+v.reserved || 0); }

  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
  function three(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : ''); }
  function words(num) {
    num = Math.round(Math.abs(num));
    if (!num) return 'Zero Rupees Only';
    var parts = [], cr = Math.floor(num / 1e7), lk = Math.floor(num / 1e5) % 100, th = Math.floor(num / 1000) % 100, rest = num % 1000;
    if (cr) parts.push(three(cr) + ' Crore');
    if (lk) parts.push(two(lk) + ' Lakh');
    if (th) parts.push(two(th) + ' Thousand');
    if (rest) parts.push(three(rest));
    return 'Rupees ' + parts.join(' ') + ' Only';
  }

  /* FIFO aging of a customer's credit vs payments. txns: [{t:'credit'|'pay', amt, at}] */
  function aging(txns, now) {
    var open = [], b = { a: 0, b: 0, c: 0, oldest: null };
    (txns || []).slice().sort(function (x, y) { return x.at - y.at; }).forEach(function (t) {
      if (t.t === 'credit') open.push({ amt: +t.amt, at: t.at });
      else {
        var p = +t.amt;
        while (p > 0.001 && open.length) { var o = open[0]; var u = Math.min(o.amt, p); o.amt -= u; p -= u; if (o.amt <= 0.001) open.shift(); }
      }
    });
    open.forEach(function (o) {
      var days = Math.floor((now - o.at) / 864e5);
      if (b.oldest === null || o.at < b.oldest) b.oldest = o.at;
      if (days <= 30) b.a += o.amt; else if (days <= 60) b.b += o.amt; else b.c += o.amt;
    });
    b.a = r2(b.a); b.b = r2(b.b); b.c = r2(b.c);
    return b;
  }

  function monthEnd(ts) { var d = new Date(ts); return new Date(d.getFullYear(), d.getMonth() + 1, 0, 20, 0, 0).getTime(); }

  return { r2: r2, pad: pad, dayKey: dayKey, monthKey: monthKey, calcBill: calcBill, variantStock: variantStock, variantAvail: variantAvail, words: words, aging: aging, monthEnd: monthEnd };
})();
if (typeof module !== 'undefined') module.exports = VXC;
