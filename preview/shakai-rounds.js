/* ============================================================
   shakai-rounds.js — 社会「回」の定義表（予習シリーズ4年下 第1〜19回）
   shakai.html（回で選ぶ）と index.html（玄関のテスト範囲おすすめ）の両方が読む。
   回の定義はこのファイルの SHAKAI_ROUND_TABLE の1か所だけ。

   ■ 行の書き方
     通常の回 : { round:6,  units:["chugoku_shikoku"] }   // units = shakai.html の REGIONS の id
     まとめ回 : { round:5,  mix:[1,2,3,4] }               // 含まれる回のうち問題がある回を合わせて出題
     準備中   : { round:8,  units:[] }                    // 問題がまだ無い回（「じゅんび中」で押せない）

   ■ 新しい単元（例: 第8回）を足すとき
     1) shakai.html の REGIONS に { id:"xxx", emoji, name, subtitle, questions } を1つ足す
     2) この表の { round:8, units:[] } を { round:8, units:["xxx"] } に書き換える（1行）
        → 回ビューに自動で出る。第10回などのまとめ回にも自動で含まれる。
   ============================================================ */
(function (global) {
  "use strict";

  var SHAKAI_ROUND_TABLE = [
    { round: 1,  units: ["hokkaido_tohoku"] },
    { round: 2,  units: ["kanto"] },
    { round: 3,  units: ["chubu"] },
    { round: 4,  units: ["kinki"] },
    { round: 5,  mix: [1, 2, 3, 4] },
    { round: 6,  units: ["chugoku_shikoku"] },
    { round: 7,  units: ["kyushu_okinawa"] },
    { round: 8, units: ["round8"] },
    { round: 9,  units: ["round9"] },
    { round: 10, mix: [6, 7, 8, 9] },
    { round: 11, units: ["round11"] },
    { round: 12, units: ["round12"] },
    { round: 13, units: ["round13"] },
    { round: 14, units: ["round14"] },
    { round: 15, mix: [11, 12, 13, 14] },
    { round: 16, units: [] },
    { round: 17, units: [] },
    { round: 18, units: [] },
    { round: 19, mix: [16, 17, 18] }
  ];

  function entry(round) {
    for (var i = 0; i < SHAKAI_ROUND_TABLE.length; i++) {
      if (SHAKAI_ROUND_TABLE[i].round === round) return SHAKAI_ROUND_TABLE[i];
    }
    return null;
  }
  function isMix(round) {
    var e = entry(round);
    return !!(e && e.mix);
  }

  /** 回 → 単元ID（まとめ回は含まれる回の単元を重複なしで合算。表に無い回は無視） */
  function unitsFor(round, _seen) {
    var seen = _seen || {};
    if (seen[round]) return [];
    seen[round] = true;
    var e = entry(round);
    if (!e) return [];
    if (!e.mix) return (e.units || []).slice();
    var out = [];
    e.mix.forEach(function (r) {
      unitsFor(r, seen).forEach(function (u) { if (out.indexOf(u) < 0) out.push(u); });
    });
    return out;
  }
  /** 回のリスト → 単元ID（重複なし） */
  function unitsForRounds(rounds) {
    var out = [];
    (rounds || []).forEach(function (r) {
      unitsFor(Number(r)).forEach(function (u) { if (out.indexOf(u) < 0) out.push(u); });
    });
    return out;
  }
  /** その回に出題できる単元があるか（まとめ回は含まれる回のどれかにあればtrue） */
  function isReady(round) {
    return unitsFor(round).length > 0;
  }
  /** まとめ回に含まれる回のうち、まだ問題が無い回（通常の回のみ） */
  function missingRounds(round) {
    var e = entry(round);
    if (!e || !e.mix) return [];
    return e.mix.filter(function (r) { return !isReady(r); });
  }
  /** 単元ID → その単元がある通常の回（地方カードの「第◯回」表示用） */
  function roundsOfUnit(unitId) {
    return SHAKAI_ROUND_TABLE.filter(function (e) {
      return !e.mix && (e.units || []).indexOf(unitId) >= 0;
    }).map(function (e) { return e.round; });
  }
  /** [1,2,3,4] → "第1〜4回"、[6,7,9] → "第6・7・9回" */
  function rangeText(rounds) {
    var rs = rounds.slice().sort(function (a, b) { return a - b; });
    if (!rs.length) return "";
    var contiguous = rs.every(function (r, i) { return i === 0 || r === rs[i - 1] + 1; });
    if (rs.length >= 3 && contiguous) return "第" + rs[0] + "〜" + rs[rs.length - 1] + "回";
    return "第" + rs.join("・") + "回";
  }

  var api = {
    table: SHAKAI_ROUND_TABLE,
    entry: entry,
    isMix: isMix,
    unitsFor: unitsFor,
    unitsForRounds: unitsForRounds,
    isReady: isReady,
    missingRounds: missingRounds,
    roundsOfUnit: roundsOfUnit,
    rangeText: rangeText
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.KQShakaiRounds = api;
})(typeof window !== "undefined" ? window : globalThis);
