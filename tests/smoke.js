// Run: npm test   (needs: npx playwright install chromium)
// Headless smoke test: boots the app in offline mode, onboards with demo data, visits every route & sub-screen.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, "..", "www")); const OUT = process.argv[3] || path.join(require("os").tmpdir(), "vastrenix-shots");
fs.mkdirSync(OUT, { recursive: true });
const types = { '.woff2': 'font/woff2', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  if (p === '/js/config.js') { s.writeHead(200, { 'content-type': 'text/javascript' }); return s.end('window.VX_CONFIG={firebase:{apiKey:""}};'); }
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
}).listen(0);
(async () => {
  const port = srv.address().port; const b = await chromium.launch();
  const errs = [];
  for (const vp of [{ w: 390, h: 844, n: 'm' }, { w: 1366, h: 860, n: 'd' }]) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, colorScheme: process.env.SCHEME || 'light' });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(`[${vp.n}] pageerror: ${e.message}`));
    pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`[${vp.n}] console.${m.type()}: ${m.text()}`); });
    await pg.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    await pg.goto(`http://localhost:${port}/`); await pg.waitForTimeout(800);
    await pg.screenshot({ path: `${OUT}/${vp.n}-00-onboard.png` });
    await pg.evaluate(async () => { Object.assign(S.f.ob, { name: 'Shree Fashion', city: 'Surat', phone: '9876543210', demo: true }); });
    for (let i = 0; i < 8; i++) { const done = await pg.evaluate(() => computeGate() === 'app'); if (done) break; await pg.evaluate(() => A.obNext && A.obNext()); await pg.waitForTimeout(500); }
    await pg.waitForTimeout(1500);
    const routes = await pg.evaluate(() => Object.keys(ROUTES));
    let i = 1;
    for (const r of routes) {
      await pg.evaluate(r => go(r), r); await pg.waitForTimeout(350);
      const bad = await pg.evaluate(() => !!document.querySelector('.gate h1') && document.querySelector('.gate h1').textContent);
      if (bad) errs.push(`[${vp.n}] route ${r} render error: ${bad} :: ${await pg.evaluate(() => (document.querySelector('.gate p') || {}).textContent)}`);
      await pg.screenshot({ path: `${OUT}/${vp.n}-${String(i++).padStart(2, '0')}-${r}.png`, fullPage: false });
    }
    // sub screens & sheets
    const subs = await pg.evaluate(() => Object.keys(window.SUBS || {}));
    for (const k of subs) {
      await pg.evaluate(k => { go('home'); try { var p = vals(D.products)[0], c = vals(D.customers)[0], inv = allInvoices()[0], dl = vals(D.dealers)[0]; openSub(k, { id: (k.match(/prod/i) && p && p.id) || (k.match(/cust/i) && c && c.id) || (k.match(/inv/i) && inv && inv.id) || (k.match(/deal/i) && dl && dl.id) || (p && p.id), day: inv && inv.day }); } catch (e) { console.error('openSub ' + k + ': ' + e.message); } }, k);
      await pg.waitForTimeout(250);
      const bad = await pg.evaluate(() => !!document.querySelector('.gate h1') && document.querySelector('.gate p') && document.querySelector('.gate p').textContent);
      if (bad) errs.push(`[${vp.n}] sub ${k}: ${bad}`);
      if (vp.n === 'm') await pg.screenshot({ path: `${OUT}/${vp.n}-s-${k}.png` });
    }
    const sheets = await pg.evaluate(() => (typeof SHEETS !== 'undefined') ? Object.keys(SHEETS) : []);
    for (const k of sheets) {
      await pg.evaluate(k => { S.sub = null; go('home'); try { openSheet(k, {}); } catch (e) { console.error('sheet ' + k + e.message); } }, k);
      await pg.waitForTimeout(200);
    }
    await ctx.close();
  }
  const uniq = [...new Set(errs)]; console.log(uniq.length ? uniq.join('\n') : 'Smoke test passed: no errors on any screen.'); process.exitCode = uniq.length ? 1 : 0;
  await b.close(); srv.close();
})();
