/* ============================================================
   common.js — 玄関＋3教科共通の記録係
   保存先: localStorage（同一Artifact内の全ページで共有される想定）
   キーはすべて "kq-hub-v1-" で始め、他アプリと衝突しないようにする。
   問題キーは教科をまたいで一意にすること（例: "rika:U02-A01",
   "kokugo:W1A01", "shakai:CHUBU:A01"）。
   ============================================================ */

/* ============================================================
   [GAS版の追加] 1) localStorage が使えない環境でも落ちない in-memory 代替
   Apps Script の HtmlService は iframe(googleusercontent.com) で配信される。
   ブラウザの設定（サードパーティCookie/サイトデータ遮断など）で localStorage が
   例外になる場合に、メモリ上の代替を window.localStorage として差し込む。
   その場合は画面上部に警告バナーを出す（ページを閉じると記録は消える）。
   ============================================================ */
(function (global) {
  "use strict";
  var probeKey = "kq-hub-probe";
  var ok = false;
  try {
    var ls = global.localStorage;
    ls.setItem(probeKey, "1");
    ok = ls.getItem(probeKey) === "1";
    ls.removeItem(probeKey);
  } catch (e) { ok = false; }
  global.__KQ_STORAGE_MODE = ok ? "local" : "memory";
  if (ok) return;

  // 読み出しは元のlocalStorageに残っている値も見える「重ね書き」にする（書きこみだけ失敗する環境の救済）
  var data = {}, gone = {}, native = null;
  try { native = global.localStorage; native.getItem(probeKey); } catch (e) { native = null; }
  function nativeKeys() {
    var ks = [], i, n = 0;
    try { n = native ? native.length : 0; for (i = 0; i < n; i++) ks.push(native.key(i)); } catch (e) { ks = []; }
    return ks;
  }
  function allKeys() {
    var seen = {}, out = [];
    nativeKeys().concat(Object.keys(data)).forEach(function (k) {
      if (typeof k === "string" && !seen[k] && !gone[k]) { seen[k] = 1; out.push(k); }
    });
    return out;
  }
  var mem = {
    getItem: function (k) {
      k = String(k);
      if (Object.prototype.hasOwnProperty.call(data, k)) return data[k];
      if (gone[k] || !native) return null;
      try { return native.getItem(k); } catch (e) { return null; }
    },
    setItem: function (k, v) { k = String(k); data[k] = String(v); delete gone[k]; },
    removeItem: function (k) { k = String(k); delete data[k]; gone[k] = true; },
    clear: function () { nativeKeys().forEach(function (k) { gone[k] = true; }); data = {}; },
    key: function (i) { var ks = allKeys(); return i >= 0 && i < ks.length ? ks[i] : null; }
  };
  Object.defineProperty(mem, "length", { get: function () { return allKeys().length; } });
  var installed = false;
  try {
    Object.defineProperty(global, "localStorage", { configurable: true, get: function () { return mem; } });
    installed = global.localStorage === mem;
  } catch (e) { installed = false; }
  global.__KQ_MEM_STORAGE = mem;
  global.__KQ_STORAGE_MODE = "memory";
  if (!installed) global.__KQ_STORAGE_MODE = "none"; // 差し込めない: 各コードのtry/catchで保存を諦める

  function banner() {
    try {
      if (!global.document || !global.document.body) return;
      if (global.document.getElementById("kqStorageWarn")) return;
      var d = global.document.createElement("div");
      d.id = "kqStorageWarn";
      d.setAttribute("role", "alert");
      d.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#fff3cd;color:#664d03;" +
        "border-bottom:2px solid #e0a800;padding:8px 12px;font:700 13px/1.5 sans-serif;text-align:center";
      d.textContent = "\u26A0 この端末ではきろくを保存できません。このページを閉じると、きろくが消えます。おうちの人に知らせてね。";
      global.document.body.insertBefore(d, global.document.body.firstChild);
    } catch (e) {}
  }
  if (global.document) {
    if (global.document.readyState === "loading") global.document.addEventListener("DOMContentLoaded", banner);
    else banner();
  }
})(window);

