/* ============================================================
   extras.js — ボス図鑑 と ミニゲーム券（神経衰弱）
   - ボスを倒すとミニゲーム券がもらえる（ふつうのボス1まい・魔王2まい。シールと同じ数）。
     もらった券の数は、ボス撃破の保存（kq-hub-v1-boss）から毎回導く。使った数だけ kq-hub-v1-game に保存。
   - あそべるのは1日2回まで。券は貯めておける。
   - ボス図鑑：たおしたボスの絵と日付を並べる（まだのボスは「？」のかげ）。
   common.js に依存しない自己完結（古い common.js が残っていても動く）。KQBossTheme / KQStickers があれば絵に使う。
   ============================================================ */
(function (global) {
  "use strict";
  var BOSS_KEY = "kq-hub-v1-boss";
  var GAME_KEY = "kq-hub-v1-game";
  var DAILY_MAX = 2;
  var SUBJECTS = ["rika", "shakai", "kokugo"];
  var NAMES = { rika: "理科", shakai: "社会", kokugo: "国語" };
  var RANGES = [[1, 2], [3, 4], [6, 7], [8, 9], [11, 12], [13, 14], [16, 17, 18]];

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function todayKey() { var d = new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function readJson(key) {
    try { var p = JSON.parse(global.localStorage.getItem(key) || "{}"); return p && typeof p === "object" && !Array.isArray(p) ? p : {}; } catch (e) { return {}; }
  }
  function writeJson(key, v) { try { global.localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // ---- ボスの保存を読む ----
  function bossId(subject, rounds) { return subject + "|" + rounds.join("-"); }
  function entry(v) {
    if (typeof v === "string") return { d: v, n: 1 };
    if (v && typeof v === "object" && typeof v.d === "string") return { d: v.d, n: Number(v.n) > 1 ? 2 : 1 };
    return null;
  }
  function bossList() {
    var s = readJson(BOSS_KEY), out = [];
    SUBJECTS.forEach(function (sub) {
      RANGES.forEach(function (r) {
        var e = entry(s[bossId(sub, r)]);
        out.push({ subject: sub, rounds: r.slice(), defeated: e ? e.d : null, maou: !!(e && e.n > 1) });
      });
    });
    return out;
  }

  // ---- 券 ----
  function earned() {
    return bossList().reduce(function (a, b) { return a + (b.defeated ? (b.maou ? 2 : 1) : 0); }, 0);
  }
  function game() {
    var g = readJson(GAME_KEY);
    g.used = Math.max(0, Math.floor(Number(g.used) || 0));
    g.days = g.days && typeof g.days === "object" ? g.days : {};
    return g;
  }
  function tickets() { return Math.max(0, earned() - game().used); }
  function playedToday() { return Math.max(0, Math.floor(Number(game().days[todayKey()]) || 0)); }
  function leftToday() { return Math.max(0, DAILY_MAX - playedToday()); }
  function canPlay() { return tickets() > 0 && leftToday() > 0; }
  /** 券を1まい使ってあそぶ。使えたら true */
  function spend() {
    if (!canPlay()) return false;
    var g = game(), t = todayKey();
    g.used += 1;
    g.days[t] = (Number(g.days[t]) || 0) + 1;
    // 古い日付は捨てる（7日ぶんだけ残す）
    Object.keys(g.days).sort().slice(0, -7).forEach(function (k) { delete g.days[k]; });
    return writeJson(GAME_KEY, g);
  }

  function el(tag, cls, text) {
    var e = global.document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var STYLE = ".kx-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}" +
    ".kx-tk{font-size:15px;font-weight:900}.kx-sub{font-size:12px;color:var(--ink-soft,#6b6a66);font-weight:700;margin-top:2px}" +
    ".kx-btn{appearance:none;border:none;border-radius:12px;padding:10px 16px;font-family:inherit;font-size:14px;font-weight:900;background:#2b2a27;color:#fff;text-decoration:none;cursor:pointer;display:inline-block}" +
    ".kx-btn[aria-disabled=true]{background:#d8d5cc;color:#8b897f;pointer-events:none}" +
    ".kx-zk{margin-top:12px;border-top:1px dashed var(--line,#e3e0d8);padding-top:10px}" +
    ".kx-zk>summary{cursor:pointer;font-weight:900;font-size:14px}" +
    ".kx-sj{font-size:12px;font-weight:900;margin:12px 0 6px;color:var(--ink-soft,#6b6a66)}" +
    ".kx-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}" +
    ".kx-b{border:1.5px solid var(--line,#e3e0d8);border-radius:12px;padding:6px 4px;text-align:center;background:#fbfaf7}" +
    ".kx-b .art{width:100%;aspect-ratio:1/1;display:block}" +
    ".kx-b.is-no .art{filter:brightness(0);opacity:.18}" +
    ".kx-b .nm{font-size:10.5px;font-weight:900;line-height:1.3}.kx-b .dt{font-size:10px;color:var(--ink-soft,#6b6a66)}" +
    ".kx-b.is-maou{border-color:#d9941a;background:#fff7e3}";
  function ensureStyle() {
    var d = global.document;
    if (d.getElementById("kx-style")) return;
    var s = d.createElement("style"); s.id = "kx-style"; s.textContent = STYLE; (d.head || d.documentElement).appendChild(s);
  }
  function art(b) {
    var T = global.KQBossTheme;
    if (T && T.artHtml) { try { return T.artHtml(b.subject, b.maou, false); } catch (e) {} }
    return "";
  }

  /** 玄関に「ミニゲーム」と「ボス図鑑」を描く */
  function render(host) {
    ensureStyle();
    host.innerHTML = "";
    var list = bossList();
    var got = list.filter(function (b) { return b.defeated; }).length;

    host.appendChild(el("div", "section-label", "🎮 ミニゲーム ／ 📖 ボス図鑑"));
    var row = el("div", "kx-row");
    var info = el("div"); info.style.flex = "1";
    info.appendChild(el("div", "kx-tk", "🎟️ ミニゲームけん  " + tickets() + " まい"));
    var why = tickets() <= 0 ? "ボスをたおすと もらえるよ（ふつう1まい・魔王2まい）"
      : leftToday() <= 0 ? "きょうは もう2かい あそんだよ。またあした！"
      : "きょうは あと " + leftToday() + " かい あそべるよ";
    info.appendChild(el("div", "kx-sub", why));
    row.appendChild(info);
    var a = el("a", "kx-btn", "しんけいすいじゃく");
    a.href = "memory.html";
    a.setAttribute("aria-disabled", canPlay() ? "false" : "true");
    row.appendChild(a);
    host.appendChild(row);

    var det = el("details", "kx-zk");
    det.appendChild(el("summary", "", "📖 ボスずかん（たおした " + got + " / " + list.length + "）"));
    SUBJECTS.forEach(function (sub) {
      det.appendChild(el("div", "kx-sj", NAMES[sub]));
      var g = el("div", "kx-g");
      list.filter(function (b) { return b.subject === sub; }).forEach(function (b) {
        var c = el("div", "kx-b" + (b.defeated ? "" : " is-no") + (b.maou ? " is-maou" : ""));
        var ar = el("span", "art"); ar.innerHTML = art(b); c.appendChild(ar);
        c.appendChild(el("div", "nm", b.defeated ? (b.maou ? "魔王 " : "") + "第" + b.rounds.join("・") + "回" : "？？？"));
        c.appendChild(el("div", "dt", b.defeated ? b.defeated.slice(5).replace("-", "/") : "まだ"));
        g.appendChild(c);
      });
      det.appendChild(g);
    });
    host.appendChild(det);
  }

  global.KQExtras = {
    DAILY_MAX: DAILY_MAX, bossList: bossList, earned: earned, tickets: tickets, playedToday: playedToday,
    leftToday: leftToday, canPlay: canPlay, spend: spend, render: render, todayKey: todayKey
  };
})(window);