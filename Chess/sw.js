const CACHE_NAME = 'dark-chess-pwa-v2'; // 增加版本號，強制更新舊快取
const ASSETS = [
  './game.html',
  './manifest.json',
  './chess192.jpg',
  './chess512.jpg',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/framer-motion@10.16.4',
  'https://esm.sh/htm@3.1.1'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  // 對於 CDN 資源，使用 Network First 或直接忽略快取以避免 CORS 錯誤
  if (e.request.url.includes('cdn.tailwindcss.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
