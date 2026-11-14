/* ============================================================
   stickers-season.js — 季節（月）シリーズのネコシール（12月＝クリスマス／1月＝お正月）
   stickers.js（KQStickers）のあとに読み込む。新しい頭・服・小物を KQStickers の HEADS/OUTFITS/PROPS に足し、
   KQSeason.SETS = { xmas:[18枚], ny:[18枚] } と KQSeason.make(entry) を提供する。
   各セット：理科5・社会5・国語5・キラ3。
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

  // =====================================================================
  // カタログ：理科5・社会5・国語5・キラ3 ×（12月・1月）
  // =====================================================================
  function E(id, subject, name, opts) { opts.bg = subject === 'kira' ? 'kira' : subject === 'rika' ? 'sci' : subject === 'shakai' ? 'soc' : 'jpn'; return { id: id, subject: subject, name: name, opts: opts }; }
  var XMAS = [
    E('xmas-rika-01', 'rika', 'ゆきのけっしょうはかせ', { fur: 'shiro', face: 'surprise', head: 'goggles', outfit: 'coat', prop: 'lens', season: 'snow' }),
    E('xmas-rika-02', 'rika', 'ほしぞらサンタ', { fur: 'chatora', face: 'sparkle', head: 'santa', outfit: 'santa', prop: 'telescope', season: 'snow' }),
    E('xmas-rika-03', 'rika', 'でんしょくけんきゅういん', { fur: 'gray', face: 'happy', head: 'elf', outfit: 'coat', tie: 'none', prop: 'lights', season: 'snow' }),
    E('xmas-rika-04', 'rika', 'ココアじっけん', { fur: 'cream', face: 'closed', head: 'knit', outfit: 'sweater', prop: 'cocoa', season: 'snow' }),
    E('xmas-rika-05', 'rika', 'ゆきだるまはかせ', { fur: 'kuro', face: 'wink', head: 'goggles', hc: '#e23b3b', outfit: 'scarf', prop: 'snowman', season: 'snow' }),
    E('xmas-shakai-01', 'shakai', 'せかいのクリスマス', { fur: 'mike', face: 'smile', head: 'explorer', outfit: 'jacket', prop: 'globe', season: 'snow' }),
    E('xmas-shakai-02', 'shakai', 'サンタのはいたつルート', { fur: 'shiro', face: 'happy', head: 'santa', outfit: 'santa', prop: 'map', season: 'snow' }),
    E('xmas-shakai-03', 'shakai', 'ゆきぐにたんけんたい', { fur: 'hachi', face: 'smile', head: 'knit', hc: '#3a7bd5', outfit: 'scarf', prop: 'compass', season: 'snow' }),
    E('xmas-shakai-04', 'shakai', 'トナカイはいたついん', { fur: 'kiji', face: 'happy', head: 'antlers', outfit: 'scarf', oc: '#c0392b', tc: '#3fb867', prop: 'gift', season: 'snow' }),
    E('xmas-shakai-05', 'shakai', 'ツリーのまちのネコ', { fur: 'tuxedo', face: 'sparkle', head: 'elf', outfit: 'vestG', prop: 'tree', season: 'snow' }),
    E('xmas-kokugo-01', 'kokugo', 'クリスマスカードやさん', { fur: 'cream', face: 'smile', head: 'wreath', outfit: 'sailor', prop: 'letter', season: 'snow' }),
    E('xmas-kokugo-02', 'kokugo', 'えほんのじかん', { fur: 'shiro', face: 'closed', head: 'knit', hc: '#3fae5c', outfit: 'cardigan', oc: '#c0392b', prop: 'book', season: 'snow' }),
    E('xmas-kokugo-03', 'kokugo', 'すずのおとのうた', { fur: 'chatora', face: 'happy', head: 'santa', outfit: 'sweater', prop: 'bell', season: 'snow' }),
    E('xmas-kokugo-04', 'kokugo', 'くつしたのプレゼント', { fur: 'gray', face: 'wink', head: 'antlers', outfit: 'sweater', oc: '#2f8a4a', prop: 'stocking', season: 'snow' }),
    E('xmas-kokugo-05', 'kokugo', 'ケーキやさんのネコ', { fur: 'mike', face: 'sparkle', head: 'knit', hc: '#ff8fb6', outfit: 'smock', prop: 'xcake', season: 'snow' }),
    E('xmas-kira-01', 'kira', 'キラキラ・ゴールドサンタ', { fur: 'shiro', face: 'sparkle', head: 'santa', hc: '#f6b82e', outfit: 'santa', prop: 'bigstar', kira: true, season: 'snow' }),
    E('xmas-kira-02', 'kira', 'ツリーのおうさま', { fur: 'cream', face: 'happy', head: 'starhat', outfit: 'cape', prop: 'tree', kira: true, season: 'snow' }),
    E('xmas-kira-03', 'kira', 'ゆきのじょおう', { fur: 'gray', face: 'sparkle', head: 'tiara', outfit: 'dress', prop: 'candycane', kira: true, season: 'snow' })
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
    var ov = o.season === 'wa' ? overlayWa() : o.season === 'snow' ? overlaySnow() : '';
    if (!ov) return svg;
    var mark = '<circle cx="100" cy="100" r="88.2" fill="none"';
    var i = svg.indexOf(mark);
    if (i < 0) return svg;
    return svg.slice(0, i) + '<g clip-path="url(#' + P + 'd)">' + ov + '</g>' + svg.slice(i);
  }

  var ALLS = []; Object.keys(SETS).forEach(function (k) { SETS[k].forEach(function (e) { e.setKey = k; ALLS.push(e); }); });
  return { SETS: SETS, ALL: ALLS, make: make };
});
