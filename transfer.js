/* ============================================================
   transfer.js — きろくの書き出し／よみこみ（旧Artifact → 新GAS の引っ越し用）
   旧版と新版は別オリジンで localStorage を共有できないため、
   kq-* キーを丸ごと JSON → UTF-8 → base64 のテキストにして、手でコピペして移す。

   形式: "KQ1:" + base64( JSON {format:"kq-export-v1", exportedAt, sum, keys:{key:string,...}} )
   sum  : keys を JSON にした文字列の FNV-1a(32bit) 16進。貼り付けの欠け・文字化けを検出する。
   端末ID(kq-hub-v1-device)は端末固有なので書き出しにも取り込みにも含めない。
   純関数（storage は getItem/setItem/removeItem/key/length を持つものを渡す）。
   UMD: window.KQTransfer / module.exports
   ============================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KQTransfer = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var PREFIX = "KQ1:";
  var FORMAT = "kq-export-v1";
  var DEVICE_KEY = "kq-hub-v1-device";
  var MAX_CHARS = 3000000;             // 貼り付け文字数の上限
  var JSON_KEYS = {                    // 値がJSONであるべき既知のキー
    "kq-hub-v1-stats": 1, "kq-hub-v2-stickers-seen": 1, "kq-hub-v3-legacy": 1, "kq-hub-v4-frozen": 1,
    "kq-rika-weak-summary-v1": 1, "kq-shakai-weak-summary-v1": 1, "kq-kokugo-weak-summary-v1": 1,
    "kq-shakai-region-play-v1": 1
  };

  function fnv(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16);
  }

  // ---- base64（UTF-8対応。btoa/atob と Buffer のどちらでも動く） ----
  function utf8Bytes(str) {
    var out = [], i, c;
    str = unescape(encodeURIComponent(str));
    for (i = 0; i < str.length; i++) { c = str.charCodeAt(i); out.push(c); }
    return out;
  }
  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function b64enc(str) {
    var b = utf8Bytes(str), out = "", i;
    for (i = 0; i < b.length; i += 3) {
      var n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0);
      out += B64.charAt((n >> 18) & 63) + B64.charAt((n >> 12) & 63) +
             (i + 1 < b.length ? B64.charAt((n >> 6) & 63) : "=") +
             (i + 2 < b.length ? B64.charAt(n & 63) : "=");
    }
    return out;
  }
  function b64dec(text) {
    var clean = text.replace(/[\s　]+/g, "");
    if (!clean || clean.length % 4 !== 0 || !/^[A-Za-z0-9+\/]+={0,2}$/.test(clean)) throw new Error("base64");
    var bytes = "", i;
    for (i = 0; i < clean.length; i += 4) {
      var a = B64.indexOf(clean.charAt(i)), b = B64.indexOf(clean.charAt(i + 1));
      var c = clean.charAt(i + 2) === "=" ? 0 : B64.indexOf(clean.charAt(i + 2));
      var d = clean.charAt(i + 3) === "=" ? 0 : B64.indexOf(clean.charAt(i + 3));
      var n = (a << 18) | (b << 12) | (c << 6) | d;
      bytes += String.fromCharCode((n >> 16) & 255);
      if (clean.charAt(i + 2) !== "=") bytes += String.fromCharCode((n >> 8) & 255);
      if (clean.charAt(i + 3) !== "=") bytes += String.fromCharCode(n & 255);
    }
    return decodeURIComponent(escape(bytes));
  }

  function keysOf(storage) {
    var ks = [], n = 0, i, k;
    try { n = storage.length; } catch (e) { n = 0; }
    for (i = 0; i < n; i++) {
      try { k = storage.key(i); } catch (e) { k = null; }
      if (typeof k === "string" && k.indexOf("kq-") === 0 && k !== DEVICE_KEY && k !== "kq-hub-probe") ks.push(k);
    }
    return ks.sort();
  }

  /** storage の全 kq-* キー → 書き出しテキスト */
  function encode(storage, now) {
    var keys = {};
    keysOf(storage).forEach(function (k) {
      var v = storage.getItem(k);
      if (typeof v === "string") keys[k] = v;
    });
    var keysJson = JSON.stringify(keys);
    var payload = {
      format: FORMAT,
      exportedAt: (now || new Date()).toISOString(),
      sum: fnv(keysJson),
      keys: keys
    };
    return PREFIX + b64enc(JSON.stringify(payload));
  }

  function dayTotals(stats) {
    var days = 0, total = 0, last = "";
    var daily = stats && stats.daily;
    if (daily && typeof daily === "object") {
      Object.keys(daily).forEach(function (d) {
        var t = 0, b = daily[d];
        if (b && typeof b === "object") Object.keys(b).forEach(function (s) { t += Number(b[s] && b[s].total) || 0; });
        if (t > 0) { days++; total += t; if (d > last) last = d; }
      });
    }
    return { days: days, total: total, last: last };
  }

  function fail(reason) { return { ok: false, error: reason }; }

  /** 貼り付けテキスト → { ok, keys, summary } | { ok:false, error } （ここでは何も書き込まない） */
  function decode(text) {
    if (typeof text !== "string") return fail("テキストが空です");
    var t = text.replace(/^[\s　]+|[\s　]+$/g, "");
    if (!t) return fail("テキストが空です");
    if (t.length > MAX_CHARS) return fail("テキストが大きすぎます");
    if (t.indexOf(PREFIX) !== 0) return fail("書き出したテキストの先頭（KQ1:）が見つかりません。コピーしなおしてください");
    var json, p;
    try { json = b64dec(t.slice(PREFIX.length)); } catch (e) { return fail("テキストが途中で切れているか、文字がまちがっています。もう一度コピーしてください"); }
    try { p = JSON.parse(json); } catch (e) { return fail("テキストの中身をよめませんでした"); }
    if (!p || typeof p !== "object" || p.format !== FORMAT) return fail("このアプリのきろくではありません");
    if (!p.keys || typeof p.keys !== "object" || Array.isArray(p.keys)) return fail("きろくの中身がありません");
    var keys = {}, names = Object.keys(p.keys), i;
    if (names.length > 200) return fail("きろくの数が多すぎます");
    for (i = 0; i < names.length; i++) {
      var k = names[i], v = p.keys[k];
      if (k.indexOf("kq-") !== 0 || k.length > 100) return fail("知らないキーが入っています: " + k.slice(0, 30));
      if (k === DEVICE_KEY) continue;
      if (typeof v !== "string") return fail("きろくの形がちがいます: " + k);
      if (JSON_KEYS[k]) {
        try { JSON.parse(v); } catch (e) { return fail("きろくがこわれています: " + k); }
      }
      keys[k] = v;
    }
    var onlyKeys = JSON.stringify(p.keys);
    if (p.sum !== fnv(onlyKeys)) return fail("チェックが合いません（コピーのとちゅうで変わった可能性）。もう一度コピーしてください");
    var stats = null;
    if (keys["kq-hub-v1-stats"]) {
      stats = JSON.parse(keys["kq-hub-v1-stats"]);
      if (!stats || typeof stats !== "object" || (stats.daily && typeof stats.daily !== "object") || (stats.score && typeof stats.score !== "object")) {
        return fail("きろく(kq-hub-v1-stats)の形がちがいます");
      }
    }
    var tot = dayTotals(stats);
    return {
      ok: true,
      keys: keys,
      summary: { keyCount: Object.keys(keys).length, days: tot.days, total: tot.total, lastDay: tot.last, exportedAt: String(p.exportedAt || "") }
    };
  }

  /** 検証済みの keys で storage の kq-* を置き換える（端末IDは残す）。書けたキー数を返す */
  function apply(storage, keys) {
    keysOf(storage).forEach(function (k) { try { storage.removeItem(k); } catch (e) {} });
    var n = 0;
    Object.keys(keys).forEach(function (k) {
      try { storage.setItem(k, keys[k]); if (storage.getItem(k) === keys[k]) n++; } catch (e) {}
    });
    return n;
  }

  /** 今の storage の要約（上書き確認で並べて見せる用） */
  function describe(storage) {
    var raw = null, stats = null;
    try { raw = storage.getItem("kq-hub-v1-stats"); stats = raw ? JSON.parse(raw) : null; } catch (e) { stats = null; }
    var tot = dayTotals(stats);
    return { keyCount: keysOf(storage).length, days: tot.days, total: tot.total, lastDay: tot.last };
  }

  return { PREFIX: PREFIX, FORMAT: FORMAT, DEVICE_KEY: DEVICE_KEY, encode: encode, decode: decode, apply: apply, describe: describe, keysOf: keysOf, _fnv: fnv };
});
