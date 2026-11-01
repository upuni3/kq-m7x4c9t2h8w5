/* ============================================================
   stars.js — 玄関の「★」計算（純関数＋localStorage読み取りのみ）
   入力は既存の日別記録 daily: "YYYY-MM-DD" -> { subject: {total, correct} }
   追加の保存はしない。過去日の★も daily から毎回数え直す。

   ★のルール（日ごとに判定、獲得数に上限なし、重ねて獲得）
     (1) 3教科すべてがその日30問以上 → ★1
     (2) 1教科でその日50問以上 → その教科ごとに★1（最大3）
     (3) 1教科でその日30問以上かつ正答率90%以上 → その教科ごとに★1（最大3）
   ============================================================ */
(function (global) {
  "use strict";

  var SUBJECTS = ["rika", "shakai", "kokugo"];
  var SUBJECT_NAMES = { rika: "理科", shakai: "社会", kokugo: "国語" };
  var ALL3_MIN = 30;      // (1) 3教科そろいの最低問題数（各教科）
  var VOLUME_MIN = 50;    // (2) 1教科の問題数
  var ACC_MIN_TOTAL = 30; // (3) 1教科の最低問題数
  var ACC_PCT = 90;       // (3) 正答率（%）。整数比較で誤差を避ける

  var STORE_KEY = "kq-hub-v1-stats";

  function num(v) {
    v = Number(v);
    return isFinite(v) && v > 0 ? Math.floor(v) : 0;
  }
  // {total, correct} を安全な整数にそろえる（correct > total は total に丸める）
  function norm(e) {
    var total = num(e && e.total);
    var correct = Math.min(num(e && e.correct), total);
    return { total: total, correct: correct };
  }
  function accOk(total, correct) {
    return total >= ACC_MIN_TOTAL && correct * 100 >= total * ACC_PCT;
  }

  /** 1日分 {subject:{total,correct}} → ★の内訳 */
  function starsForDay(day) {
    day = day || {};
    var e = {};
    SUBJECTS.forEach(function (s) { e[s] = norm(day[s]); });

    var all3 = SUBJECTS.every(function (s) { return e[s].total >= ALL3_MIN; }) ? 1 : 0;
    var volume = {}, accuracy = {}, volumeCount = 0, accuracyCount = 0;
    SUBJECTS.forEach(function (s) {
      volume[s] = e[s].total >= VOLUME_MIN ? 1 : 0;
      accuracy[s] = accOk(e[s].total, e[s].correct) ? 1 : 0;
      volumeCount += volume[s];
      accuracyCount += accuracy[s];
    });
    return {
      all3: all3,
      volume: volume,
      accuracy: accuracy,
      volumeCount: volumeCount,
      accuracyCount: accuracyCount,
      total: all3 + volumeCount + accuracyCount
    };
  }

  /** daily 全体 → ★の合計（過去日も含む） */
  function totalStars(daily) {
    var sum = 0;
    Object.keys(daily || {}).forEach(function (d) {
      sum += starsForDay(daily[d]).total;
    });
    return sum;
  }

  /** 今日の★の内訳 */
  function todayStars(daily, todayKey) {
    return starsForDay((daily || {})[todayKey]);
  }

  /**
   * あと何問で次の★か（今日の教科別）。
   * 教科ごとに「まだ取れていない★」のうち一番近いもの。
   *  - 50問★: 50 - total
   *  - 正答率★: 以降ぜんぶ正解した場合に30問以上かつ90%以上になるまでの問題数
   * 戻り値: { rika:{remaining, kind, needAllCorrect} | null, ... , all3: {remaining}|null }
   *  null はその教科の★がもう出そろっている（取れる★がない）
   *  all3: まだ3教科そろい★が未獲得のとき、足りない問題数の合計
   */
  function hintsForDay(day) {
    day = day || {};
    var out = {}, short = 0;
    SUBJECTS.forEach(function (s) {
      var e = norm(day[s]);
      var best = null;
      if (e.total < VOLUME_MIN) {
        best = { remaining: VOLUME_MIN - e.total, kind: "volume", needAllCorrect: false };
      }
      if (!accOk(e.total, e.correct)) {
        // ぜんぶ正解で何問足せば条件を満たすか
        var n = 1;
        while (!accOk(e.total + n, e.correct + n) && n < 1000) n++;
        if (!best || n < best.remaining) {
          best = { remaining: n, kind: "accuracy", needAllCorrect: true };
        }
      }
      out[s] = best;
      short += Math.max(0, ALL3_MIN - e.total);
    });
    out.all3 = short > 0 ? { remaining: short } : null;
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

  var api = {
    SUBJECTS: SUBJECTS,
    SUBJECT_NAMES: SUBJECT_NAMES,
    starsForDay: starsForDay,
    totalStars: totalStars,
    todayStars: todayStars,
    hintsForDay: hintsForDay,
    readDaily: readDaily
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.KQStars = api;
})(typeof window !== "undefined" ? window : globalThis);