(function (global) {
  "use strict";

  var STORE_KEY = "kq-hub-v1-stats";

  function loadStats() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (!p.score) p.score = {};   // "subject:key" -> 累積ポイント（にがて特訓用）
        if (!p.daily) p.daily = {};   // "YYYY-MM-DD" -> { subject: {total, correct} }
        return p;
      }
    } catch (e) {}
    return { score: {}, daily: {} };
  }

  var stats = loadStats();

  function saveStats() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  // 端末のローカル日付（日本時間）で区切る
  function dateKey(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function todayKey() { return dateKey(new Date()); }

  function dayBucket(dateStr) {
    if (!stats.daily[dateStr]) stats.daily[dateStr] = {};
    return stats.daily[dateStr];
  }
  function subjectEntry(dateStr, subject) {
    var bucket = dayBucket(dateStr);
    if (!bucket[subject]) bucket[subject] = { total: 0, correct: 0 };
    return bucket[subject];
  }

  /**
   * 正解 +1、誤答 -1 でスコアを更新し、今日の解答数・正解数を加算する。
   * subject: "rika" | "shakai" | "kokugo"
   * key: 教科をまたいで一意な問題キー（例 "rika:U02-A01"）
   * correct: true/false
   * 戻り値: { score, recovered } recovered はマイナス→プラスに戻った回（にがて克服）ならtrue
   */
  function recordAnswer(subject, key, correct) {
    var before = stats.score[key] || 0;
    var after = correct ? before + 1 : before - 1;
    stats.score[key] = after;

    var e = subjectEntry(todayKey(), subject);
    e.total += 1;
    if (correct) e.correct += 1;

    saveStats();
    scheduleSync();
    return { score: after, recovered: before <= 0 && after > 0 };
  }

  function getScore(key) {
    return stats.score[key] || 0;
  }

  /** 一度でも解いた問題か */
  function hasAttempted(key) {
    return Object.prototype.hasOwnProperty.call(stats.score, key);
  }

  /** キー配列から { weak: 挑戦済みでscore<=0, fresh: 未挑戦 } を数える */
  function countWeakFresh(keys) {
    var weak = 0, fresh = 0;
    keys.forEach(function (k) {
      if (!hasAttempted(k)) fresh++;
      else if (getScore(k) <= 0) weak++;
    });
    return { weak: weak, fresh: fresh };
  }

  /** 今日の教科ごとの解答数・正解数を返す（未記録の教科は含まれない） */
  function getTodayStats() {
    var bucket = stats.daily[todayKey()] || {};
    var out = {};
    Object.keys(bucket).forEach(function (subject) {
      out[subject] = { total: bucket[subject].total, correct: bucket[subject].correct };
    });
    return out;
  }

  function getTodayCount(subject) {
    var s = getTodayStats()[subject];
    return s ? s.total : 0;
  }
  function getTodayCorrect(subject) {
    var s = getTodayStats()[subject];
    return s ? s.correct : 0;
  }

  /** 指定日（Dateオブジェクト）の教科ごとの解答数・正解数 */
  function getStatsFor(date, subject) {
    var bucket = stats.daily[dateKey(date)] || {};
    return bucket[subject] || { total: 0, correct: 0 };
  }

  /** 今日20問以上解いたか（✅の条件、モード問わず累計） */
  function isDoneToday(subject) {
    return getTodayCount(subject) >= 20;
  }

  /** にがて特訓の重み。スコアが低いほど選ばれやすいが、ゼロにはしない。 */
  function weightForScore(score) {
    return Math.max(1, 4 - score);
  }

  /**
   * 重み付き抽選で pool から n 件（重複なし）を選ぶ。
   * pool: 配列
   * keyFn: item -> 完全修飾キー（getScore/recordAnswerに使うのと同じもの）
   * 毎回同じ問題ばかりにならないよう、スコアが低いほど出やすい確率的な抽選にする。
   */
  function weightedSample(pool, keyFn, n) {
    var items = pool.slice();
    var picked = [];
    var count = Math.min(n, items.length);
    for (var i = 0; i < count; i++) {
      var weights = items.map(function (it) { return weightForScore(getScore(keyFn(it))); });
      var total = weights.reduce(function (a, b) { return a + b; }, 0);
      var r = Math.random() * total;
      var idx = 0;
      for (; idx < weights.length; idx++) {
        r -= weights[idx];
        if (r <= 0) break;
      }
      if (idx >= items.length) idx = items.length - 1;
      picked.push(items[idx]);
      items.splice(idx, 1);
    }
    return picked;
  }


  /* ============================================================
     [GAS版の追加] 2) URL・ページ遷移・クエリ
     GASのHTMLはiframe内に表示され、iframe自身の location.search には
     ?page=...&start=weak などが入らない。サーバ(doGet)が window.KQ_BASE（/exec のURL）と
     window.KQ_PARAMS（{start, units, rounds, region} だけ）を埋め込む。
     ============================================================ */
  function pageUrl(page, params) {
    if (global.KQ_STATIC) {   // [静的サイト版] GitHub Pages など：index.html?start=weak&units=... の形
      var sq = "";
      Object.keys(params || {}).forEach(function (k) {
        if (params[k] === undefined || params[k] === null) return;
        sq += (sq ? "&" : "?") + encodeURIComponent(k) + "=" + encodeURIComponent(String(params[k])).replace(/%2C/g, ",");
      });
      return page + ".html" + sq;
    }
    var base = global.KQ_BASE || "";
    var q = "page=" + encodeURIComponent(page);
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] === undefined || params[k] === null) return;
      q += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(String(params[k])).replace(/%2C/g, ",");
    });
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + q;
  }

  /** クエリ値の取得。サーバ埋め込み(KQ_PARAMS)優先、無ければ location.search（ローカル確認用） */
  function getParam(name) {
    var p = global.KQ_PARAMS;
    if (p && typeof p === "object") {
      return Object.prototype.hasOwnProperty.call(p, name) && p[name] !== null ? String(p[name]) : null;
    }
    try { return new URLSearchParams(global.location.search).get(name); } catch (e) { return null; }
  }

  /** ページ遷移（iframeの外＝トップウィンドウを動かす）。失敗したら自分のウィンドウで */
  function go(url) {
    try { global.top.location.href = url; return; } catch (e) {}
    try { global.location.href = url; } catch (e2) {}
  }

  /* ============================================================
     [GAS版の追加] 3) 端末ID と サーバ同期（google.script.run があるときだけ）
     - recordAnswer のあと3秒デバウンスで reportDay(deviceId, dateKey, {rika:{total,correct},...})
     - 絶対値のupsertなので何回送っても同じ（冪等）。失敗は握りつぶし、dirty のまま
       次の解答時／次のページ読み込み時（直近7日分を再送）に再送する。
     ============================================================ */
  var DEVICE_KEY = "kq-hub-v1-device";
  var SYNC_DEBOUNCE_MS = 3000;
  var RESEND_DAYS = 7;
  var SUBJECT_LIST = ["rika", "shakai", "kokugo"];

  function makeId() {
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789", out = "d";
    var buf = null;
    try { buf = new Uint8Array(16); global.crypto.getRandomValues(buf); } catch (e) { buf = null; }
    for (var i = 0; i < 16; i++) {
      var r = buf ? buf[i] : Math.floor(Math.random() * 256);
      out += chars.charAt(r % chars.length);
    }
    return out;
  }
  var cachedDeviceId = null;
  function getDeviceId() {
    if (cachedDeviceId) return cachedDeviceId;
    var id = null;
    try { id = localStorage.getItem(DEVICE_KEY); } catch (e) {}
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = makeId();
      try { localStorage.setItem(DEVICE_KEY, id); } catch (e) {}
    }
    cachedDeviceId = id;
    return id;
  }

  /* [静的サイト版] google.script.run が無い環境（GitHub Pages）では、GASのWebアプリ(/exec)へ
     fetch(GET)で送る。google.script.run と同じ「.withSuccessHandler().withFailureHandler().reportDay()」の形にそろえる。 */
  function makeHttpRunner(url) {
    function request(action, params, ok, ng) {
      var q = "action=" + encodeURIComponent(action);
      Object.keys(params).forEach(function (k) { q += "&" + k + "=" + encodeURIComponent(params[k]); });
      var full = url + (url.indexOf("?") >= 0 ? "&" : "?") + q;
      try {
        global.fetch(full, { method: "GET", cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) { ok(j); }, function (e) { ng(e); });
      } catch (e) { ng(e); }
    }
    function chain() {
      var okFn = function () {}, ngFn = function () {};
      var o = {
        withSuccessHandler: function (fn) { okFn = fn; return o; },
        withFailureHandler: function (fn) { ngFn = fn; return o; },
        reportDay: function (dev, d, rec) { request("report", { dev: dev, d: d, p: JSON.stringify(rec || {}) }, okFn, ngFn); },
        ping: function () { request("ping", {}, okFn, ngFn); }
      };
      return o;
    }
    return { withSuccessHandler: function (fn) { return chain().withSuccessHandler(fn); },
             withFailureHandler: function (fn) { return chain().withFailureHandler(fn); } };
  }
  var httpRunner = null;

  function getRunner() {
    if (global.KQ_REPORT_URL && typeof global.fetch === "function") {
      if (!httpRunner) httpRunner = makeHttpRunner(String(global.KQ_REPORT_URL));
      return httpRunner;
    }
    try {
      var g = global.google;
      if (g && g.script && g.script.run && typeof g.script.run.withSuccessHandler === "function") return g.script.run;
    } catch (e) {}
    return null;
  }

  function toInt(v) { v = Number(v); return isFinite(v) && v > 0 ? Math.floor(v) : 0; }
  /** 1日分を送信形式 {rika:{total,correct},...} に（記録のある教科だけ） */
  function payloadFor(dateStr) {
    var b = stats.daily[dateStr] || {}, out = {}, any = false;
    SUBJECT_LIST.forEach(function (s) {
      if (!b[s]) return;
      var t = toInt(b[s].total), c = Math.min(toInt(b[s].correct), t);
      out[s] = { total: t, correct: c };
      any = true;
    });
    return any ? out : null;
  }

  // 同じタブの中で送信済み(サーバが ok を返した)内容は、ページを移動するたびに再送しない。
  // sessionStorage はタブを閉じると消えるので、次に開いたときは直近7日分を必ず再送する。
  // （kq- で始まらないキーなので「きろくを書き出す」には含まれない）
  var ACK_KEY = "kqsync-acked";
  function readAcked() {
    try { var o = JSON.parse(global.sessionStorage.getItem(ACK_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; }
  }
  function writeAcked(d, sig) {
    try { var o = readAcked(); o[d] = sig; global.sessionStorage.setItem(ACK_KEY, JSON.stringify(o)); } catch (e) {}
  }

  var dirty = {};          // dateKey -> 版番号（未送信または送信失敗。送信中に更新されたら版が進む）
  var verCounter = 0;
  var again = false;       // 送信中に新しい要求が来た
  function markDirty(k) { dirty[k] = ++verCounter; }
  var syncTimer = null;
  var flushing = false;
  var syncState = { sent: 0, failed: 0, lastError: null };

  function flushNow() {
    var run = getRunner();
    if (!run) return;
    if (flushing) { again = true; return; }
    var dates = Object.keys(dirty).sort();
    if (!dates.length) return;
    flushing = true;
    var i = 0;
    (function next() {
      if (i >= dates.length) {
        flushing = false;
        if (again) { again = false; flushNow(); }
        return;
      }
      var d = dates[i++];
      var ver = dirty[d];
      var payload = payloadFor(d);
      if (!payload) { delete dirty[d]; return next(); }
      var r = getRunner();
      if (!r) { flushing = false; return; }
      try {
        r.withSuccessHandler(function (res) {
          if (res && res.ok === false) { syncState.failed++; syncState.lastError = res.error || "rejected"; }
          else { if (dirty[d] === ver) delete dirty[d]; syncState.sent++; writeAcked(d, JSON.stringify(payload)); }
          next();
        }).withFailureHandler(function (err) {
          syncState.failed++; syncState.lastError = String(err && err.message ? err.message : err);
          next();           // 失敗は握りつぶす（dirty のまま。次回再送）
        }).reportDay(getDeviceId(), d, payload);
      } catch (e) {
        syncState.failed++; syncState.lastError = String(e);
        flushing = false;
      }
    })();
  }

  function scheduleSync() {
    if (!getRunner()) return;                  // テスト/ローカルでは何もしない
    markDirty(todayKey());
    if (syncTimer) global.clearTimeout(syncTimer);
    syncTimer = global.setTimeout(function () { syncTimer = null; flushNow(); }, SYNC_DEBOUNCE_MS);
  }

  /** ページ読み込み時：直近 RESEND_DAYS 日分のdailyを再送 */
  function resendRecent(force) {
    if (!getRunner()) return;
    var now = new Date(), acked = readAcked();
    for (var i = 0; i < RESEND_DAYS; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var k = dateKey(d), pl = payloadFor(k);
      if (pl && (force || acked[k] !== JSON.stringify(pl))) markDirty(k);
    }
    flushNow();
  }

  function onLeave() {
    if (syncTimer) { global.clearTimeout(syncTimer); syncTimer = null; }
    flushNow();
  }
  try {
    global.addEventListener("pagehide", onLeave);
    if (global.document) global.document.addEventListener("visibilitychange", function () {
      if (global.document.visibilityState === "hidden") onLeave();
    });
    global.setTimeout(function () { resendRecent(false); }, 800);
  } catch (e) {}

  /** localStorage から stats を読み直す（きろくをよみこんだ直後に使う） */
  function reload() {
    stats = loadStats();
    cachedDeviceId = null;
  }

  global.KQHub = {
    recordAnswer: recordAnswer,
    getScore: getScore,
    hasAttempted: hasAttempted,
    countWeakFresh: countWeakFresh,
    getTodayStats: getTodayStats,
    getTodayCount: getTodayCount,
    getTodayCorrect: getTodayCorrect,
    getStatsFor: getStatsFor,
    isDoneToday: isDoneToday,
    weightForScore: weightForScore,
    weightedSample: weightedSample,
    todayKey: todayKey,
    dateKey: dateKey,
    // --- GAS版の追加 ---
    pageUrl: pageUrl,
    getParam: getParam,
    go: go,
    getDeviceId: getDeviceId,
    DEVICE_KEY: DEVICE_KEY,
    reload: reload,
    storageMode: function () { return global.__KQ_STORAGE_MODE; },
    syncNow: function () { if (syncTimer) { global.clearTimeout(syncTimer); syncTimer = null; } resendRecent(true); },
    syncState: function () { return { sent: syncState.sent, failed: syncState.failed, lastError: syncState.lastError, pending: Object.keys(dirty).sort() }; }
  };
})(window);
