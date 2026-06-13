const CACHE_NAME = '3D-Bubble-ball';
const ASSETS = [
  'game.html',
  'manifest.json',
  'Bubble192.png',
  'Bubble512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 嘗試快取所有資源，個別失敗不影響其他資源
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`無法快取 ${asset}`, err);
        }
      }
    })
  );
  self.skipWaiting(); // 立即啟動新版本
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim()); // 立即控制所有頁面
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
