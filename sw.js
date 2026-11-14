/* ============================================================
   sw.js — オフライン対応（Service Worker）
   - インストール時にアプリのファイルを端末に保存（プリキャッシュ）
   - 同じサイトの GET は「ネット優先・だめなら保存分」（新しい問題はネットがあればすぐ反映）
   - ?start=weak などクエリ付きのページは、クエリを無視して保存分を探す
   - 別サイト（GASの記録送信・Supabase・Google Fonts など）には一切さわらない
   ファイルを追加・改名したら PRECACHE を直し、CACHE_NAME の版を上げる。
   ============================================================ */
"use strict";

var CACHE_NAME = "kq-cache-v3";
var CACHE_PREFIX = "kq-cache-";
var NAV_TIMEOUT_MS = 4000;   // 電波が弱いとき、ページはこの時間で保存分に切りかえる

var PRECACHE = [
  "./",
  "./index.html",
  "./rika.html",
  "./shakai.html",
  "./kokugo.html",
  "./hw.html",
  "./diag.html",
  "./common.js",
  "./transfer.js",
  "./stars.js",
  "./stickers-award.js",
  "./stickers.js",
  "./stickers-season.js",
  "./shakai-rounds.js",
  "./extras.js",
  "./memory.html"
];

function cacheKey(url) {
  var u = new URL(url);
  u.search = "";
  u.hash = "";
  return u.href;
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // 1つ失敗しても残りは保存する（ネットが不安定なときに全部だめにならないように）
      return Promise.all(PRECACHE.map(function (path) {
        var url = new URL(path, self.registration.scope).href;
        return fetch(new Request(url, { cache: "reload" })).then(function (res) {
          if (res && res.ok && !res.redirected) return cache.put(cacheKey(url), res);
        }).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isNavigation(req) {
  return req.mode === "navigate" || (req.destination === "document");
}

function fromCache(req) {
  return caches.open(CACHE_NAME).then(function (cache) {
    return cache.match(cacheKey(req.url), { ignoreSearch: true }).then(function (hit) {
      if (hit || !isNavigation(req)) return hit;
      return cache.match(new URL("./index.html", self.registration.scope).href);
    });
  });
}

function networkAndUpdate(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok && res.type === "basic" && !res.redirected) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function (cache) { return cache.put(cacheKey(req.url), copy); }).catch(function () {});
    }
    return res;
  });
}

function handle(req) {
  var net = networkAndUpdate(req);
  var timeout = null;
  var raced = isNavigation(req)
    ? new Promise(function (resolve, reject) {
        net.then(resolve, reject);
        // 電波が弱くて返事が来ないときは、保存分があればそれを先に見せる（ネットの分はあとで保存される）
        timeout = setTimeout(function () {
          fromCache(req).then(function (hit) { if (hit) resolve(hit); }, function () {});
        }, NAV_TIMEOUT_MS);
      })
    : net;
  return raced.then(function (res) {
    if (timeout) clearTimeout(timeout);
    return res;
  }, function (err) {
    if (timeout) clearTimeout(timeout);
    return fromCache(req).then(function (hit) {
      if (hit) return hit;
      throw err;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;      // 別サイトはそのまま通す
  if (url.pathname === new URL("./sw.js", self.registration.scope).pathname) return;
  event.respondWith(handle(req));
});
