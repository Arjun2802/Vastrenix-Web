/* Vastrenix site: mobile menu and header edge. No tracking, no third-party code. */
(function () {
  'use strict';
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav'), top = document.getElementById('top');
  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }
  if (btn && nav) {
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); } });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }
  if (top) {
    var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Prices are managed in the admin console; refresh them from the payment server when it's available. */
  var plansEl = document.querySelector('.plans');
  if (plansEl && window.fetch) {
    var nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }), inr = function (n) { return '₹' + nf.format(Math.round(n)); };
    fetch('/api/public/plans', { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !Array.isArray(j.plans) || !j.plans.length) return;
      var by = {}; j.plans.forEach(function (p) { by[p.cycle] = p; });
      var monthly = by.monthly && by.monthly.amount / by.monthly.days * 30;
      j.plans.forEach(function (p) {
        var card = plansEl.querySelector('[data-plan="' + p.cycle + '"]');
        if (!card || !(p.amount > 0) || !(p.days > 0)) return;
        if (!p.active) { card.hidden = true; return; }
        var pm = p.amount / p.days * 30, save = monthly ? Math.round((1 - pm / monthly) * 100) : 0;
        var amt = card.querySelector('.amt'), note = card.querySelector('.note'), tag = card.querySelector('.tag'), h3 = card.querySelector('h3');
        if (h3 && h3.firstChild && h3.firstChild.nodeType === 3) h3.firstChild.nodeValue = String(p.label).slice(0, 40) + (tag ? ' ' : '');
        if (amt) amt.textContent = inr(p.amount);
        if (note && p.cycle !== 'monthly') note.textContent = 'Works out to ' + inr(pm) + ' a month.';
        if (tag) { if (save >= 3) tag.textContent = 'Save ' + save + '%'; else tag.hidden = true; }
      });
      plansEl.classList.toggle('two', plansEl.querySelectorAll('.plan:not([hidden])').length === 2);
    }).catch(function () { });
  }
})();
