const CACHE_NAME = 'dark-chess-pwa-v1';
const ASSETS = [
  './game.html',
  './manifest.json',
  './chess192.jpg',
  './chess512.jpg',
  // 與 game.html 保持 100% 一致的 Tailwind 核心
  'https://cdn.tailwindcss.com',
  // 獨立打包的 React 與動態庫，確保斷網時不會觸發隱藏的網路請求
  'https://esm.sh/react@18.2.0?bundle',
  'https://esm.sh/react-dom@18.2.0/client?bundle',
  'https://esm.sh/framer-motion@10.16.4?bundle',
  'https://esm.sh/htm@3.1.1?bundle'
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

// 攔截請求：優先讀取本機 Cache 資源，實現秒開與斷網容錯
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
