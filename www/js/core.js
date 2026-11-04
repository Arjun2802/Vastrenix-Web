/* ===================== ICONS (Lucide, ISC) ===================== */
var IC = (function () {
  function C(x, y, r) { return 'M' + (x - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0'; }
  function R(x, y, w, h, r) { return 'M' + (x + r) + ' ' + y + 'h' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'v' + (h - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r + 'h' + (-(w - 2 * r)) + 'a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + (-r) + 'v' + (-(h - 2 * r)) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + (-r) + 'z'; }
  return {
    home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    receipt: ['M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z', 'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8', 'M12 17.5v-11'],
    shirt: ['M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z'],
    package: ['M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z', 'M12 22V12', 'm3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7', 'm7.5 4.27 9 5.15'],
    truck: ['M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', 'M15 18H9', 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14', C(17, 18, 2), C(7, 18, 2)],
    grid: [R(3, 3, 7, 7, 1), R(14, 3, 7, 7, 1), R(14, 14, 7, 7, 1), R(3, 14, 7, 7, 1)],
    search: [C(11, 11, 8), 'm21 21-4.3-4.3'],
    bell: ['M10.268 21a2 2 0 0 0 3.464 0', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'],
    plus: ['M5 12h14', 'M12 5v14'], minus: ['M5 12h14'],
    scan: ['M3 7V5a2 2 0 0 1 2-2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M21 17v2a2 2 0 0 1-2 2h-2', 'M7 21H5a2 2 0 0 1-2-2v-2', 'M8 7v10', 'M12 7v10', 'M17 7v10'],
    chevR: ['m9 18 6-6-6-6'], chevL: ['m15 18-6-6 6-6'], chevD: ['m6 9 6 6 6-6'], chevU: ['m18 15-6-6-6 6'],
    trendUp: ['M16 7h6v6', 'm22 7-8.5 8.5-5-5L2 17'], trendDown: ['M16 17h6v-6', 'm22 17-8.5-8.5-5 5L2 7'],
    alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
    wallet: ['M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'],
    users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', C(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    userPlus: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', C(9, 7, 4), 'M19 8v6', 'M22 11h-6'],
    user: [C(12, 8, 5), 'M20 21a8 8 0 0 0-16 0'],
    banknote: [R(2, 6, 20, 12, 2), C(12, 12, 2), 'M6 12h.01M18 12h.01'],
    card: [R(2, 5, 20, 14, 2), 'M2 10h20'],
    qr: [R(3, 3, 5, 5, 1), R(16, 3, 5, 5, 1), R(3, 16, 5, 5, 1), 'M21 16h-3a2 2 0 0 0-2 2v3', 'M21 21v.01', 'M12 7v3a2 2 0 0 1-2 2H7', 'M3 12h.01', 'M12 3h.01', 'M12 16v.01', 'M16 12h1', 'M21 12v.01', 'M12 21v-1'],
    split: ['M16 3h5v5', 'M8 3H3v5', 'M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3', 'm15 9 6-6'],
    share: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
    download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
    check: ['M20 6 9 17l-5-5'], checkCircle: [C(12, 12, 10), 'm9 12 2 2 4-4'],
    mail: [R(2, 4, 20, 16, 2), 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'],
    lock: [R(3, 11, 18, 11, 2), 'M7 11V7a5 5 0 0 1 10 0v4'],
    eye: ['M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0', C(12, 12, 3)],
    globe: [C(12, 12, 10), 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
    filter: ['M10 5H3', 'M12 19H3', 'M14 3v4', 'M16 17v4', 'M21 12h-9', 'M21 19h-5', 'M21 5h-7', 'M8 10v4', 'M8 12H3'],
    clock: [C(12, 12, 10), 'M12 6v6l4 2'],
    moreV: [C(12, 12, 1), C(12, 5, 1), C(12, 19, 1)],
    x: ['M18 6 6 18', 'm6 6 12 12'],
    mapPin: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0', C(12, 10, 3)],
    arrowR: ['M5 12h14', 'm12 5 7 7-7 7'], arrowL: ['m12 19-7-7 7-7', 'M19 12H5'],
    arrowUR: ['M7 7h10v10', 'M7 17 17 7'], arrowDL: ['M17 7 7 17', 'M17 17H7V7'],
    phone: ['M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384'],
    store: ['M2 7l2-4h16l2 4', 'M2 7h20', 'M22 7v3a2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0V7', 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4'],
    settings: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', C(12, 12, 3)],
    file: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8'],
    calendar: ['M8 2v4', 'M16 2v4', R(3, 4, 18, 18, 2), 'M3 10h18'],
    tag: ['M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z', 'M7.5 7.5h.01'],
    transfer: ['M8 3 4 7l4 4', 'M4 7h16', 'm16 21 4-4-4-4', 'M20 17H4'],
    chart: ['M3 3v16a2 2 0 0 0 2 2h16', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
    shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'],
    palette: ['M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z', 'M13.5 6.5h.01', 'M17.5 10.5h.01', 'M6.5 12.5h.01', 'M8.5 7.5h.01'],
    cloud: ['M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'],
    edit: ['M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z', 'm15 5 4 4'],
    trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
    camera: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', C(12, 13, 3)],
    network: [R(16, 16, 6, 6, 1), R(2, 16, 6, 6, 1), R(9, 2, 6, 6, 1), 'M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3', 'M12 12V8'],
    undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11'],
    calculator: [R(4, 2, 16, 20, 2), 'M8 6h8', 'M16 14v4', 'M16 10h.01', 'M12 10h.01', 'M8 10h.01', 'M12 14h.01', 'M8 14h.01', 'M12 18h.01', 'M8 18h.01'],
    copy: [R(8, 8, 14, 14, 2), 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
    send: ['M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z', 'm21.854 2.147-10.94 10.939'],
    warehouse: ['M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z', 'M6 18h12', 'M6 14h12', 'M6 22V10h12v12'],
    clipboard: [R(8, 2, 8, 4, 1), 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'm9 14 2 2 4-4'],
    building: [R(4, 2, 16, 20, 2), 'M9 22v-4h6v4', 'M8 6h.01', 'M16 6h.01', 'M12 6h.01', 'M12 10h.01', 'M12 14h.01', 'M16 10h.01', 'M16 14h.01', 'M8 10h.01', 'M8 14h.01'],
    refresh: ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'],
    info: [C(12, 12, 10), 'M12 16v-4', 'M12 8h.01'],
    percent: ['M19 5 5 19', C(6.5, 6.5, 2.5), C(17.5, 17.5, 2.5)],
    message: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
    box: ['M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12'],
    layers: ['M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z', 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65', 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'],
    archive: [R(2, 3, 20, 5, 1), 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8', 'M10 12h4'],
    pause: [R(14, 4, 4, 16, 1), R(6, 4, 4, 16, 1)],
    sparkles: ['m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z', 'M5 3v4', 'M19 17v4', 'M3 5h4', 'M17 19h4'],
    sun: [C(12, 12, 4), 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
    moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
    logout: ['m16 17 5-5-5-5', 'M21 12H9', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'],
    upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
    zap: ['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']
  };
})();
var ICON_CACHE = {};
function icon(n, s, sw) { var key = n + '|' + s + '|' + sw; if (ICON_CACHE[key]) return ICON_CACHE[key]; var p = IC[n] || IC.home; s = s || 20; return (ICON_CACHE[key] = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.75) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</svg>'); }
function isDarkTheme() {
  try {
    var th = (typeof lsGet === 'function' && lsGet('vx-theme')) || (typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute('data-theme'));
    if (th === 'dark') return true;
    if (th === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) { return false; }
}
function logo(s, dark) {
  var d = dark != null ? dark : isDarkTheme();
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="14" fill="' + (d ? '#231C4C' : '#0E0E12') + '"/><path d="M13 13.5 L24 35 L35 13.5" stroke="#FFFFFF" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 22 H28.2 M33.4 22 H39.5" stroke="' + (d ? '#7A63FF' : '#5B3DF5') + '" stroke-width="3" stroke-linecap="round"/></svg>';
}

/* ===================== UTILITIES ===================== */
var r2 = VXC.r2, dayKey = VXC.dayKey, monthKey = VXC.monthKey;
/* Only allow image sources we created ourselves (data:image/…, https:, blob:) and escape them for HTML attributes. */
function safeImg(u) { u = String(u == null ? '' : u).trim(); return /^(data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+\/=\s]+|https:\/\/[^\s"'<>()\\]+|blob:[^\s"'<>()\\]+)$/i.test(u) ? u : ''; }
function cssUrl(u) { u = safeImg(u); return u ? '&quot;' + u.replace(/[\s"]/g, '') + '&quot;' : 'none'; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var NF0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
var NF2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function inr(n, dec) { n = +n || 0; return (n < -0.004 ? '−' : '') + '₹' + (dec ? NF2.format(Math.abs(n)) : NF0.format(Math.round(Math.abs(n)))); }
function inrS(n) { var a = Math.abs(+n || 0), s = n < 0 ? '−' : ''; if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + 'Cr'; if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + 'L'; return inr(n); }
function num(v) { var x = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(x) ? x : 0; }
function nf(n) { return NF0.format(Math.round(+n || 0)); }
function uid(p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }
function vals(o) { return o ? Object.keys(o).map(function (k) { return o[k]; }).filter(Boolean) : []; }
function sum(a, f) { return a.reduce(function (s, x, i) { return s + (+(f ? f(x, i) : x) || 0); }, 0); }
function by(f, desc) { return function (a, b) { var x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1); }; }
function initials(name) { var p = String(name || '?').trim().split(/\s+/).filter(function (w) { return /^[\p{L}\p{N}]/u.test(w); }); if (!p.length) return '?'; return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : (p[0][1] || ''))).toUpperCase(); }
function phoneDigits(p) { var d = String(p || '').replace(/\D/g, ''); if (d.length > 10 && d.indexOf('91') === 0) d = d.slice(2); return d.slice(-10); }
function fmtPhone(p) { var d = phoneDigits(p); return d.length === 10 ? d.slice(0, 5) + ' ' + d.slice(5) : (p || ''); }
function waLink(phone, text) { var d = phoneDigits(phone); return 'https://wa.me/' + (d ? '91' + d : '') + '?text=' + encodeURIComponent(text); }
function locale() { return LANG === 'hi' ? 'hi-IN' : LANG === 'gu' ? 'gu-IN' : 'en-IN'; }
function fmtD(ts, o) { try { return new Date(ts).toLocaleDateString(locale(), o || { day: 'numeric', month: 'short' }); } catch (e) { return ''; } }
function fmtDY(ts) { return fmtD(ts, { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtT(ts) { try { return new Date(ts).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
function fmtDay(key) { var p = key.split('-'); var ts = new Date(+p[0], +p[1] - 1, +p[2]).getTime(); var today = dayKey(Date.now()), yest = dayKey(Date.now() - 864e5); if (key === today) return t('today', 'Today'); if (key === yest) return t('yesterday', 'Yesterday'); return fmtD(ts, { weekday: 'short', day: 'numeric', month: 'short' }); }
function keyToTs(key) { var p = key.split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)).getTime(); }
function ago(ts) { if (!ts) return '—'; var d = Math.floor((Date.now() - ts) / 864e5); if (dayKey(ts) === dayKey(Date.now())) return t('today', 'Today'); if (d <= 1) return t('yesterday', 'Yesterday'); if (d < 30) return t('days_ago', '{n} days ago', { n: d }); return fmtD(ts); }
var SWATCH = { indigo: '#2E3A7A', navy: '#1F2A4A', wine: '#7A1F3D', maroon: '#6B1E2A', red: '#A3262A', rust: '#9A4A2B', mustard: '#B8860B', yellow: '#C9A227', green: '#3F6B4A', olive: '#6B7F5E', teal: '#1F4E5F', blue: '#2F5DA8', sky: '#5B8DB8', pink: '#C2557A', peach: '#D9926B', purple: '#5B3D8A', lavender: '#8A7BB8', black: '#1A1A1F', charcoal: '#3B3B44', grey: '#7A7A85', gray: '#7A7A85', white: '#E9E6DF', ivory: '#E9E1D0', cream: '#E5D9BF', beige: '#C9B79C', brown: '#6E4B33', gold: '#B08D2E', silver: '#9EA3AA' };
function colorOf(name) { var k = String(name || '').toLowerCase().trim(); if (SWATCH[k]) return SWATCH[k]; var h = 0; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % 360; return 'hsl(' + h + ' 35% 38%)'; }

/* ===================== I18N ===================== */
var LANG = lsGet('vx-lang') || 'en';
var I18N = {};
function t(k, en, v) { var s = (LANG !== 'en' && I18N[LANG] && I18N[LANG][k]) || en; if (v) s = s.replace(/\{(\w+)\}/g, function (_, x) { return v[x] != null ? v[x] : ''; }); return s; }

/* ===================== LOCAL DB (fallback when the shared store is unavailable) ===================== */
function makeLocalDB() {
  var KEY = 'vx-local-db-v1', data = {}, subs = [], saveT = null;
  try { data = JSON.parse(lsGet(KEY) || '{}') || {}; } catch (e) { data = {}; }
  function persist() { clearTimeout(saveT); saveT = setTimeout(function () { lsSet(KEY, JSON.stringify(data)); }, 250); }
  function notify() { subs.slice().forEach(function (f) { f(); }); }
  function parentOf(p) { return p.split('/').slice(0, -1).join('/'); }
  function snap(p) { return { id: p.split('/').pop(), exists: Object.prototype.hasOwnProperty.call(data, p), data: function () { return data[p] ? clone(data[p]) : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } }; }
  function merge(a, b) { Object.keys(b).forEach(function (k) { var x = b[k]; if (x && typeof x === 'object' && !Array.isArray(x) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], x); else a[k] = x; }); return a; }
  function cmp(a, op, b) { switch (op) { case '==': return a === b; case '!=': return a !== b; case '<': return a < b; case '<=': return a <= b; case '>': return a > b; case '>=': return a >= b; case 'in': return b.indexOf(a) >= 0; case 'not-in': return b.indexOf(a) < 0; case 'array-contains': return Array.isArray(a) && a.indexOf(b) >= 0; } return false; }
  function listen(fn) { subs.push(fn); setTimeout(fn, 0); return function () { subs = subs.filter(function (x) { return x !== fn; }); }; }
  function doc(p) {
    return {
      id: p.split('/').pop(), path: p,
      get: function () { return Promise.resolve(snap(p)); },
      set: function (o) { data[p] = clone(o); persist(); notify(); return Promise.resolve(); },
      update: function (o) { if (!data[p]) return Promise.reject({ code: 'invalid_argument', message: 'Document does not exist' }); merge(data[p], clone(o)); persist(); notify(); return Promise.resolve(); },
      delete: function () { delete data[p]; persist(); notify(); return Promise.resolve(); },
      acquire: function () { return Promise.resolve({ acquired: true }); },
      onSnapshot: function (next) { return listen(function () { next(snap(p)); }); },
      collection: function (c) { return coll(p + '/' + c); }
    };
  }
  function query(path, filters, order, lim) {
    function run() {
      var docs = Object.keys(data).filter(function (k) { return parentOf(k) === path; });
      filters.forEach(function (f) { docs = docs.filter(function (k) { return cmp(data[k][f[0]], f[1], f[2]); }); });
      if (order) docs.sort(function (a, b) { var x = data[a][order[0]], y = data[b][order[0]]; if (x === y) return 0; if (x === undefined) return 1; if (y === undefined) return -1; return (x < y ? -1 : 1) * (order[1] === 'desc' ? -1 : 1); });
      else docs.sort();
      if (lim) docs = docs.slice(0, lim);
      var out = docs.map(snap);
      return { docs: out, size: out.length, empty: !out.length, docChanges: function () { return []; }, metadata: { fromCache: false, hasPendingWrites: false } };
    }
    return {
      where: function (f, op, v) { return query(path, filters.concat([[f, op, v]]), order, lim); },
      orderBy: function (f, d) { return query(path, filters, [f, d || 'asc'], lim); },
      limit: function (n) { return query(path, filters, order, n); },
      get: function () { return Promise.resolve(run()); },
      onSnapshot: function (next) { return listen(function () { next(run()); }); }
    };
  }
  function coll(path) { var q = query(path, [], null, 0); q.path = path; q.doc = function (id) { return doc(path + '/' + (id || uid())); }; q.add = function (o) { var r = doc(path + '/' + uid()); return r.set(o).then(function () { return r; }); }; return q; }
  return { doc: doc, collection: coll, local: true };
}

/* ===================== STATE ===================== */
var DB = null, USER = null, DL = null;
var MODE = 'connecting'; // live | local
var SESSION = uid('s');
var D = { store: null, subscription: null, counters: null, products: {}, customers: {}, suppliers: {}, dealers: {}, ledger: {}, ledgerOld: {}, shifts: {}, pos: {}, dorders: {}, transfers: {}, held: {}, staff: {}, requests: {}, fabricJobs: {}, loaded: {}, err: {}, sync: 'live', profiles: {} };
var ME = { id: null, name: '', avatar: '', isOwner: false, canEdit: false, role: null, gate: 'boot', staffDoc: null, reqDoc: null };
var S = { route: 'home', sub: null, sheet: null, toasts: [], q: {}, f: {}, ui: {}, busy: null, loc: lsGet('vx-loc') || null, boot: { db: 0, user: 0, data: 0 } };

/* ===================== ROLES ===================== */
var ROLES = {
  owner: ['sell', 'stock', 'purchase', 'money', 'dealers', 'people', 'settings'],
  admin: ['sell', 'stock', 'purchase', 'money', 'dealers', 'people', 'settings'],
  manager: ['sell', 'stock', 'purchase', 'money', 'dealers', 'people'],
  cashier: ['sell'], inventory: ['stock'], purchase: ['purchase', 'stock'], accountant: ['money'], dispatcher: ['dealers'], auditor: []
};
var ROLE_LIST = ['admin', 'manager', 'cashier', 'inventory', 'purchase', 'accountant', 'dispatcher', 'auditor'];
function roleName(r) { return t('role_' + r, { owner: 'Owner', admin: 'Admin', manager: 'Branch manager', cashier: 'Cashier', inventory: 'Inventory manager', purchase: 'Purchase manager', accountant: 'Accountant', dispatcher: 'Dispatcher', auditor: 'Auditor' }[r] || r); }
function can(p) { var r = ROLES[ME.role] || []; return r.indexOf(p) >= 0; }
function canAny(list) { if (!list || !list.length) return true; if (ME.role === 'auditor') return true; return list.some(can); }
function readOnly() { return ME.role === 'auditor'; }

/* ===================== DATA LAYER ===================== */
var unsubs = [];
function watchColl(key, q) {
  unsubs.push(q.onSnapshot(function (snap) {
    var m = {};
    snap.docs.forEach(function (d) { var o = d.data(); if (o) { o = Object.assign({}, o); o.id = d.id; m[d.id] = o; } });
    D[key] = m; D.loaded[key] = true; D.sync = snap.metadata && snap.metadata.fromCache ? 'syncing' : 'live'; delete D.err[key];
    schedule();
  }, function (e) { D.err[key] = (e && e.code) || 'unavailable'; D.loaded[key] = true; D.sync = 'error'; schedule(); }));
}
function watchDoc(key, ref, cb) {
  unsubs.push(ref.onSnapshot(function (s) {
    D[key] = s.exists ? Object.assign({}, s.data(), { id: s.id }) : null; D.loaded[key] = true; delete D.err[key];
    if (cb) cb(D[key]);
    schedule();
  }, function (e) { D.err[key] = (e && e.code) || 'unavailable'; D.loaded[key] = true; schedule(); }));
}
function startData() {
  if (S.dataStarted) return; S.dataStarted = true;
  watchDoc('subscription', DB.doc('meta/subscription'));
  watchColl('products', DB.collection('products'));
  watchColl('customers', DB.collection('customers'));
  watchColl('suppliers', DB.collection('suppliers'));
  watchColl('dealers', DB.collection('dealers'));
  watchColl('staff', DB.collection('staff'));
  watchColl('ledger', DB.collection('ledger').orderBy('day', 'desc').limit(62));
  watchColl('shifts', DB.collection('shifts').orderBy('openAt', 'desc').limit(60));
  watchColl('pos', DB.collection('pos').orderBy('createdAt', 'desc').limit(300));
  watchColl('dorders', DB.collection('dorders').orderBy('createdAt', 'desc').limit(300));
  watchColl('transfers', DB.collection('transfers').orderBy('at', 'desc').limit(150));
  watchColl('held', DB.collection('held'));
  watchColl('fabricJobs', DB.collection('fabricJobs').orderBy('queuedAt', 'desc').limit(100));
  if (ME.isOwner || ME.canEdit || MODE === 'local') watchColl('requests', DB.collection('requests'));
}

/* ===================== SUBSCRIPTION & 3D TRIAL ===================== */
function subState() {
  var s = D.subscription, now = Date.now();
  if (!s) {
    var st = storeV(), ca = (st && st.createdAt) || now;
    var ends = ca + 7 * 864e5;
    var exp = now > ends;
    return {
      status: exp ? 'expired' : 'trialing',
      trialStartedAt: ca,
      trialEndsAt: ends,
      trialThreeDUsed: 0,
      trialThreeDLimit: 3,
      cycleId: null,
      daysLeft: Math.max(0, Math.ceil((ends - now) / 864e5)),
      isExpired: exp,
      isTrial: !exp,
      isActive: false
    };
  }
  var isTrial = s.status === 'trialing';
  var isExpired = false;
  var daysLeft = 0;
  if (isTrial) {
    var trialEnds = s.trialEndsAt || (s.trialStartedAt + 7 * 864e5);
    isExpired = now > trialEnds;
    daysLeft = Math.max(0, Math.ceil((trialEnds - now) / 864e5));
  } else if (s.status === 'active') {
    isExpired = !!(s.expiresAt && now > s.expiresAt);
  } else if (s.status === 'past_due' || s.status === 'cancelled' || s.status === 'suspended') {
    isExpired = true;
  }
  return {
    status: isExpired ? 'expired' : s.status,
    trialStartedAt: s.trialStartedAt,
    trialEndsAt: s.trialEndsAt,
    trialThreeDUsed: +s.trialThreeDUsed || 0,
    trialThreeDLimit: s.trialThreeDLimit != null ? +s.trialThreeDLimit : 3,
    cycleId: s.cycleId,
    daysLeft: daysLeft,
    isExpired: isExpired,
    isTrial: isTrial && !isExpired,
    isActive: s.status === 'active' && !isExpired
  };
}

window.checkAndConsume3DAllowance = async function (businessId, reqData) {
  /* the store id is the owner's uid (storeV().id is just the doc id 'store') */
  var sid = (storeV() && storeV().ownerId) || ME.id;
  var sub = subState();
  if (sub.isExpired) {
    return {
      allowed: false,
      reason: 'trial_ended',
      message: t('threed_trial_ended', 'Your free trial has ended — subscribe to continue using 3D fabric previews.')
    };
  }
  if (sub.isTrial || sub.status === 'trialing') {
    if (sub.trialThreeDUsed >= sub.trialThreeDLimit) {
      return {
        allowed: false,
        reason: 'trial_limit_reached',
        used: sub.trialThreeDUsed,
        limit: sub.trialThreeDLimit,
        message: t('threed_trial_limit', "You've used all {limit} free 3D previews during your trial — subscribe to continue using this feature.", { limit: sub.trialThreeDLimit })
      };
    }
    var newCount = sub.trialThreeDUsed + 1;
    var now = Date.now();
    var patchObj = { trialThreeDUsed: newCount, updatedAt: now };
    await patch('meta/subscription', patchObj);
    if (window.FS && sid) {
      try { await window.FS.doc('subscriptions/' + sid).set(patchObj, { merge: true }); } catch (e) { console.warn('subscription mirror not updated', e); }
    }
    if (D.subscription) {
      D.subscription.trialThreeDUsed = newCount;
    }
    return {
      allowed: true,
      unlimited: false,
      used: newCount,
      limit: sub.trialThreeDLimit,
      remaining: Math.max(0, sub.trialThreeDLimit - newCount),
      message: t('threed_success', '3D preview generation initiated. ({rem} free previews left)', { rem: Math.max(0, sub.trialThreeDLimit - newCount) })
    };
  }
  if (sub.isActive || sub.status === 'active') {
    return {
      allowed: true,
      unlimited: true,
      message: t('threed_unlimited', '3D preview generation initiated (unlimited plan).')
    };
  }
  return {
    allowed: false,
    reason: 'no_subscription',
    message: t('threed_no_sub', 'Please subscribe to use 3D fabric previews.')
  };
};
async function fresh(path) { var s = await DB.doc(path).get(); return s.exists ? clone(s.data()) : null; }
async function retry(fn) { try { return await fn(); } catch (e) { if (e && e.code === 'unavailable') { await sleep(400 + Math.random() * 600); return fn(); } throw e; } }
function put(path, obj) { return retry(function () { return DB.doc(path).set(obj); }); }
function patch(path, obj) { return retry(function () { return DB.doc(path).update(obj); }); }
function del(path) { return retry(function () { return DB.doc(path).delete(); }); }

/* Serialised writer: every stock- or money-changing operation holds a short lease on meta/lock,
   so two counters can never sell the same last unit or skip an invoice number. */
var lockChain = Promise.resolve();
function withLock(fn) {
  var run = lockChain.then(async function () {
    var ref = DB.doc('meta/lock'), got = false;
    for (var i = 0; i < 30; i++) {
      var r = await ref.acquire({ holder: SESSION, ttlMs: 9000 });
      if (r && r.acquired) { got = true; break; }
      await sleep(220 + Math.random() * 380);
    }
    if (!got) throw { code: 'busy', message: t('err_busy', 'Another counter is saving. Try again in a moment.') };
    try { return await fn(); }
    finally { ref.acquire({ holder: SESSION, ttlMs: 1000 }).catch(function () { }); }
  });
  lockChain = run.catch(function () { });
  return run;
}
function errText(e) {
  if (!e) return t('err_generic', 'Something went wrong. Try again.');
  if (e.userMsg) return e.userMsg;
  if (e.code === 'busy') return e.message;
  if (e.code === 'quota_exceeded') return t('err_quota', 'Storage is full. Delete old records to add more.');
  if (e.code === 'revoked' || e.code === 'not_granted') return t('err_access', 'Your access to this store changed. Reload the page.');
  if (e.code === 'permission-denied') return subState().isExpired ? t('err_plan', 'Your plan has ended. Subscribe from More → Subscription to keep saving.') : t('err_perm', 'You don’t have permission for this. Ask the store owner.');
  if (e.code === 'unavailable') return t('err_net', 'Connection problem. Check your internet and try again.');
  return e.message || t('err_generic', 'Something went wrong. Try again.');
}
function fail(msg) { var e = new Error(msg); e.userMsg = msg; return e; }
async function tx(label, fn) {
  if (readOnly()) { toast(t('ro_note', 'Auditor access is read-only.'), 'bad'); return null; }
  S.busy = label; schedule();
  try { return await withLock(fn); }
  catch (e) { toast(errText(e), 'bad'); return null; }
  finally { S.busy = null; schedule(); }
}
async function ensureDay(day) {
  var d = await fresh('ledger/' + day);
  if (!d) { d = { day: day, inv: {}, cash: {}, exp: {}, adj: {} }; await put('ledger/' + day, d); }
  return d;
}
async function nextNo(kind) {
  var c = (await fresh('meta/counters')) || {};
  c[kind] = (+c[kind] || 0) + 1;
  await put('meta/counters', c);
  return c[kind];
}
function storeV() { return D.store || {}; }
function locs() { var l = (storeV().locations || []).filter(Boolean); return l.length ? l : [{ id: 'shop', name: t('loc_shop', 'Shop floor'), type: 'shop' }]; }
function locName(id) { var l = locs().find(function (x) { return x.id === id; }); return l ? l.name : id; }
function curLoc() { var ls = locs(); if (S.loc && ls.some(function (l) { return l.id === S.loc; })) return S.loc; return ls[0].id; }
function who(id) {
  if (!id) return (!ME.id && ME.name) ? ME.name : t('role_owner', 'Owner');
  if (id === ME.id) return ME.name || t('you', 'You');
  if (D.staff[id] && D.staff[id].name) return D.staff[id].name;
  if (D.profiles[id]) return D.profiles[id];
  needProfile(id);
  return storeV().ownerId === id ? (storeV().ownerName || t('role_owner', 'Owner')) : t('team_member', 'Team member');
}
var profQ = {}, profT = null;
function needProfile(id) {
  if (!USER || profQ[id] || D.profiles[id] !== undefined) return;
  profQ[id] = 1; clearTimeout(profT);
  profT = setTimeout(async function () {
    var ids = Object.keys(profQ); profQ = {};
    try { var ps = await USER.profiles(ids); ids.forEach(function (i) { D.profiles[i] = (ps[i] && ps[i].name) || ''; }); schedule(); } catch (e) { }
  }, 60);
}

/* ===================== DERIVED DATA (memoised on snapshot identity) ===================== */
var memoCache = {};
function memo(key, deps, fn) { var m = memoCache[key]; if (m && m.deps.length === deps.length && m.deps.every(function (d, i) { return d === deps[i]; })) return m.v; var v = fn(); memoCache[key] = { deps: deps, v: v }; return v; }
function allDays() { return memo('days', [D.ledger, D.ledgerOld], function () { var m = Object.assign({}, D.ledgerOld, D.ledger); return Object.keys(m).sort().reverse().map(function (k) { return m[k]; }); }); }
function dayDoc(key) { return D.ledger[key] || D.ledgerOld[key] || null; }
function allInvoices() {
  return memo('inv', [D.ledger, D.ledgerOld], function () {
    var out = [];
    allDays().forEach(function (d) { Object.keys(d.inv || {}).forEach(function (id) { var i = d.inv[id]; if (i && i.no) out.push(Object.assign({}, i, { day: d.day, id: id })); }); });
    out.sort(by(function (i) { return i.at; }, true));
    return out;
  });
}
function invSign(i) { return i.kind === 'cn' ? -1 : 1; }
function daySales(key) { var d = dayDoc(key); if (!d) return { total: 0, bills: 0 }; var a = vals(d.inv); return { total: r2(sum(a, function (i) { return invSign(i) * i.total; })), bills: a.filter(function (i) { return i.kind !== 'cn'; }).length }; }
function products() { return memo('prods', [D.products], function () { return vals(D.products).filter(function (p) { return !p.archived; }).sort(by(function (p) { return (p.name || '').toLowerCase(); })); }); }
function variantLabel(v) { return [v.size, v.color].filter(Boolean).join(' · '); }
function pAvail(p) { return sum(p.variants || [], VXC.variantAvail); }
function pStock(p) { return sum(p.variants || [], VXC.variantStock); }
function lowList() {
  return memo('low', [D.products], function () {
    var out = [];
    products().forEach(function (p) { (p.variants || []).forEach(function (v) { var a = VXC.variantAvail(v), mn = v.min != null ? +v.min : 3; if (a <= mn) out.push({ p: p, v: v, avail: a, min: mn, out: a <= 0, sugg: Math.max(mn * 2 - a, 1) }); }); });
    return out.sort(by(function (x) { return x.avail; }));
  });
}
/* Cash that moved through the drawer, derived from invoices, credit notes, expenses and manual entries */
function cashMoves(fromTs, toTs, loc) {
  var moves = [];
  allDays().forEach(function (d) {
    vals(d.inv).forEach(function (i) {
      if (!i || i.at < fromTs || i.at > toTs || (loc && i.loc && i.loc !== loc)) return;
      if (i.kind === 'cn') { if (i.refund === 'cash' && i.total) moves.push({ at: i.at, dir: 'out', amt: i.total, what: t('refund', 'Refund') + ' ' + i.no, by: i.by }); }
      else { var c = +((i.pay || {}).cash) || 0; if (c) moves.push({ at: i.at, dir: 'in', amt: c, what: t('sale', 'Sale') + ' ' + i.no, by: i.by }); }
    });
    vals(d.exp).forEach(function (x) { if (x && x.mode === 'cash' && x.at >= fromTs && x.at <= toTs && (!loc || !x.loc || x.loc === loc)) moves.push({ at: x.at, dir: 'out', amt: x.amt, what: catName(x.cat) + (x.note ? ' — ' + x.note : ''), by: x.by }); });
    vals(d.cash).forEach(function (x) { if (x && (x.dir === 'in' || x.dir === 'out') && x.at >= fromTs && x.at <= toTs && (!loc || !x.loc || x.loc === loc)) moves.push({ at: x.at, dir: x.dir, amt: x.amt, what: x.note || t('cash_' + x.dir, x.dir === 'in' ? 'Cash in' : 'Cash out'), by: x.by }); });
  });
  return moves.sort(by(function (m) { return m.at; }, true));
}
function openShift() { return vals(D.shifts).find(function (s) { return s.status === 'open' && s.loc === curLoc(); }) || null; }
function shiftExpected(sh) { var m = cashMoves(sh.openAt, sh.closeAt || Date.now() + 1, sh.loc); return r2((+sh.float || 0) + sum(m, function (x) { return x.dir === 'in' ? x.amt : -x.amt; })); }
var EXP_CATS = ['rent', 'salaries', 'logistics', 'utilities', 'marketing', 'repairs', 'tailoring', 'packaging', 'tea', 'other'];
function catName(c) { return t('exp_' + c, { rent: 'Rent', salaries: 'Salaries', logistics: 'Logistics & courier', utilities: 'Electricity & internet', marketing: 'Marketing', repairs: 'Repairs', tailoring: 'Tailoring & alterations', packaging: 'Packaging', tea: 'Tea & snacks', other: 'Other' }[c] || c); }
function payName(m) { return t('pay_' + m, { cash: 'Cash', upi: 'UPI', card: 'Card', split: 'Split', credit: 'Store credit' }[m] || m); }
function payIcon(m) { return { cash: 'banknote', upi: 'qr', card: 'card', split: 'split', credit: 'wallet' }[m] || 'receipt'; }

/* ===================== RENDER ENGINE ===================== */
var rq = null, afterFns = [];
function schedule() { if (rq) return; rq = requestAnimationFrame(function () { rq = null; render(); }); }
function after(fn) { afterFns.push(fn); }
function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
function setPath(o, p, v) { var ks = p.split('.'), last = ks.pop(), cur = o; ks.forEach(function (k) { if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; }); cur[last] = v; }
function render() {
  var root = document.getElementById('app'), layer = document.getElementById('layer');
  var ae = document.activeElement, fid = ae && ae.id, sel = null;
  if (fid && ae.selectionStart != null) { try { sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) { } }
  var scrolls = {}; document.querySelectorAll('[data-keep]').forEach(function (el) { scrolls[el.getAttribute('data-keep')] = el.scrollTop; });
  afterFns = [];
  var out;
  try { out = viewRoot(); } catch (err) { console.error(err); out = { app: '<div class="gate"><div class="box"><h1>' + esc(t('err_render', 'This screen hit a problem.')) + '</h1><p class="muted">' + esc(String(err && err.message || err)) + '</p><button class="btn strong" data-a="go" data-r="home">' + esc(t('go_home', 'Go to Home')) + '</button></div></div>', layer: '' }; }
  if (root.__html !== out.app) { root.innerHTML = out.app; root.__html = out.app; }
  var lay = out.layer + toastsHtml();
  if (layer.__html !== lay) { layer.innerHTML = lay; layer.__html = lay; }
  document.documentElement.lang = LANG;
  if (fid) { var el = document.getElementById(fid); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { } } } }
  Object.keys(scrolls).forEach(function (k) { var el = document.querySelector('[data-keep="' + k + '"]'); if (el) el.scrollTop = scrolls[k]; });
  afterFns.forEach(function (f) { try { f(); } catch (e) { console.warn(e); } });
  postRender();
}
var A = window.A = window.A || {};
/* inputs bound with data-m write straight to state without a re-render; data-r="1" asks for one */
document.addEventListener('input', function (e) {
  var el = e.target, m = el.getAttribute && el.getAttribute('data-m'); if (!m) return;
  var v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.getAttribute('data-num') != null && el.type !== 'checkbox') v = v === '' ? '' : num(v);
  setPath(S, m, v);
  if (el.getAttribute('data-r') != null) schedule();
});
document.addEventListener('change', function (e) {
  var el = e.target;
  if (!el || !el.getAttribute) return;
  var m = el.getAttribute('data-m');
  if (m) {
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio' || el.type === 'date') {
      var v = el.type === 'checkbox' ? el.checked : el.value;
      setPath(S, m, v);
      schedule();
    }
  }
  var fn = el.getAttribute('data-change');
  if (fn && A[fn]) A[fn](el.dataset, el, e);
});
document.addEventListener('click', function (e) {
  var el = e.target.closest && e.target.closest('[data-a]'); if (!el) return;
  if (el.tagName === 'A' && /^https?:/.test(el.getAttribute('href') || '')) { var fnA = A[el.getAttribute('data-a')]; if (fnA) fnA(el.dataset, el, e); return; }
  e.preventDefault();
  var fn = A[el.getAttribute('data-a')]; if (fn) fn(el.dataset, el, e);
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && S.sheet) { closeSheet(); return; }
  var el = e.target; if (e.key === 'Enter' && el.getAttribute && el.getAttribute('data-enter')) { var fn = A[el.getAttribute('data-enter')]; if (fn) { e.preventDefault(); fn(el.dataset, el, e); } }
});
document.addEventListener('submit', function (e) { e.preventDefault(); });
window.addEventListener('hashchange', function () { var r = (location.hash || '').slice(1); if (r && ROUTES[r] && r !== S.route) { S.route = r; S.sub = null; S.sheet = null; window.scrollTo(0, 0); schedule(); } });

/* count-up for headline figures */
var shownNums = {};
function postRender() {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var key = el.getAttribute('data-count'), to = +el.getAttribute('data-to') || 0, from = shownNums[key];
    shownNums[key] = to;
    if (reduce || from == null || from === to) { el.textContent = inr(to); return; }
    var st = performance.now(), dur = 650;
    (function step(n) { var k = Math.min(1, (n - st) / dur), e2 = 1 - Math.pow(1 - k, 3); el.textContent = inr(from + (to - from) * e2); if (k < 1) requestAnimationFrame(step); })(st);
  });
  document.querySelectorAll('[data-qr]').forEach(fillQR);
  document.querySelectorAll('.paperwrap[data-pw]').forEach(fitPaper);
  if (window.vxAfterRender) { try { window.vxAfterRender(); } catch (e) { } }
}
function fillQR(el) {
  var txt = el.getAttribute('data-qr'); if (el.__qr === txt) return; el.__qr = txt; el.innerHTML = '';
  if (!window.QRCode && window.qrcode) { try { var g = qrcode(0, 'M'); g.addData(txt); g.make(); el.innerHTML = '<img alt="" style="width:100%;height:100%;image-rendering:pixelated" src="' + g.createDataURL(8, 0) + '">'; } catch (e) { } return; }
  if (!window.QRCode) { el.innerHTML = '<span class="xsmall" style="color:#55555F">' + esc(t('qr_unavail', 'QR not available offline')) + '</span>'; return; }
  try { new QRCode(el, { text: txt, width: 440, height: 440, colorDark: '#0E0E12', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M }); } catch (e) { }
}
function fitPaper(w) {
  var paper = w.firstElementChild; if (!paper) return;
  var par = w.parentElement, cs = getComputedStyle(par), inner = par.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
  var pw = +w.getAttribute('data-pw'), target = w.getAttribute('data-fixed') ? +w.getAttribute('data-fixed') : (inner || pw);
  var s = Math.min(1, target / pw);
  paper.style.width = pw + 'px'; paper.style.transform = 'scale(' + s + ')';
  w.style.width = (pw * s) + 'px'; w.style.height = (paper.offsetHeight * s) + 'px';
}
window.addEventListener('resize', function () { document.querySelectorAll('.paperwrap[data-pw]').forEach(fitPaper); });

/* ===================== TOASTS / SHEETS ===================== */
function toast(msg, kind, action) { var id = uid('t'); S.toasts.push({ id: id, msg: msg, kind: kind || '', action: action }); if (S.toasts.length > 2) S.toasts = S.toasts.slice(-2); schedule(); setTimeout(function () { S.toasts = S.toasts.filter(function (x) { return x.id !== id; }); schedule(); }, kind === 'bad' ? 5200 : 3200); }
function toastsHtml() { if (!S.toasts.length) return ''; return '<div class="toasts" role="status" aria-live="polite">' + S.toasts.map(function (x) { return '<div class="toast ' + x.kind + '">' + icon(x.kind === 'bad' ? 'alert' : 'checkCircle', 18) + '<span>' + esc(x.msg) + '</span>' + (x.action ? '<button class="tb" data-a="' + x.action.a + '"' + (x.action.attrs || '') + '>' + esc(x.action.label) + '</button>' : '') + '</div>'; }).join('') + '</div>'; }
function openSheet(kind, data) { S.sheet = Object.assign({ k: kind }, data || {}); schedule(); }
function closeSheet() { S.sheet = null; schedule(); }
function openSub(kind, data) {
  var prev = S.sub;
  S.sub = Object.assign({ k: kind, prev: prev, scroll: window.scrollY }, data || {});
  S.sheet = null;
  window.scrollTo(0, 0);
  schedule();
  if (data && data.target) {
    setTimeout(function () {
      var el = document.getElementById(data.target);
      if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }
}
function backSub() { var p = S.sub && S.sub.prev, y = S.sub && S.sub.scroll; S.sub = p || null; schedule(); requestAnimationFrame(function () { window.scrollTo(0, y || 0); }); }
function go(r) { S.sub = null; S.sheet = null; if (location.hash !== '#' + r) { try { location.hash = r; } catch (e) { } } S.route = r; window.scrollTo(0, 0); schedule(); }
window.handleAndroidBack = function () {
  if (S.sheet) { closeSheet(); return true; }
  if (S.sub) { backSub(); return true; }
  if (S.route && S.route !== 'home') { go('home'); return true; }
  return false;
};

/* ===================== COMPONENTS ===================== */
function ph(title, sub, actions, back, small) {
  return '<header class="ph' + (small ? ' small' : '') + '">' + (back ? '<button class="ib plain" data-a="' + back + '" aria-label="' + esc(t('back', 'Back')) + '">' + icon('arrowL', 22) + '</button>' : '') +
    '<div class="ph-t"><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="ph-a">' + actions + '</div>' : '') + '</header>';
}
function pill(txt, k) { return '<span class="pill ' + (k || '') + '">' + esc(txt) + '</span>'; }
function empty(ic, title, body, btn) { return '<div class="empty"><div class="ei">' + icon(ic, 26) + '</div><b>' + esc(title) + '</b>' + (body ? '<p>' + esc(body) + '</p>' : '') + (btn || '') + '</div>'; }
function skelRows(n) { var s = ''; for (var i = 0; i < (n || 4); i++) s += '<div class="li"><div class="skel" style="width:38px;height:38px;border-radius:12px"></div><div class="tx"><div class="skel" style="height:12px;width:60%"></div><div class="skel" style="height:10px;width:40%;margin-top:6px"></div></div></div>'; return '<div class="list">' + s + '</div>'; }
function fld(label, input, hint, err, id) { return '<div class="fld">' + (label ? '<label' + (id ? ' for="' + id + '"' : '') + '>' + esc(label) + '</label>' : '') + input + (err ? '<span class="err">' + esc(err) + '</span>' : hint ? '<span class="hint">' + esc(hint) + '</span>' : '') + '</div>'; }
function inp(model, attrs) { var v = getPath(S, model); var id = 'f-' + model.replace(/\./g, '-'); return '<input class="in" id="' + id + '" data-m="' + model + '" value="' + esc(v == null ? '' : v) + '" ' + (attrs || '') + '>'; }
function txtF(label, model, attrs, hint, err) { return fld(label, inp(model, attrs), hint, err, 'f-' + model.replace(/\./g, '-')); }
function numF(label, model, attrs, hint, err) { return fld(label, inp(model, 'inputmode="decimal" data-num ' + (attrs || '')), hint, err, 'f-' + model.replace(/\./g, '-')); }
function moneyF(label, model, attrs, hint, err) { var id = 'f-' + model.replace(/\./g, '-'); return fld(label, '<div class="inwrap"><span class="pre">₹</span>' + inp(model, 'inputmode="decimal" data-num ' + (attrs || '')) + '</div>', hint, err, id); }
function selF(label, model, opts, attrs, hint) { var v = getPath(S, model); var id = 'f-' + model.replace(/\./g, '-'); return fld(label, '<select class="in" id="' + id + '" data-m="' + model + '" ' + (attrs || '') + '>' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v == null ? '' : v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>', hint, null, id); }
function togF(title, sub, model, attrs) { var v = !!getPath(S, model); var id = 'f-' + model.replace(/\./g, '-'); return '<label class="tog" for="' + id + '"><span class="tt"><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><input type="checkbox" id="' + id + '" data-m="' + model + '"' + (v ? ' checked' : '') + ' ' + (attrs || '') + '><span class="sl"></span></label>'; }
function seg(model, opts, label) { var v = getPath(S, model); return '<div class="seg" role="radiogroup"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + opts.map(function (o) { var on = String(o[0]) === String(v); return '<button type="button" role="radio" aria-checked="' + on + '" class="' + (on ? 'on' : '') + '" data-a="set" data-k="' + model + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }
function chips(model, opts) { var v = getPath(S, model); return '<div class="chips">' + opts.map(function (o) { var on = String(o[0]) === String(v); return '<button type="button" class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-a="set" data-k="' + model + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + (o[2] != null ? ' <span class="c">' + esc(o[2]) + '</span>' : '') + '</button>'; }).join('') + '</div>'; }
function searchBox(model, ph2, extra) { var id = 'f-' + model.replace(/\./g, '-'); return '<label class="inwrap" for="' + id + '"><span class="lead">' + icon('search', 18) + '</span><span class="sr">' + esc(ph2) + '</span><input class="in" type="search" id="' + id + '" data-m="' + model + '" data-r value="' + esc(getPath(S, model) || '') + '" placeholder="' + esc(ph2) + '" autocomplete="off" ' + (extra || '') + '></label>'; }
function stepper(dec, inc, val, label) { return '<span class="step"><button type="button" aria-label="' + esc(t('decrease', 'Decrease') + ' ' + (label || '')) + '" ' + dec + '>' + icon('minus', 16) + '</button><span class="num">' + esc(val) + '</span><button type="button" aria-label="' + esc(t('increase', 'Increase') + ' ' + (label || '')) + '" ' + inc + '>' + icon('plus', 16) + '</button></span>'; }
function swatch(p, size) {
  var c = (p.colors && p.colors[0]) || ((p.variants || [])[0] || {}).color || p.name;
  var imgUrl = p.img;
  var st = 'background-color:' + colorOf(c) + ';' + (imgUrl ? 'background-image:url(' + cssUrl(imgUrl) + ');' : '') + (size ? 'width:' + size[0] + 'px;height:' + size[1] + 'px;' : '');
  return '<span class="sw" style="' + st + '">' + (imgUrl ? '' : icon('shirt', 18)) + '</span>';
}
function stockPill(a, mn) { if (a <= 0) return pill(t('out_of_stock', 'Out of stock'), 'bad'); if (a <= (mn == null ? 3 : mn)) return pill(t('n_left', '{n} left', { n: a }), 'bad'); if (a <= (mn == null ? 3 : mn) * 2) return pill(t('n_avail', '{n} available', { n: a }), 'warn'); return pill(t('n_avail', '{n} available', { n: a }), 'ok'); }
function avatarHtml(name, cls) { return '<span class="ic round ' + (cls || 'acc') + '">' + esc(initials(name)) + '</span>'; }
function sheetWrap(title, body, foot, wide) {
  return '<div class="scrim" data-a="close"></div><section class="sheet' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="grab"></div><div class="sh"><h2>' + esc(title) + '</h2><button class="ib plain" data-a="close" aria-label="' + esc(t('close', 'Close')) + '">' + icon('x', 20) + '</button></div><div class="sb" data-keep="sheet">' + body + '</div>' + (foot ? '<div class="sf">' + foot + '</div>' : '') + '</section>';
}
function busyBtn(label, action, cls, attrs, busyKey) { var b = S.busy && (!busyKey || S.busy === busyKey); return '<button type="button" class="btn ' + (cls || 'primary') + '" data-a="' + action + '" ' + (attrs || '') + (b ? ' disabled' : '') + '>' + (b ? '<span class="spin"></span>' : '') + esc(label) + '</button>'; }

/* ===================== GENERIC ACTIONS ===================== */
Object.assign(A, {
  set: function (d) { var v = d.v; if (v === 'true') v = true; else if (v === 'false') v = false; setPath(S, d.k, v); schedule(); },
  go: function (d) { go(d.r); },
  back: function () { backSub(); },
  close: function () { closeSheet(); },
  openSub: function (d) { openSub(d.k, d); },
  triggerUpload: function (d) {
    var id = d && d.for;
    if (!id) return;
    var inp = document.getElementById(id);
    if (inp) inp.click();
  },
  reload: function () { location.reload(); },
  noop: function () { }
});
