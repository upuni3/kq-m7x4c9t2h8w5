/* ============================================================
   stickers-award.js — シール獲得の計算（純関数＋localStorage読み取りのみ）
   入力は既存の日別記録 daily: "YYYY-MM-DD" -> { subject: {total, correct} }
   追加の保存は「既見数」(kq-hub-v1-stickers-seen) だけ。獲得シールは毎回 daily から導く。

   ルール
     (1) 1日・1教科で30問解くごとに、その教科のシール1枚（floor(その日の教科total/30)枚、上限なし）
     (2) 3教科すべてがその日30問以上 → その日「キラ」シール1枚を追加
   どのシールが出るか（決定的・v3）
     日付昇順に、各教科の「通算 n 枚目」を数え、n 枚目の柄は 教科名+n から作る決定的な擬似乱数で選ぶ（完全ランダム）。
     救済: ダブり（既に持っている柄）が5回連続したら、次は必ず未所持の柄（未所持の中から選ぶ）。
     新しい柄が出るたび連続ダブり数は0に戻る。全種そろったあとは一様ランダム（ダブりのみ）。
     移行: 旧ロジック（15種の固定シード順列）で既にもらった枚数 L は kq-hub-v3-legacy に1度だけ保存し、
           n < L は旧順列の柄のまま（没収しない・連続ダブり0扱い）、n >= L から新ロジック。
     同じ daily + 同じ legacy なら常に同じ結果（Math.random は使わない）。
   ============================================================ */
