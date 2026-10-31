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
})();
