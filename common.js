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
    scheduleScores();
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
  // マイナスほど急に出やすく（0点=4, -1=6, -3=10, -5=14）、プラスは出にくく（+1=2, +2=0.5, +3以上=0.3）。
  function weightForScore(score) {
    if (score <= 0) return 4 + 2 * (-score);
    if (score === 1) return 2;
    if (score === 2) return 0.5;
    return 0.3;
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
    writeSentLocal(d, sig);
  }

  // [オフライン対応] 「送信ずみ」の内容を localStorage にも残す（タブを閉じても「未送信があるか」を判定できるように）。
  // 再送の判断は従来どおり sessionStorage(ACK_KEY) で行い、こちらは表示用。
  // kq- で始まらないキー（kqsync-）なので「きろくを書き出す」(transfer.js) には含まれない。
  var SENT_KEY = "kqsync-sent-v1";
  function readSentLocal() {
    try { var o = JSON.parse(localStorage.getItem(SENT_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; }
  }
  function writeSentLocal(d, sig) {
    try {
      var o = readSentLocal(), now = new Date(), keep = {}, i;
      for (i = 0; i < RESEND_DAYS + 7; i++) keep[dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i))] = 1;
      Object.keys(o).forEach(function (k) { if (!keep[k]) delete o[k]; });   // 古い日付は捨てる
      o[d] = sig;
      localStorage.setItem(SENT_KEY, JSON.stringify(o));
    } catch (e) {}
  }
  /** 直近 RESEND_DAYS 日のうち、まだサーバに届いた記録がない（または送信後に増えた）日付の一覧 */
  function unsentDays() {
    var now = new Date(), sent = readSentLocal(), out = [];
    for (var i = 0; i < RESEND_DAYS; i++) {
      var k = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)), pl = payloadFor(k);
      if (pl && sent[k] !== JSON.stringify(pl)) out.push(k);
    }
    return out.sort();
  }

  // 送信の一区切り（送るものが無くなった／失敗して止まった）ごとに呼ぶ。画面の表示更新用。
  var doneWaiters = [];
  function syncFinished() {
    var ws = doneWaiters; doneWaiters = [];
    var st = { sent: syncState.sent, failed: syncState.failed, lastError: syncState.lastError, pending: Object.keys(dirty).sort(), unsent: unsentDays() };
    ws.forEach(function (fn) { try { fn(st); } catch (e) {} });
    try {
      if (typeof global.CustomEvent === "function" && global.dispatchEvent) global.dispatchEvent(new global.CustomEvent("kqsync", { detail: st }));
    } catch (e) {}
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
    if (!run) { syncFinished(); return; }
    if (flushing) { again = true; return; }
    var dates = Object.keys(dirty).sort();
    if (!dates.length) { syncFinished(); return; }
    flushing = true;
    var i = 0;
    (function next() {
      if (i >= dates.length) {
        flushing = false;
        if (again) { again = false; flushNow(); }
        else syncFinished();
        return;
      }
      var d = dates[i++];
      var ver = dirty[d];
      var payload = payloadFor(d);
      if (!payload) { delete dirty[d]; return next(); }
      var r = getRunner();
      if (!r) { flushing = false; syncFinished(); return; }
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
        syncFinished();
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
      else if (pl && readSentLocal()[k] !== acked[k]) writeSentLocal(k, acked[k]);   // このタブで送信ずみ → 表示用にも記録
    }
    flushNow();
  }

  /* ---- [問題ごとのスコア] 親（とClaude）が「どの問題が何点のマイナスか」を集計できるように、
     stats.score（0以外の問題だけ）を Supabase に1日1行で送る（関数 kq_put_scores 経由。表は直接読めない）。
     中身が前回送ったものと同じなら送らない。失敗しても次の解答・次のページ読み込みで再送する。
     KQ_REPORT_URL が空（テスト・確認用ページ）のときは送らない。 */
  var SCORE_RPC_URL = "https://lzyrjjkcmhncwxsaqpqu.supabase.co/rest/v1/rpc/kq_put_scores";
  var SCORE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6eXJqamtjbWhuY3d4c2FxcHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTk3NTAsImV4cCI6MjEwMTA3NTc1MH0.FmwKa4WZvJ_j3LKBl2iJThXZxRNAjeqWDurgqwZNnO8";
  var SCORE_SENT_KEY = "kqsync-scores-v1";   // kq- で始まらない（書き出しに入れない）
  var scoreTimer = null, scoreBusy = false;
  function scorePayload() {
    var out = {};
    Object.keys(stats.score || {}).forEach(function (k) {
      var v = Math.round(Number(stats.score[k]));
      if (isFinite(v) && v !== 0) out[k] = v;
    });
    return out;
  }
  function uploadScores() {
    if (!global.KQ_REPORT_URL || typeof global.fetch !== "function" || scoreBusy) return;
    if (global.navigator && global.navigator.onLine === false) return;
    var day = todayKey(), body = scorePayload(), sig = day + ":" + JSON.stringify(body);
    var prev = null;
    try { prev = localStorage.getItem(SCORE_SENT_KEY); } catch (e) {}
    if (prev === sig) return;
    scoreBusy = true;
    try {
      global.fetch(SCORE_RPC_URL, {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", "apikey": SCORE_ANON_KEY, "Authorization": "Bearer " + SCORE_ANON_KEY },
        body: JSON.stringify({ p_device: getDeviceId(), p_day: day, p_scores: body })
      }).then(function (r) {
        scoreBusy = false;
        if (r && r.ok) { try { localStorage.setItem(SCORE_SENT_KEY, sig); } catch (e) {} }
      }, function () { scoreBusy = false; });
    } catch (e) { scoreBusy = false; }
  }
  function scheduleScores() {
    if (!global.KQ_REPORT_URL) return;
    if (scoreTimer) global.clearTimeout(scoreTimer);
    scoreTimer = global.setTimeout(function () { scoreTimer = null; uploadScores(); }, 10000);
  }

  function onLeave() {
    if (syncTimer) { global.clearTimeout(syncTimer); syncTimer = null; }
    flushNow();
    if (scoreTimer) { global.clearTimeout(scoreTimer); scoreTimer = null; uploadScores(); }
  }
  try {
    global.addEventListener("pagehide", onLeave);
    if (global.document) global.document.addEventListener("visibilitychange", function () {
      if (global.document.visibilityState === "hidden") onLeave();
    });
    global.setTimeout(function () { resendRecent(false); }, 800);
    global.setTimeout(uploadScores, 2500);
    // [オフライン対応] ネットにつながりなおしたら、まだ届いていない分を送る
    global.addEventListener("online", function () { resendRecent(false); uploadScores(); });
  } catch (e) {}

  /** localStorage から stats を読み直す（きろくをよみこんだ直後に使う） */
  function reload() {
    stats = loadStats();
    cachedDeviceId = null;
  }

  /* ---- 回のリストを5回ごとに折りたたむ ----
     組分けテストが終わった範囲（第1〜5回・第6〜10回…）は閉じて、これからの範囲だけ開く。
     使い方: var f = KQHub.foldList(container, "rika"); f.add(roundNumber, element, forceOpen);
     （回の番号が取れない行はそのまま並べる。開閉の状態は再描画しても保つ） */
  var FOLD_DONE = [["2026-10-04", 5], ["2026-11-08", 10], ["2026-12-13", 15], ["2027-01-24", 19]];
  var foldState = {};
  function foldDoneThrough() {
    var t = dateKey(new Date()), done = 0;
    FOLD_DONE.forEach(function (x) { if (x[0] <= t) done = x[1]; });
    return done;
  }
  function roundFromText(txt) {
    var m = String(txt || "").normalize("NFKC").match(/第\s*(\d+)\s*回/);
    return m ? Number(m[1]) : 0;
  }
  function foldList(container, key) {
    var groups = {}, done = foldDoneThrough();
    foldState[key] = foldState[key] || {};
    var st = foldState[key];
    return {
      add: function (round, el, forceOpen) {
        if (!round) { container.appendChild(el); return; }
        var g = Math.floor((round - 1) / 5), lo = g * 5 + 1, hi = Math.min(g * 5 + 5, 19);
        var d = groups[g];
        if (!d) {
          d = document.createElement("details");
          d.className = "kq-fold";
          d.open = st[g] !== undefined ? st[g] : !(g * 5 + 5 <= done);
          var sm = document.createElement("summary");
          sm.className = "kq-fold-head";
          sm.textContent = "第" + lo + "〜" + hi + "回" + (g * 5 + 5 <= done ? "（組分けテストおわり）" : "");
          d.appendChild(sm);
          var inner = document.createElement("div");
          inner.className = container.className;
          inner.style.marginTop = "10px";
          d.appendChild(inner);
          d._inner = inner;
          d.addEventListener("toggle", function () { st[g] = d.open; });
          container.appendChild(d);
          groups[g] = d;
        }
        if (forceOpen) d.open = true;
        d._inner.appendChild(el);
      }
    };
  }
  function ensureFoldStyle() {
    if (document.getElementById("kq-fold-style")) return;
    var st = document.createElement("style");
    st.id = "kq-fold-style";
    st.textContent = ".kq-fold{border:2px solid var(--line,#ddd);border-radius:16px;padding:0 10px 10px;background:transparent}" +
      ".kq-fold>summary{cursor:pointer;font-weight:900;font-size:14px;padding:12px 4px;list-style:none;display:flex;justify-content:space-between;align-items:center}" +
      ".kq-fold>summary::-webkit-details-marker{display:none}" +
      ".kq-fold>summary::after{content:'▾';font-size:14px;opacity:.7}" +
      ".kq-fold:not([open])>summary::after{content:'▸'}" +
      ".kq-fold:not([open]){padding-bottom:0}";
    (document.head || document.documentElement).appendChild(st);
  }
  ensureFoldStyle();

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
    foldList: foldList,
    roundFromText: roundFromText,
    dateKey: dateKey,
    // --- GAS版の追加 ---
    pageUrl: pageUrl,
    getParam: getParam,
    go: go,
    getDeviceId: getDeviceId,
    DEVICE_KEY: DEVICE_KEY,
    reload: reload,
    storageMode: function () { return global.__KQ_STORAGE_MODE; },
    // syncNow(cb): cb は送信が一区切りしたときに syncState() と同じ形（+unsent）で呼ばれる（省略可）
    syncNow: function (cb) { if (typeof cb === "function") doneWaiters.push(cb); if (syncTimer) { global.clearTimeout(syncTimer); syncTimer = null; } resendRecent(true); },
    syncState: function () { return { sent: syncState.sent, failed: syncState.failed, lastError: syncState.lastError, pending: Object.keys(dirty).sort(), unsent: unsentDays() }; },
    unsentDays: unsentDays,
    hasUnsent: function () { return unsentDays().length > 0; },
    canSync: function () { return !!getRunner(); }
  };
})(window);