(function (global) {
  "use strict";

  var SUBJECTS = ["rika", "shakai", "kokugo"];             // 問題を解く教科
  var ALL = ["rika", "shakai", "kokugo", "kira"];          // シール帳の区分
  var NAMES = { rika: "理科", shakai: "社会", kokugo: "国語", kira: "キラ" };
  var POOL = { rika: 15, shakai: 15, kokugo: 15, kira: 9 }; // 種類数（stickers.js のカタログと同じ）
  var PER = 30;                                             // 1枚あたりの問題数

  var STORE_KEY = "kq-hub-v1-stats";
  var SEEN_KEY = "kq-hub-v2-stickers-seen"; // v1は過去分一括付与の版で使用。破棄
  var FROZEN_KEY = "kq-hub-v4-frozen";      // 乱数の偏り修正前(v3)に獲得済みの枚数 {rika,shakai,kokugo,kira}（初回に1度だけ保存）
  var LEGACY_KEY = "kq-hub-v3-legacy";      // 旧ロジックで獲得済みの枚数 {rika,shakai,kokugo,kira}（初回に1度だけ保存）
  var RESCUE_AFTER = 5;                     // ダブりがこの回数続いたら次は必ず新規
  var START_DATE = "2026-10-11"; // この日以降の記録だけシール対象（過去へは遡らない）

  function num(v) {
    v = Number(v);
    return isFinite(v) && v > 0 ? Math.floor(v) : 0;
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function idOf(subject, index) { return subject + "-" + pad2(index + 1); } // 例 rika-01 / kira-09

  // ---- 固定シード付き乱数（FNV-1a + mulberry32） ----
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  // MurmurHash3 の最終ミックス。連番に近い文字列のハッシュでも出力がバラけるようにする
  function fmix(h) {
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var permCache = {};
  /** 教科 subject の round 周目の順列（0..POOL-1 の並べ替え）。周の境目で同じ柄が連続しないよう補正 */
  function permFor(subject, round) {
    var key = subject + "#" + round;
    if (permCache[key]) return permCache[key];
    var n = POOL[subject];
    function shuffled(r) {
      var rand = rng(hashStr("kq-sticker-v1|" + subject + "|" + r));
      var a = [], i, j, t;
      for (i = 0; i < n; i++) a.push(i);
      for (i = n - 1; i > 0; i--) {
        j = Math.floor(rand() * (i + 1));
        t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    var p = shuffled(round);
    if (round > 0) {
      var prev = permFor(subject, round - 1);
      if (p[0] === prev[n - 1]) { var t2 = p[0]; p[0] = p[1]; p[1] = t2; }
    }
    permCache[key] = p;
    return p;
  }

  /** 【旧ロジック】教科 subject の通算 k 枚目（0始まり）のシールID（固定シード順列方式） */
  function legacyStickerIdFor(subject, k) {
    var n = POOL[subject];
    var round = Math.floor(k / n);
    return idOf(subject, permFor(subject, round)[k % n]);
  }
  var stickerIdFor = legacyStickerIdFor; // 互換エイリアス（旧名）

  /** 【旧ロジック】daily から教科別の獲得枚数 L（START_DATE 以降）。移行の基準に使う */
  function legacyEarnedCounts(daily) {
    var L = {};
    ALL.forEach(function (s) { L[s] = 0; });
    Object.keys(daily || {}).forEach(function (d) {
      if (d < START_DATE) return;
      var c = dayCounts(daily[d]);
      ALL.forEach(function (s) { L[s] += c[s]; });
    });
    return L;
  }

  function dayCounts(day) {
    day = day || {};
    var t = {}, out = {};
    SUBJECTS.forEach(function (s) { t[s] = num(day[s] && day[s].total); });
    SUBJECTS.forEach(function (s) { out[s] = Math.floor(t[s] / PER); });
    out.kira = SUBJECTS.every(function (s) { return t[s] >= PER; }) ? 1 : 0;
    return out;
  }

  /**
   * daily 全体 → 教科（キラ含む）ごとの獲得リスト（日付昇順＝獲得順）
   * { rika:[{id, date, nth}], shakai:[...], kokugo:[...], kira:[...] }
   * nth はそのシールを何枚目として持ったか（1なら初ゲット＝NEW、2以上はダブり）
   * opts.legacy: {subject: L}（旧ロジックで獲得済みの枚数。省略時は 0＝全て新ロジック。Infinity なら全て旧順列）
   * opts.frozen: {subject: F}（乱数修正前の旧(v3)抽選で獲得済みの枚数。n<F の分は v3 のまま、以降は v4）。省略時は 0＝全て v4
   * opts.salt: テスト用のシード追加文字列（通常は使わない）
   */
  function earned(daily, opts) {
    opts = opts || {};
    var legacy = opts.legacy || {}, frozen = opts.frozen || {}, salt = opts.salt ? "|" + opts.salt : "";
    var out = {}, count = {}, have = {}, run = {};
    ALL.forEach(function (s) { out[s] = []; count[s] = 0; run[s] = 0; });
    function pick(s, n) {
      var L = legacy[s] === Infinity ? Infinity : num(legacy[s]);
      if (n < L) { run[s] = 0; return legacyStickerIdFor(s, n); }       // 旧分: 新規扱い・カウンタ0
      var pool = POOL[s];
      var F = frozen[s] === Infinity ? Infinity : num(frozen[s]);
      var r = n < F
        ? rng(hashStr("kq-sticker-v3|" + s + "|" + n + salt))()                 // 修正前に出た分（そのまま）
        : rng(fmix(hashStr("kq-sticker-v4|" + s + "|" + n + salt)))();          // 修正後（偏りなし）
      var id;
      if (run[s] >= RESCUE_AFTER) {
        var un = [];
        for (var i = 0; i < pool; i++) if (!have[idOf(s, i)]) un.push(i);
        id = un.length ? idOf(s, un[Math.floor(r * un.length)]) : idOf(s, Math.floor(r * pool));
      } else {
        id = idOf(s, Math.floor(r * pool));
      }
      run[s] = have[id] ? run[s] + 1 : 0;
      return id;
    }
    Object.keys(daily || {}).sort().forEach(function (d) {
      if (d < START_DATE) return;
      var c = dayCounts(daily[d]);
      ALL.forEach(function (s) {
        for (var i = 0; i < c[s]; i++) {
          var id = pick(s, count[s]);
          have[id] = (have[id] || 0) + 1;
          out[s].push({ id: id, date: d, nth: have[id] });
          count[s]++;
        }
      });
    });
    return out;
  }

  /** 獲得リスト → 集計 { counts:{subject:枚数}, owned:{id:枚数}, distinct:{subject:種類数}, total } */
  function summarize(e) {
    var counts = {}, owned = {}, distinct = {}, total = 0;
    ALL.forEach(function (s) {
      counts[s] = e[s].length;
      total += e[s].length;
      distinct[s] = 0;
      e[s].forEach(function (a) {
        if (!owned[a.id]) distinct[s]++;
        owned[a.id] = (owned[a.id] || 0) + 1;
      });
    });
    return { counts: counts, owned: owned, distinct: distinct, total: total };
  }

  /** 未見の獲得分（教科の並び順 → 獲得順）。seen は {subject: 既見数}（無い教科は0）。 */
  function unseen(e, seen) {
    seen = seen || {};
    var out = [];
    ALL.forEach(function (s) {
      var from = Math.min(num(seen[s]), e[s].length);
      e[s].slice(from).forEach(function (a) {
        out.push({ subject: s, id: a.id, date: a.date, nth: a.nth, isNew: a.nth === 1 });
      });
    });
    return out;
  }

  /**
   * 今日あと何問で次のシールか（教科別）と、キラまでのあと問数。
   * { rika:{remaining}, shakai:{remaining}, kokugo:{remaining}, kira:{remaining}|null }
   * remaining は常に 1〜30。kira は今日すでにもらっていれば null。
   */
  function hintsForDay(day) {
    day = day || {};
    var out = {}, short = 0;
    SUBJECTS.forEach(function (s) {
      var t = num(day[s] && day[s].total);
      out[s] = { remaining: PER - (t % PER) };
      short += Math.max(0, PER - t);
    });
    out.kira = short > 0 ? { remaining: short } : null;
    return out;
  }

  /** localStorage の既存記録から daily を読む（無い・壊れていれば {}） */
  function readDaily() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(STORE_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p.daily === "object" && p.daily) return p.daily;
      }
    } catch (e) {}
    return {};
  }

  /** 保存値（文字列/null）→ {rika,shakai,kokugo,kira: 既見数}。未保存・壊れは null（＝初回扱いで全部未見） */
  function parseSeen(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    try {
      var p = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!p || typeof p !== "object") return null;
      var out = {};
      ALL.forEach(function (s) { out[s] = num(p[s]); });
      return out;
    } catch (e) { return null; }
  }
  function readSeen() {
    try { return parseSeen(global.localStorage.getItem(SEEN_KEY)); } catch (e) { return null; }
  }
  /** 既見数を保存。いまの獲得数まで（それより小さい値には戻さない） */
  function writeSeen(counts, prev) {
    var out = {};
    ALL.forEach(function (s) { out[s] = Math.max(num(counts[s]), num(prev && prev[s])); });
    try { global.localStorage.setItem(SEEN_KEY, JSON.stringify(out)); } catch (e) {}
    return out;
  }

  /** 保存値 → {rika,shakai,kokugo,kira: 枚数}。未保存・壊れは null */
  function parseLegacy(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    try {
      var p = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!p || typeof p !== "object") return null;
      var out = {};
      ALL.forEach(function (s) { out[s] = num(p[s]); });
      return out;
    } catch (e) { return null; }
  }
  /**
   * 移行基準 L を返す。保存済みならそれ、無ければ旧ロジックで daily から計算して1度だけ保存。
   * localStorage が使えず保存できない環境では、全て旧順列で出す縮退（L=Infinity）。
   */
  function readLegacy(daily) {
    var ls = null, saved = null;
    try { ls = global.localStorage; saved = parseLegacy(ls.getItem(LEGACY_KEY)); } catch (e) { ls = null; }
    if (saved) return saved;
    var L = legacyEarnedCounts(daily);
    try {
      ls.setItem(LEGACY_KEY, JSON.stringify(L));
      if (parseLegacy(ls.getItem(LEGACY_KEY)) === null) throw new Error("not stored");
    } catch (e) {
      var d = {}; ALL.forEach(function (s) { d[s] = Infinity; }); return d;
    }
    return L;
  }

  /**
   * 乱数修正前に獲得済みの枚数 F を返す。保存済みならそれ、無ければ「いまの獲得枚数」を1度だけ保存。
   * 保存できない環境では全て v3 のまま（縮退）。
   */
  function readFrozen(daily, legacy) {
    var ls = null, saved = null;
    try { ls = global.localStorage; saved = parseLegacy(ls.getItem(FROZEN_KEY)); } catch (e) { ls = null; }
    if (saved) return saved;
    var e = earned(daily, { legacy: legacy, frozen: infFrozen() });
    var F = {}; ALL.forEach(function (s) { F[s] = e[s].length; });
    try {
      ls.setItem(FROZEN_KEY, JSON.stringify(F));
      if (parseLegacy(ls.getItem(FROZEN_KEY)) === null) throw new Error("not stored");
    } catch (err) { return infFrozen(); }
    return F;
  }
  function infFrozen() { var d = {}; ALL.forEach(function (s) { d[s] = Infinity; }); return d; }

  var api = {
    FROZEN_KEY: FROZEN_KEY, readFrozen: readFrozen,
    SUBJECTS: SUBJECTS, ALL: ALL, NAMES: NAMES, POOL: POOL, PER: PER, SEEN_KEY: SEEN_KEY, LEGACY_KEY: LEGACY_KEY, RESCUE_AFTER: RESCUE_AFTER,
    legacyStickerIdFor: legacyStickerIdFor, legacyEarnedCounts: legacyEarnedCounts,
    parseLegacy: parseLegacy, readLegacy: readLegacy,
    idOf: idOf, permFor: permFor, stickerIdFor: stickerIdFor,
    dayCounts: dayCounts, earned: earned, summarize: summarize, unseen: unseen,
    hintsForDay: hintsForDay, readDaily: readDaily,
    parseSeen: parseSeen, readSeen: readSeen, writeSeen: writeSeen
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.KQStickerAward = api;
})(typeof window !== "undefined" ? window : globalThis);
