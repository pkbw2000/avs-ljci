const CACHE_NAME = 'dark-chess-pwa-v2'; // 升級快取標籤
const ASSETS = [
  './game.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0',
  'https://esm.sh/framer-motion@10.16.4',
  'https://esm.sh/htm@3.1.1'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 強制激活新快取，清除乾淨上一版的快取衝突殘留
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

// 網絡優先與本機快取備用流
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
