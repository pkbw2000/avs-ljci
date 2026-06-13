/**
 * Service Worker - PWA 快取策略
 * 策略：
 *   靜態資源（HTML/CSS/JS）→ Stale-While-Revalidate
 *   圖片資源 → Network-First → Cache
 *   其他 → Network-First → Cache
 */
const CACHE_VERSION = "slot-game-v6.0.0";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = "dynamic-cache";

const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/utils.js",
    "./js/audioMgr.js",
    "./js/dataStore.js",
    "./js/uiCtrl.js",
    "./js/gameCore.js",
    "./js/main.js",
    "./manifest.json"
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
                    .map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", e => {
    const url = new URL(e.request.url);

    // 靜態資源：Stale-While-Revalidate
    if (STATIC_ASSETS.some(a => url.href.includes(a.replace("./", "")))) {
        e.respondWith(
            caches.open(STATIC_CACHE).then(cache =>
                cache.match(e.request).then(cached => {
                    const fetchPromise = fetch(e.request).then(networkRes => {
                        if (networkRes && networkRes.ok) {
                            cache.put(e.request, networkRes.clone());
                        }
                        return networkRes;
                    }).catch(() => cached);
                    return cached || fetchPromise;
                })
            )
        );
        return;
    }

    // 圖片資源：Network-First → Cache
    if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webp)$/i)) {
        e.respondWith(
            fetch(e.request).then(networkRes => {
                if (networkRes && networkRes.ok) {
                    const clone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => cache.put(e.request, clone));
                }
                return networkRes;
            }).catch(() => caches.match(e.request))
        );
        return;
    }

    // 其他：Network-First → Cache
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// 確保 SW 在頁面切換時立即控制
self.addEventListener("activate", () => {
    self.clients.claim();
});
