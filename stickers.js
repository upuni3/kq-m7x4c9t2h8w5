/* ごほうびねこシール 案D「ぷっくりポップ・バストアップ」
 * 案Cの画風（太い輪郭・白フチ・ぷっくり光沢・円形バッジ）のまま、下半身を描かず「顔大きめ＋胸〜肩」に。
 *   makeCatSticker(opts) -> SVG文字列（純関数・外部依存なし・同じ引数なら同じ出力）
 *   opts: { fur, face, bg:'sci'|'soc'|'jpn'|'kira', head, outfit, prop, hc, hc2, oc, tc, pc, gc, kira, uid }
 *   STICKER_CATALOG: 全54枚 [{id, subject, name, opts}]（理科15・社会15・国語15・キラ9）
 *   uid: 同一ページで複数置くときの接頭辞。defs内のIDは全て cs<uid>_ で始まる（省略時は引数のハッシュ）
 * UMD: window.KQStickers / module.exports / (互換) window.CatStickers
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KQStickers = api;
  root.CatStickers = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var INK = '#33284a';

  // ---------- 毛色 ----------
  var FURS = {
    shiro:  { ja: 'しろ',     base: '#fffaf2', sh: '#d3c0e0', line: '#5b4458', ear: '#ffb3c6', iris: '#4aa8e6', irisL: '#b9e8ff' },
    kuro:   { ja: 'くろ',     base: '#625c7c', sh: '#3a3452', line: '#1d1830', ear: '#d98fb0', iris: '#ffc83d', irisL: '#fff2a0' },
    chairo: { ja: 'ちゃいろ', base: '#d79a5c', sh: '#b06e38', line: '#4a2a1c', ear: '#f7b3a0', iris: '#e59a2e', irisL: '#ffe29a' },
    chatora:{ ja: 'ちゃとら', base: '#f6ab5a', sh: '#d57e30', line: '#5a2e14', ear: '#ffb7a0', iris: '#58b84c', irisL: '#d2f5a8', stripe: '#c8651e' },
    kiji:   { ja: 'キジ',     base: '#d6a76c', sh: '#b4803f', line: '#45281a', ear: '#f7b3a0', iris: '#6cbf5a', irisL: '#d2f5a8', stripe: '#5e3a20' },
    mike:   { ja: 'みけ',     base: '#fffaf2', sh: '#d3c0e0', line: '#563a3c', ear: '#ffb3c6', iris: '#e59a2e', irisL: '#ffe29a', p1: '#f4a448', p2: '#4d4666' },
    hachi:  { ja: 'はちわれ', base: '#fffaf2', sh: '#d3c0e0', line: '#3a3348', ear: '#ffb3c6', iris: '#4a86e0', irisL: '#b8d6ff', p1: '#4d4666' },
    gray:   { ja: 'グレー',   base: '#c4cbd8', sh: '#929db4', line: '#363c52', ear: '#ffb8c8', iris: '#46b886', irisL: '#c2f5d2' },
    cream:  { ja: 'クリーム', base: '#fde2ae', sh: '#e2bb7e', line: '#5c4128', ear: '#ffb8a8', iris: '#d9742a', irisL: '#ffd7a0' },
    tuxedo: { ja: 'くつした', base: '#59537a', sh: '#38324f', line: '#1d1830', ear: '#d98fb0', iris: '#9be05a', irisL: '#e8ffb0', wh: '#fffaf2' }
  };
  var FACES = { smile: 'にっこり', closed: 'ねむねむ', surprise: 'びっくり', wink: 'ウインク', happy: 'わくわく', sparkle: 'きらきら' };
  var SUBJ_ALIAS = { science: 'sci', rika: 'sci', social: 'soc', shakai: 'soc', japanese: 'jpn', kokugo: 'jpn' };
  var PALS = {
    sci:  { a: '#c9f5e4', b: '#58cfae', rim: '#35a58a', spot: '#2e9d84' },
    soc:  { a: '#d3ecff', b: '#68b6f0', rim: '#3f86c8', spot: '#3a78bb' },
    jpn:  { a: '#fbd8f4', b: '#c196ee', rim: '#9a6ac8', spot: '#8a5cc0' },
    kira: { a: '#fff0b0', b: '#ee93dc', rim: '#d9941a', spot: '#b457c4' }
  };
  var ACC_ALIAS = { beaker: 'beaker', map: 'map', globe: 'globe', book: 'book', pencil: 'pencil' };
  var DEF = {
    sci:  { head: 'goggles', outfit: 'coat',   prop: 'beaker' },
    soc:  { head: 'explorer', outfit: 'jacket', prop: 'globe' },
    jpn:  { head: 'round',   outfit: 'sailor', prop: 'book' },
    kira: { head: 'crown',   outfit: 'cape',   prop: 'scepter' }
  };

  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36).slice(-5);
  }
  function pick(table, key, fallback, name) {
    if (key === undefined || key === null) return fallback;
    if (Object.prototype.hasOwnProperty.call(table, key)) return key;
    throw new Error('makeCatSticker: unknown ' + name + ': ' + key);
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function mixc(a, b, t) { // 16進カラー a から b へ t だけ寄せる
    function p(h) { h = h.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    var x = p(a), y = p(b), v = 0;
    for (var i = 0; i < 3; i++) v = v * 256 + Math.round(x[i] + (y[i] - x[i]) * t);
    return '#' + (v + 0x1000000).toString(16).slice(1);
  }

  // ---------- 描画ヘルパ ----------
  // 共通の線属性は <style> のクラスに寄せてサイズを削減: zk=輪郭(インク色・丸)  zq=線のみ  zh=白ハイライト線
  var STYLE = '<style>.zk{stroke:' + INK + ';stroke-linejoin:round;stroke-linecap:round}.zq,.zh{fill:none;stroke-linecap:round;stroke-linejoin:round}.zh{stroke:#fff;stroke-opacity:.85}.zl{fill:none;stroke-linejoin:round}.zg{stroke:#d9941a;stroke-width:1.2;stroke-linejoin:round}</style>';
  function K(d, f, w) { return '<path class="zk" d="' + d + '" fill="' + f + '" stroke-width="' + (w || 3) + '"/>'; }
  function Q(d, c, w, op) { return c === '#fff' && !op ? '<path class="zh" d="' + d + '" stroke-width="' + w + '"/>' : '<path class="zq" d="' + d + '" stroke="' + c + '" stroke-width="' + w + '"' + (op ? ' stroke-opacity="' + op + '"' : '') + '/>'; }
  function HL(d, w) { return '<path class="zh" d="' + d + '" stroke-width="' + (w || 3) + '"/>'; }
  function Ci(x, y, r, f, w) { return '<circle' + (w === 0 ? '' : ' class="zk" stroke-width="' + (w || 3) + '"') + ' cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"/>'; }
  function El(x, y, rx, ry, f, w, rot) { return '<ellipse' + (w === 0 ? '' : ' class="zk" stroke-width="' + (w || 3) + '"') + ' cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>'; }
  function Rc(x, y, w, h, rx, f, sw) { return '<rect' + (sw === 0 ? '' : ' class="zk" stroke-width="' + (sw || 3) + '"') + ' x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + f + '"/>'; }
  function Gp(tr, inner) { return '<g transform="' + tr + '">' + inner + '</g>'; }
  function star4(cx, cy, r, fill, stroke) {
    var k = r * 0.2, cls = stroke === INK ? ' class="zk" stroke-width="1.2"' : stroke === '#d9941a' ? ' class="zg"' : stroke ? ' stroke="' + stroke + '" stroke-width="1.2" stroke-linejoin="round"' : '';
    return '<path d="M' + cx + ',' + (cy - r) + 'Q' + (cx + k) + ',' + (cy - k) + ' ' + (cx + r) + ',' + cy + 'Q' + (cx + k) + ',' + (cy + k) + ' ' + cx + ',' + (cy + r) +
      'Q' + (cx - k) + ',' + (cy + k) + ' ' + (cx - r) + ',' + cy + 'Q' + (cx - k) + ',' + (cy - k) + ' ' + cx + ',' + (cy - r) + 'Z" fill="' + fill + '"' + cls + '/>';
  }
  function star5(cx, cy, r, fill, sw) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r;
      pts.push(r1(cx + Math.cos(a) * rr) + ',' + r1(cy + Math.sin(a) * rr));
    }
    return '<polygon class="zk" points="' + pts.join(' ') + '" fill="' + fill + '" stroke-width="' + (sw || 2.4) + '"/>';
  }
  function heart(cx, cy, s, fill, sw) { // 中心 (cx,cy) 幅およそ 2s
    return '<path d="M' + cx + ',' + r1(cy + s * 0.9) + ' C' + r1(cx - s * 1.6) + ',' + r1(cy - s * 0.1) + ' ' + r1(cx - s * 0.9) + ',' + r1(cy - s * 1.2) + ' ' + cx + ',' + r1(cy - s * 0.35) +
      ' C' + r1(cx + s * 0.9) + ',' + r1(cy - s * 1.2) + ' ' + r1(cx + s * 1.6) + ',' + r1(cy - s * 0.1) + ' ' + cx + ',' + r1(cy + s * 0.9) + 'Z" class="zk" fill="' + fill + '" stroke-width="' + (sw || 2.4) + '"/>';
  }
  function bubble(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" fill-opacity=".3" stroke="#fff" stroke-width="1.8"/>';
  }

  // ---------- 本体 ----------
  function makeCatSticker(o) {
    o = o || {};
    var furKey = pick(FURS, o.fur, 'shiro', 'fur');
    var faceKey = pick(FACES, o.face, 'smile', 'face');
    var subj = SUBJ_ALIAS[o.bg] || o.bg || 'sci';
    if (!PALS[subj]) throw new Error('makeCatSticker: unknown bg: ' + o.bg);
    var kira = !!o.kira || subj === 'kira';
    var D = DEF[subj];
    var headKey = o.head || D.head, outfitKey = o.outfit || D.outfit;
    var propKey = o.prop || (o.accessory && ACC_ALIAS[o.accessory]) || D.prop;
    var F = FURS[furKey];
    var uid = (o.uid !== undefined && o.uid !== null) ? String(o.uid) : hash(JSON.stringify([furKey, faceKey, subj, headKey, outfitKey, propKey, o.hc, o.hc2, o.oc, o.tc, o.pc, o.gc, kira]));
    var P = 'cs' + uid.replace(/[^A-Za-z0-9_-]/g, '_') + '_';
    var defs = [];
    function url(n) { return 'url(#' + P + n + ')'; }
    function ref(n) { return '#' + P + n; }
    function shape(n, d) {
      defs.push('<path id="' + P + n + '" d="' + d + '"/><clipPath id="' + P + n + 'c"><use href="' + ref(n) + '"/></clipPath>');
    }
    // セル塗り: 影色のベタ + 左上にずらした明色を重ねて右下に影の三日月を作る(マスク不要・軽量)。o2.noline:輪郭なし o2.inner:内側の飾り
    function cel(n, base, line, sw, shadeCol, o2) {
      o2 = o2 || {};
      var dx = o2.dx === undefined ? -4.5 : o2.dx, dy = o2.dy === undefined ? -6.5 : o2.dy;
      function use(f, ddx, ddy) { return '<use href="' + ref(n) + '" fill="' + f + '"' + (ddx !== undefined ? ' transform="translate(' + ddx + ',' + ddy + ')"' : '') + '/>'; }
      var s = '<g clip-path="' + url(n + 'c') + '">';
      if (o2.one) s += use(mixc(base, shadeCol, 0.5)) + use(base, dx, dy);
      else s += use(mixc(base, shadeCol, 0.71)) + use(mixc(base, shadeCol, 0.42), dx, dy) + use(base, r1(dx * 2.2), r1(dy * 2.2));
      s += (o2.inner || '') + '</g>';
      if (!o2.noline) {
        if (!o2.thin) s += '<use class="zl" href="' + ref(n) + '" stroke="' + line + '" stroke-width="' + r1(sw + 0.5) + '" transform="translate(.9,1.5)"/>';
        s += '<use class="zl" href="' + ref(n) + '" stroke="' + line + '" stroke-width="' + sw + '"/>';
      }
      return s;
    }

    var PAL = PALS[subj];
    defs.push('<radialGradient id="' + P + 'g" cx="38%" cy="28%" r="85%"><stop offset="0" stop-color="' + PAL.a + '"/><stop offset="1" stop-color="' + PAL.b + '"/></radialGradient>');
    defs.push('<clipPath id="' + P + 'd"><circle cx="100" cy="100" r="89"/></clipPath>');
    defs.push('<filter id="' + P + 'o" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="3.6" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/><feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
    defs.push('<radialGradient id="' + P + 's" cx="35%" cy="25%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".55" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>');
    defs.push('<radialGradient id="' + P + 'l"><stop offset="0" stop-color="#ff7d9d" stop-opacity=".85"/><stop offset="1" stop-color="#ff7d9d" stop-opacity="0"/></radialGradient>');
    defs.push('<linearGradient id="' + P + 'i" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + F.iris + '"/><stop offset="1" stop-color="' + F.irisL + '"/></linearGradient>');
    if (kira) {
      defs.push('<linearGradient id="' + P + 'au" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4b0"/><stop offset=".25" stop-color="#f6b82e"/><stop offset=".5" stop-color="#fff0a0"/><stop offset=".75" stop-color="#e8a010"/><stop offset="1" stop-color="#ffe680"/></linearGradient>');
      defs.push('<linearGradient id="' + P + 'rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6fd0"/><stop offset=".2" stop-color="#ffd86b"/><stop offset=".4" stop-color="#6dffb4"/><stop offset=".6" stop-color="#6bc8ff"/><stop offset=".8" stop-color="#b48cff"/><stop offset="1" stop-color="#ff6fd0"/></linearGradient>');
    }
    var GOLD = kira ? url('au') : '#ffd23f';

    // ---------- 舞台（背景）----------
    var stage = '';
    if (subj === 'sci') {
      [[24, 70, 8], [42, 40, 5], [160, 34, 7], [176, 62, 4.4], [14, 112, 4], [186, 108, 4]].forEach(function (b) { stage += bubble(b[0], b[1], b[2]); });
      stage += '<path d="M150,14 l9,5 v10 l-9,5 l-9,-5 v-10Z" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/>' + star4(34, 20, 8, '#ffe27a', INK) + star4(180, 86, 6, '#ffe27a', INK) + star4(100, 12, 5, '#fff') + star4(18, 140, 5, '#fff');
    } else if (subj === 'soc') {
      var sun = '';
      for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; sun += 'M' + r1(36 + Math.cos(a) * 17) + ',' + r1(36 + Math.sin(a) * 17) + 'L' + r1(36 + Math.cos(a) * 24) + ',' + r1(36 + Math.sin(a) * 24); }
      stage += Q(sun, '#f5a93a', 3.4);
      stage += Ci(36, 36, 13, '#ffd84d', 2.6) + '<path d="M0,170 C20,128 48,128 70,160Z M130,164 C150,118 178,122 200,150V190H130Z" fill="#7cc88a" stroke="#2f6a58" stroke-width="2.6" stroke-linejoin="round"/>' +
        Q('M52,92 C70,70 96,84 112,66 S150,60 170,78', '#fff', 3, 0.85).replace('stroke-linecap="round"', 'stroke-linecap="round" stroke-dasharray="1 8"') +
        K('M172,90 C164,80 164,68 172,68 C180,68 180,80 172,90Z', '#ff5f7a', 2.4) + Ci(172, 76, 2.6, '#fff', 0) +
        '<path d="M130,26 C122,26 122,18 129,18 C130,10 142,9 146,16 C153,13 160,19 156,26Z" fill="#fff" stroke="#8db8dc" stroke-width="2"/>' +
        '<path d="M14,98 C8,98 8,90 15,90 C16,83 26,82 30,88 C37,85 42,92 38,98Z" fill="#fff" stroke="#8db8dc" stroke-width="2"/>' + star4(100, 14, 5, '#fff') + star4(184, 112, 4, '#fff');
    } else if (subj === 'jpn') {
      var ruled = ''; for (var y = 26; y < 150; y += 17) ruled += 'M0,' + y + 'H200';
      stage += Q(ruled, '#fff', 2, 0.5);
      var FONT = 'font-family="\'Hiragino Maru Gothic ProN\',\'Zen Maru Gothic\',\'Yu Gothic\',\'Noto Sans CJK JP\',\'Noto Sans JP\',sans-serif" font-weight="900"';
      var gl = function (ch, x, y, sz, rot, col) { return '<text x="' + x + '" y="' + y + '" font-size="' + sz + '" ' + FONT + ' fill="' + col + '" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round" text-anchor="middle" transform="rotate(' + rot + ' ' + x + ' ' + y + ')">' + ch + '</text>'; };
      stage += gl('あ', 30, 58, 28, -10, '#ff7aa8') + gl('字', 174, 52, 26, 10, '#ffa23a') + gl('ア', 20, 124, 22, 8, '#6b8cff') + gl('文', 182, 118, 22, -8, '#4cc0a0') +
        heart(152, 20, 6, '#ff8fb6', 2) + star4(60, 16, 5, '#fff') + star4(100, 10, 4, '#fff') + star4(150, 150, 4, '#fff');
    } else { // kira: 放射光 + きらきら
      var rays = '';
      for (var k = 0; k < 12; k++) { var a2 = k * Math.PI / 6; rays += 'M100,100L' + r1(100 + Math.cos(a2 - 0.13) * 130) + ',' + r1(100 + Math.sin(a2 - 0.13) * 130) + 'L' + r1(100 + Math.cos(a2 + 0.13) * 130) + ',' + r1(100 + Math.sin(a2 + 0.13) * 130) + 'Z'; }
      stage += '<path d="' + rays + '" fill="#fff" fill-opacity=".22"/>';
      stage += star4(34, 40, 10, '#fff', '#e8a010') + star4(168, 30, 8, '#fff', '#e8a010') + star4(184, 100, 7, '#fff7c0', '#e8a010') + star4(16, 112, 7, '#fff7c0', '#e8a010') + star4(100, 12, 6, '#fff', '#e8a010') +
        heart(172, 150, 5, '#ff9fc8', 2) + heart(26, 150, 5, '#ffd86b', 2);
    }
    stage = '<circle cx="100" cy="106" r="74" fill="' + PAL.spot + '" fill-opacity=".2"/>' + stage;

    // ---------- 体 ----------
    var BODY = 'M10,200 C14,172 46,148 100,144 C154,148 186,172 190,200Z';
    shape('b', BODY);
    var cl = OUTFITS[outfitKey];
    if (!cl) throw new Error('makeCatSticker: unknown outfit: ' + outfitKey);
    var oc = o.oc || cl.oc, tc = o.tc || cl.tc;
    var back = cl.back ? cl.back(oc, tc) : '';
    var body = cel('b', cl.base(oc, o), INK, 3.6, cl.sh, { noline: true, dx: -7, dy: -12 }) +
      '<path d="M10,200 C14,172 46,148 100,144 C154,148 186,172 190,200" fill="none" stroke="' + INK + '" stroke-width="3.8" stroke-linecap="round"/>' +
      cl.draw(oc, tc, F, o) +
      '<ellipse cx="100" cy="146" rx="50" ry="11" fill="#000" fill-opacity=".16"/>' +
      HL('M30,178 C34,166 44,158 56,153', 3.4);
    body = back + '<g clip-path="' + url('d') + '">' + body + '</g>';

    // ---------- 耳 ----------
    shape('el', 'M61,92 C52,76 52,58 58,43 Q60,38 65,41 C79,48 91,58 97,71Z');
    shape('er', 'M139,92 C148,76 148,58 142,43 Q140,38 135,41 C121,48 109,58 103,71Z');
    var mk = furKey === 'mike', hc = furKey === 'hachi';
    var earColL = mk ? F.p1 : hc ? F.p1 : F.base, earColR = mk ? F.p2 : hc ? F.p1 : F.base;
    var earShL = mk ? '#c87420' : F.sh, earShR = mk ? '#262040' : F.sh;
    var ears = cel('el', earColL, F.line, 3, earShL, { one: true, thin: true, dx: -3, dy: -5 }) + cel('er', earColR, F.line, 3, earShR, { one: true, thin: true, dx: 3, dy: -5 }) +
      '<path d="M65,83 C61,71 61,60 64,52 Q66,49 69,51 C77,56 84,62 88,70Z" fill="' + F.ear + '"/><path d="M135,83 C139,71 139,60 136,52 Q134,49 131,51 C123,56 116,62 112,70Z" fill="' + F.ear + '"/>';

    // ---------- 頭 ----------
    shape('h', 'M100,63 C124,63 142,76 143,98 C144,104 148,108 152,112 C147,114 146,117 141,119 C136,131 120,137 100,137 C80,137 64,131 59,119 C54,117 53,114 48,112 C52,108 56,104 57,98 C58,76 76,63 100,63Z');
    var pat = '';
    if (mk) {
      pat = '<path d="M40,50 L104,50 C108,60 100,70 92,74 C80,80 70,74 58,80 L40,86Z" fill="' + F.p1 + '"/><path d="M126,70 C140,64 152,72 156,86 L156,104 C140,104 128,94 122,86 C120,78 122,72 126,70Z" fill="' + F.p2 + '"/><ellipse cx="121" cy="124" rx="9" ry="6" fill="' + F.p1 + '"/>';
    } else if (F.stripe) {
      pat = Q('M100,64 V80 M91,65.5 Q92,74 94,81 M109,65.5 Q108,74 106,81', F.stripe, 3.6) + Q('M57,98 H71 M58,106 H69 M143,98 H129 M142,106 H131', F.stripe, 3.2) + Q('M70,70 Q76,68 80,70 M130,70 Q124,68 120,70', F.stripe, 2.8);
    } else if (hc) {
      pat = '<path d="M40,50 H100 L99,58 C94,74 88,86 80,94 C68,98 52,96 40,92Z" fill="' + F.p1 + '"/><path d="M160,50 H100 L101,58 C106,74 112,86 120,94 C132,98 148,96 160,92Z" fill="' + F.p1 + '"/>';
    } else if (furKey === 'tuxedo') {
      pat = '<path d="M100,84 C94,96 90,108 84,116 C78,128 90,140 100,140 C110,140 122,128 116,116 C110,108 106,96 100,84Z" fill="' + F.wh + '"/>';
    }
    var head = cel('h', F.base, F.line, 3.4, F.sh, { dx: -5, dy: -7, inner: pat + '<ellipse cx="100" cy="134" rx="52" ry="14" fill="' + F.sh + '" fill-opacity=".28"/><rect x="40" y="40" width="120" height="100" fill="' + url('s') + '"/>' });

    // ---------- 顔 ----------
    var face = '', eL = 80, eR = 120, ey = 104;
    function eyeOpen(cx, rx, ry, big, sp) {
      var s = '<ellipse cx="' + cx + '" cy="' + ey + '" rx="' + r1(rx + 0.8) + '" ry="' + r1(ry + 0.8) + '" fill="' + url('i') + '" stroke="' + F.line + '" stroke-width="1.7"/>' + El(cx, r1(ey + 1), r1(rx * (big ? 0.38 : 0.55)), r1(ry * (big ? 0.42 : 0.62)), '#241a30', 0) +
        Q('M' + r1(cx - rx - 1) + ',' + r1(ey - ry * 0.35) + ' Q' + cx + ',' + r1(ey - ry - 3.2) + ' ' + r1(cx + rx + 1) + ',' + r1(ey - ry * 0.35), F.line, 3) +
        El(r1(cx - rx * 0.32), r1(ey - ry * 0.34), r1(rx * 0.36), r1(ry * 0.34), '#fff', 0);
      if (sp) s += star4(r1(cx + rx * 0.3), r1(ey + ry * 0.2), r1(rx * 0.5), '#fff');
      return s;
    }
    function eyeUp(cx) { return Q('M' + (cx - 8) + ',' + (ey + 4) + ' Q' + cx + ',' + (ey - 9) + ' ' + (cx + 8) + ',' + (ey + 4), F.line, 3.8); }
    function eyeDown(cx) { return Q('M' + (cx - 7.5) + ',' + (ey - 1) + ' Q' + cx + ',' + (ey + 9) + ' ' + (cx + 7.5) + ',' + (ey - 1), F.line, 3.6) + Q('M' + (cx + (cx < 100 ? -7.5 : 7.5)) + ',' + (ey - 1) + ' l' + (cx < 100 ? -3 : 3) + ',-2.6', F.line, 2.2); }
    if (faceKey === 'smile') face += eyeOpen(eL, 7.6, 9.4) + eyeOpen(eR, 7.6, 9.4);
    else if (faceKey === 'closed') face += eyeDown(eL) + eyeDown(eR);
    else if (faceKey === 'surprise') face += eyeOpen(eL, 9, 11, true) + eyeOpen(eR, 9, 11, true) + Q('M70,88 Q79,82 88,87 M112,87 Q121,82 130,88', F.line, 2.8);
    else if (faceKey === 'happy') face += eyeUp(eL) + eyeUp(eR);
    else if (faceKey === 'sparkle') face += eyeOpen(eL, 8.6, 10.4, true, true) + eyeOpen(eR, 8.6, 10.4, true, true);
    else face += eyeOpen(eL, 7.6, 9.4) + eyeUp(eR);
    face += '<ellipse cx="66" cy="119" rx="9.5" ry="6" fill="' + url('l') + '"/><ellipse cx="134" cy="119" rx="9.5" ry="6" fill="' + url('l') + '"/>' +
      '<path d="M95.6,112 Q100,109.4 104.4,112 Q102.6,117.2 100,118 Q97.4,117.2 95.6,112Z" fill="#ff7c9c" stroke="' + F.line + '" stroke-width="1.8" stroke-linejoin="round"/>';
    if (faceKey === 'smile' || faceKey === 'happy' || faceKey === 'sparkle') {
      face += Q('M100,118 V120.5', F.line, 2) + '<path d="M91,121 Q100,119.4 109,121 Q108.6,131.5 100,131.5 Q91.4,131.5 91,121Z" fill="#8a2a48" stroke="' + F.line + '" stroke-width="2.2" stroke-linejoin="round"/><path d="M94,128.4 Q100,124.8 106,128.4 Q104,131 100,131 Q96,131 94,128.4Z" fill="#ff8aa6"/>' + Q('M93,122.4 H107', '#fff', 1.8);
    } else if (faceKey === 'surprise') {
      face += Q('M100,118 V120', F.line, 2) + El(100, 125, 4.4, 5.2, '#8a2a48', 2.2).replace(INK, F.line) + El(100, 127.4, 2.6, 1.8, '#ff8aa6', 0);
    } else {
      face += Q('M100,118 V121 M100,121 Q95,127 89.5,121.5 M100,121 Q105,127 110.5,121.5', F.line, 2.6);
      if (faceKey === 'wink') face += '<path d="M103,125 Q104,132 109.5,131 Q113,130 112,125.6 Q108,127 103,125Z" fill="#ff8aa6" stroke="' + F.line + '" stroke-width="1.8" stroke-linejoin="round"/>';
    }
    face += Q('M55,110 L40,106 M55,115 L41,117 M56,120 L44,126 M145,110 L160,106 M145,115 L159,117 M144,120 L156,126', F.line, 1.9, 0.7) +
      Q('M64,86 C64,76 72,69 84,67', '#fff', 4.6, 0.85) + Ci(62.5, 94, 2, '#fff', 0);

    // ---------- 頭の小物 ----------
    var hd = HEADS[headKey];
    if (!hd) throw new Error('makeCatSticker: unknown head: ' + headKey);
    var ctx = { P: P, url: url, defs: defs, F: F, ey: ey, eL: eL, eR: eR, gold: GOLD };
    var hc1 = o.hc || hd.c1, hc2 = o.hc2 || hd.c2;
    var gear = hd.draw(hc1, hc2, ctx);
    var gearBack = hd.back ? hd.back(hc1, hc2, ctx) : '';
    if (o.glass) gear += GLASSES[o.glass](o.gc || '#7a68d8', ctx); // 帽子と眼鏡の併用
    var headLayer = '<g transform="matrix(1.23 0 0 1.23 -23 -25)">' + gearBack + ears + head + face + gear + '</g>';

    // ---------- 小物（手つき） ----------
    var pawOn = 0, pr = PROPS[propKey];
    if (!pr) throw new Error('makeCatSticker: unknown prop: ' + propKey);
    var props = pr(o.pc, { P: P, url: url, defs: defs, F: F, gold: GOLD, paw: function (x, y, k) { if (!pawOn) { pawOn = 1; defs.push(pawDef(F, P + 'w')); } return '<use href="' + ref('w') + '" transform="translate(' + x + ',' + y + (k && k !== 1 ? ') scale(' + k : '') + ')"/>'; } });

    // ---------- 組み立て ----------
    var ring = '', glit = '', holo = '';
    if (kira) {
      ring = '<circle cx="100" cy="100" r="90.6" fill="none" stroke="' + url('au') + '" stroke-width="6.6"/><circle cx="100" cy="100" r="87.4" fill="none" stroke="#b5760a" stroke-opacity=".6" stroke-width="1.2"/>' +
        '<circle cx="100" cy="100" r="90.6" fill="none" stroke="' + url('rb') + '" stroke-opacity=".4" stroke-width="3" stroke-dasharray="3 5"/>';
      glit = star4(24, 30, 12, '#fff7c0', '#d9941a') + star4(178, 24, 10, '#fff', '#d9941a') + star4(186, 126, 10, '#fff7c0', '#d9941a') + star4(14, 138, 9, '#fff', '#d9941a') + star4(150, 182, 7, '#fff7c0', '#d9941a') + star4(100, 6, 6, '#fff7c0', '#d9941a');
    }
    var gloss = '<g clip-path="' + url('d') + '"><path d="M20,92 A82,82 0 0 1 64,26" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/></g>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="ごほうびねこシール">' +
      STYLE + '<defs>' + defs.join('') + '</defs>' +
      '<circle cx="102.5" cy="103.5" r="96.5" fill="#2b1d4a" fill-opacity=".2"/><circle cx="100" cy="100" r="96.5" fill="#fff" stroke="#e6dcee"/>' +
      '<circle cx="100" cy="100" r="89" fill="' + url('g') + '"/><g clip-path="' + url('d') + '">' + stage + '</g>' + ring +
      '<circle cx="100" cy="100" r="88.2" fill="none" stroke="' + PAL.rim + '" stroke-opacity=".55" stroke-width="2.4"/>' +
      '<g filter="' + url('o') + '">' + body + headLayer + props + '</g>' + gloss + holo + glit + '</svg>';
  }

  // ---------- 手（肉球つきの丸い手） ----------
  function pawDef(F, id) {
    function bean(cx, cy, r) { return 'M' + (cx - r) + ',' + cy + 'a' + r + ',' + r + ' 0 1 0 ' + 2 * r + ',0a' + r + ',' + r + ' 0 1 0 ' + (-2 * r) + ',0Z'; }
    return '<g id="' + id + '"><ellipse rx="15" ry="14" fill="' + F.line + '"/><ellipse rx="13" ry="12" fill="' + F.sh + '"/><ellipse cx="-1.2" cy="-1.5" rx="11.4" ry="10.4" fill="' + F.base + '"/>' +
      '<path d="M-5.6,5C-5.6,.4 -2.6,-.6 0,-.6C2.6,-.6 5.6,.4 5.6,5C5.6,9.4 2,9.8 0,9.8C-2,9.8 -5.6,9.4 -5.6,5Z' + bean(-8.4, -5.4, 3.3) + bean(0, -9.4, 3.4) + bean(8.4, -5.4, 3.3) + '" fill="#ff8aa6" stroke="#d9597c" stroke-width="1"/></g>';
  }

  // =====================================================================
  // 衣装（体の中身）。座標は 200x200 の絶対座標。肩ライン上端 y=144、あごは y≈142
  // =====================================================================
  var OUTFITS = {};
  function pocketPens(x, y) {
    return '<path d="M' + x + ',' + (y + 4) + ' h20 v15 q0,3 -3,3 h-14 q-3,0 -3,-3z" fill="#fff" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      Rc(x + 3, y - 4, 4.4, 14, 2, '#ff6b8b', 1.8) + Rc(x + 9, y - 1, 4.4, 11, 2, '#4a90f0', 1.8) + Rc(x + 14.6, y - 3, 4.4, 13, 2, '#ffd23f', 1.8);
  }
  function bowtie(cx, cy, c, s) { s = s || 1; return K('M' + cx + ',' + cy + ' L' + r1(cx - 15 * s) + ',' + r1(cy - 8 * s) + ' V' + r1(cy + 8 * s) + 'Z M' + cx + ',' + cy + ' L' + r1(cx + 15 * s) + ',' + r1(cy - 8 * s) + ' V' + r1(cy + 8 * s) + 'Z', c, 2.8) + Rc(r1(cx - 4.6 * s), r1(cy - 6 * s), r1(9.2 * s), r1(12 * s), 3.4, shade(c, 0.15), 2.6); }
  function btn(cx, cy, c, r) { return Ci(cx, cy, r || 3, c || '#ffd23f', 1.8); }
  // ---- 理科 ----
  OUTFITS.coat = {
    oc: '#8fdcee', tc: '#ff6b8b', sh: '#6a6ab0', base: function (oc, o) { return o.bc || '#ffffff'; },
    draw: function (oc, tc, F, o) {
      var bc = o.bc || '#fff', s = K('M100,186 L74,142 H126Z', oc, 2.8);
      s += K('M74,142 L100,178 L86,192 L52,162 L64,148Z', bc, 3.2) + K('M126,142 L100,178 L114,192 L148,162 L136,148Z', bc, 3.2) + Q('M100,180 V194', INK, 2.4, 0.7);
      if (o.tie === 'long') s += K('M100,152 L94,156 L97,184 L100,190 L103,184 L106,156Z', tc, 2.8) + Rc(95.5, 146, 9, 10, 3.5, tc, 2.6);
      else if (o.tie !== 'none') s += bowtie(100, 153, tc);
      if (o.pocket !== false) s += pocketPens(114, 168);
      if (o.badge) s += Rc(60, 166, 20, 13, 3, '#fff', 2.4) + Q('M64,171 h12 M64,175 h8', '#ff6b8b', 2) + Ci(70, 164, 1.6, INK, 0);
      s += Ci(88, 180, 3, '#6ec5ff', 1.8);
      return s;
    }
  };
  // ---- 社会 ----
  OUTFITS.jacket = {
    oc: '#e8b95a', tc: '#ff5f7a', sh: '#6a3a10', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var d = shade(oc, -0.12);
      return K('M100,188 L76,142 H124Z', '#fff6dc', 2.8) + K('M76,142 L100,174 L84,192 L50,162 L64,148Z', oc, 3.2) + K('M124,142 L100,174 L116,192 L150,162 L136,148Z', oc, 3.2) +
        Rc(50, 170, 22, 15, 3.4, d, 2.8) + Q('M50,175 h22', INK, 2) + btn(61, 178, '#b86b25', 2.8) + Rc(128, 170, 22, 15, 3.4, d, 2.8) + Q('M128,175 h22', INK, 2) + btn(139, 178, '#b86b25', 2.8) +
        K('M72,146 Q100,168 128,146 L124,160 Q100,182 76,160Z', tc, 3) + Q('M80,156 Q100,172 120,156', '#fff', 2, 0.7).replace('stroke-linecap="round"', 'stroke-linecap="round" stroke-dasharray="1 6"') +
        K('M108,170 L100,194 L122,188Z', tc, 2.8) + Ci(108, 168, 7.4, shade(tc, 0.15), 2.8) + Ci(106, 166, 2, '#fff', 0);
    }
  };
  OUTFITS.zip = {
    oc: '#4a9ee8', tc: '#ffd23f', sh: '#1a3a7a', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var d = shade(oc, -0.25);
      return K('M64,144 Q100,160 136,144 L142,166 Q100,182 58,166Z', d, 3.2) + K('M62,150 Q100,166 138,150 L138,160 Q100,176 62,160Z', oc, 2.6) + Q('M100,170 V196', INK, 4.6) + Q('M100,170 V196', '#fff', 1.6, 0.8) + K('M100,176 l-4,6 h8z', tc, 1.8) +
        Q('M34,176 C40,172 48,170 58,170 M142,170 C152,170 160,172 166,176', tc, 4.4) + Ci(130, 178, 9, '#fff', 2.6) + star5(130, 178, 6, '#ff5f7a', 1.4);
    }
  };
  OUTFITS.captain = {
    oc: '#2a3f8a', tc: '#e8405a', sh: '#0e1840', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var s = K('M100,186 L78,142 H122Z', '#fff', 2.8) + K('M100,152 L96,156 L98,184 L102,184 L104,156Z', tc, 2.4) +
        K('M78,142 L100,176 L86,192 L52,162 L66,148Z', oc, 3.2) + K('M122,142 L100,176 L114,192 L148,162 L134,148Z', oc, 3.2) + Q('M70,150 L96,176 M130,150 L104,176', '#fff', 2.2, 0.8);
      [168, 182].forEach(function (y) { s += btn(86, y, '#ffd23f', 3.2) + btn(114, y, '#ffd23f', 3.2); });
      s += K('M30,166 L56,152 L64,162 L38,178Z', '#ffd23f', 2.8) + Q('M36,172 L56,160', '#e8a010', 2) + K('M170,166 L144,152 L136,162 L162,178Z', '#ffd23f', 2.8) + Q('M164,172 L144,160', '#e8a010', 2);
      return s;
    }
  };
  OUTFITS.vestG = {
    oc: '#6fbf6a', tc: '#ff5f7a', sh: '#3a4a2a', base: function () { return '#fffaf0'; },
    draw: function (oc, tc) {
      return K('M72,142 L100,168 L128,142 L134,150 L106,184 L94,184 L66,150Z', '#fff', 2.8) + K('M72,142 L100,170 L90,194 L40,194 L46,160 Q56,148 72,142Z', oc, 3.4) + K('M128,142 L100,170 L110,194 L160,194 L154,160 Q144,148 128,142Z', oc, 3.4) +
        Rc(52, 172, 22, 16, 3.4, shade(oc, -0.14), 2.6) + Rc(126, 172, 22, 16, 3.4, shade(oc, -0.14), 2.6) + btn(63, 180, '#fff', 2.6) + btn(137, 180, '#fff', 2.6) +
        K('M100,152 L95,158 L97,180 L100,184 L103,180 L105,158Z', tc, 2.6) + btn(92, 184, '#ffd23f', 2.8);
    }
  };
  // ---- 国語 ----
  OUTFITS.sailor = {
    oc: '#4a5aa8', tc: '#ff5a7e', sh: '#141a50', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var s = K('M82,142 L100,184 L118,142Z', '#fff', 2.8);
      s += K('M82,142 L40,160 Q44,176 60,176 L100,186 L100,166 L88,146Z', '#fff', 3.2) + K('M118,142 L160,160 Q156,176 140,176 L100,186 L100,166 L112,146Z', '#fff', 3.2);
      s += Q('M80,150 L48,164 M86,156 L58,170', oc, 2.6) + Q('M120,150 L152,164 M114,156 L142,170', oc, 2.6);
      s += K('M100,170 L88,164 Q82,172 86,180Z M100,170 L112,164 Q118,172 114,180Z', tc, 2.8) + Rc(95, 164, 10, 12, 4, shade(tc, 0.15), 2.8) + K('M96,178 L90,196 L100,190Z M104,178 L110,196 L100,190Z', tc, 2.4);
      return s;
    }
  };
  OUTFITS.cardigan = {
    oc: '#ffa8c8', tc: '#e8405a', sh: '#a03a6a', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var s = K('M100,184 L78,142 H122Z', '#fff', 2.8) + K('M78,142 Q92,146 100,170 L98,196 L56,196 L50,160 Q62,148 78,142Z', oc, 3.4) + K('M122,142 Q108,146 100,170 L102,196 L144,196 L150,160 Q138,148 122,142Z', oc, 3.4);
      s += K('M82,144 L100,166 L70,160Z', '#fff', 2.8) + K('M118,144 L100,166 L130,160Z', '#fff', 2.8);
      s += btn(94, 178, '#fff', 3) + btn(94, 190, '#fff', 3) + btn(106, 178, '#fff', 3) + Q('M58,170 Q60,182 58,192 M142,170 Q140,182 142,192', shade(oc, -0.2), 2.6, 0.7);
      s += bowtie(100, 164, tc, 0.9);
      return s;
    }
  };
  OUTFITS.vestY = {
    oc: '#ffd25e', tc: '#4a7ae0', sh: '#8a5a10', base: function () { return '#ffffff'; },
    draw: function (oc, tc) {
      var s = K('M72,142 L100,170 L128,142Z', '#fff', 2.8) + K('M72,142 L100,172 L88,194 L40,194 L46,160 Q56,148 72,142Z', oc, 3.4) + K('M128,142 L100,172 L112,194 L160,194 L154,160 Q144,148 128,142Z', oc, 3.4);
      s += Q('M44,174 H92 M44,184 H88 M62,152 V196 M78,148 V196 M156,174 H108 M156,184 H112 M138,152 V196 M122,148 V196', '#ff9f4a', 2, 0.55);
      s += K('M100,154 L94,160 L97,184 L100,188 L103,184 L106,160Z', tc, 2.6) + Rc(95.4, 148, 9.2, 9, 3.4, tc, 2.6) + K('M84,144 L100,160 L76,156Z', '#fff', 2.6) + K('M116,144 L100,160 L124,156Z', '#fff', 2.6);
      return s;
    }
  };
  OUTFITS.smock = {
    oc: '#3cb8b0', tc: '#ffd23f', sh: '#0a5a5a', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      return K('M80,142 Q100,162 120,142 L124,152 Q100,172 76,152Z', '#fff', 2.8) + Q('M100,164 V196', shade(oc, -0.3), 2.6, 0.7) + Ci(60, 166, 6, '#ff5a7e', 0) + Ci(72, 182, 4.6, '#ffd23f', 0) + Ci(140, 170, 6.4, '#4a90f0', 0) + Ci(128, 186, 4, '#ff8f3a', 0) + Ci(52, 184, 3.4, '#4a90f0', 0) +
        Rc(112, 168, 24, 20, 4, shade(oc, 0.15), 2.8) + Gp('translate(124,170) rotate(10)', Rc(-2.4, -14, 4.8, 24, 2, '#ffd23f', 2) + K('M-2.4,-14 L0,-22 L2.4,-14Z', '#ff5a7e', 1.8)) + Gp('translate(130,170) rotate(22)', Rc(-2.4, -12, 4.8, 22, 2, '#8a5a2a', 2) + Rc(-3,-20,6,9,3,'#222',1.6));
    }
  };
  // ---- キラ ----
  OUTFITS.cape = {
    oc: '#e8405a', tc: '#ffd23f', sh: '#6a0a2a', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var s = K('M50,150 Q100,174 150,150 L146,168 Q100,194 54,168Z', '#fffdf6', 3.2);
      [[64, 164], [82, 172], [100, 175], [118, 172], [136, 164]].forEach(function (p) { s += Ci(p[0], p[1], 2.6, INK, 0); s += Q('M' + (p[0] + 1) + ',' + (p[1] + 4) + ' v4', INK, 2.2); });
      return s + Ci(62, 158, 7, tc, 2.6) + gem(62, 158, 3.4, '#5ab4ff') + Ci(138, 158, 7, tc, 2.6) + gem(138, 158, 3.4, '#5ab4ff') + Q('M68,160 Q100,182 132,160', tc, 2.6);
    }
  };
  OUTFITS.robe = {
    oc: '#6c4fd0', tc: '#ffd23f', sh: '#1a1050', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      return K('M76,142 L100,176 L124,142 L134,150 L106,190 L94,190 L66,150Z', shade(oc, -0.2), 3) + Q('M76,142 L100,176 L124,142', tc, 4.4) + Q('M100,176 V196', tc, 3) +
        star4(52, 170, 8, '#ffe27a', INK) + star4(150, 176, 9, '#ffe27a', INK) + star4(70, 188, 5, '#fff', INK) + star4(132, 160, 5, '#fff', INK) + Ci(100, 158, 5, tc, 2.4);
    }
  };
  OUTFITS.dress = {
    oc: '#ff8fc0', tc: '#e8405a', sh: '#a02060', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var s = K('M72,144 Q100,164 128,144 L132,152 Q100,178 68,152Z', '#fffdf6', 3);
      for (var i = 0; i < 7; i++) { var t = i / 6, x = 70 + t * 60, y = 152 + Math.sin(t * Math.PI) * 18; s += Ci(r1(x), r1(y + 3), 4.2, '#fffdf6', 2.2); }
      return s + bowtie(100, 172, tc, 1.2) + Ci(50, 172, 2.4, '#fff', 0) + Ci(150, 172, 2.4, '#fff', 0) + Ci(60, 186, 2.4, '#fff', 0) + Ci(142, 186, 2.4, '#fff', 0);
    }
  };
  OUTFITS.toga = {
    oc: '#ffffff', tc: '#ffd23f', sh: '#8a8ac8', base: function (oc) { return oc; },
    back: function () {
      var w = 'M58,172 C8,176 -4,120 12,76 C22,98 32,100 42,92 C36,110 48,120 62,118Z', v = 'M24,100 C16,126 26,152 52,166 M38,106 C34,124 42,142 58,152';
      return K(w, '#fff', 3.6) + Q(v, '#cdb8e4', 2.6) + Gp('matrix(-1 0 0 1 200 0)', K(w, '#fff', 3.6) + Q(v, '#cdb8e4', 2.6));
    },
    draw: function (oc, tc) {
      return Q('M74,142 L100,178 L126,142', tc, 4.6) + Q('M100,178 V196', tc, 3) + Q('M58,180 Q70,170 78,190 M142,180 Q130,170 122,190', '#d3c0e0', 2.4) + star4(100, 164, 6, '#ffe27a', INK);
    }
  };
  OUTFITS.space = {
    oc: '#ffffff', tc: '#ff8a3d', sh: '#6a7ab0', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      return Rc(70, 170, 60, 22, 6, '#e8eef8', 2.8) + Ci(84, 181, 4, '#ff5a6e', 1.8) + Ci(98, 181, 4, '#ffd23f', 1.8) + Ci(112, 181, 4, '#5ab4ff', 1.8) + Q('M120,176 H125', INK, 2.4) +
        Rc(40, 168, 24, 14, 4, '#ff8a3d', 2.6) + Q('M44,175 h16', '#fff', 2.4) + Gp('translate(150,172)', Ci(0, 0, 9, '#fff', 2.6) + star5(0, 0, 6, '#4a90f0', 1.4)) + Q('M34,160 Q40,152 50,152 M166,160 Q160,152 150,152', '#ff8a3d', 4.4);
    }
  };
  OUTFITS.tux = {
    oc: '#ffffff', tc: '#e8405a', sh: '#0e0c28', base: function () { return '#2c2a46'; },
    draw: function (oc, tc) {
      return K('M100,188 L76,142 H124Z', '#fff', 2.8) + K('M76,142 L100,176 L88,192 L52,164 L66,148Z', '#3a3860', 3.2) + K('M124,142 L100,176 L112,192 L148,164 L134,148Z', '#3a3860', 3.2) +
        Q('M66,152 L88,176 M134,152 L112,176', '#9a98c8', 2.2, 0.7) + bowtie(100, 153, tc, 1.05) + btn(100, 172, '#ffd23f', 3) + btn(100, 184, '#ffd23f', 3) + star4(130, 168, 5, '#ffd23f');
    }
  };
  OUTFITS.armor = {
    oc: '#c9d3e6', tc: '#ffd23f', sh: '#5a6a98', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      return K('M72,146 Q100,166 128,146 L124,160 Q100,178 76,160Z', shade(oc, -0.2), 3) + K('M70,170 Q100,160 130,170 L124,194 L76,194Z', shade(oc, 0.1), 3.2) + star5(100, 178, 10, tc, 2.4) +
        Ci(42, 160, 15, oc, 3.2) + Q('M34,154 Q40,148 48,148', '#fff', 3) + Ci(158, 160, 15, oc, 3.2) + Q('M150,154 Q156,148 164,148', '#fff', 3) + Q('M28,166 H56 M144,166 H172', tc, 3);
    }
  };
  OUTFITS.rainbow = {
    oc: '#ffe6f2', tc: '#ff5a8a', sh: '#a0609a', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      var cols = ['#ff5a6e', '#ffa23a', '#ffe14d', '#5adf8a', '#5ab4ff', '#a98cff'], s = '';
      cols.forEach(function (c, i) { var y = 148 + i * 6.4; s += Q('M54,' + (y + 4) + ' Q100,' + (y + 28) + ' 146,' + (y + 4), c, 7.6); });
      s = Q('M54,152 Q100,176 146,152', INK, 7) + s;
      return s + K('M110,172 L104,194 L124,190Z', '#5ab4ff', 2.6) + heart(46, 182, 5, '#ff8fb6', 2) + heart(154, 188, 4, '#ffd86b', 2);
    }
  };
  OUTFITS.champion = {
    oc: '#e8405a', tc: '#ffd23f', sh: '#6a0a2a', base: function (oc) { return oc; },
    draw: function (oc, tc) {
      return K('M100,184 L74,142 H126Z', '#fff6dc', 2.8) + K('M74,142 L100,176 L84,194 L48,164 L62,148Z', shade(oc, -0.1), 3) + K('M126,142 L100,176 L116,194 L152,164 L138,148Z', shade(oc, -0.1), 3) + Q('M66,150 L98,182 M134,150 L102,182', tc, 3.4) +
        K('M88,150 L100,172 L112,150 L106,148 L100,160 L94,148Z', '#4a90f0', 2.6) + Ci(100, 180, 10, '#ffd23f', 3) + star5(100, 180, 6, '#e89a10', 1.2);
    }
  };

  // =====================================================================
  // 頭の小物（頭座標：頭は x48-152, y63-137、目は y=104）
  // =====================================================================
  var HEADS = {};
  var GLASSES = {};
  HEADS.goggles = {
    c1: '#ffab40', c2: '#3b9fbe',
    draw: function (c1, c2, x) {
      x.defs.push('<radialGradient id="' + x.P + 'gl" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e6fbff"/><stop offset=".6" stop-color="#8fdcf2"/><stop offset="1" stop-color="#4aaed6"/></radialGradient>');
      var s = '<g clip-path="' + x.url('hc') + '">' + Q('M44,82 Q100,70 156,82', INK, 12) + Q('M44,82 Q100,70 156,82', c2, 8.4) + '</g>';
      [82, 118].forEach(function (cx) {
        s += Ci(cx, 80, 15, c1, 3) + Ci(cx, 80, 10.6, x.url('gl'), 2) + Q('M' + (cx - 7) + ',77 Q' + (cx - 4) + ',72.4 ' + cx + ',72', '#fff', 2.8) + Ci(cx + 4.4, 85, 1.4, '#fff', 0);
      });
      return s + Rc(96, 77, 8, 7, 2, c1, 2);
    }
  };
  function shade(hex, t) { // t<0:暗く t>0:明るく
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, tg = t < 0 ? 0 : 255, a = Math.abs(t);
    function m(v) { return Math.round(v + (tg - v) * a); }
    return '#' + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1);
  }
  function lensDef(x) {
    if (!x.lensDone) { x.lensDone = 1; x.defs.push('<linearGradient id="' + x.P + 'lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".5" stop-color="#d8ecff" stop-opacity=".3"/><stop offset="1" stop-color="#d8ecff" stop-opacity=".15"/></linearGradient>'); }
    return x.url('lens');
  }
  function frame(x, shapeFn, col, w) { // shapeFn(cx) -> 閉じた図形のSVG属性文字列(d or r) を返す関数ではなく、SVG要素文字列を作る関数
    var s = '';
    [x.eL, x.eR].forEach(function (cx) { s += shapeFn(cx, INK, w + 3.4, 'none') + shapeFn(cx, col, w, lensDef(x)); });
    return s;
  }
  GLASSES.round = function (col, x) {
    var sh = function (cx, st, w, fill) { return '<circle cx="' + cx + '" cy="' + x.ey + '" r="14.6" fill="' + fill + '" stroke="' + st + '" stroke-width="' + w + '"/>'; };
    return Q('M66,100 L53,94 M134,100 L147,94', INK, 3) + Q('M93.6,102 Q100,97 106.4,102', INK, 3.6) + frame(x, sh, col, 4.2) +
      [x.eL, x.eR].map(function (cx) { return Q('M' + (cx - 9) + ',' + (x.ey - 6) + ' Q' + (cx - 6) + ',' + (x.ey - 10.4) + ' ' + (cx - 1) + ',' + (x.ey - 11.4), '#fff', 2.8); }).join('');
  };
  GLASSES.big = function (col, x) {
    var sh = function (cx, st, w, fill) { return '<circle cx="' + cx + '" cy="' + x.ey + '" r="17" fill="' + fill + '" stroke="' + st + '" stroke-width="' + w + '"/>'; };
    return Q('M63,100 L51,94 M137,100 L149,94', INK, 3) + Q('M95,102 Q100,98 105,102', INK, 4) + frame(x, sh, col, 5.4) +
      [x.eL, x.eR].map(function (cx) { return Q('M' + (cx - 10) + ',' + (x.ey - 7) + ' Q' + (cx - 7) + ',' + (x.ey - 12) + ' ' + (cx - 1) + ',' + (x.ey - 13), '#fff', 3); }).join('');
  };
  GLASSES.square = function (col, x) {
    var sh = function (cx, st, w, fill) { return '<rect x="' + (cx - 15.5) + '" y="' + (x.ey - 13) + '" width="31" height="26" rx="8" fill="' + fill + '" stroke="' + st + '" stroke-width="' + w + '"/>'; };
    return Q('M64.5,100 L53,94 M135.5,100 L147,94', INK, 3) + Q('M95.5,100 Q100,97 104.5,100', INK, 3.6) + frame(x, sh, col, 4.2) +
      [x.eL, x.eR].map(function (cx) { return Q('M' + (cx - 10) + ',' + (x.ey - 5) + ' V' + (x.ey - 8) + ' Q' + (cx - 10) + ',' + (x.ey - 10) + ' ' + (cx - 6) + ',' + (x.ey - 10), '#fff', 2.8); }).join('');
  };
  GLASSES.cat = function (col, x) {
    var sh = function (cx, st, w, fill) {
      var m = cx < 100 ? -1 : 1, ox = cx + m * 16, tx = cx - m * 14;
      return '<path d="M' + ox + ',' + (x.ey - 14) + ' L' + (cx + m * 3) + ',' + (x.ey - 13) + ' Q' + tx + ',' + (x.ey - 12) + ' ' + tx + ',' + (x.ey + 2) + ' Q' + (tx + m * 2) + ',' + (x.ey + 14) + ' ' + (cx + m * 4) + ',' + (x.ey + 14) + ' Q' + (ox - m * 1) + ',' + (x.ey + 14) + ' ' + (ox + m * 1) + ',' + (x.ey + 2) + ' Q' + (ox + m * 1) + ',' + (x.ey - 6) + ' ' + ox + ',' + (x.ey - 14) + 'Z" fill="' + fill + '" stroke="' + st + '" stroke-width="' + w + '" stroke-linejoin="round"/>';
    };
    return Q('M66,96 L52,90 M134,96 L148,90', INK, 3) + Q('M94,100 Q100,96 106,100', INK, 3.6) + frame(x, sh, col, 4.2);
  };
  ['round', 'big', 'square', 'cat'].forEach(function (g) {
    HEADS[g] = { c1: g === 'big' ? '#ff6f9c' : g === 'cat' ? '#e8506c' : g === 'square' ? '#2f5dc8' : '#7a68d8', c2: '', draw: function (c1, c2, x) { return GLASSES[g](c1, x); } };
  });
  HEADS.beret = { c1: '#e8405a', draw: function (c, c2, x) {
    return Gp('rotate(-9 100 60)', K('M52,74 C48,46 86,34 120,42 C140,48 150,64 142,76 C112,66 80,74 52,74Z', c, 3.2) + Q('M60,66 C66,54 80,48 96,46', '#fff', 3.4, 0.7) + K('M104,40 Q106,31 112,35 Q111,42 104,40Z', shade(c, -0.25), 2.4) +
      Q('M70,72 C90,68 112,70 138,74', shade(c, -0.3), 3, 0.5));
  } };
  HEADS.mortar = { c1: '#3b3860', draw: function (c, c2, x) {
    return K('M72,64 V84 Q100,94 128,84 V64 L100,74Z', c, 3) + K('M48,58 L100,38 L152,58 L100,76Z', shade(c, -0.35), 3.2) + Q('M60,56 L98,42', '#fff', 2.6, 0.5) +
      Q('M100,58 L140,64 V82', '#ffd23f', 3.4) + Ci(140, 87, 5, '#ffd23f', 2.2) + Ci(100,58,3.6,'#ffd23f',2);
  } };
  HEADS.bow = { c1: '#ff7aa8', draw: function (c, c2, x) {
    return Gp('translate(66,70) rotate(-12)', K('M0,0 L-24,-14 Q-32,0 -24,14Z', c, 3.2) + K('M0,0 L24,-14 Q32,0 24,14Z', c, 3.2) + Q('M-20,-6 L-12,-3 M12,-3 L20,-6', '#fff', 2.2, 0.8) + Ci(0, 0, 8, shade(c, 0.2), 3) + HL('M-3,-3 q2,-2 4,-1', 2));
  } };
  HEADS.pencilEar = { c1: '#ffd23f', draw: function (c, c2, x) {
    return Gp('translate(136,80) rotate(24)', Rc(-5.5, -24, 11, 40, 3, c, 3) + Q('M-2,-20 V12', shade(c, 0.5), 2.4) + Q('M2.6,-20 V12', shade(c, -0.25), 2.4) + K('M-5.5,-24 L0,-36 L5.5,-24Z', '#f6d3a2', 3) + K('M-2,-31 L0,-36 L2,-31Z', INK, 1.4) +
      Rc(-5.5, 16, 11, 9, 3, '#ff8fb6', 3) + Rc(-6, 13, 12, 4, 0, '#cfd6e6', 2));
  } };
  HEADS.mirror = { c1: '#eef2fa', c2: '#9bb0c8', draw: function (c1, c2, x) {
    return '<g clip-path="' + x.url('hc') + '">' + Q('M44,82 Q100,70 156,82', INK, 12) + Q('M44,82 Q100,70 156,82', '#ff6b8b', 8.4) + '</g>' +
      Ci(100, 76, 16, c1, 3.4) + Ci(100, 76, 9, c2, 2.4) + Ci(100, 76, 3.6, INK, 0) + HL('M89,70 Q92,64 98,62', 3.4);
  } };
  HEADS.lamp = { c1: '#ffd23f', c2: '#fffbe0', draw: function (c1, c2, x) {
    return '<g clip-path="' + x.url('hc') + '">' + Q('M44,82 Q100,70 156,82', INK, 12) + Q('M44,82 Q100,70 156,82', '#4a90f0', 8.4) + '</g>' +
      Q('M100,54 V47 M84,58 L79,52 M116,58 L121,52', '#ffd23f', 3.6) + Rc(86, 62, 28, 22, 7, c1, 3.2) + Ci(100, 73, 8, c2, 2.6) + Ci(100, 73, 3.2, '#ffe066', 0) + HL('M91,66 Q94,64 98,64', 2.6);
  } };
  HEADS.explorer = { c1: '#f0c466', c2: '#e8504f', draw: function (c, b, x) {
    return El(100, 74, 44, 11, shade(c, -0.1), 3) + Q('M62,76 Q100,89 138,76', shade(c, -0.35), 3, 0.55) + HL('M62,71 Q72,65 84,65', 2.8) +
      K('M70,74 C70,48 84,38 100,38 C116,38 130,48 130,74 C116,82 84,82 70,74Z', c, 3.2) + '<path d="M100,74 C112,76 122,76 130,74 C130,58 126,48 120,43 C124,52 124,64 100,74Z" fill="' + shade(c, -0.3) + '" fill-opacity=".55"/>' +
      K('M70.4,68 C84,76 116,76 129.6,68 L130,74 C116,82 84,82 70,74Z', b, 2.6) + HL('M80,50 C84,44 90,41 97,41', 4) +
      Ci(100, 63, 7, '#fff6dc', 2.6) + '<path d="M100,57.4 L102,63 L100,68.6 L98,63Z" fill="#ff5f7a"/>';
  } };
  HEADS.helmet = { c1: '#fff3d6', c2: '#b8793a', draw: function (c, b, x) {
    return El(100, 80, 52, 10, c, 3) + K('M64,78 C60,50 80,36 100,36 C120,36 140,50 136,78 C120,86 80,86 64,78Z', c, 3.2) + '<path d="M104,38 C122,42 134,56 136,78 C128,82 118,84 108,84Z" fill="' + shade(c, -0.25) + '" fill-opacity=".6"/>' +
      K('M63,71 C80,80 120,80 137,71 L137,79 C120,88 80,88 63,79Z', b, 2.8) + Ci(100, 36, 4.4, b, 2.4) + HL('M76,56 C80,48 88,43 96,41', 4.2) + Ci(86, 56, 2.2, b, 0) + Ci(114, 56, 2.2, b, 0);
  } };
  HEADS.captain = { c1: '#ffffff', c2: '#2a3f8a', draw: function (c, b, x) {
    return K('M62,78 Q100,98 138,78 L138,84 Q100,102 62,84Z', '#1c2447', 2.8) + K('M62,72 C58,54 78,46 100,46 C122,46 142,54 138,72 Q100,84 62,72Z', c, 3.2) + K('M62.4,66 Q100,78 137.6,66 L138,78 Q100,90 62,78Z', b, 2.8) +
      HL('M72,56 C78,50 86,48 94,48', 3.6) + Ci(100, 74, 7.4, '#ffd23f', 2.4) + star5(100, 74, 4.6, '#fff', 1.2) + Q('M80,74 h6 M114,74 h6', '#ffd23f', 3);
  } };
  HEADS.straw = { c1: '#ffe08a', c2: '#ff5a6e', draw: function (c, b, x) {
    return El(100, 74, 56, 13, shade(c, -0.08), 3.2) + Q('M52,76 Q100,92 148,76', '#d99a2c', 3, 0.5) + K('M72,74 C70,48 86,40 100,40 C114,40 130,48 128,74 C116,82 84,82 72,74Z', c, 3.2) +
      Q('M80,52 H120 M76,60 H124', '#e8b64c', 2.2, 0.8) + K('M71.6,66 Q100,78 128.4,66 L128.6,74 Q100,86 71.4,74Z', b, 2.8) + HL('M82,48 C86,44 92,42 98,42', 3.6) + HL('M60,70 Q68,66 78,66', 2.8);
  } };
  HEADS.hard = { c1: '#ffd23f', c2: '#fff', draw: function (c, b, x) {
    return K('M54,78 H146 Q146,87 138,87 H62 Q54,87 54,78Z', shade(c, -0.08), 3) + K('M64,78 C62,50 80,38 100,38 C120,38 138,50 136,78Z', c, 3.2) + K('M92,39 Q100,32 108,39 V78 H92Z', shade(c, -0.14), 2.8) +
      HL('M72,58 C74,50 80,44 88,41', 4.4) + Rc(94, 54, 12, 8, 3, b, 2) + Ci(100, 58, 2, '#e8504f', 0);
  } };
  // ----- キラ -----
  function gem(cx, cy, r, c) { return Ci(cx, cy, r, c, 1.8) + Ci(r1(cx - r * 0.3), r1(cy - r * 0.3), r1(r * 0.28), '#fff', 0); }
  HEADS.crown = { c1: '#ffd23f', draw: function (c, c2, x) {
    return K('M60,72 L62,44 L80,60 L100,38 L120,60 L138,44 L140,72Z', x.gold, 3.4) + K('M60,70 Q100,82 140,70 L140,82 Q100,94 60,82Z', x.gold, 3.2) + Q('M70,56 L68,50', '#fff', 2.6, 0.9) +
      gem(62, 44, 4.4, '#ff5a8a') + gem(100, 38, 5, '#5ab4ff') + gem(138, 44, 4.4, '#5adf8a') + gem(84, 79, 3.6, '#ff5a8a') + gem(100, 82, 4, '#5ab4ff') + gem(116, 79, 3.6, '#5adf8a');
  } };
  HEADS.wizard = { c1: '#6c4fd0', draw: function (c, c2, x) {
    return El(100, 76, 52, 10, shade(c, -0.15), 3.2) + K('M64,76 C72,60 86,46 108,36 C102,50 112,64 136,76 C120,84 84,84 64,76Z', c, 3.2) + K('M65,70 Q100,82 135,70 L136,77 Q100,90 64,77Z', '#ffd23f', 2.8) +
      star4(94, 58, 7, '#ffe27a', INK) + star4(116, 66, 4.6, '#fff', INK) + HL('M78,66 C82,58 90,52 98,47', 3.4);
  } };
  HEADS.tiara = { c1: '#ffd23f', draw: function (c, c2, x) {
    return K('M66,74 Q70,66 74,56 L88,66 L100,48 L112,66 L126,56 Q130,66 134,74 Q100,84 66,74Z', x.gold, 3.4) + heart(100, 66, 5.4, '#ff5a8a', 2) + gem(74, 57, 3.6, '#5ab4ff') + gem(126, 57, 3.6, '#5ab4ff') + Ci(100, 48, 3.6, '#fff', 2);
  } };
  HEADS.halo = { c1: '#ffd23f', draw: function (c, c2, x) {
    return '<ellipse cx="100" cy="42" rx="25" ry="7.4" fill="none" stroke="' + INK + '" stroke-width="11"/><ellipse cx="100" cy="42" rx="25" ry="7.4" fill="none" stroke="' + x.gold + '" stroke-width="6.6"/>' + Q('M80,38 Q92,34 104,35', '#fff', 2.4, 0.9) + star4(132, 38, 5, '#fff', '#d9941a');
  } };
  HEADS.astro = { c1: '#ffffff', draw: function (c, c2, x) {
    return '<ellipse cx="100" cy="98" rx="62" ry="58" fill="#cfeeff" fill-opacity=".05" stroke="' + INK + '" stroke-width="7.4"/><ellipse cx="100" cy="98" rx="62" ry="58" fill="none" stroke="#fff" stroke-width="3.6" stroke-opacity=".9"/>' +
      Q('M52,70 C56,56 66,48 80,44', '#fff', 5, 0.95) + Ci(84, 40, 2.4, '#fff', 0) + Q('M138,128 C146,118 150,108 150,98', '#fff', 3, 0.5) +
      '<path d="M50,136 Q100,172 150,136" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/><path d="M50,136 Q100,172 150,136" fill="none" stroke="#ff8a3d" stroke-width="8.6" stroke-linecap="round"/>' + Q('M60,141 Q100,164 140,141', '#ffc08a', 2.4, 0.9);
  } };
  HEADS.tophat = { c1: '#3b3860', draw: function (c, c2, x) {
    return Gp('rotate(-9 100 60)', El(100, 68, 46, 10, c, 3.2) + K('M70,68 L74,38 Q100,32 126,38 L130,68 Q100,76 70,68Z', c, 3.2) + K('M71.4,60 Q100,68 128.6,60 L129.6,68 Q100,76 70.4,68Z', '#e8405a', 2.6) + star5(100, 66, 4.6, '#ffe27a', 1.4) + HL('M78,48 L80,38', 3.4));
  } };
  HEADS.knight = { c1: '#c9d3e6', draw: function (c, c2, x) {
    return K('M96,60 H104 V92 Q100,97 96,92Z', shade(c, -0.1), 2.8) + K('M100,46 C96,34 112,30 128,40 C118,40 114,46 106,50Z', '#ff5a6e', 2.8) + K('M60,82 C58,58 78,46 100,46 C122,46 142,58 140,82 C120,76 80,76 60,82Z', c, 3.4) +
      Q('M62,76 C84,70 116,70 138,76', x.gold, 3.6) + HL('M70,64 C74,56 82,52 92,50', 4) + gem(100, 62, 4.2, '#ff5a8a');
  } };
  HEADS.rainbowbow = { c1: '#ff6fd0', draw: function (c, c2, x) {
    return K('M100,58 L68,40 Q60,58 68,76Z', x.url('rb'), 3.2) + K('M100,58 L132,40 Q140,58 132,76Z', x.url('rb'), 3.2) + HL('M72,48 Q70,56 72,64', 2.6) + Ci(100, 58, 9, '#ffe27a', 3) + HL('M96,54 q2,-2 4,-1', 2);
  } };
  HEADS.laurel = { c1: '#4fbf6a', draw: function (c, c2, x) {
    var s = '';
    for (var i = 0; i < 6; i++) {
      var t = (i + 0.6) / 6.4, a = Math.PI * (0.98 - t * 0.62), px = 100 - Math.cos(a) * 49, py = 96 - Math.sin(a) * 52;
      var ang = r1(-(a * 180 / Math.PI) + 90 + 20);
      s += El(r1(px), r1(py), 8.4, 4.4, c, 2, ang) + El(r1(200 - px), r1(py), 8.4, 4.4, c, 2, r1(-ang));
    }
    return s + star5(100, 44, 8.4, '#ffe27a', 2.4);
  } };

  // ---------- 小物（手つき）— 次のパートで定義 ----------
  var PROPS = {};
  // ---------- 理科の小物 ----------
  function pg(x, y, inner) { return '<g transform="translate(' + x + ',' + y + ') scale(1)">' + inner + '</g>'; }
  PROPS.beaker = function (pc, x) {
    pc = pc || '#d68cff';
    return pg(144, 138,
      '<path d="M-19,-26 V8 C-19,22 -10,28 0,28 C10,28 19,22 19,8 V-26Z" fill="#fff" fill-opacity=".6"/>' +
      '<path d="M-19,-6 Q-10,-11 0,-6 T19,-6 V8 C19,22 10,28 0,28 C-10,28 -19,22 -19,8Z" fill="' + pc + '"/>' + Q('M-19,-6 Q-10,-11 0,-6 T19,-6', '#fff', 2.2, 0.75) +
      Ci(-8, 14, 2.6, '#fff', 0) + Ci(6, 8, 2, '#fff', 0) + Ci(9, 18, 2.8, '#fff', 0) +
      '<path d="M-19,-26 V8 C-19,22 -10,28 0,28 C10,28 19,22 19,8 V-26" fill="none" stroke="' + INK + '" stroke-width="3.8" stroke-linejoin="round"/>' +
      Rc(-24, -33, 48, 9, 4.5, '#fff', 3.4) + Q('M8,-17 h8 M11,-10 h5', INK, 2.4) + HL('M-12,-18 V0', 3.8) +
      bubble(-6, -46, 5) + bubble(8, -54, 3.4) + bubble(16, -44, 2.6) + x.paw(-16, 24, 1));
  };
  PROPS.tubes = function (pc, x) {
    var cols = pc ? [pc, '#ffe066', '#6ec5ff'] : ['#ff8fb6', '#ffe066', '#6ec5ff'], s = '';
    [[-16, 0, 14], [0, -8, 0], [16, 0, 14]].forEach(function (t, i) {
      var cx = t[0], top = -36 + t[1];
      s += '<path d="M' + (cx - 8) + ',' + top + ' V14 C' + (cx - 8) + ',26 ' + (cx + 8) + ',26 ' + (cx + 8) + ',14 V' + top + 'Z" fill="#fff" fill-opacity=".6"/>' +
        '<path d="M' + (cx - 8) + ',-2 H' + (cx + 8) + ' V14 C' + (cx + 8) + ',26 ' + (cx - 8) + ',26 ' + (cx - 8) + ',14Z" fill="' + cols[i] + '"/>' +
        '<path d="M' + (cx - 8) + ',' + top + ' V14 C' + (cx - 8) + ',26 ' + (cx + 8) + ',26 ' + (cx + 8) + ',14 V' + top + '" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linejoin="round"/>' +
        Rc(cx - 10, top - 3, 20, 6, 3, '#fff', 3) + HL('M' + (cx - 3.6) + ',' + (top + 8) + ' V8', 3);
    });
    return pg(140, 138, s + Rc(-30, 8, 60, 15, 6, '#e0a460', 3.2) + Q('M-25,13 H25', '#f6d49c', 2.4) + bubble(-12, -48, 4) + bubble(10, -52, 3) + x.paw(0, 26, 1));
  };
  PROPS.flask = function (pc, x) {
    pc = pc || '#7be09a';
    return pg(142, 138,
      '<path d="M-8,-34 V-14 C-30,-2 -26,30 0,30 C26,30 30,-2 8,-14 V-34Z" fill="#fff" fill-opacity=".6"/>' +
      '<path d="M-22,6 Q-11,1 0,6 T22,6 C24,24 12,30 0,30 C-12,30 -24,24 -22,6Z" fill="' + pc + '"/>' + Q('M-22,6 Q-11,1 0,6 T22,6', '#fff', 2.2, 0.75) + Ci(-6, 16, 2.6, '#fff', 0) + Ci(8, 20, 2, '#fff', 0) +
      '<path d="M-8,-34 V-14 C-30,-2 -26,30 0,30 C26,30 30,-2 8,-14 V-34" fill="none" stroke="' + INK + '" stroke-width="3.8" stroke-linejoin="round"/>' +
      Rc(-11, -39, 22, 8, 4, '#fff', 3.2) + HL('M-17,2 C-19,10 -16,18 -11,22', 3.6) +
      bubble(-4, -50, 4.6) + bubble(8, -56, 3) + x.paw(-18, 22, 1));
  };
  PROPS.lens = function (pc, x) {
    pc = pc || '#ff9a3c';
    x.defs.push('<radialGradient id="' + x.P + 'lg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f2fdff"/><stop offset=".7" stop-color="#a6e6f6"/><stop offset="1" stop-color="#6cc4e4"/></radialGradient>');
    return pg(136, 124, Q('M12,14 L26,32', INK, 15) + Q('M12,14 L26,32', '#a8683a', 10.4) + Q('M14,15 L22,25', '#d9985e', 3.6) +
      Ci(0, 0, 26, pc, 3.4) + Ci(0, 0, 19, x.url('lg'), 2.6) + HL('M-12,-6 Q-8,-14 0,-16', 4) + Ci(9, 9, 2.2, '#fff', 0) + x.paw(16, 28, 1));
  };
  PROPS.magnet = function (pc, x) {
    var d = 'M-18,26 V-4 A18,18 0 0 1 18,-4 V26';
    return pg(137, 131, Q(d, INK, 25) + Q('M-18,26 V-4 A18,18 0 0 1 0,-22', pc || '#ff5a6e', 18) + Q('M0,-22 A18,18 0 0 1 18,-4 V26', '#4a90f0', 18) +
      '<path d="M-18,14 V26 M18,14 V26" stroke="' + INK + '" stroke-width="22" stroke-linecap="butt" fill="none"/><path d="M-18,15 V25 M18,15 V25" stroke="#eef2fa" stroke-width="18" stroke-linecap="butt" fill="none"/>' +
      HL('M-22,-4 C-22,-14 -14,-22 -6,-25', 3.4) + Q('M32,-14 l8,-6 M34,-4 h9', '#ffe066', 3.4) + x.paw(0, 30, 1));
  };
  PROPS.sprout = function (pc, x) {
    return pg(142, 140, '<path d="M0,2 V-12" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/><path d="M0,2 V-12" stroke="#4fbf6a" stroke-width="5" stroke-linecap="round"/>' +
      K('M0,-12 C-8,-34 -30,-34 -34,-24 C-28,-12 -10,-8 0,-12Z', '#6fd47a', 3.2) + K('M0,-16 C8,-42 32,-44 36,-32 C30,-18 10,-12 0,-16Z', '#52c26a', 3.2) +
      Q('M-4,-14 C-14,-20 -22,-24 -28,-25 M4,-18 C14,-26 22,-32 30,-34', '#2f8a4a', 2) + HL('M-24,-29 Q-18,-31 -12,-28', 2.4) +
      K('M-22,4 H22 L17,32 H-17Z', '#e0875a', 3.2) + Rc(-25, -2, 50, 11, 4, '#f0a074', 3.2) + HL('M-18,16 V26', 3) + star4(30, -48, 5, '#ffe066', INK) + x.paw(0, 28, 1));
  };

  // ---------- 社会の小物 ----------
  var LAND = '<path d="M80,152 C84,142 96,142 100,148 C104,153 94,156 92,162 C90,168 82,164 80,152Z M104,166 C112,160 122,164 120,172 C118,180 108,180 104,174Z M108,146 C114,144 120,148 116,152Z" fill="#6cc46a" stroke="#2f7a46" stroke-width="1.6" stroke-linejoin="round"/>';
  PROPS.globe = function (pc, x) {
    x.defs.push('<radialGradient id="' + x.P + 'gg" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="#9fe0ff"/><stop offset="1" stop-color="' + (pc || '#2f84d4') + '"/></radialGradient><clipPath id="' + x.P + 'gc"><circle cx="100" cy="164" r="25"/></clipPath>');
    return '<g clip-path="' + x.url('gc') + '"><circle cx="100" cy="164" r="25" fill="' + x.url('gg') + '"/>' + Gp('translate(0,3) scale(1.1 1.1) translate(-10,-14)', LAND) + '<path d="M100,164 A25,25 0 0 0 122,180 A25,25 0 0 1 78,180Z" fill="#1c4f9a" fill-opacity=".22"/></g>' +
      Ci(100, 164, 25, 'none', 3.8) + HL('M82,154 A21,21 0 0 1 97,145', 4) + x.paw(72, 172, 1) + x.paw(128, 172, 1);
  };
  PROPS.map = function (pc, x) {
    var s = K('M60,157 L84,152 V178 L60,182Z', '#fff0c4', 3) + K('M84,152 L116,152 V178 L84,178Z', '#ffe29a', 3) + K('M116,152 L140,157 V182 L116,178Z', '#fff0c4', 3);
    s += Q('M65,166 q4,-4 8,0 t8,0 M65,174 q4,-4 8,0 t8,0', '#6ec5ff', 2.4) + '<path d="M66,160 C72,157 79,159 79,162 C79,165 70,165 66,163Z" fill="#7ccc7c" stroke="#2f7a46" stroke-width="1.4"/>' +
      Q('M90,172 C95,164 101,172 106,160', '#ff5f7a', 2.6).replace('stroke-linecap="round"', 'stroke-linecap="round" stroke-dasharray="4 3.4"') + Q('M104,158 l7,7 m0,-7 l-7,7', '#e8394f', 3.2) + Ci(91, 173, 2.8, '#fff', 1.8) +
      '<path d="M120,172 C124,164 132,166 137,161 L137,176 L120,175Z" fill="#7ccc7c" stroke="#2f7a46" stroke-width="1.4"/>' + star5(128, 168, 4.4, '#ffd84d', 1.4) + HL('M64,155 L80,152', 2.6);
    return s + x.paw(66, 172, 1) + x.paw(134, 172, 1);
  };
  PROPS.compass = function (pc, x) {
    return pg(142, 140, Ci(0, 0, 27, '#ffd23f', 3.4) + Ci(0, 0, 20, '#fffdf6', 2.6) + Q('M0,-20 V-15 M0,20 V15 M-20,0 H-15 M20,0 H15', INK, 2.4) + K('M0,-16 L5,0 L0,16 L-5,0Z', '#fff', 1.8) + '<path d="M0,-16 L5,0 L-5,0Z" fill="#ff4a6a" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>' + Ci(0, 0, 2.6, INK, 0) +
      Gp('rotate(32)', Rc(-3.6, -36, 7.2, 10, 3, '#ffd23f', 2.4)) + HL('M-18,-10 Q-14,-18 -6,-21', 3.2) + x.paw(-16, 24, 1));
  };
  PROPS.flag = function (pc, x) {
    var fc = pc || '#ff4a5e';
    return Q('M146,100 V170', INK, 7.4) + Q('M146,100 V170', '#c8923a', 4) + Ci(146, 98, 4.6, '#ffd23f', 2.4) +
      '<path d="M148,104 C158,98 168,110 182,104 L182,132 C168,138 158,126 148,132Z" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' + Ci(165, 118, 8.4, fc, 0) + HL('M152,108 Q158,106 163,108', 2.4) + x.paw(146, 160, 1);
  };
  PROPS.telescope = function (pc, x) {
    x.defs.push('<radialGradient id="' + x.P + 'tl" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f2fdff"/><stop offset=".6" stop-color="#8fdcf2"/><stop offset="1" stop-color="#3a86d0"/></radialGradient>');
    var c = pc || '#e8504f';
    return pg(134, 148, Gp('rotate(-38)', Rc(-42, -7, 22, 14, 5, '#3a4a8a', 3.2) + Rc(-24, -11, 24, 22, 4, c, 3.2) + Rc(-4, -15, 24, 30, 4, '#ffd23f', 3.2) + Rc(18, -18, 22, 36, 5, c, 3.2) + Q('M-14,-8 V8', '#fff', 3, 0.8) + Q('M6,-12 V12', '#fff', 3, 0.8) +
      El(41, 0, 7, 17, '#ffd23f', 3.2) + El(41, 0, 4, 12, x.url('tl'), 2.2) + Q('M39,-7 V-2', '#fff', 2.4)) + x.paw(-6, 26, 1));
  };
  PROPS.binoculars = function (pc, x) {
    x.defs.push('<radialGradient id="' + x.P + 'bn" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e6fbff"/><stop offset=".6" stop-color="#8fdcf2"/><stop offset="1" stop-color="#4a8ed6"/></radialGradient>');
    var c = pc || '#3a4a8a', s = Rc(72, 146, 18, 10, 4, shade(c, -0.2), 2.8) + Rc(110, 146, 18, 10, 4, shade(c, -0.2), 2.8) + Rc(84, 160, 32, 12, 4, shade(c, -0.1), 2.8);
    [80, 120].forEach(function (cx) { s += Ci(cx, 168, 19, c, 3.4) + Ci(cx, 168, 12.4, x.url('bn'), 2.6) + HL('M' + (cx - 7) + ',165 Q' + (cx - 4) + ',160 ' + cx + ',159', 3) + Ci(cx + 4, 173, 1.6, '#fff', 0); });
    return s + x.paw(68, 172, 0.9) + x.paw(132, 172, 0.9);
  };
  // ---------- 国語の小物 ----------
  PROPS.book = function (pc, x) {
    var c = pc || '#7a68ff';
    return Gp('translate(0,-3)', K('M58,154 Q79,147 100,154 Q121,147 142,154 L142,182 Q121,175 100,182 Q79,175 58,182Z', c, 3.4) + K('M63,152 Q82,146 99,152 L99,177 Q82,171 63,177Z', '#fffdf6', 2.8) + K('M101,152 Q118,146 137,152 V177 Q118,171 101,177Z', '#fff6e4', 2.8) +
      Q('M69,159 Q82,154 93,159 M69,165 Q82,160 93,165 M69,171 Q80,167 88,171 M108,160 Q119,155 131,160', '#c4aee8', 2.4) + heart(120, 169, 5, '#ff8fb6', 1.8) + HL('M66,155 Q76,151 88,153', 2.6)) + x.paw(66, 172, 1) + x.paw(134, 172, 1);
  };
  PROPS.pencil = function (pc, x) {
    var c = pc || '#ffd23f';
    return pg(152, 132, Gp('rotate(24)', K('M-9,-28 L0,-52 L9,-28Z', '#f6d3a2', 3.2) + K('M-3.6,-42 L0,-52 L3.6,-42Z', INK, 1.6) + Rc(-10, -28, 20, 58, 3, c, 3.2) + Q('M-3,-26 V28', shade(c, 0.45), 3) + Q('M4,-26 V28', shade(c, -0.25), 3) + Rc(-10, 28, 20, 9, 2, '#cfd6e6', 2.8) + Rc(-10, 36, 20, 12, 5, '#ff8fb6', 3.2)) + x.paw(-8, 24, 1));
  };
  PROPS.brush = function (pc, x) {
    return pg(152, 134, Gp('rotate(24)', K('M-9,-12 C-10,-36 -3,-50 0,-56 C3,-50 10,-36 9,-12Z', '#2e2a3e', 3.2) + HL('M-4,-24 Q-3,-36 0,-44', 2.6) + Rc(-8, -12, 16, 10, 2, '#ffd23f', 3) + Rc(-6, -2, 12, 56, 4, pc || '#e8c07a', 3.2) + Q('M-6,18 H6 M-6,34 H6', '#a8742c', 2.6) + HL('M-2.4,2 V50', 2.4)) + x.paw(-8, 26, 1));
  };
  PROPS.scroll = function (pc, x) {
    var c = pc || '#e0a460';
    return K('M66,155 H134 V179 H66Z', '#fff6e0', 3) + Q('M74,163 q4,5 8,0 t8,0 t8,0 M74,172 h14 M100,172 h14', '#3a3350', 2.6) + star4(122, 164, 4, '#ff5a7e') +
      Rc(56, 148, 16, 34, 8, c, 3.2) + Rc(128, 148, 16, 34, 8, c, 3.2) + HL('M62,154 V172', 2.6) + HL('M134,154 V172', 2.6) + x.paw(66, 172, 1) + x.paw(134, 172, 1);
  };
  PROPS.dict = function (pc, x) {
    var c = pc || '#e8504f';
    return Gp('rotate(-4 100 168)', K('M70,154 H134 V186 H70Z', '#fffdf6', 3) + K('M64,150 Q64,148 68,148 H128 Q132,148 132,152 V182 Q132,184 128,184 H68 Q64,184 64,180Z', c, 3.4) + Rc(78, 157, 40, 14, 3, '#fff6dc', 2.6) + Q('M84,162 h28 M84,167 h18', '#a8742c', 2.4) + star4(120, 176, 5, '#ffe27a', INK) + Q('M70,150 V184', shade(c, -0.3), 3, 0.6) + HL('M74,152 H110', 2.6)) + x.paw(70, 173, 1) + x.paw(130, 173, 1);
  };
  PROPS.paper = function (pc, x) {
    var g = '';
    for (var i = 1; i < 4; i++) g += 'M' + (-26 + i * 13) + ',-34 V32 ';
    for (var j = 1; j < 5; j++) g += 'M-26,' + (-34 + j * 13.2) + ' H26 ';
    var hana = '';
    for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; hana += Ci(r1(14 + Math.cos(a) * 7), r1(-20 + Math.sin(a) * 7), 4.6, '#fff', 0).replace('fill="#fff"', 'fill="none" stroke="#ff4a6a" stroke-width="2.2"'); }
    return pg(137, 135, Gp('rotate(-8)', K('M-24,-32 H24 V30 H-24Z', '#fffdf6', 3.2) + Q(g, pc || '#7bd49a', 1.8, 0.9) + Q('M-20,-26 q4,6 8,0 M-20,-12 q6,-4 8,2 q-2,6 -8,3', '#3a3350', 2.4) + hana + Ci(14, -20, 3.4, '#ff4a6a', 0) + HL('M-24,-32 H20', 2.2)) + x.paw(-14, 30, 1));
  };
  // ---------- キラの小物 ----------
  PROPS.scepter = function (pc, x) {
    return pg(146, 136, Gp('rotate(18)', Q('M0,-6 V40', INK, 10.6) + Q('M0,-6 V40', x.gold, 6.4) + Ci(0, -22, 16, x.gold, 3.4) + Ci(0, -22, 9.4, '#ff5a8a', 2.4) + Ci(-3, -25, 2.6, '#fff', 0) + Rc(-9, 4, 18, 6, 3, x.gold, 2.6) + star4(18, -40, 6, '#fff', '#d9941a')) + x.paw(0, 26, 1));
  };
  PROPS.starwand = function (pc, x) {
    return pg(146, 138, Gp('rotate(18)', Q('M0,0 V40', INK, 9.6) + Q('M0,0 V40', pc || '#ff8fc0', 5.6) + star5(0, -18, 24, x.gold, 3.2) + Q('M-8,-26 Q-5,-32 0,-34', '#fff', 3, 0.9) + Rc(-6, 4, 12, 5, 2.4, x.gold, 2.4)) + star4(26, -40, 6, '#fff', '#d9941a') + star4(-22, -30, 5, '#fff7c0', '#d9941a') + x.paw(0, 28, 1));
  };
  PROPS.heartwand = function (pc, x) {
    return pg(146, 138, Gp('rotate(16)', Q('M0,0 V40', INK, 9.6) + Q('M0,0 V40', '#ffffff', 5.6) + heart(0, -22, 16, pc || '#ff6fa8', 3.2) + Q('M-12,-30 Q-9,-36 -3,-36', '#fff', 3, 0.9) + K('M-8,2 C-26,-6 -26,-18 -18,-18 C-12,-12 -10,-6 -8,2Z', '#fff', 2.4) + K('M8,2 C26,-6 26,-18 18,-18 C12,-12 10,-6 8,2Z', '#fff', 2.4)) + star4(28, -40, 5.4, '#fff', '#d9941a') + x.paw(0, 28, 1));
  };
  PROPS.bigstar = function (pc, x) {
    return star5(100, 166, 27, x.gold, 3.6) + Q('M88,160 Q92,152 100,148', '#fff', 3.6, 0.9) + star4(132, 148, 6, '#fff', '#d9941a') + x.paw(72, 172, 1) + x.paw(128, 172, 1);
  };
  PROPS.starflag = function (pc, x) {
    return Q('M146,98 V170', INK, 7.4) + Q('M146,98 V170', x.gold, 4) + Ci(146, 96, 4.6, '#ffd23f', 2.4) +
      '<path d="M148,102 C158,96 168,108 182,102 L182,130 C168,136 158,124 148,130Z" fill="#4a90f0" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' + star5(165, 116, 8.4, '#ffe27a', 1.8) + x.paw(146, 160, 1);
  };
  PROPS.magicwand = function (pc, x) {
    return pg(146, 138, Gp('rotate(32)', Rc(-6, -36, 12, 72, 5, '#2c2a46', 3.2) + Rc(-6, -36, 12, 16, 5, '#fff', 3.2) + Rc(-6, 22, 12, 14, 5, '#fff', 3.2) + HL('M-2,-14 V16', 2.2)) + star4(-20, -44, 8, '#ffe27a', INK) + star4(18, -50, 6, '#fff', '#d9941a') + star4(30, -28, 5, '#ffe27a', INK) + x.paw(6, 18, 1));
  };
  PROPS.shield = function (pc, x) {
    return pg(142, 140, K('M-24,-32 H24 V6 C24,24 10,32 0,38 C-10,32 -24,24 -24,6Z', pc || '#4a90f0', 3.6) + Q('M-18,-26 H18 V5 C18,19 8,26 0,31 C-8,26 -18,19 -18,5Z', '#ffd23f', 2.6) + star5(0, -2, 13, '#fff', 2.4) + HL('M-14,-24 V-6', 3) + x.paw(-18, 28, 1));
  };
  PROPS.crystal = function (pc, x) {
    x.defs.push('<radialGradient id="' + x.P + 'cr" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#d6b8ff"/><stop offset="1" stop-color="#6a4ad0"/></radialGradient>');
    return K('M82,184 L88,176 H112 L118,184Z', '#ffd23f', 3) + Ci(100, 162, 22, x.url('cr'), 3.6) + star4(94, 166, 6, '#fff') + star4(108, 156, 4.6, '#ffe27a') + HL('M86,152 A18,18 0 0 1 98,145', 4) + x.paw(72, 172, 1) + x.paw(128, 172, 1);
  };
  PROPS.trophy = function (pc, x) {
    return pg(142, 138, Q('M-18,-18 C-34,-18 -32,2 -16,4 M18,-18 C34,-18 32,2 16,4', INK, 9) + Q('M-18,-18 C-34,-18 -32,2 -16,4 M18,-18 C34,-18 32,2 16,4', x.gold, 5) +
      K('M-19,-30 H19 V-8 C19,8 8,14 0,14 C-8,14 -19,8 -19,-8Z', x.gold, 3.4) + Rc(-5, 12, 10, 14, 2, x.gold, 3) + Rc(-16, 25, 32, 10, 4, '#e8a010', 3.2) + star5(0, -13, 9, '#fff', 2) + HL('M-12,-26 V-6', 3) + x.paw(-20, 30, 1));
  };

  // =====================================================================
  // カタログ（全54枚）。毛色×表情×頭の小物×衣装×手持ちの組合せ
  // =====================================================================
  var CAT = [];
  function E(id, subject, name, opts) { CAT.push({ id: id, subject: subject, name: name, opts: opts }); }
  function sci(o) { o.bg = 'sci'; return o; }
  function soc(o) { o.bg = 'soc'; return o; }
  function jpn(o) { o.bg = 'jpn'; return o; }
  function kr(o) { o.bg = 'kira'; o.kira = true; return o; }
  // 理科 15
  E('rika-01', 'rika', 'はかせ白ねこ',           sci({ fur: 'shiro',   face: 'smile',    head: 'goggles', outfit: 'coat', prop: 'beaker', pc: '#d68cff' }));
  E('rika-02', 'rika', 'けんきゅういん黒ねこ',   sci({ fur: 'kuro',    face: 'surprise', head: 'goggles', hc: '#ffd23f', hc2: '#e8405a', outfit: 'coat', tie: 'long', tc: '#4a90f0', prop: 'tubes' }));
  E('rika-03', 'rika', 'じっけん茶トラ',         sci({ fur: 'chatora', face: 'wink',     head: 'goggles', hc: '#ff6fa8', hc2: '#9a6ae0', outfit: 'coat', tc: '#ffd23f', prop: 'flask' }));
  E('rika-04', 'rika', 'むしめがねキジねこ',     sci({ fur: 'kiji',    face: 'sparkle',  head: 'mirror',  outfit: 'coat', tie: 'long', tc: '#e8405a', prop: 'lens' }));
  E('rika-05', 'rika', 'じしゃく三毛ねこ',       sci({ fur: 'mike',    face: 'happy',    head: 'goggles', hc: '#4a90f0', hc2: '#ff8a3d', outfit: 'coat', bc: '#dff7ef', prop: 'magnet' }));
  E('rika-06', 'rika', 'めばえハチワレ',         sci({ fur: 'hachi',   face: 'closed',   head: 'goggles', hc: '#6fd47a', hc2: '#ff6fa8',    outfit: 'coat', tie: 'none', badge: true, pocket: false, prop: 'sprout' }));
  E('rika-07', 'rika', 'じょしゅグレーねこ',     sci({ fur: 'gray',    face: 'smile',    head: 'goggles', hc: '#6fd47a', hc2: '#3b9fbe', outfit: 'coat', tie: 'long', tc: '#a98cff', prop: 'beaker', pc: '#6ec5ff' }));
  E('rika-08', 'rika', 'ひらめきクリームねこ',   sci({ fur: 'cream',   face: 'surprise', head: 'goggles', hc: '#a98cff', hc2: '#ffd23f',  outfit: 'coat', oc: '#ffb3d0', tc: '#4a90f0', prop: 'tubes', pc: '#ffa23a' }));
  E('rika-09', 'rika', 'しろくろ博士ねこ',       sci({ fur: 'tuxedo',  face: 'wink',     head: 'goggles', hc: '#ff5a6e', hc2: '#2a3f8a', outfit: 'coat', bc: '#ffe6f0', tc: '#ff6b8b', prop: 'flask', pc: '#ffd23f' }));
  E('rika-10', 'rika', 'げんき茶ねこ',           sci({ fur: 'chairo',  face: 'happy',    head: 'lamp',    hc: '#ff8f3a', outfit: 'coat', bc: '#dbeeff', tie: 'long', tc: '#ffd23f', prop: 'lens', pc: '#4a90f0' }));
  E('rika-11', 'rika', 'じしゃく先生白ねこ',     sci({ fur: 'shiro',   face: 'closed',   head: 'goggles', hc: '#e8eef8', hc2: '#4a90f0',  outfit: 'coat', oc: '#ffd0e0', tc: '#ffd23f', prop: 'magnet', pc: '#4acf8a' }));
  E('rika-12', 'rika', 'めばえ黒ねこ',           sci({ fur: 'kuro',    face: 'smile',    head: 'goggles', hc: '#ff7a3a', hc2: '#e8405a', outfit: 'coat', tie: 'long', tc: '#ffe27a', badge: true, pocket: false, prop: 'sprout' }));
  E('rika-13', 'rika', 'しけんかんキジねこ',     sci({ fur: 'kiji',    face: 'surprise', head: 'goggles', hc: '#4a90f0', hc2: '#ff8a3d', outfit: 'coat', tc: '#ff6b8b', prop: 'tubes', pc: '#7be0a0' }));
  E('rika-14', 'rika', 'フラスコ三毛ねこ',       sci({ fur: 'mike',    face: 'sparkle',  head: 'goggles', hc: '#ffd23f', hc2: '#3b9fbe',    outfit: 'coat', oc: '#ffe27a', tie: 'none', badge: true, pocket: false, prop: 'flask', pc: '#ff8fb6' }));
  E('rika-15', 'rika', 'むしめがねグレーねこ',   sci({ fur: 'gray',    face: 'wink',     head: 'goggles', outfit: 'coat', bc: '#fff0f6', tc: '#e8405a', prop: 'lens', pc: '#ff6fa8' }));
  // 社会 15
  E('shakai-01', 'shakai', 'たんけん茶トラ',           soc({ fur: 'chatora', face: 'smile',    head: 'explorer', outfit: 'jacket', prop: 'globe' }));
  E('shakai-02', 'shakai', 'ちずたいちょう白ねこ',     soc({ fur: 'shiro',   face: 'wink',     head: 'helmet',   outfit: 'zip', prop: 'map' }));
  E('shakai-03', 'shakai', 'せんちょう黒ねこ',         soc({ fur: 'kuro',    face: 'surprise', head: 'captain',  outfit: 'captain', prop: 'telescope' }));
  E('shakai-04', 'shakai', 'はたふり三毛ねこ',         soc({ fur: 'mike',    face: 'happy',    head: 'straw',    outfit: 'vestG', prop: 'flag' }));
  E('shakai-05', 'shakai', 'こうじょう見学キジねこ',   soc({ fur: 'kiji',    face: 'sparkle',  head: 'hard',     outfit: 'zip', oc: '#ffb03a', tc: '#ffffff', prop: 'compass' }));
  E('shakai-06', 'shakai', 'そうがんきょうグレーねこ', soc({ fur: 'gray',    face: 'closed',   head: 'explorer', hc: '#7fc27a', hc2: '#ffd23f', outfit: 'jacket', oc: '#6fbf6a', tc: '#ffd23f', prop: 'binoculars' }));
  E('shakai-07', 'shakai', 'ちきゅうぎハチワレ',       soc({ fur: 'hachi',   face: 'smile',    head: 'helmet',   hc: '#e8f6ff', outfit: 'jacket', oc: '#e8504f', tc: '#ffd23f', prop: 'globe', pc: '#3aa8d8' }));
  E('shakai-08', 'shakai', 'ちずめいじんクリームねこ', soc({ fur: 'cream',   face: 'surprise', head: 'straw',    hc: '#ffd0e0', hc2: '#4a90f0', outfit: 'zip', oc: '#ff8fb6', prop: 'map' }));
  E('shakai-09', 'shakai', 'みどりの船長くつしたねこ', soc({ fur: 'tuxedo',  face: 'wink',     head: 'captain',  hc2: '#2a8a6a', outfit: 'captain', oc: '#2a8a6a', tc: '#ffd23f', prop: 'binoculars', pc: '#2a8a6a' }));
  E('shakai-10', 'shakai', 'たびびと茶ねこ',           soc({ fur: 'chairo',  face: 'happy',    head: 'straw',    hc2: '#4a90f0', outfit: 'vestG', oc: '#ffb03a', tc: '#4a90f0', prop: 'compass' }));
  E('shakai-11', 'shakai', 'はくぶつかん白ねこ',       soc({ fur: 'shiro',   face: 'closed',   head: 'explorer', hc: '#7fc27a', hc2: '#ffd23f', outfit: 'zip', oc: '#6fbf6a', tc: '#ffd23f', prop: 'globe' }));
  E('shakai-12', 'shakai', 'ちずハンター黒ねこ',       soc({ fur: 'kuro',    face: 'sparkle',  head: 'hard',     hc: '#ff8f3a', outfit: 'jacket', oc: '#8a8aa8', tc: '#ffd23f', prop: 'map' }));
  E('shakai-13', 'shakai', 'ぼうえんきょうキジねこ',   soc({ fur: 'kiji',    face: 'surprise', head: 'explorer', hc: '#d9a860', hc2: '#4a7ae0', outfit: 'vestG', oc: '#4a9ee8', tc: '#ffd23f', prop: 'telescope' }));
  E('shakai-14', 'shakai', 'じしんばん三毛ねこ',       soc({ fur: 'mike',    face: 'wink',     head: 'helmet',   hc: '#d9f0e0', hc2: '#e8504f', outfit: 'zip', oc: '#a98cff', tc: '#ffe27a', prop: 'compass' }));
  E('shakai-15', 'shakai', 'にほんいっしゅうグレーねこ', soc({ fur: 'gray',  face: 'happy',    head: 'straw',    outfit: 'jacket', oc: '#e8b95a', tc: '#4a90f0', prop: 'flag' }));
  // 国語 15
  E('kokugo-01', 'kokugo', 'ぶんがくクリームねこ', jpn({ fur: 'cream',   face: 'smile',    head: 'round',  outfit: 'sailor', prop: 'book' }));
  E('kokugo-02', 'kokugo', 'えんぴつハチワレ',     jpn({ fur: 'hachi',   face: 'wink',     head: 'square', outfit: 'cardigan', prop: 'pencil' }));
  E('kokugo-03', 'kokugo', 'しょどうかくつしたねこ', jpn({ fur: 'tuxedo', face: 'surprise', head: 'cat',    outfit: 'vestY', prop: 'brush' }));
  E('kokugo-04', 'kokugo', 'まきもの茶ねこ',       jpn({ fur: 'chairo',  face: 'happy',    head: 'beret',  glass: 'round', gc: '#7a68d8', outfit: 'smock', prop: 'scroll' }));
  E('kokugo-05', 'kokugo', 'じしょ博士白ねこ',     jpn({ fur: 'shiro',   face: 'sparkle',  head: 'mortar', glass: 'square', gc: '#e8506c', outfit: 'sailor', prop: 'dict' }));
  E('kokugo-06', 'kokugo', 'はなまる三毛ねこ',     jpn({ fur: 'mike',    face: 'closed',   head: 'big',    outfit: 'cardigan', prop: 'paper' }));
  E('kokugo-07', 'kokugo', 'どくしょキジねこ',     jpn({ fur: 'kiji',    face: 'smile',    head: 'round',  hc: '#46b886', outfit: 'sailor', oc: '#2a8a6a', prop: 'book', pc: '#ff8fb6' }));
  E('kokugo-08', 'kokugo', 'さっか黒ねこ',         jpn({ fur: 'kuro',    face: 'wink',     head: 'beret',  hc: '#4a7ae0', glass: 'cat', gc: '#ffd23f', outfit: 'vestY', prop: 'pencil', pc: '#ff8fb6' }));
  E('kokugo-09', 'kokugo', 'ことばグレーはかせ',   jpn({ fur: 'gray',    face: 'surprise', head: 'mortar', glass: 'round', gc: '#7a68d8', outfit: 'cardigan', oc: '#a8d4ff', prop: 'dict', pc: '#4aa8a0' }));
  E('kokugo-10', 'kokugo', 'ふでまめ茶トラ',       jpn({ fur: 'chatora', face: 'happy',    head: 'bow',    glass: 'big', gc: '#ff6f9c', outfit: 'smock', oc: '#ff8f6a', prop: 'brush' }));
  E('kokugo-11', 'kokugo', 'まきもの白ねこ',       jpn({ fur: 'shiro',   face: 'closed',   head: 'pencilEar', glass: 'square', gc: '#33284a', outfit: 'sailor', oc: '#c8506a', prop: 'scroll', pc: '#7ac8e8' }));
  E('kokugo-12', 'kokugo', 'ぶんごうクリームねこ', jpn({ fur: 'cream',   face: 'wink',     head: 'big',    hc: '#4a7ae0', outfit: 'vestY', oc: '#9fd4ff', prop: 'book', pc: '#e8504f' }));
  E('kokugo-13', 'kokugo', 'おしゃれハチワレ',     jpn({ fur: 'hachi',   face: 'sparkle',  head: 'bow',    glass: 'cat', gc: '#7a68d8', outfit: 'cardigan', oc: '#c8b8ff', prop: 'paper' }));
  E('kokugo-14', 'kokugo', 'しじんくつしたねこ',   jpn({ fur: 'tuxedo',  face: 'closed',   head: 'beret',  hc: '#4cc0a0', glass: 'square', gc: '#ff6f9c', outfit: 'smock', oc: '#ff9ac0', prop: 'pencil' }));
  E('kokugo-15', 'kokugo', 'じしょ三毛ねこ',       jpn({ fur: 'mike',    face: 'smile',    head: 'round',  hc: '#ff9a3c', outfit: 'sailor', oc: '#3aa8a0', prop: 'dict' }));
  // キラ 9（金フチ＋きらきら。教科混合の特別衣装）
  E('kira-01', 'kira', 'きんの王さま白ねこ',       kr({ fur: 'shiro',   face: 'smile',    head: 'crown',      outfit: 'cape',     prop: 'scepter' }));
  E('kira-02', 'kira', 'まほうつかい黒ねこ',       kr({ fur: 'kuro',    face: 'wink',     head: 'wizard',     outfit: 'robe',     prop: 'starwand', pc: '#7ac8ff' }));
  E('kira-03', 'kira', 'おひめさまクリームねこ',   kr({ fur: 'cream',   face: 'happy',    head: 'tiara',      outfit: 'dress',    prop: 'heartwand' }));
  E('kira-04', 'kira', 'てんし三毛ねこ',           kr({ fur: 'mike',    face: 'closed',   head: 'halo',       outfit: 'toga',     prop: 'bigstar' }));
  E('kira-05', 'kira', 'うちゅうひこうしグレー',   kr({ fur: 'gray',    face: 'sparkle',  head: 'astro',      outfit: 'space',    prop: 'starflag' }));
  E('kira-06', 'kira', 'マジシャンハチワレ',       kr({ fur: 'hachi',   face: 'surprise', head: 'tophat',     outfit: 'tux',      prop: 'magicwand' }));
  E('kira-07', 'kira', 'きし茶トラ',               kr({ fur: 'chatora', face: 'smile',    head: 'knight',     outfit: 'armor',    prop: 'shield' }));
  E('kira-08', 'kira', 'にじいろくつしたねこ',     kr({ fur: 'tuxedo',  face: 'wink',     head: 'rainbowbow', outfit: 'rainbow',  prop: 'crystal' }));
  E('kira-09', 'kira', 'チャンピオンキジねこ',     kr({ fur: 'kiji',    face: 'happy',    head: 'laurel',     outfit: 'champion', prop: 'trophy' }));
  var STICKER_CATALOG = CAT;

  return { makeCatSticker: makeCatSticker, STICKER_CATALOG: STICKER_CATALOG, FURS: FURS, FACES: FACES, HEADS: HEADS, OUTFITS: OUTFITS, PROPS: PROPS };
});