/* ============================================================
   [オフライン対応] Service Worker の登録（静的サイト版のみ）
   sw.js がアプリのファイルを端末に保存し、ネットが無くても開けるようにする。
   ============================================================ */
(function (global) {
  "use strict";
  try {
    if (!global.KQ_STATIC) return;
    var nav = global.navigator;
    if (!nav || !("serviceWorker" in nav) || !global.isSecureContext) return;
    var reg = function () {
      try { nav.serviceWorker.register("sw.js").catch(function () {}); } catch (e) {}
    };
    if (global.document && global.document.readyState === "complete") reg();
    else global.addEventListener("load", reg);
  } catch (e) {}
})(window);

/* ============================================================
   [ボス] にがて退治のHPバー（window.KQBoss）
   - ボス = 教科 × カリキュラムテストの範囲（RANGES）。組分けテストは範囲内の2体。
   - HP = 範囲の問題のうち「まだ倒していない」問題の数（未挑戦 または score<=0）。最大HP = 範囲の問題数。
   - HPが0になったら撃破。kq-hub-v1-boss に {"教科|範囲": 初めて倒した日} を保存（以後は復活しない）。
     ごほうびシールは stickers-award.js がこの保存値を読んで、その日に教科シールを足す（ボス1まい・魔王2まい）。
   - 魔王：いちばん近いテストが組分けテストのとき、その範囲のボスは「魔王ぐも」になる（たおすとシール2まい）。
   - 回→問題キーの索引: 教科ページが開かれるたびに registerIndex() で kqidx-<教科>-v1 に書く
     （kq- で始めない＝「きろくを書き出す」に入れない。いつでも作り直せるキャッシュ）。
     玄関は 教科ページの索引（メモリ）→ キャッシュ → index.html に埋め込んだ静的な索引（KQ_BOSS_STATIC）の順に使う。
   見た目（絵・色・文言）はこの下の KQBossTheme だけにまとめる。ここはロジックのみ。
   ============================================================ */
