const CACHE_NAME = 'dark-chess-pwa-v1';
const ASSETS = [
  './game.html',
  './manifest.json',
  // 與 game.html 保持 100% 完全一致的標準整合快取清單（杜絕底層動態二次探測）
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/framer-motion@10.16.4?external=react',
  'https://esm.sh/htm@3.1.1?external=react'
];

// 安裝階段：將核心資源全部寫入 Cache 中
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 激活階段：清理舊版本的快取快照
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截請求階段：採用 Cache First 策略，保證斷網狀態秒開遊戲
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
