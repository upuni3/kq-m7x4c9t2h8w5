/* ============================================================
   stickers-season.js — 季節（月）シリーズのネコシール（12月＝クリスマス／1月＝お正月）
   stickers.js（KQStickers）のあとに読み込む。新しい頭・服・小物を KQStickers の HEADS/OUTFITS/PROPS に足し、
   KQSeason.SETS = { xmas:[18枚], ny:[18枚] } と KQSeason.make(entry) を提供する。
   各セット（ny）：理科5・社会5・国語5・キラ3。xmas は 54種：理科15・社会15・国語15・キラ9（先頭の5/5/5/3＝18種は従来のまま）。
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./stickers.js'));
  else root.KQSeason = factory(root.KQStickers);
})(typeof window !== 'undefined' ? window : globalThis, function (S) {
  'use strict';
  var INK = '#33284a';
  var HEADS = S.HEADS, OUTFITS = S.OUTFITS, PROPS = S.PROPS;

  // ---------- 小さな描画ヘルパー（stickers.js と同じ流儀） ----------
  function r1(n) { return Math.round(n * 10) / 10; }
  function mix(a, b, t) {
    function p(h) { h = h.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    var x = p(a), y = p(b); return '#' + [0, 1, 2].map(function (i) { return ('0' + Math.round(x[i] + (y[i] - x[i]) * t).toString(16)).slice(-2); }).join('');
  }
  function shade(c, t) { return t < 0 ? mix(c, '#000000', -t) : mix(c, '#ffffff', t); }
  function K(d, f, w) { return '<path class="zk" d="' + d + '" fill="' + f + '" stroke-width="' + (w || 3) + '"/>'; }
  function Q(d, c, w, op) { return '<path class="zq" d="' + d + '" stroke="' + c + '" stroke-width="' + w + '"' + (op ? ' stroke-opacity="' + op + '"' : '') + '/>'; }
  function HL(d, w) { return '<path class="zh" d="' + d + '" stroke-width="' + (w || 3) + '"/>'; }
  function Ci(x, y, r, f, w) { return '<circle' + (w === 0 ? '' : ' class="zk" stroke-width="' + (w || 3) + '"') + ' cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"/>'; }
  function El(x, y, rx, ry, f, w, rot) { return '<ellipse' + (w === 0 ? '' : ' class="zk" stroke-width="' + (w || 3) + '"') + ' cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>'; }
  function Rc(x, y, w, h, rx, f, sw) { return '<rect' + (sw === 0 ? '' : ' class="zk" stroke-width="' + (sw || 3) + '"') + ' x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + f + '"/>'; }
  function Gp(tr, inner) { return '<g transform="' + tr + '">' + inner + '</g>'; }
  function pg(x, y, inner) { return '<g transform="translate(' + x + ',' + y + ')">' + inner + '</g>'; }
  function st4(cx, cy, r, f, stroke) {
    var d = 'M' + cx + ',' + (cy - r) + ' Q' + cx + ',' + cy + ' ' + (cx + r) + ',' + cy + ' Q' + cx + ',' + cy + ' ' + cx + ',' + (cy + r) + ' Q' + cx + ',' + cy + ' ' + (cx - r) + ',' + cy + ' Q' + cx + ',' + cy + ' ' + cx + ',' + (cy - r) + 'Z';
    return stroke ? '<path class="zk" d="' + d + '" fill="' + f + '" stroke="' + stroke + '" stroke-width="1.6"/>' : '<path d="' + d + '" fill="' + f + '"/>';
  }
  function st5(cx, cy, r, f, sw) {
    var pts = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push(r1(cx + Math.cos(a) * rr) + ',' + r1(cy + Math.sin(a) * rr)); }
    return K('M' + pts.join('L') + 'Z', f, sw || 2.4);
  }
  function snowflake(cx, cy, r, col, w) {
    var d = '';
    for (var i = 0; i < 3; i++) {
      var a = i * Math.PI / 3, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      d += 'M' + r1(cx - dx) + ',' + r1(cy - dy) + 'L' + r1(cx + dx) + ',' + r1(cy + dy);
      [-1, 1].forEach(function (sg) {
        var bx = cx + dx * 0.62 * sg, by = cy + dy * 0.62 * sg, pa = a + Math.PI / 2, l = r * 0.28;
        d += 'M' + r1(bx - Math.cos(a + 1.05) * l) + ',' + r1(by - Math.sin(a + 1.05) * l) + 'L' + r1(bx) + ',' + r1(by) + 'L' + r1(bx - Math.cos(a - 1.05) * l) + ',' + r1(by - Math.sin(a - 1.05) * l);
      });
    }
    return Q(d, col || '#fff', w || 2.4);
  }
  function bean(x, y, c) { return Ci(x, y, 3, c, 1.6); }

  // =====================================================================
  // 頭（ねこの頭の座標系：頭の上端 y≈63、幅 57〜143）
  // =====================================================================
  HEADS.santa = { c1: '#e23b3b', draw: function (c) {
    return Gp('rotate(-7 100 60)', K('M58,76 C58,50 80,34 104,32 C128,32 146,42 154,60 C158,70 152,74 146,74 L60,78Z', c, 3.2) +
      Q('M70,62 C78,50 92,42 108,40', '#fff', 3, 0.6) + K('M54,70 Q100,82 148,68 Q152,82 146,90 Q100,98 56,92 Q50,82 54,70Z', '#fffaf0', 3.2) + Ci(160, 66, 8.5, '#fffaf0', 3));
  } };
  HEADS.antlers = { c1: '#9a6a3a', back: function (c) {
    function ant(sg) { var x = 100 + sg * 28, d = 'M' + x + ',70 C' + (x + sg * 3) + ',60 ' + (x + sg * 10) + ',54 ' + (x + sg * 13) + ',44 M' + (x + sg * 6) + ',58 C' + (x + sg * 12) + ',57 ' + (x + sg * 19) + ',54 ' + (x + sg * 22) + ',48 M' + (x + sg * 11) + ',48 C' + (x + sg * 6) + ',46 ' + (x + sg * 5) + ',42 ' + (x + sg * 6) + ',38'; return Q(d, INK, 11) + Q(d, c, 6.4); }
    return ant(-1) + ant(1);
  }, draw: function (c) {
    return Gp('translate(100,72)', K('M0,0 L-18,-8 Q-24,2 -18,10Z', '#e23b3b', 3) + K('M0,0 L18,-8 Q24,2 18,10Z', '#e23b3b', 3) + Ci(0, 0, 5.4, '#c42a2a', 2.6) + Ci(24, 12, 5.5, '#ffd23f', 2.2) + Q('M24,15 v3', INK, 1.6));
  } };
  HEADS.elf = { c1: '#3fae5c', draw: function (c) {
    return K('M58,76 C60,58 80,46 100,42 C118,38 138,40 152,52 C142,52 138,60 146,76Z', c, 3.2) + HL('M70,64 C78,56 88,50 98,47', 2.6) +
      K('M56,70 L66,82 L76,70 L86,82 L96,70 L106,82 L116,70 L126,82 L136,70 L146,82 L148,70 L148,76 L56,76Z', '#fffaf0', 2.6) + Ci(154, 54, 6, '#ffd23f', 2.6);
  } };
  HEADS.knit = { c1: '#d9483b', c2: '#fffaf0', draw: function (c, c2) {
    return K('M56,80 C54,54 84,42 100,42 C116,42 146,54 144,80Z', c, 3.2) + Q('M72,76 C70,60 78,50 88,45 M90,76 C90,60 94,50 100,44 M108,76 C108,60 106,50 112,45 M126,76 C126,60 122,52 128,48', shade(c, -0.28), 3, 0.6) +
      K('M52,66 Q100,78 148,66 L150,84 Q100,94 50,84Z', c2, 3.2) + Q('M60,74 Q100,84 140,74', shade(c2, -0.15), 2.4, 0.7) + Ci(100, 41, 9, '#fffaf0', 3.2) + Q('M95,39 q5,-3 10,0', '#d8cfc0', 2, 0.8);
  } };
  HEADS.wreath = { c1: '#3fae5c', draw: function (c) {
    var s = '', i;
    for (i = 0; i < 9; i++) { var a = Math.PI * (1.08 + i * 0.105), x = 100 + Math.cos(a) * 46, y = 82 + Math.sin(a) * 40; s += El(r1(x), r1(y), 11, 5.6, i % 2 ? c : shade(c, -0.12), 2.4, r1(a * 180 / Math.PI + 90)); }
    s += Ci(70, 54, 4.2, '#e23b3b', 1.8) + Ci(78, 50, 3.8, '#e23b3b', 1.8) + Ci(130, 54, 4.2, '#e23b3b', 1.8);
    s += Gp('translate(100,40)', K('M0,0 L-14,-9 Q-18,0 -14,9Z', '#e23b3b', 2.6) + K('M0,0 L14,-9 Q18,0 14,9Z', '#e23b3b', 2.6) + Ci(0, 0, 5, '#c42a2a', 2.4));
    return s;
  } };
  HEADS.starhat = { c1: '#ffd23f', draw: function (c) {
    return Q('M60,74 Q100,60 140,74', INK, 9) + Q('M60,74 Q100,60 140,74', '#e23b3b', 5.6) + Gp('translate(100,52) rotate(-8)', st5(0, 0, 17, c, 3.2) + Ci(0, 2, 2.6, '#fff3b0', 0)) + st4(128, 46, 5, '#fff') + st4(74, 48, 4, '#fff');
  } };
  HEADS.sheep = { c1: '#fff6e6', c2: '#b8864e', back: function (c, c2) {
    function horn(sg) { var x = 100 + sg * 44; return Q('M' + x + ',78 C' + (x + sg * 26) + ',78 ' + (x + sg * 30) + ',46 ' + (x + sg * 12) + ',44 C' + (x + sg * 2) + ',44 ' + (x + sg * 2) + ',58 ' + (x + sg * 10) + ',58', INK, 12) + Q('M' + x + ',78 C' + (x + sg * 26) + ',78 ' + (x + sg * 30) + ',46 ' + (x + sg * 12) + ',44 C' + (x + sg * 2) + ',44 ' + (x + sg * 2) + ',58 ' + (x + sg * 10) + ',58', c2, 7.4); }
    return horn(-1) + horn(1);
  }, draw: function (c) {
    var s = ''; [[78, 62, 10], [91, 53, 12], [109, 53, 12], [122, 62, 10], [100, 60, 11]].forEach(function (b) { s += Ci(b[0], b[1], b[2], c, 3); });
    return s + Ci(100, 60, 7, shade(c, -0.04), 0) + HL('M84,50 q6,-4 12,-1', 2.2) + Gp('translate(130,66)', Ci(0, 0, 6, '#ff9db4', 1.6));
  } };
  HEADS.hachimaki = { c1: '#fffaf0', draw: function (c, c2, x) {
    // はちまきは頭の輪郭の内側にクリップして「頭に巻いている」ように見せ、結び目と垂れだけを外に出す
    return '<g clip-path="' + x.url('hc') + '">' + Q('M40,84 Q100,68 160,84', INK, 14) + Q('M40,84 Q100,68 160,84', c, 10.4) + Q('M56,82 Q100,68 144,82', shade(c, -0.1), 1.6, 0.6) + '</g>' +
      Ci(100, 75, 8, '#e23b3b', 2.4) +
      K('M138,84 L150,106 L143,107 L141,94Z', c, 2.6) + K('M138,84 L156,98 L152,105 L140,92Z', c, 2.6) + Ci(138, 84, 5, c, 2.6) + Q('M141,96 L145,104', '#e23b3b', 1.8);
  } };
  HEADS.eboshi = { c1: '#2c2a3a', draw: function (c) {
    return Gp('rotate(-6 100 60)', K('M62,78 C60,62 74,46 96,40 C108,36 124,42 132,54 C140,66 142,72 140,80Z', c, 3.2) + HL('M74,66 C78,56 86,48 96,44', 2.6) + K('M60,70 Q100,80 142,70 L144,84 Q100,94 58,84Z', shade(c, 0.12), 3) + Q('M142,76 Q158,84 154,102', '#fffaf0', 3.6) + Ci(154,104,3,'#fffaf0',1.6));
  } };
  HEADS.kanzashi = { c1: '#ff8fb6', draw: function (c) {
    function flower(x, y, r) { var s = ''; for (var i = 0; i < 5; i++) { var a = i * 72 * Math.PI / 180; s += Ci(r1(x + Math.cos(a) * r), r1(y + Math.sin(a) * r), r * 0.72, c, 2.2); } return s + Ci(x, y, r * 0.5, '#ffd23f', 2); }
    return Q('M126,66 C138,76 146,88 146,106', '#ffd23f', 2.4) + Ci(146, 109, 3.6, '#ff5f7a', 1.8) + Q('M133,70 C142,82 152,92 154,104', '#ffd23f', 2) + Ci(154, 107, 3, '#fffaf0', 1.6) + flower(124, 62, 9) + flower(110, 56, 6.4) + flower(136, 72, 6.6);
  } };
  HEADS.mochi = { c1: '#fffaf0', draw: function (c) {
    return K('M60,60 C60,50 140,50 140,60 C142,72 130,76 100,76 C70,76 58,72 60,60Z', c, 3.2) + HL('M66,58 Q80,54 96,54', 2.4) +
      K('M72,50 C72,40 128,40 128,50 C130,58 120,60 100,60 C80,60 70,58 72,50Z', c, 3.2) + Ci(100, 36, 11, '#ff9a2e', 3) + HL('M94,32 q4,-4 9,-3', 2.2) + K('M100,26 q8,-8 16,-3 q-6,8 -16,3Z', '#4fbf6a', 2.2);
  } };

  // ---- 12月クリスマス 54種化で追加した頭（ここから）----
  function hollyLeaf(col, L) {
    L = L || 26; var h = L / 26;
    return K('M0,0 L' + r1(5 * h) + ',-5 L' + r1(8 * h) + ',-3 L' + r1(13 * h) + ',-8 L' + r1(16 * h) + ',-4 L' + r1(22 * h) + ',-6 L' + r1(L) + ',0 L' + r1(22 * h) + ',6 L' + r1(16 * h) + ',4 L' + r1(13 * h) + ',8 L' + r1(8 * h) + ',3 L' + r1(5 * h) + ',5Z', col, 2.2) + Q('M2,0 H' + r1(L - 4), shade(col, -0.3), 1.4, 0.8);
  }
  function hollyBerries(x, y, r) {
    r = r || 4; return Ci(x, y, r, '#e23b3b', 1.8) + Ci(r1(x + r * 1.7), r1(y + r * 0.7), r, '#e23b3b', 1.8) + Ci(r1(x - r * 1.1), r1(y + r * 1.4), r, '#c42a2a', 1.8) + Ci(r1(x - r * 0.35), r1(y - r * 0.35), r * 0.28, '#fff', 0);
  }
  HEADS.earmuff = { c1: '#e23b3b', c2: '#fffaf0', draw: function (c, c2) {
    function muff(sg) { var x = 100 + sg * 47, s = '', i; for (i = 0; i < 8; i++) { var a = i * Math.PI / 4; s += Ci(r1(x + Math.cos(a) * 10.5), r1(94 + Math.sin(a) * 10.5), 6.6, c2, 2.2); } return s + Ci(x, 94, 11, c2, 0) + HL('M' + (x - 7) + ',89 q4,-5 9,-4', 2.2); }
    return Q('M55,90 C52,44 148,44 145,90', INK, 9.6) + Q('M55,90 C52,44 148,44 145,90', shade(c, -0.1), 5.8) + Q('M68,60 C82,51 98,49 112,52', '#fff', 2, 0.55) + muff(-1) + muff(1);
  } };
  HEADS.holly = { c1: '#2f9a52', draw: function (c) {
    return Q('M57,86 C58,52 142,52 143,86', INK, 8.6) + Q('M57,86 C58,52 142,52 143,86', '#e23b3b', 5) +
      Gp('translate(116,62) rotate(-150)', hollyLeaf(c, 30)) + Gp('translate(116,62) rotate(-28)', hollyLeaf(shade(c, -0.12), 30)) + Gp('translate(116,62) rotate(-92)', hollyLeaf(shade(c, 0.1), 26)) + hollyBerries(114, 64, 4.2);
  } };
  HEADS.candyhat = { c1: '#e23b3b', c2: '#fffaf0', draw: function (c, c2, x) {
    var id = x.P + 'cdh', d = 'M74,70 L78,30 Q100,24 122,30 L126,70Z', st = '', i;
    x.defs.push('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>');
    for (i = -1; i < 7; i++) st += 'M' + (56 + i * 14) + ',74 L' + (96 + i * 14) + ',22 ';
    return Gp('rotate(-7 100 62)', '<path d="' + d + '" fill="' + c2 + '"/><g clip-path="url(#' + id + ')">' + Q(st, c, 7.4) + '</g><path class="zk" d="' + d + '" fill="none" stroke-width="3.2"/>' +
      El(100, 71, 38, 9, '#2f9a52', 3.2) + Rc(77, 58, 46, 10, 0, '#2f9a52', 0) + Q('M77,63 H123', '#1f6a3a', 1.4, 0.6) + Gp('translate(120,62) rotate(-20)', hollyLeaf('#3fb867', 16)) + hollyBerries(112, 64, 2.8) + Q('M76,31 Q100,24 124,31', '#fff', 2.2, 0.6));
  } };
  HEADS.icecrown = { c1: '#bfe8ff', draw: function (c) {
    return K('M60,82 L61,50 L77,66 L90,36 L100,62 L110,36 L123,66 L139,50 L140,82Z', c, 3.2) + HL('M66,72 L66,58 M92,52 L94,44', 2.4) + K('M60,76 Q100,86 140,76 V88 Q100,98 60,88Z', shade(c, -0.1), 3) +
      snowflake(100, 74, 6, '#fff', 1.8) + Ci(100, 90, 0, '#fff', 0) + Ci(70, 82, 3.2, '#ff8fd0', 1.6) + Ci(130, 82, 3.2, '#ff8fd0', 1.6) + st4(90, 34, 5, '#fff') + st4(110, 34, 5, '#fff') + st4(138, 46, 4, '#fff');
  } };
  HEADS.candlecrown = { c1: '#3fae5c', draw: function (c) {
    var s = '', i;
    [[82, 62], [100, 59], [118, 62]].forEach(function (p) { s += Rc(p[0] - 4.6, p[1] - 14, 9.2, 16, 2, '#fffaf0', 2.4) + K('M' + p[0] + ',' + (p[1] - 16) + ' q-5,-6 0,-12 q5,6 0,12Z', '#ffb02e', 2.2) + Q('M' + p[0] + ',' + (p[1] - 18) + ' v-4', '#fff3b0', 1.8); });
    for (i = 0; i < 11; i++) { var a = Math.PI * (1.04 + i * 0.092), x = 100 + Math.cos(a) * 46, y = 88 + Math.sin(a) * 26; s += El(r1(x), r1(y), 10.5, 5.4, i % 2 ? c : shade(c, -0.14), 2.4, r1(a * 180 / Math.PI + 90)); }
    return s + Ci(66, 66, 3.6, '#e23b3b', 1.8) + Ci(134, 66, 3.6, '#e23b3b', 1.8) + Ci(100, 70, 3.6, '#e23b3b', 1.8);
  } };
  HEADS.nutcracker = { c1: '#d03030', draw: function (c) {
    return K('M72,78 L74,42 H126 L128,78Z', c, 3.2) + Rc(74, 40, 52, 7, 0, '#ffd23f', 2.4) + Rc(72, 64, 56, 12, 0, '#ffd23f', 2.4) + Q('M100,48 V62 M88,48 V62 M112,48 V62', '#ffd23f', 2.4, 0.9) +
      K('M66,80 Q100,92 134,80 L134,86 Q100,98 66,86Z', '#2c2a3a', 2.6) + Ci(100, 36, 7, '#fffaf0', 2.8) + Ci(93, 39, 5, '#fffaf0', 2.4) + Ci(107, 39, 5, '#fffaf0', 2.4) + st5(100, 55, 4.6, '#fffaf0', 1.6);
  } };
  HEADS.jester = { c1: '#e23b3b', c2: '#2f9a52', draw: function (c, c2) {
    return Gp('translate(100,80) scale(.93) translate(-100,-80)', K('M62,86 C54,64 42,54 30,62 C42,66 48,74 54,84 C64,84 82,80 100,74Z', c, 3.2) + Ci(29, 63, 5, '#ffd23f', 2.2) +
      K('M138,86 C146,64 158,54 170,62 C158,66 152,74 146,84 C136,84 118,80 100,74Z', c2, 3.2) + Ci(171, 63, 5, '#ffd23f', 2.2) +
      K('M60,86 C70,66 84,58 100,56 C116,58 130,66 140,86 C120,80 100,78 100,78 C100,78 80,80 60,86Z', shade(c, -0.05), 3.2) + Q('M100,56 C100,66 100,72 100,78', INK, 2.4, 0.5) +
      K('M58,80 Q100,90 142,80 L144,92 Q100,102 56,92Z', '#fffaf0', 3) + Q('M64,86 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6', '#ffd23f', 2, 0.9) + Ci(100, 52, 5, '#ffd23f', 2.2));
  } };
  HEADS.treehat = { c1: '#2f9a52', draw: function (c) {
    return Gp('translate(100,66) scale(.74)', K('M-28,8 L0,-16 L28,8Z', c, 3.2) + K('M-21,-8 L0,-32 L21,-8Z', shade(c, 0.1), 3.2) + K('M-14,-24 L0,-46 L14,-24Z', shade(c, 0.2), 3.2) + st5(0, -50, 8, '#ffd23f', 2.2) +
      Q('M-22,2 Q-8,-6 6,0 Q14,3 24,-2', '#fffaf0', 2.6, 0.9) + Ci(-14, 2, 3.2, '#e23b3b', 1.6) + Ci(16, 0, 3.2, '#4a90f0', 1.6) + Ci(-4, -14, 3, '#ffd23f', 1.6) + Ci(6, -28, 2.6, '#ff8fb6', 1.6));
  } };
  HEADS.giftbox = { c1: '#4a90f0', draw: function (c) {
    return Gp('rotate(-7 100 62)', Rc(72, 46, 56, 24, 3, c, 3.2) + Rc(68, 38, 64, 11, 3, shade(c, 0.14), 3.2) + Rc(94.5, 38, 11, 32, 0, '#ffd23f', 2.4) + HL('M76,56 V64', 2.4) +
      K('M100,38 C90,18 72,22 80,32 C85,38 95,38 100,38Z', '#ffd23f', 2.6) + K('M100,38 C110,18 128,22 120,32 C115,38 105,38 100,38Z', '#ffd23f', 2.6) + Ci(100, 36, 4, '#e8a010', 2));
  } };
  HEADS.xbow = { c1: '#e23b3b', c2: '#2f8a4a', draw: function (c, c2) {
    var pl = Q('M-26,-12 V-2 M-20,-16 V0 M-14,-14 V-2', c2, 2.2, 0.8) + Q('M-28,-8 H-10', shade(c, -0.25), 1.6, 0.8);
    return Gp('translate(126,64) rotate(-14)', K('M0,2 L-12,22 L-2,24 L6,8Z', shade(c, -0.1), 2.6) + K('M0,2 L14,20 L5,24 L-4,8Z', shade(c, -0.1), 2.6) + K('M0,0 C-8,-18 -30,-20 -32,-6 C-32,8 -12,8 0,0Z', c, 3) + pl + K('M0,0 C8,-18 30,-20 32,-6 C32,8 12,8 0,0Z', c, 3) + Gp('scale(-1,1)', pl) + Ci(0, 0, 6, shade(c, 0.12), 2.6) + Ci(0, 0, 2.4, '#ffd23f', 0));
  } };
  HEADS.hood = { c1: '#3a7bd5', c2: '#fffaf0', back: function (c) {
    return K('M42,132 C30,80 62,34 100,34 C138,34 170,80 158,132Z', c, 3.4) + Q('M60,60 C70,46 86,40 98,40', '#fff', 2.4, 0.45);
  }, draw: function (c, c2) {
    var s = Q('M58,102 C56,70 76,60 100,60 C124,60 144,70 142,102', INK, 15.4) + Q('M58,102 C56,70 76,60 100,60 C124,60 144,70 142,102', c2, 11.4), i;
    for (i = 0; i < 12; i++) { var a = Math.PI * (1.0 + i * 0.0865), px = 100 + Math.cos(a) * 43.5, py = 102 + Math.sin(a) * 40; s += Ci(r1(px), r1(py), 5.6, c2, 0); }
    return s + Q('M66,84 C70,72 82,66 94,65', '#fff', 2, 0.7);
  } };
  // ---- 頭の追加ここまで ----

  // =====================================================================
  // 服（肩ライン上端 y=144）
  // =====================================================================
  OUTFITS.santa = { oc: '#e23b3b', tc: '#1d1830', sh: '#9c2230', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M92,150 L108,150 L110,200 L90,200Z', '#fffaf0', 2.8);
    s += Q('M96,160 q4,3 8,0 M96,172 q4,3 8,0', '#e6dccb', 2.2);
    s += K('M64,148 Q100,170 136,148 L140,160 Q100,182 60,160Z', '#fffaf0', 3.2);
    s += Rc(24, 178, 152, 13, 3, tc, 3) + Rc(88, 175, 24, 19, 4, '#ffd23f', 2.8) + Rc(95, 181, 10, 7, 2, '#c8921a', 1.6);
    return s;
  } };
  OUTFITS.sweater = { oc: '#c0392b', tc: '#fffaf0', sh: '#7a2a2e', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M70,144 Q100,160 130,144 L134,156 Q100,172 66,156Z', shade(oc, 0.18), 3.2) + Q('M72,152 q4,5 8,4 M88,158 q4,5 8,4 M104,159 q4,4 8,3 M120,154 q4,4 7,2', shade(oc, -0.3), 2, 0.7);
    s += Rc(20, 176, 160, 12, 0, tc, 0) + Q('M20,176 H180 M20,188 H180', shade(oc, -0.35), 2.4, 0.6);
    for (var i = 0; i < 6; i++) { s += snowflake(36 + i * 26, 182, 4.6, shade(oc, -0.2), 1.6); }
    s += Q('M22,196 H178', tc, 4, 0.9);
    return s;
  } };
  OUTFITS.scarf = { oc: '#3a7bd5', tc: '#e23b3b', sh: '#1f4a8a', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M62,146 Q100,170 138,146 L142,162 Q100,186 58,162Z', tc, 3.4) + Q('M68,154 L72,168 M84,162 L86,176 M100,166 L100,180 M116,162 L114,176 M132,154 L128,168', '#fffaf0', 3, 0.85);
    s += K('M112,164 L130,166 L134,198 L114,200Z', tc, 3.2) + Q('M114,176 L132,178 M114,188 L133,190', '#fffaf0', 3, 0.85) + Q('M116,200 v6 M122,200 v6 M128,199 v6', tc, 2.4);
    s += Rc(40, 180, 4, 0, 0, tc, 0);
    return s;
  } };
  OUTFITS.kimono = { oc: '#e23b6a', tc: '#ffd23f', sh: '#8e2150', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M80,144 L100,172 L120,144 L112,144 L100,160 L88,144Z', '#fffaf0', 2.8) + Q('M82,146 L100,170 L118,146', '#d8cfc0', 1.8, 0.8);
    s += Q('M76,144 L110,198', INK, 3.2) + Q('M124,144 L96,196', INK, 3.2) + '<path d="M80,144 L116,200 H84Z" fill="' + shade(oc, 0.08) + '" fill-opacity=".0"/>';
    s += Rc(24, 176, 152, 22, 4, tc, 3.2) + Q('M24,187 H176', shade(tc, -0.2), 2, 0.6) + Rc(24, 181, 152, 4, 0, '#e23b3b', 0) + Rc(24, 190, 152, 4, 0, '#e23b3b', 0);
    s += Ci(100, 187, 10, shade(tc, 0.35), 2.8) + Ci(100, 187, 4, '#e23b3b', 0);
    [[44, 158], [152, 160], [62, 168], [138, 170], [34, 168]].forEach(function (p) { s += snowflake(p[0], p[1], 4.4, '#fffaf0', 1.6); });
    return s;
  } };
  OUTFITS.haori = { oc: '#2a3a6a', tc: '#fffaf0', sh: '#171f3d', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M78,144 L100,164 L122,144 L116,144 L100,156 L84,144Z', '#fffaf0', 2.8);
    s += Q('M80,146 L98,190 M120,146 L102,190', shade(oc, 0.35), 2.6, 0.8) + Q('M82,166 Q100,172 118,166', '#fffaf0', 3.4) + Ci(82, 168, 3.2, '#fffaf0', 1.6) + Ci(118, 168, 3.2, '#fffaf0', 1.6);
    s += Ci(100, 184, 9, '#fffaf0', 2.4) + Ci(100, 184, 4, oc, 0) + Q('M100,175 v18 M91,184 h18', '#fffaf0', 1.4);
    s += Q('M30,196 H170', shade(oc, 0.2), 2.4, 0.6);
    return s;
  } };

  // ---- 12月クリスマス 54種化で追加した服（ここから）----
  function bodyClip(o) { return 'url(#cs' + (o && o.uid) + '_bc)'; }
  OUTFITS.parka = { oc: '#2f7ad0', tc: '#fffaf0', sh: '#173a78', base: function (oc) { return oc; }, draw: function (oc, tc, F, o) {
    var s = Q('M20,166 Q100,182 180,166 M14,182 Q100,198 186,182', shade(oc, -0.32), 3, 0.9) + Q('M58,158 L50,200 M142,158 L150,200 M78,164 L76,200 M122,164 L124,200', shade(oc, -0.25), 2.2, 0.55);
    s += Q('M100,166 V200', INK, 4.6) + Q('M100,166 V200', '#fff', 1.6, 0.8) + K('M100,178 l-4,7 h8z', '#ffd23f', 1.8);
    s += K('M58,146 Q100,170 142,146 L150,160 Q100,190 50,160Z', tc, 3.2);
    for (var i = 0; i < 7; i++) { var t = i / 6; s += Ci(r1(56 + t * 88), r1(155 + Math.sin(t * Math.PI) * 15), 5.2, tc, 0); }
    return s + Q('M64,156 Q100,176 136,156', shade(tc, -0.1), 2, 0.6);
  } };
  OUTFITS.plaid = { oc: '#c0392b', tc: '#fffaf0', sh: '#7a2a2e', base: function (oc) { return oc; }, draw: function (oc, tc, F, o) {
    var s = '<g clip-path="' + bodyClip(o) + '">', i;
    for (i = 0; i < 9; i++) s += Rc(18 + i * 20, 144, 7, 60, 0, shade(oc, -0.3), 0).replace('<rect', '<rect fill-opacity=".55"');
    for (i = 0; i < 5; i++) s += '<rect x="0" y="' + (152 + i * 12) + '" width="200" height="5" fill="' + shade(oc, -0.3) + '" fill-opacity=".55"/>';
    s += Q('M10,160 H190 M10,178 H190 M10,196 H190', '#ffd23f', 1.4, 0.7) + '</g>';
    s += K('M72,144 L100,172 L128,144 L120,142 L100,160 L80,142Z', tc, 2.8) + Q('M100,172 V200', INK, 2.4, 0.8) + Ci(100, 182, 2.8, '#ffd23f', 1.6) + Ci(100, 194, 2.8, '#ffd23f', 1.6);
    return s;
  } };
  OUTFITS.xapron = { oc: '#2f8a4a', tc: '#e23b3b', sh: '#174a28', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M74,146 L126,146 L140,200 H60Z', '#fffaf0', 3.2) + Q('M74,146 L56,156 M126,146 L144,156', '#fffaf0', 4.6) + Q('M74,146 L56,156 M126,146 L144,156', INK, 1, 0.4);
    s += Q('M70,172 H130', tc, 3, 0.9) + Q('M66,190 H134', tc, 3, 0.9);
    s += Ci(100, 160, 7, tc, 2.4) + Ci(96.4, 158, 1.8, '#fff', 0) + K('M94,163 L100,170 L106,163Z', tc, 0);
    s += Rc(84, 176, 32, 14, 3, '#fff', 2.6) + Q('M92,176 V166 q0,-5 5,-5', '#e23b3b', 3.4) + Q('M104,176 l4,-12', '#3fb867', 3.4) + Ci(112, 164, 3.6, '#ffd23f', 1.6);
    return s;
  } };
  OUTFITS.nutcoat = { oc: '#d03030', tc: '#ffd23f', sh: '#7a1620', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M82,144 H118 V158 L100,166 L82,158Z', tc, 2.8) + Q('M100,146 V200', INK, 2.6) + Q('M70,150 L112,200 M130,150 L88,200', '#fffaf0', 3.4, 0.95);
    [[88, 172], [112, 172], [88, 186], [112, 186]].forEach(function (p) { s += Ci(p[0], p[1], 3.4, tc, 1.8); });
    s += K('M30,168 L56,152 L64,163 L38,180Z', tc, 2.8) + Q('M36,174 L56,162', '#e8a010', 2) + K('M170,168 L144,152 L136,163 L162,180Z', tc, 2.8) + Q('M164,174 L144,162', '#e8a010', 2);
    return s + Rc(20, 192, 160, 8, 0, '#2c2a3a', 2.4);
  } };
  OUTFITS.elfsuit = { oc: '#2f9a52', tc: '#e23b3b', sh: '#175a2c', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M56,148 L66,166 L78,152 L88,168 L100,154 L112,168 L122,152 L134,166 L144,148 L136,144 H64Z', tc, 2.8) + Ci(100, 158, 5.4, '#ffd23f', 2.2) + Q('M97,157 h6', INK, 1.4);
    s += Rc(14, 178, 172, 12, 0, '#2c2a3a', 3) + Rc(86, 175, 28, 18, 4, '#ffd23f', 2.8) + Rc(94, 180, 12, 8, 2, '#c8921a', 1.6);
    for (var i = 0; i < 6; i++) s += st5(30 + i * 28, 168, 4, '#ffd23f', 1.2);
    return s + Q('M18,198 l10,-8 l10,8 l10,-8 l10,8 l10,-8 l10,8 l10,-8 l10,8 l10,-8 l10,8 l10,-8 l10,8 l10,-8 l10,8', tc, 3, 0.9);
  } };
  OUTFITS.poncho = { oc: '#e23b3b', tc: '#fffaf0', sh: '#7a2a2e', base: function (oc) { return oc; }, draw: function (oc, tc, F, o) {
    var s = '<g clip-path="' + bodyClip(o) + '">', cols = [oc, tc, '#2f8a4a', tc, oc, '#2f8a4a'], i;
    for (i = 0; i < 6; i++) s += '<rect x="0" y="' + (148 + i * 10) + '" width="200" height="10" fill="' + cols[i] + '"/>';
    s += Q('M10,158 H190 M10,168 H190 M10,178 H190 M10,188 H190 M10,198 H190', INK, 1.6, 0.35) + '</g>';
    s += K('M66,146 Q100,162 134,146 L136,158 Q100,174 64,158Z', shade(oc, -0.12), 3) + Q('M72,156 q4,6 8,3 M92,162 q4,6 8,2 M112,161 q4,5 8,0', shade(oc, -0.32), 2, 0.7);
    return s + Q('M100,172 V196', INK, 2, 0.4) + Ci(100, 190, 3.4, '#ffd23f', 1.8);
  } };
  OUTFITS.ginger = { oc: '#b9733a', tc: '#fffaf0', sh: '#6a3a14', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = Q('M52,158 q6,9 12,0 q6,9 12,0 q6,9 12,0 q6,9 12,0 q6,9 12,0 q6,9 12,0 q6,9 12,0', tc, 4.4) + Q('M18,184 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0 q6,-9 12,0', tc, 3.6);
    s += Ci(100, 172, 5.6, '#e23b3b', 2.2) + Ci(100, 192, 5.6, '#3fb867', 2.2) + Ci(98, 170, 1.6, '#fff', 0) + Ci(98, 190, 1.6, '#fff', 0);
    return s + Ci(54, 176, 3.4, '#ffd23f', 1.6) + Ci(146, 176, 3.4, '#4a90f0', 1.6) + Ci(36, 194, 3, '#e23b3b', 1.4) + Ci(164, 194, 3, '#e23b3b', 1.4);
  } };
  OUTFITS.furcape = { oc: '#b0233a', tc: '#fffaf0', sh: '#5e1020', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M92,158 H108 V200 H92Z', tc, 3) + Q('M70,150 Q86,178 90,200 M130,150 Q114,178 110,200', shade(oc, -0.3), 2.6, 0.7);
    s += K('M54,146 Q100,172 146,146 L152,162 Q100,192 48,162Z', tc, 3.4);
    [[64, 160], [82, 170], [118, 170], [136, 160], [100, 176]].forEach(function (p) { s += '<path d="M' + p[0] + ',' + p[1] + ' l-2.4,8 l2.4,-1.6 l2.4,1.6z" fill="' + INK + '"/>'; });
    return s + Q('M84,150 Q100,164 116,150', '#ffd23f', 2.4) + Ci(100, 160, 5, '#ffd23f', 2.2) + st4(50, 180, 5, '#fff') + st4(152, 184, 5, '#fff');
  } };
  OUTFITS.xgown = { oc: '#9c1f3c', tc: '#f6b82e', sh: '#4a0c1c', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var s = K('M70,144 L100,178 L130,144 L122,144 L100,166 L78,144Z', tc, 2.8) + Q('M72,146 L100,176 L128,146', '#fff7c0', 1.8, 0.9);
    s += Q('M12,170 C44,160 70,170 100,178 C130,170 156,160 188,170', tc, 3.4) + Q('M14,188 Q100,176 186,188', '#fffaf0', 6) + Q('M14,188 Q100,176 186,188', INK, 1, 0.3);
    return s + st4(44, 176, 6, '#fff7c0', '#d9941a') + st4(156, 178, 6, '#fff7c0', '#d9941a') + st4(100, 192, 5, '#fff7c0', '#d9941a') + Ci(100, 182, 5, '#ff5f7a', 2.2) + Ci(98.4, 180.4, 1.4, '#fff', 0);
  } };
  OUTFITS.lightsuit = { oc: '#1f6a3a', tc: '#ffd23f', sh: '#0e3a1e', base: function (oc) { return oc; }, draw: function (oc, tc) {
    var cols = ['#e23b3b', '#ffd23f', '#4a90f0', '#ff8fb6', '#6dffb4'], s = '';
    [[150, 'M16,168 C50,186 150,186 184,168'], [168, 'M12,186 C50,204 150,204 188,186']].forEach(function (g, gi) {
      s += Q(g[1], INK, 4.6) + Q(g[1], '#3a3a4a', 2);
      for (var i = 0; i < 8; i++) {
        var t = (i + 0.5) / 8, y0 = gi ? 186 : 168, px = (gi ? 12 : 16) + t * (gi ? 176 : 168), py = y0 + Math.sin(t * Math.PI) * 14.5;
        s += Rc(r1(px - 2), r1(py + 1), 4, 4, 1, '#5b4a6a', 1.2) + '<path class="zk" d="M' + r1(px - 5) + ',' + r1(py + 5) + ' h10 q0,10 -5,10 q-5,0 -5,-10Z" fill="' + cols[(i + gi * 2) % 5] + '" stroke-width="1.8"/>' + Ci(r1(px - 1.6), r1(py + 9), 1.4, '#fff', 0);
      }
    });
    return Q('M100,146 V164', INK, 2.4, 0.5) + s + st4(40, 156, 4, '#fff') + st4(160, 156, 4, '#fff');
  } };
  // ---- 服の追加ここまで ----

  // =====================================================================
  // 小物
  //   右手持ち：pg(142,140,…) の座標（原点＝持つ位置）／前持ち：絶対座標で両手
  // =====================================================================
  PROPS.tree = function (pc, x) {
    return pg(144, 140, K('M-4,22 H4 V30 H-4Z', '#8a5a34', 2.6) + K('M-22,22 L0,-8 L22,22Z', '#2f9a52', 3.2) + K('M-18,6 L0,-22 L18,6Z', '#3fb867', 3.2) + K('M-13,-12 L0,-38 L13,-12Z', '#52cc7a', 3.2) +
      st5(0, -42, 8, '#ffd23f', 2.2) + Ci(-8, 14, 3.4, '#e23b3b', 1.6) + Ci(8, 4, 3.4, '#4a90f0', 1.6) + Ci(-3, -6, 3, '#ffd23f', 1.6) + Ci(4, -18, 2.8, '#ff8fb6', 1.6) + HL('M-12,0 L-4,-10', 2.2) +
      K('M-17,28 H17 L13,38 H-13Z', '#e0875a', 3) + x.paw(0, 34, 0.9));
  };
  PROPS.gift = function (pc, x) {
    var c = pc || '#e23b3b';
    return pg(144, 142, K('M-22,-16 H22 V24 H-22Z', c, 3.4) + Rc(-25, -22, 50, 12, 3, shade(c, 0.12), 3.2) + Rc(-5, -22, 10, 46, 0, '#ffd23f', 2.4) + Rc(-25, -8, 0, 0, 0, '#fff', 0) +
      K('M0,-22 C-10,-40 -26,-34 -20,-26 C-16,-20 -6,-22 0,-22Z', '#ffd23f', 2.8) + K('M0,-22 C10,-40 26,-34 20,-26 C16,-20 6,-22 0,-22Z', '#ffd23f', 2.8) + Ci(0, -22, 4, '#e8a010', 2) + HL('M-17,-12 V10', 2.6) + x.paw(0, 22, 1));
  };
  PROPS.candycane = function (pc, x) {
    var s = '', i;
    s += Q('M0,40 V-14 C0,-34 26,-34 26,-14', INK, 15);
    s += Q('M0,40 V-14 C0,-34 26,-34 26,-14', '#fffaf0', 10.4);
    for (i = 0; i < 6; i++) s += Q('M-6,' + (30 - i * 9) + ' l12,-6', '#e23b3b', 4.2);
    s += Q('M22,-26 l5,5 M25,-30 l5,5', '#e23b3b', 4.2);
    return pg(140, 134, s + Q('M-3,-12 C-3,-30 22,-30 23,-14', '#fff', 2, 0.7) + x.paw(0, 32, 1));
  };
  PROPS.stocking = function (pc, x) {
    return pg(144, 138, K('M-14,-26 H14 V8 C14,16 26,18 28,28 C30,38 16,40 8,38 C-8,34 -14,22 -14,8Z', '#e23b3b', 3.4) + K('M-17,-32 H17 V-20 H-17Z', '#fffaf0', 3.2) + Q('M-8,-6 h14 M-8,2 h14', '#fffaf0', 3, 0.85) +
      Q('M18,16 q8,4 8,12', '#fffaf0', 3, 0.85) + K('M-4,-34 L-1,-46 L5,-34Z', '#ffd23f', 2) + Q('M-12,-30 L-6,-40', '#e23b3b', 3) + Ci(8, -42, 4, '#e23b3b', 1.8) + x.paw(0, 20, 1));
  };
  PROPS.bell = function (pc, x) {
    function b(rot) { return Gp('rotate(' + rot + ')', K('M-14,16 C-14,-6 -8,-22 0,-22 C8,-22 14,-6 14,16 Z', '#ffd23f', 3.2) + Rc(-17, 14, 34, 7, 3, '#f2b81c', 3) + Ci(0, 26, 4.4, '#c8921a', 2) + HL('M-8,10 C-8,-2 -5,-12 -2,-16', 2.4)); }
    return pg(142, 138, Gp('translate(-14,2)', b(-12)) + Gp('translate(14,2)', b(12)) + K('M0,-24 C-8,-34 -22,-30 -16,-22 C-12,-18 -4,-20 0,-24Z', '#e23b3b', 2.6) + K('M0,-24 C8,-34 22,-30 16,-22 C12,-18 4,-20 0,-24Z', '#e23b3b', 2.6) + Ci(0, -24, 3.6, '#c42a2a', 2) + x.paw(0, 22, 0.95));
  };
  PROPS.cocoa = function (pc, x) {
    return pg(144, 138, Q('M-6,-18 q-6,-8 0,-14 q6,-6 0,-14 M8,-18 q-6,-8 0,-14 q6,-6 0,-14', '#fff', 3.4, 0.8) + K('M-20,-14 H20 V16 C20,28 12,34 0,34 C-12,34 -20,28 -20,16Z', '#fffaf0', 3.4) +
      K('M-20,-14 H20 V-4 C20,0 -20,0 -20,-4Z', '#7a4a2a', 2.6) + Ci(-8, -14, 6, '#fffaf0', 2.2) + Ci(6, -15, 5, '#fffaf0', 2.2) + K('M20,-6 C34,-6 34,14 18,14', 'none', 3.4) + Q('M-16,8 h32', '#e23b3b', 4) + HL('M-14,-2 V12', 2.6) + x.paw(0, 28, 1));
  };
  PROPS.snowman = function (pc, x) {
    return pg(144, 138, Ci(0, 14, 17, '#fffaf0', 3.2) + Ci(0, -10, 12, '#fffaf0', 3.2) + HL('M-9,-14 q3,-4 8,-5', 2.2) + Ci(-4, -12, 1.8, INK, 0) + Ci(4, -12, 1.8, INK, 0) + K('M0,-9 L10,-7 L0,-5Z', '#ff9a2e', 1.8) +
      K('M-13,-22 H13 L11,-34 H-11Z', '#2c2a3a', 2.8) + Rc(-15, -24, 30, 5, 1, '#2c2a3a', 2.6) + Rc(-11, -30, 22, 4, 0, '#e23b3b', 0) + K('M-12,-1 Q0,6 12,-1 L13,5 Q0,12 -13,5Z', '#e23b3b', 2.6) + Ci(0, 12, 2, INK, 0) + Ci(0, 20, 2, INK, 0) + x.paw(0, 26, 0.9));
  };
  PROPS.lights = function (pc, x) {
    var cols = ['#e23b3b', '#ffd23f', '#3fb867', '#4a90f0', '#ff8fb6', '#ffd23f', '#e23b3b'];
    var s = Q('M66,168 C80,196 120,196 134,168', INK, 5);
    cols.forEach(function (c, i) { var t = i / 6, px = 66 + t * 68, py = 168 + Math.sin(t * Math.PI) * 21; s += Rc(r1(px - 2), r1(py), 4, 6, 1, '#5b4a6a', 1.6) + '<path class="zk" d="M' + r1(px - 6) + ',' + r1(py + 6) + ' h12 q0,14 -6,14 q-6,0 -6,-14Z" fill="' + c + '" stroke-width="2.2"/>' + Ci(r1(px - 2), r1(py + 11), 1.8, '#fff', 0); });
    return s + x.paw(66, 170, 1) + x.paw(134, 170, 1);
  };
  PROPS.letter = function (pc, x) {
    return pg(144, 140, Gp('rotate(10)', K('M-26,-16 H26 V22 H-26Z', '#fffdf6', 3.2) + K('M-26,-16 L0,6 L26,-16', 'none', 3) + Q('M-26,22 L-8,4 M26,22 L8,4', INK, 2.4, 0.5) + Ci(0, 4, 6.4, '#e23b3b', 2) + HL('M-3,2 q2,-3 4,-1', 1.8) + st4(-30, -22, 6, '#ffd23f', INK) + st4(30, 26, 5, '#fff')) + x.paw(2, 28, 1));
  };
  PROPS.xcake = function (pc, x) {
    return K('M58,184 H142 L138,194 H62Z', '#fffaf0', 3) + K('M64,164 H136 V184 H64Z', '#fffaf0', 3.4) + K('M64,164 C64,152 136,152 136,164 C136,172 128,170 124,166 C120,174 112,172 110,166 C104,174 96,172 94,166 C88,174 78,172 76,166 C72,172 64,172 64,164Z', '#8a4a2a', 3) +
      Rc(94, 146, 10, 14, 2, '#fffaf0', 2.4) + K('M99,146 q-4,-6 0,-11 q4,5 0,11Z', '#ffb02e', 2) + Ci(78, 158, 4.4, '#e23b3b', 2) + Ci(120, 158, 4.4, '#e23b3b', 2) + Ci(88, 170, 3.4, '#e23b3b', 1.6) + Ci(112, 170, 3.4, '#e23b3b', 1.6) + K('M126,158 l8,-4 l-2,8Z', '#3fb867', 1.8) + x.paw(60, 178, 1) + x.paw(140, 178, 1);
  };
  PROPS.kagami = function (pc, x) {
    return pg(144, 138, K('M-24,22 H24 V30 H-24Z', '#c8372d', 2.8) + K('M-22,22 C-22,8 22,8 22,22Z', '#fffaf0', 3.2) + K('M-16,10 C-16,-4 16,-4 16,10Z', '#fffaf0', 3.2) + Ci(0, -8, 9, '#ff9a2e', 3) + K('M0,-16 q8,-8 16,-3 q-6,8 -16,3Z', '#4fbf6a', 2.2) + Q('M-12,2 q6,3 12,0', '#e6dccb', 2) + x.paw(0, 28, 1));
  };
  PROPS.koma = function (pc, x) {
    return pg(144, 134, Q('M-30,-6 q8,-6 14,0 M20,-14 q8,-6 14,0 M-28,12 q8,6 16,2', '#fff', 3, 0.85) + K('M0,34 L-5,20 H5Z', '#6a4a2a', 2.6) + K('M-24,0 C-24,-14 24,-14 24,0 C24,12 12,22 0,22 C-12,22 -24,12 -24,0Z', '#e23b3b', 3.4) + Q('M-22,-2 C-10,2 10,2 22,-2', '#ffd23f', 4) + Q('M-18,8 C-8,12 8,12 18,8', '#4a90f0', 4) + Rc(-3, -22, 6, 10, 2, '#6a4a2a', 2.4) + HL('M-16,-4 C-14,-9 -8,-11 -4,-11', 2.4) + x.paw(0, 38, 0.9));
  };
  PROPS.kite = function (pc, x) {
    return pg(146, 124, Gp('rotate(18)', Q('M0,16 C-8,34 8,46 0,62', '#fff', 2.4, 0.9) + K('M0,-40 L26,-8 L0,24 L-26,-8Z', '#fffaf0', 3.2) + Q('M0,-40 V24 M-26,-8 H26', '#e23b3b', 3) + Ci(0, -8, 8, '#e23b3b', 2.4) + Ci(-12,-8,1.8,'#fffaf0',0) + K('M0,24 q-8,12 -4,22 q8,-4 4,-22Z', '#4a90f0', 2.2) + K('M0,24 q8,14 4,24 q-8,-6 -4,-24Z', '#ffd23f', 2.2)) + x.paw(-2, 30, 0.95));
  };
  PROPS.ema = function (pc, x) {
    return pg(144, 140, Gp('rotate(-6)', K('M-26,-12 L0,-34 L26,-12 V22 H-26Z', '#e6b878', 3.4) + Q('M-26,-12 L0,-34 L26,-12', '#c88a4a', 0) + HL('M-20,-8 L0,-26', 2.4) + K('M0,-34 v-8', 'none', 2.6) + Q('M0,-36 C-8,-44 8,-46 0,-52', '#e23b3b', 2.8) + Ci(0, -4, 8.4, '#fffaf0', 2.2) + K('M-8,-10 L-6,-18 L-2,-12Z M8,-10 L6,-18 L2,-12Z', '#fffaf0', 1.8) + Q('M-3,-4 h0 M3,-4 h0', INK, 2.6) + st4(-14, 10, 4.6, '#ff8fb6', INK) + Q('M-6,13 q6,5 12,0', '#e23b3b', 2.4)) + x.paw(2, 26, 1));
  };
  PROPS.osechi = function (pc, x) {
    var tier = function (y, col) { return Rc(62, y, 76, 16, 3, col, 3.2); };
    var s = tier(172, '#c8372d') + Rc(62, 170, 76, 4, 0, '#ffd23f', 2) + tier(156, '#2c2a3a') + Rc(62, 154, 76, 4, 0, '#ffd23f', 2);
    s += K('M62,150 H138 V158 H62Z', '#c8372d', 3) + Rc(66, 136, 68, 14, 2, '#fffaf0', 2.8) + Ci(78, 143, 4.4, '#ff8fb6', 1.6) + Ci(90, 143, 4.4, '#ffd23f', 1.6) + Ci(102, 143, 4.4, '#ff9a2e', 1.6) + Ci(114, 143, 4.4, '#3fb867', 1.6) + Ci(126, 143, 4.4, '#e23b3b', 1.6);
    return s + x.paw(60, 178, 1) + x.paw(140, 178, 1);
  };
  PROPS.omikuji = function (pc, x) {
    return pg(144, 138, K('M-14,-34 H14 V30 H-14Z', '#fffdf6', 3.2) + Rc(-14, -34, 28, 8, 0, '#e23b3b', 3) + Q('M0,-22 V24', INK, 0) + '<text x="0" y="-8" font-size="15" font-weight="900" text-anchor="middle" fill="#e23b3b" font-family="\'Hiragino Maru Gothic ProN\',\'Zen Maru Gothic\',\'Yu Gothic\',sans-serif">大</text><text x="0" y="10" font-size="15" font-weight="900" text-anchor="middle" fill="#e23b3b" font-family="\'Hiragino Maru Gothic ProN\',\'Zen Maru Gothic\',\'Yu Gothic\',sans-serif">吉</text>' + st4(-22, -26, 5, '#ffd23f', INK) + x.paw(0, 26, 1));
  };
  PROPS.fukubukuro = function (pc, x) {
    return pg(144, 140, K('M-26,24 C-30,0 -22,-14 -12,-20 H12 C22,-14 30,0 26,24Z', '#e23b3b', 3.4) + K('M-14,-20 L-20,-34 L-6,-26 L0,-38 L6,-26 L20,-34 L14,-20Z', '#e23b3b', 3) + Rc(-14, -22, 28, 6, 3, '#ffd23f', 2.6) + '<text x="0" y="14" font-size="26" font-weight="900" text-anchor="middle" fill="#ffd23f" stroke="' + INK + '" stroke-width="1.4" paint-order="stroke" font-family="\'Hiragino Maru Gothic ProN\',\'Zen Maru Gothic\',\'Yu Gothic\',sans-serif">福</text>' + HL('M-20,-4 C-24,4 -24,12 -22,18', 2.4) + x.paw(0, 26, 1));
  };
  PROPS.nengajo = function (pc, x) {
    return pg(144, 138, Gp('rotate(-8)', K('M-22,-30 H22 V30 H-22Z', '#fffdf6', 3.2) + Rc(8, -26, 11, 13, 1, '#ff8fb6', 1.8) + Q('M10,-22 h7 M10,-18 h5', '#fff', 1.6) + Ci(-2, 4, 12, '#fff6e6', 3) + Ci(-8, -4, 4, '#fff6e6', 2) + Ci(4, -6, 4, '#fff6e6', 2) + Q('M-7,12 q5,4 10,0', '#b8864e', 2.4) + Ci(-4, 4, 1.4, INK, 0) + Ci(3, 4, 1.4, INK, 0) + '<text x="-10" y="-14" font-size="10" font-weight="900" fill="#e23b3b" text-anchor="middle" font-family="\'Hiragino Maru Gothic ProN\',\'Zen Maru Gothic\',\'Yu Gothic\',sans-serif">賀正</text>') + x.paw(2, 30, 1));
  };
  PROPS.kakizome = function (pc, x) {
    var f = '\'Hiragino Mincho ProN\',\'Hiragino Maru Gothic ProN\',\'Zen Maru Gothic\',\'Yu Gothic\',sans-serif';
    return K('M62,148 H138 V196 H62Z', '#fffdf6', 3.2) + Q('M70,156 H130', '#e8dfc9', 2) + '<text x="100" y="186" font-size="38" font-weight="900" text-anchor="middle" fill="#2c2a3a" font-family="' + f + '">ゆめ</text>' + Ci(126, 160, 5, '#e23b3b', 0) + x.paw(60, 184, 1) + x.paw(140, 184, 1);
  };
  PROPS.karuta = function (pc, x) {
    function card(rot, col, tx) { return Gp('rotate(' + rot + ')', K('M-14,-26 H14 V26 H-14Z', col, 3) + '<text x="0" y="6" font-size="22" font-weight="900" text-anchor="middle" fill="#2c2a3a" font-family="\'Hiragino Mincho ProN\',\'Hiragino Maru Gothic ProN\',\'Yu Gothic\',sans-serif">' + tx + '</text>'); }
    return pg(144, 140, Gp('translate(-14,2)', card(-18, '#fffdf6', 'い')) + Gp('translate(14,2)', card(16, '#ffe9a8', 'ろ')) + Gp('translate(0,-2)', card(0, '#fffdf6', 'は')) + x.paw(0, 28, 1));
  };
  PROPS.otoshidama = function (pc, x) {
    return pg(144, 140, Gp('rotate(6)', K('M-18,-30 H18 V30 H-18Z', '#e23b3b', 3.4) + K('M-18,-30 L0,-14 L18,-30', '#c42a2a', 2.8) + Ci(0, -6, 7, '#ffd23f', 2.4) + Q('M-12,6 h24 M-12,14 h24', '#ffd23f', 2.2, 0.9) + '<text x="0" y="26" font-size="9" font-weight="900" text-anchor="middle" fill="#fffaf0" font-family="\'Hiragino Maru Gothic ProN\',\'Zen Maru Gothic\',\'Yu Gothic\',sans-serif">おとしだま</text>') + x.paw(2, 28, 1));
  };
  PROPS.hagoita = function (pc, x) {
    return pg(146, 132, Gp('rotate(22)', K('M-16,-34 H16 V8 C16,16 8,20 0,20 C-8,20 -16,16 -16,8Z', '#e6b878', 3.4) + Rc(-4, 20, 8, 30, 2, '#c88a4a', 3) + Ci(0, -12, 11, '#ffc4d6', 2.6) + Q('M-6,-10 q6,5 12,0', '#e23b3b', 2.4) + Ci(-4, -14, 1.6, INK, 0) + Ci(4, -14, 1.6, INK, 0) + K('M-12,-26 Q0,-36 12,-26', '#2c2a3a', 2.4) + st4(-10, 4, 4, '#e23b3b', INK) + st4(10, 4, 4, '#4a90f0', INK)) +
      Gp('translate(-28,-36)', Ci(0, 0, 6, '#2c2a3a', 2) + K('M-3,-5 L-8,-18 L-1,-12 L0,-20 L2,-12 L8,-18 L3,-5Z', '#e23b3b', 1.8)) + x.paw(-2, 36, 0.95));
  };
  PROPS.sunfan = function (pc, x) {
    return pg(144, 136, Gp('rotate(-10)', '<path class="zk" d="M0,30 L-34,-14 A44,44 0 0 1 34,-14Z" fill="#fffaf0" stroke-width="3.4"/>' + Q('M0,30 L-22,-26 M0,30 L-8,-32 M0,30 L8,-32 M0,30 L22,-26', '#e8dfc9', 2) + Ci(0, -14, 10, '#e23b3b', 2.6) + Q('M-34,-14 A44,44 0 0 1 34,-14', '#ffd23f', 3.6)) + x.paw(0, 28, 0.95));
  };
  PROPS.kadomatsu = function (pc, x) {
    return pg(144, 140, K('M-22,22 H22 V30 H-22Z', '#8a5a34', 2.6) + K('M-16,-14 L-6,-24 L-6,24 H-16Z', '#9fd86a', 3) + K('M0,-26 L10,-36 L10,24 H0Z', '#7cc24a', 3) + K('M-12,-16 H-9 M4,-30 H7', INK, 1.6) + Q('M-14,-6 H-8 M-14,10 H-8 M2,-10 H8 M2,8 H8', '#4a9a2a', 2, 0.9) +
      Q('M14,24 C22,6 30,-8 38,-18 M14,24 C26,14 34,10 42,10 M14,24 C20,-2 22,-16 24,-30', '#2f9a52', 3.4) + Ci(36, -16, 3.4, '#ff8fb6', 1.6) + Ci(-20, 18, 3.4, '#ffd23f', 1.6) + K('M-24,12 H24 V22 H-24Z', '#e23b3b', 2.6) + x.paw(0, 28, 0.9));
  };
  PROPS.hamaya = function (pc, x) {
    return pg(146, 132, Gp('rotate(26)', Q('M0,-54 V44', INK, 7) + Q('M0,-54 V44', '#e6b878', 3.6) + K('M0,-62 L-6,-48 H6Z', '#c8d0dc', 2.4) + K('M-8,30 L0,16 L8,30 L0,44Z', '#fffaf0', 2.6) + K('M-6,18 L-14,40 L-4,30Z', '#fffaf0', 2.4) + K('M6,18 L14,40 L4,30Z', '#fffaf0', 2.4) + Rc(-5, 0, 10, 6, 2, '#e23b3b', 2.2) + Ci(0, -10, 6, '#ffd23f', 2.2) + Q('M0,-4 v6', '#e23b3b', 2)) + x.paw(-6, 20, 0.95));
  };

  // ---- 12月クリスマス 54種化で追加した小物（ここから）----
  PROPS.flake = function (pc, x) {
    return pg(144, 136, Ci(0, 0, 30, pc || '#6ec5ff', 3.4) + Ci(0, 0, 24.5, '#eaf7ff', 0) + snowflake(0, 0, 21, '#3a8ad8', 3) + Ci(0, 0, 3, '#3a8ad8', 0) + HL('M-20,-14 q4,-8 14,-11', 2.6) + x.paw(0, 32, 1));
  };
  PROPS.thermo = function (pc, x) {
    return pg(144, 134, Rc(-7, -40, 14, 56, 7, '#fffaf0', 3.2) + Rc(-2.6, -10, 5.2, 28, 2.6, '#e23b3b', 0) + Ci(0, 24, 11, '#fffaf0', 3.2) + Ci(0, 24, 7, '#e23b3b', 0) + Ci(-2.4, 21.6, 1.8, '#fff', 0) +
      Q('M11,-32 h8 M11,-22 h5 M11,-12 h8 M11,-2 h5 M11,8 h8', INK, 2, 0.7) + snowflake(-22, -26, 7, '#fff', 1.8) + x.paw(0, 2, 0.95));
  };
  PROPS.candle = function (pc, x) {
    return pg(144, 140, '<circle cx="0" cy="-26" r="17" fill="#ffe27a" fill-opacity=".38"/>' + El(0, 28, 26, 7, '#ffd23f', 2.8) + Q('M26,26 C38,24 38,34 26,34', '#ffd23f', 3.2) + Rc(-8, -12, 16, 40, 3, pc || '#fffaf0', 3) + Q('M-8,2 l16,-6 M-8,14 l16,-6', '#e23b3b', 3.4) +
      K('M0,-12 C-9,-22 -3,-30 0,-40 C3,-30 9,-22 0,-12Z', '#ff9a2e', 2.4) + K('M0,-14 C-4,-20 -1,-25 0,-29 C1,-25 4,-20 0,-14Z', '#fff3b0', 0) + x.paw(0, 30, 0.95));
  };
  PROPS.prism = function (pc, x) {
    var cols = ['#ff5a5a', '#ff9a2e', '#ffd23f', '#3fb867', '#4a90f0'], s = Q('M-40,-4 L-6,6', '#fff', 3.6) + Q('M-40,-4 L-6,6', INK, 0.8, 0.3);
    cols.forEach(function (c, i) { s += Q('M8,4 L30,' + (-12 + i * 9), c, 3); });
    return pg(142, 138, s + K('M-20,28 L0,-20 L20,28Z', '#cfeeff', 3.2) + Q('M-8,18 L0,-4', '#fff', 2.4, 0.85) + x.paw(0, 30, 0.95));
  };
  PROPS.snowglobe = function (pc, x) {
    return pg(144, 138, Ci(0, -6, 26, '#e2f4ff', 3.4) + K('M-9,12 L0,-8 L9,12Z', '#2f9a52', 2.2) + K('M-6,2 L0,-16 L6,2Z', '#3fb867', 2.2) + st5(0, -18, 3.6, '#ffd23f', 1.2) + Ci(-14, -14, 2, '#fff', 0) + Ci(14, -6, 2, '#fff', 0) + Ci(-16, 4, 2, '#fff', 0) + Ci(10, -20, 1.8, '#fff', 0) + Ci(16, 8, 1.8, '#fff', 0) + HL('M-18,-16 q4,-8 12,-10', 2.6) +
      K('M-19,16 H19 L24,32 H-24Z', '#c8372d', 3) + Q('M-21,23 H21', '#ffd23f', 2.4) + x.paw(0, 30, 0.95));
  };
  PROPS.pinecone = function (pc, x) {
    var s = '', r, c;
    for (r = 0; r < 5; r++) for (c = 0; c < 3; c++) s += Q('M' + (-11 + c * 8 + (r % 2) * 4) + ',' + (-12 + r * 9) + ' q4,7 8,0', shade('#8a5a34', 0.28), 2.6, 0.9);
    return pg(144, 138, El(0, 0, 16, 27, '#8a5a34', 3.2) + s + Q('M0,-26 l-9,-14 M0,-26 l0,-16 M0,-26 l9,-14', '#2f9a52', 3.6) + El(0, -24, 11, 5, '#fff', 2) + El(0, 24, 8, 3, '#6a4020', 0) + x.paw(0, 26, 0.95));
  };
  PROPS.ornament = function (pc, x) {
    var c = pc || '#e23b3b';
    return pg(144, 136, Q('M0,-20 q-6,-10 0,-12 q6,2 0,12', '#ffd23f', 2.6) + Ci(0, 6, 22, c, 3.4) + Q('M-20,2 Q0,14 20,2 M-18,14 Q0,26 18,14', '#fff', 3, 0.85) + Ci(-8, 8, 2, '#ffd23f', 0) + Ci(8, 8, 2, '#ffd23f', 0) + Rc(-6, -18, 12, 8, 2, '#ffd23f', 2.4) + HL('M-15,-4 q2,-8 10,-10', 2.8) + x.paw(0, 30, 0.95));
  };
  PROPS.sled = function (pc, x) {
    return pg(132, 142, Gp('scale(.9)', Q('M-36,28 H30 C44,28 46,12 34,10', INK, 10) + Q('M-36,28 H30 C44,28 46,12 34,10', '#c8a060', 5.4) + Q('M-24,28 V22 M16,28 V22', INK, 3.4) + Rc(-30, 12, 60, 10, 2, '#c8372d', 3) + Rc(-12, -8, 24, 20, 2, '#4a90f0', 2.8) + Rc(-2, -8, 4, 20, 0, '#ffd23f', 2) + K('M0,-8 C-8,-18 -16,-14 -10,-9 C-6,-6 -2,-8 0,-8Z', '#ffd23f', 2) + K('M0,-8 C8,-18 16,-14 10,-9 C6,-6 2,-8 0,-8Z', '#ffd23f', 2) +
      Q('M-30,16 Q-40,0 -28,-14', '#fffaf0', 3)) + x.paw(-24, -10, 0.9));
  };
  PROPS.sack = function (pc, x) {
    return pg(144, 140, K('M-24,28 C-36,6 -22,-8 -10,-14 L10,-14 C22,-8 36,6 24,28Z', pc || '#b56a3a', 3.4) + Q('M-14,6 Q-10,14 -14,22 M12,2 Q16,12 12,20', shade('#b56a3a', -0.3), 2.4, 0.6) +
      Rc(-10, -28, 11, 11, 1, '#4a90f0', 2.2) + Q('M-4.5,-28 v11', '#ffd23f', 2) + Q('M7,-14 V-32 q0,-7 7,-7', INK, 8) + Q('M7,-14 V-32 q0,-7 7,-7', '#fffaf0', 4.4) + Q('M7,-24 l5,-3', '#e23b3b', 2.6) + st5(-12, -36, 6, '#ffd23f', 1.8) +
      K('M-14,-12 Q0,-2 14,-12 L14,-8 Q0,2 -14,-8Z', '#ffd23f', 2.6) + x.paw(0, 26, 0.95));
  };
  PROPS.advent = function (pc, x) {
    var s = '', r, c, open;
    for (r = 0; r < 4; r++) for (c = 0; c < 3; c++) { open = (r * 3 + c) % 5 === 1; s += Rc(-18 + c * 13, -26 + r * 14, 11, 11, 1, open ? '#ffe27a' : (r + c) % 2 ? '#fffaf0' : '#ffb3c0', 1.6); if (!open) s += Ci(-12.5 + c * 13, -20.5 + r * 14, 1.1, '#e23b3b', 0); }
    return pg(144, 138, Rc(-24, -34, 48, 64, 3, '#2f8a4a', 3.4) + s + st5(0, -42, 8, '#ffd23f', 2) + x.paw(0, 34, 0.9));
  };
  PROPS.wreathd = function (pc, x) {
    var s = '', i;
    for (i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += El(r1(Math.cos(a) * 23), r1(Math.sin(a) * 23), 11, 6, i % 2 ? '#2f9a52' : '#3fb867', 2.2, r1(a * 180 / Math.PI + 90)); }
    return pg(144, 138, s + Ci(-14, -18, 3.6, '#e23b3b', 1.6) + Ci(16, -14, 3.6, '#e23b3b', 1.6) + Ci(-20, 8, 3.6, '#e23b3b', 1.6) + Ci(18, 12, 3.6, '#e23b3b', 1.6) +
      K('M0,-24 C-10,-40 -28,-34 -22,-26 C-18,-20 -8,-22 0,-24Z', '#e23b3b', 2.6) + K('M0,-24 C10,-40 28,-34 22,-26 C18,-20 8,-22 0,-24Z', '#e23b3b', 2.6) + Ci(0, -24, 4, '#c42a2a', 2) + x.paw(0, 28, 0.95));
  };
  PROPS.lantern = function (pc, x) {
    return pg(144, 144, '<circle cx="0" cy="4" r="30" fill="#ffe27a" fill-opacity=".16"/>' + Q('M-10,-24 C-10,-42 10,-42 10,-24', INK, 3.4) + K('M-15,-24 H15 L10,-16 H-10Z', '#2c2a3a', 2.8) + Rc(-12, -16, 24, 38, 3, '#ffe9a0', 3.2) + Q('M0,-16 V22 M-12,3 H12', INK, 2, 0.55) +
      K('M0,18 C-8,10 -3,4 0,-6 C3,4 8,10 0,18Z', '#ff9a2e', 2.2) + K('M0,16 C-3,11 -1,8 0,4 C1,8 3,11 0,16Z', '#fff3b0', 0) + Rc(-14, 22, 28, 7, 2, '#c8372d', 2.8) + x.paw(0, -36, 0.95));
  };
  PROPS.cookie = function (pc, x) {
    var c = pc || '#c8864a';
    return pg(146, 140, Gp('scale(1.2)', K('M-8,-12 L-25,-9 C-32,-7 -29,5 -22,5 L-9,3 L-13,27 C-13,34 -4,34 -2,27 L0,17 L2,27 C4,34 13,34 13,27 L9,3 L22,5 C29,5 32,-7 25,-9 L8,-12Z', c, 3.2) + Ci(0, -23, 12, c, 3.2) + Ci(-4, -25, 1.7, INK, 0) + Ci(4, -25, 1.7, INK, 0) + Q('M-4,-19 q4,4 8,0', '#fffaf0', 2.2) +
      Q('M-24,1 l5,-1 M-14,22 l5,0 M6,22 l5,0 M19,1 l5,0', '#fffaf0', 2.6) + Ci(0, -4, 2.4, '#e23b3b', 0) + Ci(0, 6, 2.4, '#3fb867', 0) + Q('M-7,-12 L0,-8 L7,-12', '#e23b3b', 2.6)) + x.paw(-8, 34, 0.95));
  };
  PROPS.giftstack = function (pc, x) {
    return Rc(54, 170, 92, 26, 3, '#e23b3b', 3.4) + Rc(94, 170, 12, 26, 0, '#ffd23f', 2.4) + Rc(68, 150, 64, 22, 3, '#4a90f0', 3.2) + Rc(94, 150, 12, 22, 0, '#ffd23f', 2.4) + Rc(82, 132, 36, 20, 3, '#3fb867', 3) + Rc(94, 132, 12, 20, 0, '#ffd23f', 2.4) +
      K('M100,132 C92,116 78,120 84,128 C88,134 96,132 100,132Z', '#ffd23f', 2.6) + K('M100,132 C108,116 122,120 116,128 C112,134 104,132 100,132Z', '#ffd23f', 2.6) + Ci(100, 131, 3.6, '#e8a010', 2) + HL('M60,178 V190', 2.4) + x.paw(56, 188, 1) + x.paw(144, 188, 1);
  };
  PROPS.carolbook = function (pc, x) {
    return pg(144, 140, Gp('rotate(-8)', K('M-38,-26 V24 C-26,20 -12,20 0,26 C12,20 26,20 38,24 V-26 C26,-30 12,-30 0,-24 C-12,-30 -26,-30 -38,-26Z', '#c8372d', 3.4) + K('M-33,-22 V18 C-24,15 -10,15 0,20 V-20 C-10,-25 -24,-25 -33,-22Z', '#fffdf6', 2.6) + K('M33,-22 V18 C24,15 10,15 0,20 V-20 C10,-25 24,-25 33,-22Z', '#fffdf6', 2.6) +
      Q('M-28,-12 H-6 M-28,-6 H-6 M-28,0 H-6 M6,-12 H28 M6,-6 H28 M6,0 H28', INK, 1.2, 0.5) + Ci(-22, -2, 3, INK, 0) + Q('M-19.4,-2 V-14', INK, 1.6) + Ci(-10, -8, 3, INK, 0) + Q('M-7.4,-8 V-20', INK, 1.6) + Ci(12, -2, 3, INK, 0) + Q('M14.6,-2 V-14', INK, 1.6) + Ci(22, -8, 3, INK, 0) + Q('M24.6,-8 V-20', INK, 1.6) + Q('M-19,-14 L-7,-20 M15,-14 L25,-20', INK, 2.6) + st4(0, -30, 5, '#ffd23f', INK)) + x.paw(0, 28, 1));
  };
  PROPS.handbell = function (pc, x) {
    return pg(144, 138, Rc(-4.4, 4, 8.8, 30, 3.4, '#7a4a2a', 3) + K('M-22,6 C-22,-14 -12,-28 0,-28 C12,-28 22,-14 22,6Z', '#ffd23f', 3.4) + Rc(-25, 2, 50, 8, 3, '#f2b81c', 3) + HL('M-14,-2 C-14,-12 -10,-20 -5,-23', 2.6) + Ci(0, 12, 4, '#c8921a', 2) +
      Q('M-12,-26 Q0,-36 12,-26', '#e23b3b', 3.6) + Ci(0, -30, 3.4, '#c42a2a', 1.8) + x.paw(0, 28, 0.95));
  };
  PROPS.hollysprig = function (pc, x) {
    return pg(144, 136, Q('M0,34 C0,14 2,2 0,-8', '#6a4a2a', 3.2) + Gp('translate(0,2) rotate(-150)', hollyLeaf('#2f9a52', 36)) + Gp('translate(0,2) rotate(-30)', hollyLeaf('#3fb867', 36)) + Gp('translate(0,2) rotate(-90)', hollyLeaf('#2f9a52', 30)) + hollyBerries(0, -6, 5.4) + x.paw(0, 28, 0.95));
  };
  PROPS.yulelog = function (pc, x) {
    return Rc(52, 158, 96, 34, 16, '#7a4a2a', 3.4) + Q('M66,168 q10,-4 22,0 M96,176 q12,-4 24,0 M70,184 q10,-3 20,0', shade('#7a4a2a', 0.25), 2.2, 0.8) + El(138, 175, 10, 17, '#e8c89a', 3) + Q('M138,175 m-4,0 a4,4 0 1 1 4,4 a8,8 0 1 1 -8,-8', '#7a4a2a', 1.8, 0.9) +
      K('M54,162 C64,152 74,164 86,156 C98,150 108,162 120,155 C130,150 140,158 146,160 V164 H54Z', '#fffaf0', 2.8) + Gp('translate(88,152) rotate(-20)', hollyLeaf('#2f9a52', 20)) + Gp('translate(90,152) rotate(-150)', hollyLeaf('#3fb867', 20)) + hollyBerries(86, 154, 3) + x.paw(58, 186, 1) + x.paw(144, 188, 1);
  };
  PROPS.candyjar = function (pc, x) {
    var cols = ['#e23b3b', '#ffd23f', '#3fb867', '#4a90f0', '#ff8fb6', '#fffaf0'], s = '', i;
    for (i = 0; i < 9; i++) s += Ci(-10 + (i % 3) * 10, -2 + Math.floor(i / 3) * 11, 4.6, cols[(i * 5) % 6], 1.6);
    return pg(144, 136, Rc(-18, -14, 36, 46, 9, '#e8f6ff', 3.2) + s + Rc(-20, -24, 40, 11, 3, '#e23b3b', 3) + Q('M-20,-18 H20', '#fff', 1.6, 0.7) + st5(0, -34, 5, '#ffd23f', 1.8) + HL('M-13,-6 V20', 2.4) + x.paw(0, 34, 0.95));
  };
  PROPS.mitten = function (pc, x) {
    function mt(c, tx, rot) { return Gp('translate(' + tx + ',2) rotate(' + rot + ')', K('M-11,24 V-4 C-11,-18 10,-18 10,-4 V24Z', c, 3.2) + K('M-11,6 C-22,4 -22,-8 -12,-5Z', c, 3) + Rc(-12, 18, 23, 11, 2, '#fffaf0', 2.8) + snowflake(0, 4, 5.4, '#fffaf0', 1.6)); }
    return pg(144, 136, Q('M-26,-30 Q0,-18 26,-30', '#fffaf0', 3) + mt('#e23b3b', -15, -8) + mt('#3a7bd5', 16, 8) + x.paw(0, -26, 0.9));
  };
  // ---- 小物の追加ここまで ----

  // =====================================================================
  // 背景の飾り（教科の色の上に重ねる）
  // =====================================================================
  function overlaySnow(seed) {
    var s = '', dots = [[22, 62, 4], [48, 26, 3], [92, 16, 3.4], [152, 30, 4], [178, 66, 3], [14, 108, 3], [186, 110, 4], [34, 142, 3], [170, 148, 3], [120, 12, 2.6], [70, 44, 2.4], [160, 92, 2.4]];
    dots.forEach(function (d) { s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="#fff" fill-opacity=".95"/>'; });
    s += snowflake(30, 40, 12, '#fff', 2.6) + snowflake(170, 46, 13, '#fff', 2.6) + snowflake(182, 124, 9, '#fff', 2.2) + snowflake(16, 128, 9, '#fff', 2.2) + snowflake(58, 20, 7, '#fff', 2);
    return s + '<path d="M0,176 C30,166 52,174 80,170 C112,166 140,176 200,168 V200 H0Z" fill="#fff" fill-opacity=".9"/>';
  }
  function overlayWa() {
    var s = '', r;
    // 青海波（せいがいは）っぽい半円の重なり ＋ 日の出
    for (var y = 0; y < 3; y++) for (var xx = 0; xx < 6; xx++) { r = 14; s += '<path d="M' + (xx * 36 - 10 + (y % 2) * 18) + ',' + (178 + y * 8) + ' a18,18 0 0 1 36,0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>'; }
    s += '<circle cx="34" cy="38" r="14" fill="#ff5a4a" fill-opacity=".9"/><circle cx="34" cy="38" r="14" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>';
    s += st4(168, 30, 9, '#ffe27a') + st4(182, 100, 6, '#fff') + st4(14, 118, 6, '#fff') + st4(120, 14, 5, '#fff');
    s += '<path d="M150,60 l4,-8 l4,8 M170,56 l4,-8 l4,8" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2.2" stroke-linecap="round"/>';
    return s;
  }

  // ---- 12月クリスマス 54種化で追加した背景の飾り（season 名: snowB / night / pines / bokeh / lightrow / candy / hollyc / gold）----
  function overlayIcicle() {
    var s = '', i, h;
    for (i = 0; i < 10; i++) { h = 12 + ((i * 7) % 4) * 7; s += '<path d="M' + (i * 21 - 6) + ',0 H' + (i * 21 + 14) + ' L' + (i * 21 + 4) + ',' + h + 'Z" fill="#fff" fill-opacity=".88"/>'; }
    s += snowflake(26, 76, 15, '#fff', 2.8) + snowflake(174, 92, 17, '#fff', 2.8) + snowflake(20, 134, 9, '#fff', 2.2) + snowflake(184, 40, 9, '#fff', 2.2) + snowflake(150, 22, 6, '#fff', 2);
    [[50, 52, 3], [76, 30, 2.6], [128, 38, 3.2], [160, 62, 2.6], [14, 104, 3], [190, 128, 3], [40, 112, 2.4], [168, 116, 2.4]].forEach(function (d) { s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="#fff" fill-opacity=".95"/>'; });
    return s + '<path d="M0,182 C40,172 72,184 104,178 C140,172 168,184 200,176 V200 H0Z" fill="#fff" fill-opacity=".92"/>';
  }
  function overlayNight() {
    var s = '<rect width="200" height="200" fill="#1c2a66" fill-opacity=".4"/>';
    s += '<path d="M160,24 a22,22 0 1 0 16,36 a17,17 0 1 1 -16,-36Z" fill="#fff3b0"/>';
    [[28, 30, 9], [60, 54, 5], [100, 16, 6], [24, 96, 6], [184, 96, 7], [140, 40, 4], [172, 148, 5], [18, 144, 5], [76, 28, 4]].forEach(function (p) { s += st4(p[0], p[1], p[2], '#fff'); });
    [[44, 66], [86, 40], [126, 22], [150, 70], [12, 66], [190, 66], [110, 50], [38, 118], [166, 126]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="#fff"/>'; });
    return s + '<path d="M0,184 C36,174 70,184 100,180 C140,174 170,184 200,178 V200 H0Z" fill="#dff1ff" fill-opacity=".9"/>';
  }
  function overlayPines() {
    var s = '', xs = [12, 44, 150, 186, 172, 30], hs = [34, 26, 30, 36, 22, 20], i;
    for (i = 0; i < xs.length; i++) {
      var x = xs[i], h = hs[i], y = 176;
      s += '<path d="M' + (x - h * 0.5) + ',' + y + ' L' + x + ',' + (y - h * 1.5) + ' L' + (x + h * 0.5) + ',' + y + 'Z" fill="#2f8a4a" fill-opacity=".92"/><path d="M' + (x - h * 0.3) + ',' + (y - h * 0.75) + ' L' + x + ',' + (y - h * 1.5) + ' L' + (x + h * 0.3) + ',' + (y - h * 0.75) + ' Q' + x + ',' + (y - h * 0.62) + ' ' + (x - h * 0.3) + ',' + (y - h * 0.75) + 'Z" fill="#fff" fill-opacity=".92"/>';
    }
    [[24, 40, 3], [60, 18, 2.6], [130, 20, 3], [176, 52, 3.4], [14, 82, 2.6], [190, 100, 2.6], [96, 12, 2.4]].forEach(function (d) { s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="#fff" fill-opacity=".95"/>'; });
    return s + snowflake(32, 62, 9, '#fff', 2.2) + snowflake(170, 78, 11, '#fff', 2.4) + '<path d="M0,178 C40,170 72,180 104,175 C140,170 170,180 200,172 V200 H0Z" fill="#fff" fill-opacity=".95"/>';
  }
  function overlayBokeh() {
    var s = '';
    [[28, 40, 15, '#ffd23f'], [64, 22, 9, '#ff8fb6'], [150, 28, 13, '#6dffb4'], [178, 70, 10, '#ffd23f'], [16, 96, 9, '#ff8fb6'], [186, 116, 14, '#ff6b6b'], [40, 146, 11, '#6dc8ff'], [164, 152, 9, '#ffd23f'], [104, 14, 7, '#fff']].forEach(function (b) {
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + b[3] + '" fill-opacity=".42"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>';
    });
    return s + st4(48, 70, 6, '#fff') + st4(150, 60, 7, '#fff') + st4(24, 126, 5, '#fff') + st4(180, 150, 5, '#fff') + st4(120, 30, 5, '#fff');
  }
  function overlayLightRow() {
    var cols = ['#e23b3b', '#ffd23f', '#3fb867', '#4a90f0', '#ff8fb6'], s = '', i;
    [[-6, 38, 100, 66, 206, 38], [-6, 78, 100, 106, 206, 78]].forEach(function (c, ci) {
      s += '<path d="M' + c[0] + ',' + c[1] + ' Q' + c[2] + ',' + c[3] + ' ' + c[4] + ',' + c[5] + '" fill="none" stroke="#33284a" stroke-opacity=".7" stroke-width="2.4"/>';
      for (i = 0; i < 8; i++) {
        var t = (i + 0.5) / 8, px = c[0] * (1 - t) * (1 - t) + 2 * c[2] * t * (1 - t) + c[4] * t * t, py = c[1] * (1 - t) * (1 - t) + 2 * c[3] * t * (1 - t) + c[5] * t * t;
        s += '<circle cx="' + r1(px) + '" cy="' + r1(py + 6) + '" r="5.2" fill="' + cols[(i + ci * 2) % 5] + '" stroke="#33284a" stroke-opacity=".7" stroke-width="1.4"/><circle cx="' + r1(px - 1.6) + '" cy="' + r1(py + 4.4) + '" r="1.4" fill="#fff"/>';
      }
    });
    return s + st4(30, 130, 6, '#fff') + st4(172, 138, 6, '#fff') + '<path d="M0,184 C40,176 72,186 104,180 C140,174 170,186 200,178 V200 H0Z" fill="#fff" fill-opacity=".9"/>';
  }
  function overlayCandy() {
    var s = '', i;
    for (i = -2; i < 9; i++) s += '<path d="M' + (i * 28 - 20) + ',210 L' + (i * 28 + 70) + ',-20" stroke="#fff" stroke-opacity=".3" stroke-width="14"/>';
    [[26, 40], [176, 44], [186, 120], [18, 120], [100, 14]].forEach(function (p, k) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k % 2 ? 6 : 8) + '" fill="#fff" fill-opacity=".9"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k % 2 ? 2.6 : 3.4) + '" fill="#e23b3b" fill-opacity=".85"/>'; });
    return s + st4(60, 28, 6, '#fff') + st4(150, 24, 6, '#fff') + st4(30, 150, 5, '#fff') + st4(170, 154, 5, '#fff');
  }
  function overlayHollyCorner() {
    var s = '';
    s += Gp('translate(8,30) rotate(10)', hollyLeaf('#2f9a52', 30)) + Gp('translate(6,34) rotate(55)', hollyLeaf('#3fb867', 26)) + hollyBerries(20, 36, 4);
    s += Gp('translate(192,30) rotate(170)', hollyLeaf('#2f9a52', 30)) + Gp('translate(194,34) rotate(125)', hollyLeaf('#3fb867', 26)) + hollyBerries(178, 36, 4);
    s += Gp('translate(6,150) rotate(-10)', hollyLeaf('#3fb867', 28)) + Gp('translate(8,146) rotate(-55)', hollyLeaf('#2f9a52', 24)) + hollyBerries(20, 146, 3.6);
    s += Gp('translate(194,150) rotate(190)', hollyLeaf('#3fb867', 28)) + Gp('translate(192,146) rotate(235)', hollyLeaf('#2f9a52', 24)) + hollyBerries(180, 146, 3.6);
    [[60, 16, 2.6], [100, 10, 2.4], [142, 16, 2.6], [30, 86, 2.4], [172, 86, 2.4]].forEach(function (d) { s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="#fff" fill-opacity=".95"/>'; });
    return s + snowflake(52, 44, 8, '#fff', 2) + snowflake(148, 44, 8, '#fff', 2);
  }
  function overlayGold() {
    var s = '', cf = [[22, 60, 0], [46, 24, 1], [84, 14, 0], [124, 16, 1], [158, 26, 0], [180, 58, 1], [190, 96, 0], [12, 96, 1], [30, 140, 0], [172, 142, 1], [60, 170, 1], [140, 174, 0], [102, 190, 1]];
    cf.forEach(function (p) { s += p[2] ? '<rect x="' + (p[0] - 3) + '" y="' + (p[1] - 3) + '" width="6" height="6" rx="1" fill="#ffe27a" transform="rotate(30 ' + p[0] + ' ' + p[1] + ')" fill-opacity=".95"/>' : '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#fff7c0" fill-opacity=".95"/>'; });
    s += snowflake(32, 36, 13, '#fff7c0', 2.6) + snowflake(170, 40, 12, '#fff7c0', 2.6) + snowflake(184, 132, 9, '#fff', 2.2) + snowflake(16, 130, 9, '#fff', 2.2);
    return s + st4(56, 60, 7, '#fff', '#d9941a') + st4(146, 70, 6, '#fff', '#d9941a');
  }
  var XOV = { snowB: overlayIcicle, night: overlayNight, pines: overlayPines, bokeh: overlayBokeh, lightrow: overlayLightRow, candy: overlayCandy, hollyc: overlayHollyCorner, gold: overlayGold };

  // =====================================================================
  // カタログ：12月＝54種（理科15・社会15・国語15・キラ9）／1月＝18種（理科5・社会5・国語5・キラ3）
  // =====================================================================
  function E(id, subject, name, opts) { opts.bg = subject === 'kira' ? 'kira' : subject === 'rika' ? 'sci' : subject === 'shakai' ? 'soc' : 'jpn'; return { id: id, subject: subject, name: name, opts: opts }; }
  var XMAS = [
    E('xmas-rika-01', 'rika', 'ゆきのけっしょうはかせ', { fur: 'shiro', face: 'surprise', head: 'goggles', outfit: 'coat', prop: 'lens', season: 'snow' }),
    E('xmas-rika-02', 'rika', 'ほしぞらサンタ', { fur: 'chatora', face: 'sparkle', head: 'santa', outfit: 'santa', prop: 'telescope', season: 'snow' }),
    E('xmas-rika-03', 'rika', 'でんしょくけんきゅういん', { fur: 'gray', face: 'happy', head: 'elf', outfit: 'coat', tie: 'none', prop: 'lights', season: 'snow' }),
    E('xmas-rika-04', 'rika', 'ココアじっけん', { fur: 'cream', face: 'closed', head: 'knit', outfit: 'sweater', prop: 'cocoa', season: 'snow' }),
    E('xmas-rika-05', 'rika', 'ゆきだるまはかせ', { fur: 'kuro', face: 'wink', head: 'goggles', hc: '#e23b3b', outfit: 'scarf', prop: 'snowman', season: 'snow' }),
    E('xmas-rika-06', 'rika', 'けっしょうスケッチのはかせ', { fur: 'gray', face: 'closed', head: 'earmuff', outfit: 'parka', prop: 'flake', season: 'snowB' }),
    E('xmas-rika-07', 'rika', 'ろうそくのほのおけんきゅう', { fur: 'chairo', face: 'surprise', head: 'holly', outfit: 'coat', tie: 'none', prop: 'candle', season: 'bokeh' }),
    E('xmas-rika-08', 'rika', 'プリズムのクリスマス', { fur: 'mike', face: 'sparkle', head: 'jester', outfit: 'elfsuit', prop: 'prism', season: 'night' }),
    E('xmas-rika-09', 'rika', 'ゆきのおんどけいはかせ', { fur: 'kuro', face: 'smile', head: 'hood', hc: '#3a7bd5', outfit: 'poncho', prop: 'thermo', season: 'snow' }),
    E('xmas-rika-10', 'rika', 'まつぼっくりかんさつ', { fur: 'shiro', face: 'wink', head: 'treehat', outfit: 'plaid', prop: 'pinecone', season: 'pines' }),
    E('xmas-rika-11', 'rika', 'スノードームじっけん', { fur: 'cream', face: 'happy', head: 'goggles', hc: '#9ad8ff', hc2: '#ffffff', outfit: 'coat', oc: '#dff1ff', tc: '#4a90f0', prop: 'snowglobe', season: 'snowB' }),
    E('xmas-rika-12', 'rika', 'クリスマスでんきゅうはかせ', { fur: 'tuxedo', face: 'sparkle', head: 'lamp', hc: '#ffd23f', outfit: 'sweater', oc: '#2f8a4a', tc: '#fffaf0', prop: 'ornament', pc: '#ffd23f', season: 'lightrow' }),
    E('xmas-rika-13', 'rika', 'もみのきのひみつ', { fur: 'hachi', face: 'happy', head: 'wreath', outfit: 'vestG', prop: 'sprout', pc: '#e23b3b', season: 'pines' }),
    E('xmas-rika-14', 'rika', 'ふゆのせいざかんそく', { fur: 'kiji', face: 'closed', head: 'starhat', hc: '#4a7ae0', outfit: 'zip', oc: '#1f3a6a', tc: '#ffd23f', prop: 'binoculars', season: 'night' }),
    E('xmas-rika-15', 'rika', 'ふゆのくうきじっけん', { fur: 'chatora', face: 'surprise', head: 'knit', hc: '#2fa0b8', hc2: '#fffaf0', outfit: 'sweater', oc: '#3a5fa8', tc: '#fffaf0', prop: 'flask', pc: '#8fe0ff', season: 'snow' }),
    E('xmas-shakai-01', 'shakai', 'せかいのクリスマス', { fur: 'mike', face: 'smile', head: 'explorer', outfit: 'jacket', prop: 'globe', season: 'snow' }),
    E('xmas-shakai-02', 'shakai', 'サンタのはいたつルート', { fur: 'shiro', face: 'happy', head: 'santa', outfit: 'santa', prop: 'map', season: 'snow' }),
    E('xmas-shakai-03', 'shakai', 'ゆきぐにたんけんたい', { fur: 'hachi', face: 'smile', head: 'knit', hc: '#3a7bd5', outfit: 'scarf', prop: 'compass', season: 'snow' }),
    E('xmas-shakai-04', 'shakai', 'トナカイはいたついん', { fur: 'kiji', face: 'happy', head: 'antlers', outfit: 'scarf', oc: '#c0392b', tc: '#3fb867', prop: 'gift', season: 'snow' }),
    E('xmas-shakai-05', 'shakai', 'ツリーのまちのネコ', { fur: 'tuxedo', face: 'sparkle', head: 'elf', outfit: 'vestG', prop: 'tree', season: 'snow' }),
    E('xmas-shakai-06', 'shakai', 'ゆきぞりたんけんたい', { fur: 'hachi', face: 'smile', head: 'explorer', hc: '#c0392b', outfit: 'parka', oc: '#c0392b', tc: '#fffaf0', prop: 'sled', season: 'snowB' }),
    E('xmas-shakai-07', 'shakai', 'クリスマスマーケットのまち', { fur: 'shiro', face: 'wink', head: 'knit', hc: '#2f8a4a', hc2: '#fffaf0', outfit: 'plaid', oc: '#2f6a3a', tc: '#fffaf0', prop: 'candyjar', season: 'lightrow' }),
    E('xmas-shakai-08', 'shakai', 'せかいのクリスマスりょこう', { fur: 'cream', face: 'sparkle', head: 'beret', hc: '#c0392b', outfit: 'cardigan', oc: '#2f8a4a', prop: 'globe', season: 'bokeh' }),
    E('xmas-shakai-09', 'shakai', 'クリスマスのふねのはいたつ', { fur: 'tuxedo', face: 'happy', head: 'captain', hc: '#e23b3b', outfit: 'captain', oc: '#2f6a3a', tc: '#ffd23f', prop: 'giftstack', season: 'snow' }),
    E('xmas-shakai-10', 'shakai', 'アドベントカレンダーやさん', { fur: 'gray', face: 'closed', head: 'helmet', hc: '#e23b3b', outfit: 'jacket', oc: '#2f8a4a', tc: '#ffd23f', prop: 'advent', season: 'pines' }),
    E('xmas-shakai-11', 'shakai', 'きたのくにのたんけん', { fur: 'kiji', face: 'surprise', head: 'earmuff', hc: '#4a90f0', hc2: '#fffaf0', outfit: 'zip', oc: '#c0392b', tc: '#fffaf0', prop: 'compass', season: 'snowB' }),
    E('xmas-shakai-12', 'shakai', 'プレゼントのふくろやさん', { fur: 'mike', face: 'happy', head: 'santa', hc: '#2f8a4a', outfit: 'vestG', prop: 'sack', season: 'candy' }),
    E('xmas-shakai-13', 'shakai', 'かざりつけのだいくさん', { fur: 'chairo', face: 'wink', head: 'giftbox', hc: '#e23b3b', outfit: 'cardigan', oc: '#2f8a4a', prop: 'wreathd', season: 'hollyc' }),
    E('xmas-shakai-14', 'shakai', 'イルミネーションのまち', { fur: 'chatora', face: 'smile', head: 'hard', hc: '#ffd23f', outfit: 'zip', oc: '#e8504f', tc: '#ffffff', prop: 'lantern', season: 'lightrow' }),
    E('xmas-shakai-15', 'shakai', 'ジンジャーブレッドのまち', { fur: 'shiro', face: 'sparkle', head: 'explorer', hc: '#2f9a52', outfit: 'jacket', oc: '#c0392b', prop: 'cookie', season: 'candy' }),
    E('xmas-kokugo-01', 'kokugo', 'クリスマスカードやさん', { fur: 'cream', face: 'smile', head: 'wreath', outfit: 'sailor', prop: 'letter', season: 'snow' }),
    E('xmas-kokugo-02', 'kokugo', 'えほんのじかん', { fur: 'shiro', face: 'closed', head: 'knit', hc: '#3fae5c', outfit: 'cardigan', oc: '#c0392b', prop: 'book', season: 'snow' }),
    E('xmas-kokugo-03', 'kokugo', 'すずのおとのうた', { fur: 'chatora', face: 'happy', head: 'santa', outfit: 'sweater', prop: 'bell', season: 'snow' }),
    E('xmas-kokugo-04', 'kokugo', 'くつしたのプレゼント', { fur: 'gray', face: 'wink', head: 'antlers', outfit: 'sweater', oc: '#2f8a4a', prop: 'stocking', season: 'snow' }),
    E('xmas-kokugo-05', 'kokugo', 'ケーキやさんのネコ', { fur: 'mike', face: 'sparkle', head: 'knit', hc: '#ff8fb6', outfit: 'smock', prop: 'xcake', season: 'snow' }),
    E('xmas-kokugo-06', 'kokugo', 'キャロルのうたごえ', { fur: 'shiro', face: 'smile', head: 'xbow', outfit: 'cardigan', oc: '#2f8a4a', prop: 'carolbook', season: 'snow' }),
    E('xmas-kokugo-07', 'kokugo', 'ハンドベルのおと', { fur: 'hachi', face: 'wink', head: 'bow', hc: '#e23b3b', outfit: 'smock', oc: '#2f8a4a', prop: 'handbell', season: 'bokeh' }),
    E('xmas-kokugo-08', 'kokugo', 'ヒイラギのことば', { fur: 'tuxedo', face: 'happy', head: 'round', hc: '#2f9a52', outfit: 'sailor', oc: '#c0392b', prop: 'hollysprig', season: 'hollyc' }),
    E('xmas-kokugo-09', 'kokugo', 'ブッシュドノエルやさん', { fur: 'cream', face: 'closed', head: 'beret', hc: '#c0392b', outfit: 'xapron', prop: 'yulelog', season: 'snow' }),
    E('xmas-kokugo-10', 'kokugo', 'サンタさんへのおねがいがき', { fur: 'mike', face: 'surprise', head: 'pencilEar', outfit: 'plaid', prop: 'pencil', pc: '#e23b3b', season: 'pines' }),
    E('xmas-kokugo-11', 'kokugo', 'クリスマスのしりとり', { fur: 'gray', face: 'sparkle', head: 'big', hc: '#e23b3b', outfit: 'vestY', oc: '#2f8a4a', prop: 'paper', season: 'bokeh' }),
    E('xmas-kokugo-12', 'kokugo', 'おかしのいえのものがたり', { fur: 'chairo', face: 'happy', head: 'candyhat', outfit: 'ginger', prop: 'candyjar', season: 'candy' }),
    E('xmas-kokugo-13', 'kokugo', 'クリスマスことばじてん', { fur: 'kiji', face: 'wink', head: 'mortar', hc: '#2f8a4a', outfit: 'cardigan', oc: '#c0392b', prop: 'dict', season: 'snowB' }),
    E('xmas-kokugo-14', 'kokugo', 'サンタへのおてがみのまき', { fur: 'kuro', face: 'sparkle', head: 'elf', hc: '#e23b3b', outfit: 'smock', oc: '#3a7bd5', prop: 'scroll', pc: '#e23b3b', season: 'night' }),
    E('xmas-kokugo-15', 'kokugo', 'てぶくろのおはなし', { fur: 'chatora', face: 'happy', head: 'knit', hc: '#fffaf0', hc2: '#e23b3b', outfit: 'sweater', oc: '#7a4aa8', tc: '#fffaf0', prop: 'mitten', season: 'snowB' }),
    E('xmas-kira-01', 'kira', 'キラキラ・ゴールドサンタ', { fur: 'shiro', face: 'sparkle', head: 'santa', hc: '#f6b82e', outfit: 'santa', prop: 'bigstar', kira: true, season: 'snow' }),
    E('xmas-kira-02', 'kira', 'ツリーのおうさま', { fur: 'cream', face: 'happy', head: 'starhat', outfit: 'cape', prop: 'tree', kira: true, season: 'snow' }),
    E('xmas-kira-03', 'kira', 'ゆきのじょおう', { fur: 'gray', face: 'sparkle', head: 'tiara', outfit: 'dress', prop: 'candycane', kira: true, season: 'snow' }),
    E('xmas-kira-04', 'kira', 'キラキラ・こがねのトナカイ', { fur: 'shiro', face: 'sparkle', head: 'antlers', hc: '#f6b82e', outfit: 'xgown', prop: 'ornament', pc: '#ffd23f', kira: true, season: 'gold' }),
    E('xmas-kira-05', 'kira', 'キラキラ・ダイヤのツリー', { fur: 'cream', face: 'happy', head: 'treehat', hc: '#2fd08a', outfit: 'cape', oc: '#1f6a9a', prop: 'crystal', kira: true, season: 'gold' }),
    E('xmas-kira-06', 'kira', 'キラキラ・こおりのおうじ', { fur: 'kuro', face: 'wink', head: 'icecrown', outfit: 'furcape', prop: 'starwand', pc: '#7ac8ff', kira: true, season: 'gold' }),
    E('xmas-kira-07', 'kira', 'キラキラ・くるみわりたいちょう', { fur: 'gray', face: 'surprise', head: 'nutcracker', outfit: 'nutcoat', prop: 'shield', kira: true, season: 'gold' }),
    E('xmas-kira-08', 'kira', 'キラキラ・ろうそくのひめ', { fur: 'mike', face: 'closed', head: 'candlecrown', outfit: 'xgown', oc: '#f3ead8', tc: '#e8a010', prop: 'candle', kira: true, season: 'gold' }),
    E('xmas-kira-09', 'kira', 'キラキラ・ひかりのサンタ', { fur: 'tuxedo', face: 'sparkle', head: 'santa', hc: '#7a3fd0', outfit: 'lightsuit', prop: 'giftstack', kira: true, season: 'gold' })
  ];
  var NY = [
    E('ny-rika-01', 'rika', 'はつひのでけんきゅう', { fur: 'chatora', face: 'sparkle', head: 'hachimaki', outfit: 'coat', prop: 'sunfan', season: 'wa' }),
    E('ny-rika-02', 'rika', 'ひつじどしのけいとラボ', { fur: 'shiro', face: 'smile', head: 'sheep', outfit: 'coat', prop: 'beaker', season: 'wa' }),
    E('ny-rika-03', 'rika', 'もちのひみつはかせ', { fur: 'cream', face: 'happy', head: 'mochi', outfit: 'coat', tie: 'none', prop: 'kagami', season: 'wa' }),
    E('ny-rika-04', 'rika', 'こまのかがくしゃ', { fur: 'kuro', face: 'surprise', head: 'goggles', hc: '#e23b3b', outfit: 'coat', prop: 'koma', season: 'wa' }),
    E('ny-rika-05', 'rika', 'かぜのたこあげ', { fur: 'gray', face: 'wink', head: 'hachimaki', outfit: 'zip', prop: 'kite', season: 'wa' }),
    E('ny-shakai-01', 'shakai', 'はつもうでのネコ', { fur: 'shiro', face: 'closed', head: 'eboshi', outfit: 'haori', prop: 'ema', season: 'wa' }),
    E('ny-shakai-02', 'shakai', 'おせちにほんたんけん', { fur: 'mike', face: 'sparkle', head: 'explorer', outfit: 'haori', prop: 'osechi', season: 'wa' }),
    E('ny-shakai-03', 'shakai', 'おみくじだいきち', { fur: 'chairo', face: 'happy', head: 'hachimaki', outfit: 'haori', oc: '#7a2a4a', prop: 'omikuji', season: 'wa' }),
    E('ny-shakai-04', 'shakai', 'ふくぶくろやさん', { fur: 'hachi', face: 'wink', head: 'sheep', outfit: 'jacket', prop: 'fukubukuro', season: 'wa' }),
    E('ny-shakai-05', 'shakai', 'かどまつのまち', { fur: 'kiji', face: 'smile', head: 'eboshi', outfit: 'haori', oc: '#3a5a3a', prop: 'kadomatsu', season: 'wa' }),
    E('ny-kokugo-01', 'kokugo', 'かきぞめのネコ', { fur: 'kuro', face: 'sparkle', head: 'hachimaki', outfit: 'haori', oc: '#4a3a7a', prop: 'kakizome', season: 'wa' }),
    E('ny-kokugo-02', 'kokugo', 'かるたとりめいじん', { fur: 'shiro', face: 'surprise', head: 'kanzashi', outfit: 'kimono', prop: 'karuta', season: 'wa' }),
    E('ny-kokugo-03', 'kokugo', 'おとしだまありがとう', { fur: 'cream', face: 'happy', head: 'kanzashi', hc: '#ffd23f', outfit: 'kimono', oc: '#3a7bd5', tc: '#ffd23f', prop: 'otoshidama', season: 'wa' }),
    E('ny-kokugo-04', 'kokugo', 'ねんがじょうのたより', { fur: 'chatora', face: 'smile', head: 'sheep', outfit: 'cardigan', oc: '#e23b6a', prop: 'nengajo', season: 'wa' }),
    E('ny-kokugo-05', 'kokugo', 'はごいたあそび', { fur: 'mike', face: 'wink', head: 'kanzashi', outfit: 'kimono', oc: '#2f9a8a', prop: 'hagoita', season: 'wa' }),
    E('ny-kira-01', 'kira', 'キラキラ・きんのきもの', { fur: 'shiro', face: 'sparkle', head: 'kanzashi', hc: '#f6b82e', outfit: 'kimono', oc: '#e23b6a', prop: 'fukubukuro', kira: true, season: 'wa' }),
    E('ny-kira-02', 'kira', 'ひつじどしのおうさま', { fur: 'cream', face: 'happy', head: 'sheep', outfit: 'cape', prop: 'scepter', kira: true, season: 'wa' }),
    E('ny-kira-03', 'kira', 'はつひのヒーロー', { fur: 'chatora', face: 'sparkle', head: 'hachimaki', outfit: 'champion', prop: 'hamaya', kira: true, season: 'wa' })
  ];
  var SETS = { xmas: XMAS, ny: NY };

  // 1枚のSVG文字列を作る。season の飾りを背景（教科色の上・ネコの下）に差し込む。
  function make(entry, suffix) {
    var o = {}; for (var k in entry.opts) o[k] = entry.opts[k];
    o.uid = 's' + (entry.id + (suffix || '')).replace(/[^A-Za-z0-9]/g, '');
    var P = 'cs' + o.uid + '_';
    var svg = S.makeCatSticker(o);
    var ov = o.season === 'wa' ? overlayWa() : o.season === 'snow' ? overlaySnow() : XOV[o.season] ? XOV[o.season]() : '';
    if (!ov) return svg;
    var mark = '<circle cx="100" cy="100" r="88.2" fill="none"';
    var i = svg.indexOf(mark);
    if (i < 0) return svg;
    return svg.slice(0, i) + '<g clip-path="url(#' + P + 'd)">' + ov + '</g>' + svg.slice(i);
  }

  var ALLS = []; Object.keys(SETS).forEach(function (k) { SETS[k].forEach(function (e) { e.setKey = k; ALLS.push(e); }); });
  return { SETS: SETS, ALL: ALLS, make: make };
});