(function (global) {
  "use strict";
  var H = global.KQHub;
  if (!H) return;
  var STORE_KEY = "kq-hub-v1-boss";
  var IDX_PREFIX = "kqidx-";
  var IDX_VER = "-v1";
  var SUBJECTS = ["rika", "shakai", "kokugo"];
  var NAMES = { rika: "理科", shakai: "社会", kokugo: "国語" };
  // ボス1体 = この回のまとまり（第5・10・15・19回は総合回なのでボスなし）
  var RANGES = [[1, 2], [3, 4], [6, 7], [8, 9], [11, 12], [13, 14], [16, 17, 18]];
  // テスト日程（kind: curriculum=カリキュラムテスト / kumiwake=組分けテスト）。rounds はテスト範囲の回
  var TESTS = [
    { date: "2026-09-12", kind: "curriculum", rounds: [1, 2] },
    { date: "2026-09-26", kind: "curriculum", rounds: [3, 4] },
    { date: "2026-10-04", kind: "kumiwake",   rounds: [1, 2, 3, 4] },
    { date: "2026-10-17", kind: "curriculum", rounds: [6, 7] },
    { date: "2026-10-31", kind: "curriculum", rounds: [8, 9] },
    { date: "2026-11-08", kind: "kumiwake",   rounds: [6, 7, 8, 9] },
    { date: "2026-11-21", kind: "curriculum", rounds: [11, 12] },
    { date: "2026-12-05", kind: "curriculum", rounds: [13, 14] },
    { date: "2026-12-13", kind: "kumiwake",   rounds: [11, 12, 13, 14] },
    { date: "2027-01-16", kind: "curriculum", rounds: [16, 17, 18] },
    { date: "2027-01-24", kind: "kumiwake",   rounds: [16, 17, 18] }
  ];

  function rangeId(rounds) { return rounds.slice().sort(function (a, b) { return a - b; }).join("-"); }
  function bossId(subject, rounds) { return subject + "|" + rangeId(rounds); }
  /** "11,12" / [11,12] → RANGES の中の一致する範囲（無ければ null） */
  function findRange(v) {
    var arr = Array.isArray(v) ? v : String(v || "").split(/[,\-]/);
    var id = rangeId(arr.map(Number).filter(function (n) { return n > 0; }));
    for (var i = 0; i < RANGES.length; i++) if (rangeId(RANGES[i]) === id) return RANGES[i].slice();
    return null;
  }
  function bossesForTest(t) {
    return RANGES.filter(function (r) { return r.every(function (n) { return t.rounds.indexOf(n) >= 0; }); })
      .map(function (r) { return r.slice(); });
  }
  /** dateStr（YYYY-MM-DD、省略時は今日）以降でいちばん近いテストと、そのボスの範囲 */
  function recommend(dateStr) {
    var d = dateStr || H.todayKey();
    var up = TESTS.filter(function (t) { return t.date >= d; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (!up.length) return null;
    return { test: up[0], bosses: bossesForTest(up[0]) };
  }
  /** 魔王かどうか：いちばん近いテストが組分けテストで、その範囲に入っているボス（たおすとシール2まい） */
  function isMaou(subject, rounds, dateStr) {
    var rec = recommend(dateStr);
    if (!rec || rec.test.kind !== "kumiwake") return false;
    return rounds.every(function (n) { return rec.test.rounds.indexOf(n) >= 0; });
  }
  function bossName(subject, rounds, maou) { return NAMES[subject] + " 第" + rounds.join("・") + "回の" + (maou ? "魔王" : "ボス"); }

  /* ---- 回→問題キーの索引 ---- */
  var live = {};
  function cleanIndex(map) {
    var out = {};
    if (!map || typeof map !== "object") return null;
    Object.keys(map).forEach(function (r) {
      var n = Number(r);
      if (!(n > 0) || !Array.isArray(map[r])) return;
      out[n] = map[r].filter(function (s) { return typeof s === "string" && s; });
    });
    return out;
  }
  /** 教科ページが「回 → 問題キー（"教科:" を除いた部分）」を登録する。キャッシュも更新 */
  function registerIndex(subject, map) {
    var idx = cleanIndex(map);
    if (!idx) return;
    live[subject] = idx;
    var s = JSON.stringify({ v: 1, r: idx });
    try {
      if (global.localStorage.getItem(IDX_PREFIX + subject + IDX_VER) !== s) global.localStorage.setItem(IDX_PREFIX + subject + IDX_VER, s);
    } catch (e) {}
  }
  function indexFor(subject) {
    if (live[subject]) return live[subject];
    try {
      var p = JSON.parse(global.localStorage.getItem(IDX_PREFIX + subject + IDX_VER) || "null");
      var c = p && cleanIndex(p.r);
      if (c && Object.keys(c).length) return c;
    } catch (e) {}
    var st = global.KQ_BOSS_STATIC && global.KQ_BOSS_STATIC[subject];
    return st ? cleanIndex(st) : null;
  }
  /** 範囲の問題キー（完全なキー）。索引が無ければ null */
  function keysFor(subject, rounds) {
    var idx = indexFor(subject);
    if (!idx) return null;
    var out = [], seen = {};
    rounds.forEach(function (r) {
      (idx[r] || []).forEach(function (s) { var k = subject + ":" + s; if (!seen[k]) { seen[k] = 1; out.push(k); } });
    });
    return out;
  }

  /* ---- HP ---- */
  function isConquered(key) { return H.getScore(key) > 0; }
  function hpOfKeys(keys) {
    var hp = 0;
    keys.forEach(function (k) { if (!isConquered(k)) hp++; });
    return { hp: hp, max: keys.length };
  }

  /* ---- 撃破の保存 ---- */
  function readStore() {
    try { var p = JSON.parse(global.localStorage.getItem(STORE_KEY) || "{}"); return p && typeof p === "object" && !Array.isArray(p) ? p : {}; } catch (e) { return {}; }
  }
  // 保存値は "YYYY-MM-DD"（ふつうのボス＝シール1まい）か {d:"YYYY-MM-DD", n:2}（魔王＝シール2まい）
  function storeDate(v) { return typeof v === "string" ? v : (v && typeof v === "object" && typeof v.d === "string" ? v.d : null); }
  function storeReward(v) { return v && typeof v === "object" && Number(v.n) > 1 ? Math.floor(Number(v.n)) : 1; }
  function defeatedOn(subject, rounds) { return storeDate(readStore()[bossId(subject, rounds)]); }
  /** いまの状態 { subject, rounds, id, name, maou, reward, known, hp, max, defeated(日付|null), ready } */
  function status(subject, rounds, keys) {
    var ks = keys || keysFor(subject, rounds);
    var saved = readStore()[bossId(subject, rounds)];
    var dDate = storeDate(saved);
    // たおしたあとは、たおした時の姿（魔王/ボス）のまま。まだなら今日の判定
    var maou = dDate ? storeReward(saved) > 1 : isMaou(subject, rounds);
    var o = { subject: subject, rounds: rounds.slice(), id: bossId(subject, rounds), name: bossName(subject, rounds, maou),
              maou: maou, reward: maou ? 2 : 1,
              known: !!ks, hp: null, max: null, defeated: dDate, ready: false };
    if (ks) { var h = hpOfKeys(ks); o.hp = h.hp; o.max = h.max; o.ready = h.max > 0; }
    return o;
  }
  /** HP0なら撃破を保存。初めての撃破なら true（ごほうびシールはこの保存から導かれる：ボス1まい・魔王2まい） */
  function checkDefeat(subject, rounds, keys) {
    var st = status(subject, rounds, keys);
    if (st.defeated || !st.ready || st.hp !== 0) return false;
    var s = readStore();
    if (s[st.id]) return false;
    s[st.id] = st.maou ? { d: H.todayKey(), n: 2 } : H.todayKey();
    try { global.localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { return false; }
    return defeatedOn(subject, rounds) !== null;
  }
  /** ボスせんの出題：まだ倒していない問題（未挑戦＋にがて）を優先し、足りなければ倒した問題から補う */
  function pickBattle(pool, keyFn, n) {
    var un = pool.filter(function (q) { return !isConquered(keyFn(q)); });
    var done = pool.filter(function (q) { return isConquered(keyFn(q)); });
    // まぐれ正解の確認枠：+1点だけ（1回正解しただけ）の問題を、約1割（最低1問）ぶん混ぜる
    var once = done.filter(function (q) { return H.getScore(keyFn(q)) === 1; });
    // 未制覇が残っている間は約1割（最低1問）。未制覇がなければ混ぜない（残りは制覇済みから重み付きで補う）。
    var quota = (once.length && un.length) ? Math.min(once.length, Math.max(1, Math.round(n * 0.1))) : 0;
    var a = H.weightedSample(un, keyFn, Math.min(n - quota, un.length));
    var onceP = H.weightedSample(once, keyFn, Math.min(n - a.length, quota));
    a = a.concat(onceP);
    if (a.length < n) {
      var rest = done.filter(function (q) { return onceP.indexOf(q) < 0; });
      a = a.concat(H.weightedSample(rest, keyFn, Math.min(n - a.length, rest.length)));
    }
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function battleUrl(subject, rounds) { return H.pageUrl(subject, { start: "weak", rounds: rounds.join(","), boss: 1 }); }
  /** URL が ?start=weak&rounds=..&boss=1 なら範囲を返す */
  function battleParam() {
    if (H.getParam("start") !== "weak" || H.getParam("boss") !== "1") return null;
    return findRange(H.getParam("rounds"));
  }

  /**
   * 教科ページのクイズ画面の上に出すHPバー。host（クイズ画面の section）の先頭に置く。
   * update() は1しゅうめの解答のあとに呼ぶ。HPが0になったらその場でお祝い（1回だけ）。
   */
  function mountBattle(host, subject, rounds, keys) {
    var T = global.KQBossTheme;
    if (!host || !T) return null;
    var old = host.querySelector(".kqb-hud");
    if (old) old.parentNode.removeChild(old);
    var el = T.hud(subject, rounds);
    host.insertBefore(el, host.firstChild);
    function update() {
      var first = checkDefeat(subject, rounds, keys);
      var st = status(subject, rounds, keys);
      T.updateHud(el, st);
      if (first) T.celebrate(st, { where: "page" });
      return st;
    }
    update();
    return { el: el, update: update, remove: function () { if (el.parentNode) el.parentNode.removeChild(el); } };
  }

  /* ---- 自動HP：クイズ中は「いま出ている問題の範囲のボス」のHPバーを常に出す ----
     問題キー → 回 → RANGES のボス。ボスの無い回（総合回など）はバーを出さない。 */
  var auto = { host: null, id: null, hud: null };
  var revCache = { idx: null, map: null };
  function roundOfKey(subject, key) {
    var idx = indexFor(subject);
    if (!idx) return 0;
    if (revCache.idx !== idx) {
      var m = {};
      Object.keys(idx).forEach(function (r) { idx[r].forEach(function (s) { m[s] = Number(r); }); });
      revCache = { idx: idx, map: m };
    }
    var pre = subject + ":";
    if (String(key).indexOf(pre) !== 0) return 0;
    return revCache.map[String(key).slice(pre.length)] || 0;
  }
  function rangeOfKey(subject, key) {
    var r = roundOfKey(subject, key);
    if (!r) return null;
    for (var i = 0; i < RANGES.length; i++) if (RANGES[i].indexOf(r) >= 0) return RANGES[i].slice();
    return null;
  }
  function autoClear() {
    if (auto.hud) auto.hud.remove();
    auto = { host: null, id: null, hud: null };
  }
  function autoFocus(host, subject, key) {
    try {
      var r = rangeOfKey(subject, key);
      if (!r) { autoClear(); return; }
      var id = bossId(subject, r);
      if (auto.hud && auto.id === id && auto.host === host && auto.hud.el.parentNode === host) return;
      autoClear();
      var keys = keysFor(subject, r);
      if (!keys || !keys.length) return;
      var h = mountBattle(host, subject, r, keys);
      if (h) auto = { host: host, id: id, hud: h };
    } catch (e) {}
  }
  function autoUpdate() { try { if (auto.hud) auto.hud.update(); } catch (e) {} }

  global.KQBoss = {
    autoFocus: autoFocus, autoUpdate: autoUpdate, autoClear: autoClear, rangeOfKey: rangeOfKey,
    STORE_KEY: STORE_KEY, IDX_PREFIX: IDX_PREFIX, SUBJECTS: SUBJECTS, NAMES: NAMES, RANGES: RANGES, TESTS: TESTS,
    rangeId: rangeId, bossId: bossId, findRange: findRange, bossesForTest: bossesForTest, recommend: recommend, bossName: bossName, isMaou: isMaou,
    storeDate: storeDate, storeReward: storeReward,
    registerIndex: registerIndex, indexFor: indexFor, keysFor: keysFor,
    isConquered: isConquered, hpOfKeys: hpOfKeys, readStore: readStore, defeatedOn: defeatedOn, status: status,
    checkDefeat: checkDefeat, pickBattle: pickBattle, battleUrl: battleUrl, battleParam: battleParam, mountBattle: mountBattle
  };
})(window);

/* ============================================================
   [ボス] 見た目の層（window.KQBossTheme）— 絵・色・文言はここだけ。
   絵は「にがてぐも」（ふだん＝ちょいワルぐも、組分けテスト前＝魔王ぐも）を SVG で描く（artHtml）。
   HPバーは「ゲームのHPゲージ」型（太わく・10マスの目もり・緑→黄→赤、0で「たおした！」）。
   ============================================================ */
(function (global) {
  "use strict";
  /* ---- 絵（SVG）：ふだん＝ちょいワルぐも、組分けテスト前＝魔王ぐも。たおすと雲がはれる ---- */
  // 教科ごと：tint=ちょいワルの雲の色 / glow=魔王の目の色 / item=ふらせるもの。
  // sansu（算数）はクイズがまだ無いので使っていない（算数クイズができたらそのまま使える：かずぐも）。
  var CLOUD = {
    kokugo: { name: "すみぐも",     tint: "#7d5a6e", glow: "#ff6b6b" },
    sansu:  { name: "かずぐも",     tint: "#5a72a3", glow: "#6fa8ff" },
    rika:   { name: "フラスコぐも", tint: "#a8703a", glow: "#ffb347" },
    shakai: { name: "ちずぐも",     tint: "#4f7f5a", glow: "#7ddc8f" }
  };
  function cloudShape(fill, extra) {
    return '<g fill="' + fill + '"' + (extra || "") + '><circle cx="52" cy="78" r="26"/><circle cx="82" cy="62" r="32"/><circle cx="112" cy="80" r="24"/><rect x="34" y="74" width="96" height="32" rx="16"/></g>';
  }
  function villainFace(eye, brow, glow) {
    var dark = "#1a1418", s = "";
    if (glow) s += '<g fill="' + eye + '" opacity="0.35"><polygon points="54,81 80,89 77,99 56,97"/><polygon points="110,81 84,89 87,99 108,97"/></g>';
    s += '<polygon points="58,84 76,90 74,96 60,94" fill="' + eye + '"/><polygon points="106,84 88,90 90,96 104,94" fill="' + eye + '"/>';
    s += '<ellipse cx="68" cy="91" rx="1.8" ry="4" fill="' + dark + '"/><ellipse cx="96" cy="91" rx="1.8" ry="4" fill="' + dark + '"/>';
    s += '<path d="M54 76 L78 86 M110 76 L86 86" stroke="' + (brow || dark) + '" stroke-width="6" stroke-linecap="round"/>';
    s += '<path d="M62 102 Q82 116 102 102 Q82 109 62 102 Z" fill="#2b0f12" stroke="' + dark + '" stroke-width="1.5"/>';
    s += '<polygon points="69,104 74,105 71,112" fill="#fff"/><polygon points="90,105 95,104 93,112" fill="#fff"/>';
    return s;
  }
  function cloudItem(subject, col, line) {
    if (subject === "kokugo") return '<g transform="rotate(28 80 128)"><rect x="76" y="110" width="8" height="26" rx="3" fill="#8a5a2b"/><path d="M74 136 Q80 156 86 136 Z" fill="#1a1418" stroke="' + col + '" stroke-width="2"/></g><circle cx="110" cy="126" r="4" fill="' + col + '"/><circle cx="118" cy="142" r="5" fill="' + col + '"/><circle cx="46" cy="132" r="4" fill="' + col + '"/>';
    if (subject === "sansu") return '<g font-size="24" font-weight="900" fill="' + col + '" text-anchor="middle" font-family="sans-serif"><text x="50" y="138">+</text><text x="80" y="152">×</text><text x="112" y="136">÷</text><text x="128" y="155">−</text></g>';
    if (subject === "rika") return '<path d="M67 138 H93 L99 146 Q100 151 95 151 H65 Q60 151 61 146 Z" fill="' + col + '"/><path d="M74 114 H86 V122 L99 146 Q100 151 95 151 H65 Q60 151 61 146 L74 122 Z" fill="none" stroke="' + line + '" stroke-width="3" stroke-linejoin="round"/><circle cx="112" cy="128" r="4" fill="' + col + '"/><circle cx="46" cy="138" r="4" fill="' + col + '"/>';
    return '<path d="M122 62 V30" stroke="#cfc8b8" stroke-width="3"/><path d="M122 30 L142 36 L122 43 Z" fill="' + col + '"/><circle cx="80" cy="136" r="14" fill="#fff" stroke="#2b2a27" stroke-width="3"/><polygon points="80,124 85,136 80,148 75,136" fill="#e4572e"/><polygon points="85,136 80,148 75,136" fill="#8b93a7"/>';
  }
  function svgWrap(inner, label) {
    return '<svg viewBox="0 0 160 160" width="100%" height="100%" role="img" aria-label="' + label + '" focusable="false">' + inner + '</svg>';
  }
  /** ボスの絵（SVG文字列）。maou=魔王ぐも / defeated=はれた空 */
  function artHtml(subject, maou, defeated) {
    var c = CLOUD[subject] || CLOUD.rika;
    if (defeated) {
      return svgWrap('<circle cx="80" cy="80" r="78" fill="#cfe8ff"/><g stroke="#f2b42c" stroke-width="7" stroke-linecap="round"><path d="M80 18 V34 M80 126 V142 M18 80 H34 M126 80 H142 M36 36 L47 47 M113 113 L124 124 M124 36 L113 47 M47 113 L36 124"/></g><circle cx="80" cy="80" r="34" fill="#f6c443"/><circle cx="68" cy="76" r="4" fill="#5a3a12"/><circle cx="92" cy="76" r="4" fill="#5a3a12"/><path d="M66 90 Q80 102 94 90" fill="none" stroke="#5a3a12" stroke-width="4" stroke-linecap="round"/>', "はれた空");
    }
    if (maou) {
      var horns = '<polygon points="62,40 50,12 78,34" fill="#8a1f2a" stroke="#2a0a0e" stroke-width="2.5" stroke-linejoin="round"/><polygon points="102,40 114,12 86,34" fill="#8a1f2a" stroke="#2a0a0e" stroke-width="2.5" stroke-linejoin="round"/>';
      var drips = '<polygon points="36,100 44,120 54,104 64,124 76,104 88,124 100,104 112,120 128,100" fill="#1a1420"/>';
      // 夕やけ空（赤むらさき）＋教科の色で光るフチ（黒い背景に雲がとけないように）
      var gid = "kqbSky-" + subject;
      var sky = '<defs><radialGradient id="' + gid + '" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#c2477a"/><stop offset="1" stop-color="#4a1236"/></radialGradient></defs><circle cx="80" cy="80" r="78" fill="url(#' + gid + ')"/>';
      return svgWrap(sky + cloudShape("none", ' stroke="' + c.glow + '" stroke-width="5"') + horns + drips + cloudShape("#1a1420") + villainFace(c.glow, c.glow, true) + cloudItem(subject, c.glow, "#ffffff"), c.name + "魔王");
    }
    var col = subject === "kokugo" ? "#2b2a27" : subject === "sansu" ? "#e0a21a" : subject === "rika" ? "#5bb6c9" : "#e4572e";
    return svgWrap(cloudShape(c.tint) + villainFace("#f6d743") + cloudItem(subject, col, "#2b2a27"), c.name);
  }
  var BOSS_THEME = {
    cloud: CLOUD,
    color: {   // 教科の色（ボスの丸・カード）
      rika:   { bg: "#faeeda", ink: "#633806", ring: "#e2b66e" },
      shakai: { bg: "#eaf3de", ink: "#27500a", ring: "#9ccf6c" },
      kokugo: { bg: "#fcebeb", ink: "#791f1f", ring: "#e89a9a" },
      sansu:  { bg: "#e3ebf8", ink: "#1f3d6e", ring: "#8fb0e0" }
    },
    bar: { hi: "#46b06a", mid: "#f0b429", lo: "#e5533d", track: "#ece8df", midAt: 0.5, loAt: 0.2 },
    text: {
      cardTitle: "⚔️ ボスとたたかう",
      nextTest: function (t, days) { return (t.kind === "kumiwake" ? "組分けテスト" : "カリキュラムテスト") + "（" + Number(t.date.slice(5, 7)) + "/" + Number(t.date.slice(8, 10)) + "）まで あと" + days + "日" + (t.kind === "kumiwake" ? "　😈 魔王があらわれた！（たおすとシール2まい）" : ""); },
      noTest: "つぎのテストは まだ きまっていないよ",
      hp: "のこりHP",
      fight: "たたかう",
      defeated: "たおした！",
      notReady: "📸 問題じゅんび中：テキストのこの回の写真をとって、パパにわたそう",
      unknown: "HPはクイズをひらくと わかるよ",
      other: "ほかのボスをえらぶ",
      otherClose: "とじる",
      range: function (r) { return "第" + r.join("・") + "回"; },
      winTitle: function (st) { return st.maou ? "魔王をたおした！" : "ボスをたおした！"; },
      winSub: function (st) { return st.name + "を やっつけたよ"; },
      winSticker: function (st) { return "ごほうびシールを" + (st.reward || 1) + "まい ゲット！"; },
      winStickerHub: "シール帳で はがしてね",
      winStickerPage: "げんかんの シール帳で はがしてね",
      ok: "やったね！"
    }
  };

  var CSS = [
    ".kqb-card .kqb-sub{font-size:12.5px;font-weight:700;color:#6b6a66;margin:-4px 0 10px}",
    ".kqb-list{display:flex;flex-direction:column;gap:8px}",
    ".kqb-row{display:flex;align-items:center;gap:12px;border-radius:16px;padding:10px 12px;text-decoration:none;color:var(--kqb-ink);background:var(--kqb-bg);border:2px solid transparent}",
    "a.kqb-row:active{transform:scale(.99)}",
    ".kqb-row.is-off{opacity:.55}",
    ".kqb-row.is-defeated{border-color:#ffd45e}",
    ".kqb-ava{flex:none;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#fff;box-shadow:inset 0 0 0 3px var(--kqb-ring);overflow:hidden}",
    ".kqb-ava svg{display:block;width:100%;height:100%}",
    ".kqb-ava.is-maou{background:#151219;box-shadow:0 0 0 2px #2a2233,0 0 10px 1px var(--kqb-glow)}",
    ".kqb-row.is-maou{background:#2a2233;color:#fff;border-color:var(--kqb-glow)}",
    ".kqb-row.is-maou .kqb-go{background:var(--kqb-glow);color:#1a1418}",
    ".kqb-hud.is-maou{background:#2a2233;color:#fff}",
    ".kqb-body{flex:1;min-width:0}",
    ".kqb-name{font-weight:900;font-size:14.5px}",
    ".kqb-bar{position:relative;height:16px;border:2.5px solid #2b2a27;border-radius:8px;background:" + BOSS_THEME.bar.track + ";overflow:hidden;margin-top:5px;box-sizing:content-box}",
    ".kqb-bar::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(10% - 2px),rgba(0,0,0,.18) calc(10% - 2px),rgba(0,0,0,.18) 10%);pointer-events:none}",
    ".kqb-fill{position:absolute;left:0;top:0;bottom:0;background:" + BOSS_THEME.bar.hi + ";transition:width .5s ease,background .3s}",
    ".kqb-bar.is-zero::before{content:'たおした！';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#b4552f;z-index:1}",
    ".is-maou .kqb-bar{border-color:#fff}",
    ".kqb-fill.mid{background:" + BOSS_THEME.bar.mid + "}",
    ".kqb-fill.lo{background:" + BOSS_THEME.bar.lo + "}",
    ".kqb-bar.is-faded{opacity:.35}",
    ".kqb-hpt{font-size:11.5px;font-weight:700;margin-top:3px;font-variant-numeric:tabular-nums}",
    ".kqb-go{flex:none;font-size:12.5px;font-weight:900;border-radius:12px;padding:8px 11px;background:var(--kqb-ink);color:#fff;white-space:nowrap}",
    ".kqb-badge{flex:none;font-size:12px;font-weight:900;border-radius:999px;padding:5px 10px;background:#fff6d6;color:#8a5a00;border:2px solid #ffd45e;white-space:nowrap}",
    ".kqb-other{margin-top:10px}",
    ".kqb-other-btn{appearance:none;font:inherit;font-size:13px;font-weight:900;border:1.5px solid #e3e0d8;background:#fff;color:#2b2a27;border-radius:12px;padding:8px 14px;cursor:pointer}",
    ".kqb-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}",
    ".kqb-chip{appearance:none;font:inherit;font-size:12.5px;font-weight:700;border:2px solid #e3e0d8;background:#fff;color:#2b2a27;border-radius:999px;padding:5px 11px;cursor:pointer}",
    ".kqb-chip[aria-pressed=true]{border-color:#2b2a27;background:#f6f4ef}",
    ".kqb-chip .kqb-cnt{font-size:11px;color:#8a5a00;margin-left:3px}",
    ".kqb-hud{display:flex;align-items:center;gap:10px;border-radius:16px;padding:8px 12px;margin-bottom:10px;background:var(--kqb-bg);color:var(--kqb-ink)}",
    ".kqb-hud .kqb-ava{width:46px;height:46px}",
    ".kqb-hud.hit .kqb-ava{animation:kqbHit .45s ease}",
    "@keyframes kqbHit{0%{transform:none}25%{transform:translateX(-5px) rotate(-8deg)}50%{transform:translateX(5px) rotate(6deg)}100%{transform:none}}",
    ".kqb-ov{position:fixed;inset:0;background:rgba(43,42,39,.6);display:flex;align-items:center;justify-content:center;padding:20px;z-index:80}",
    ".kqb-win{background:linear-gradient(160deg,#fffbea,#ffe9f4);border:3px solid #ffd45e;border-radius:28px;padding:24px 20px 20px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 50px -10px rgba(0,0,0,.4)}",
    ".kqb-win .kqb-big{width:120px;height:120px;margin:0 auto;animation:kqbPop .6s cubic-bezier(.2,1.4,.4,1) both}",
    ".kqb-win .kqb-big svg{display:block;width:100%;height:100%}",
    ".kqb-win .kqb-t{font-size:22px;font-weight:900;color:#b7791f;margin-top:6px}",
    ".kqb-win .kqb-s{font-size:14px;font-weight:700;margin-top:4px;color:#2b2a27}",
    ".kqb-win .kqb-st{margin-top:12px;background:#fff;border:2.5px dashed #b48be8;border-radius:16px;padding:10px;font-size:14px;font-weight:900;color:#6b3fc0}",
    ".kqb-win .kqb-st small{display:block;font-size:12px;color:#6b6a66;font-weight:700;margin-top:2px}",
    ".kqb-win button{margin-top:14px;appearance:none;border:none;border-radius:14px;padding:12px 28px;font:inherit;font-size:16px;font-weight:900;background:#f5b301;color:#fff;cursor:pointer}",
    "@keyframes kqbPop{0%{transform:scale(.3) rotate(-20deg);opacity:0}100%{transform:none;opacity:1}}",
    "@media (prefers-reduced-motion: reduce){.kqb-win .kqb-big,.kqb-hud.hit .kqb-ava{animation:none}.kqb-fill{transition:none}}"
  ].join("\n");

  function ensureStyle() {
    var d = global.document;
    if (!d || d.getElementById("kqbStyle")) return;
    var s = d.createElement("style"); s.id = "kqbStyle"; s.textContent = CSS;
    (d.head || d.documentElement).appendChild(s);
  }
  function el(tag, cls, text) {
    var e = global.document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function paint(node, subject) {
    var c = BOSS_THEME.color[subject] || BOSS_THEME.color.rika;
    node.style.setProperty("--kqb-bg", c.bg); node.style.setProperty("--kqb-ink", c.ink); node.style.setProperty("--kqb-ring", c.ring);
    node.style.setProperty("--kqb-glow", (CLOUD[subject] || CLOUD.rika).glow);
  }
  function avatar(subject, defeated, maou) {
    var a = el("span", "kqb-ava" + (defeated ? " is-defeated" : "") + (maou && !defeated ? " is-maou" : ""));
    a.innerHTML = artHtml(subject, maou, defeated);
    a.setAttribute("aria-hidden", "true");
    return a;
  }
  function bar(hp, max, faded) {
    var b = el("div", "kqb-bar" + (faded ? " is-faded" : ""));
    b.setAttribute("role", "img");
    var f = el("div", "kqb-fill"); b.appendChild(f);
    setBar(b, hp, max);
    return b;
  }
  function setBar(b, hp, max) {
    var f = b.querySelector(".kqb-fill");
    var r = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
    f.style.width = Math.round(r * 100) + "%";
    f.className = "kqb-fill" + (r <= BOSS_THEME.bar.loAt ? " lo" : r <= BOSS_THEME.bar.midAt ? " mid" : "");
    b.setAttribute("aria-label", BOSS_THEME.text.hp + " " + hp + " / " + max);
    b.classList.toggle("is-zero", max > 0 && hp === 0);
  }
  function hpText(st) { return BOSS_THEME.text.hp + " " + st.hp + " / " + st.max; }

  /** 玄関のボス1体ぶんの行（a または div） */
  function row(st, href) {
    ensureStyle();
    var T = BOSS_THEME.text, can = st.ready && href;
    var r = el(can ? "a" : "div", "kqb-row" + (st.defeated ? " is-defeated" : "") + (st.known && !st.ready ? " is-off" : "") + (st.maou && !st.defeated ? " is-maou" : ""));
    if (can) { r.href = href; r.target = "_top"; }
    r.setAttribute("data-boss", st.id);
    paint(r, st.subject);
    r.appendChild(avatar(st.subject, !!st.defeated, st.maou));
    var body = el("span", "kqb-body");
    body.appendChild(el("span", "kqb-name", st.name));
    body.lastChild.style.display = "block";
    if (st.ready) {
      body.appendChild(bar(st.hp, st.max, !!st.defeated));
      body.appendChild(el("span", "kqb-hpt", hpText(st)));
      body.lastChild.style.display = "block";
    } else {
      body.appendChild(el("span", "kqb-hpt", st.known ? T.notReady : T.unknown));
      body.lastChild.style.display = "block";
    }
    r.appendChild(body);
    if (st.defeated) r.appendChild(el("span", "kqb-badge", T.defeated));
    else if (can) r.appendChild(el("span", "kqb-go", T.fight));
    return r;
  }

  /** クイズ画面の上のHPバー */
  function hud(subject, rounds) {
    ensureStyle();
    var h = el("div", "kqb-hud");
    h.setAttribute("role", "status");
    paint(h, subject);
    h.appendChild(avatar(subject, false));
    var body = el("div", "kqb-body");
    body.appendChild(el("div", "kqb-name", ""));
    body.appendChild(bar(1, 1, false));
    body.appendChild(el("div", "kqb-hpt", ""));
    h.appendChild(body);
    return h;
  }
  function updateHud(h, st) {
    var prev = h.getAttribute("data-hp");
    h.querySelector(".kqb-name").textContent = st.name;
    var ava = h.querySelector(".kqb-ava");
    var down = !!st.defeated || st.hp === 0;
    var look = (down ? "d" : "") + (st.maou ? "m" : "");
    if (ava.getAttribute("data-look") !== look) { ava.innerHTML = artHtml(st.subject, st.maou, down); ava.setAttribute("data-look", look); }
    ava.className = "kqb-ava" + (down ? " is-defeated" : "") + (st.maou && !down ? " is-maou" : "");
    h.classList.toggle("is-maou", !!st.maou && !down);
    setBar(h.querySelector(".kqb-bar"), st.hp || 0, st.max || 0);
    h.querySelector(".kqb-bar").className = "kqb-bar" + (st.defeated && st.hp > 0 ? " is-faded" : "");
    h.querySelector(".kqb-hpt").textContent = hpText(st) + (st.defeated ? "　" + BOSS_THEME.text.defeated : "");
    if (prev !== null && Number(prev) > st.hp) { h.classList.remove("hit"); void h.offsetWidth; h.classList.add("hit"); }
    h.setAttribute("data-hp", String(st.hp));
  }

  /** 撃破のお祝い。opts.where: "hub" | "page" */
  function celebrate(st, opts) {
    ensureStyle();
    opts = opts || {};
    var d = global.document, T = BOSS_THEME.text;
    var old = d.getElementById("kqbWin"); if (old && old.parentNode) old.parentNode.removeChild(old);
    var ov = el("div", "kqb-ov"); ov.id = "kqbWin"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    var box = el("div", "kqb-win");
    var bigArt = el("div", "kqb-big"); bigArt.innerHTML = artHtml(st.subject, st.maou, false);
    box.appendChild(bigArt);
    box.appendChild(el("div", "kqb-t", T.winTitle(st)));
    box.appendChild(el("div", "kqb-s", T.winSub(st)));
    var stk = el("div", "kqb-st", T.winSticker(st));
    stk.appendChild(el("small", "", opts.where === "hub" ? T.winStickerHub : T.winStickerPage));
    box.appendChild(stk);
    var b = el("button", "", T.ok); b.type = "button"; b.id = "kqbWinClose";
    b.addEventListener("click", function () { if (ov.parentNode) ov.parentNode.removeChild(ov); if (opts.onClose) opts.onClose(); });
    box.appendChild(b);
    ov.appendChild(box);
    d.body.appendChild(ov);
    // 少しおくれて絵を「たおれた」絵に変える
    global.setTimeout(function () { var big = box.querySelector(".kqb-big"); if (big) big.innerHTML = artHtml(st.subject, st.maou, true); }, 900);
    return ov;
  }

  global.KQBossTheme = { BOSS_THEME: BOSS_THEME, artHtml: artHtml, ensureStyle: ensureStyle, row: row, hud: hud, updateHud: updateHud, celebrate: celebrate, bar: bar, setBar: setBar, avatar: avatar };
})(window);

/* ============================================================
   [もう一回] まちがえた問題の出し直し（window.KQRetry）
   1しゅうめ（ふつうの出題）が終わったら、まちがえた問題をすぐ続けて出す（2しゅうめ）。
   2しゅうめでもまちがえたものはもう1回（3しゅうめ）。3しゅうめでまちがえたら答えを見せておわり。
   2・3しゅうめは記録しない（recordAnswer を呼ばない＝スコア・今日の数・シール・★・送信・ボスHPに入らない）。
   ============================================================ */
(function (global) {
  "use strict";
  var MAX_PASS = 3;
  var CSS = ".kq-pass-tag{display:inline-block;align-self:flex-start;font-size:12.5px;font-weight:900;border-radius:999px;padding:3px 12px;background:#e6f1fb;color:#0c447c;border:1.5px dashed #7fb1e3;margin-right:6px}" +
            ".kq-pass-tag[hidden]{display:none}.kq-retry-sum{margin-top:6px;font-size:13.5px;font-weight:900;color:#0c447c}";
  function ensureStyle() {
    var d = global.document;
    if (!d || d.getElementById("kqRetryStyle")) return;
    var s = d.createElement("style"); s.id = "kqRetryStyle"; s.textContent = CSS;
    (d.head || d.documentElement).appendChild(s);
  }
  function create() {
    var pass = [], res = [];
    return {
      /** 新しいセットの開始（queue は1しゅうめの問題の配列） */
      start: function (queue) { pass = queue.map(function () { return 1; }); res = []; },
      passAt: function (i) { return pass[i] || 1; },
      /** 記録してよいのは1しゅうめだけ */
      counts: function (i) { return (pass[i] || 1) === 1; },
      mark: function (i, correct) { res[i] = !!correct; },
      /** queue の最後まで来たら呼ぶ。まちがえた問題を queue の後ろに足して、新しい「しゅう」の番号を返す（足さなければ0） */
      extend: function (queue) {
        var n = queue.length;
        if (!n) return 0;
        var last = pass[n - 1] || 1;
        if (last >= MAX_PASS) return 0;
        var add = [];
        for (var i = 0; i < n; i++) if ((pass[i] || 1) === last && res[i] === false) add.push(queue[i]);
        if (!add.length) return 0;
        add.forEach(function (q) { queue.push(q); pass.push(last + 1); });
        return last + 1;
      },
      /** 1しゅうめでまちがえ、もう一回（2・3しゅうめ）で正解できた問題の数 */
      recovered: function () { var c = 0; for (var i = 0; i < pass.length; i++) if (pass[i] > 1 && res[i] === true) c++; return c; }
    };
  }
  /** 問題カードの「もう一回（2しゅうめ）」札。before の直前に置く */
  function tag(before, p) {
    if (!before || !before.parentNode) return;
    ensureStyle();
    var t = before.parentNode.querySelector(".kq-pass-tag");
    if (!t) { t = global.document.createElement("span"); t.className = "kq-pass-tag"; before.parentNode.insertBefore(t, before); }
    t.hidden = !(p > 1);
    t.textContent = p > 1 ? "もう一回（" + p + "しゅうめ）" : "";
  }
  /** 結果画面の「もう一回で正解できた: n問」。after の直後に置く（0なら隠す） */
  function summary(after, n) {
    if (!after || !after.parentNode) return;
    ensureStyle();
    var s = after.parentNode.querySelector(".kq-retry-sum");
    if (!s) { s = global.document.createElement("div"); s.className = "kq-retry-sum"; after.parentNode.insertBefore(s, after.nextSibling); }
    s.hidden = !(n > 0);
    s.textContent = n > 0 ? "🔁 もう一回で正解できた: " + n + "問" : "";
  }
  global.KQRetry = { MAX_PASS: MAX_PASS, create: create, tag: tag, summary: summary };
})(window);
