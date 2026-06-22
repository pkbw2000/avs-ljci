const CACHE_NAME = 'dark-chess-pwa-v1';
const ASSETS = [
  './game.html',
  './manifest.json',
  './chess192.jpg',
  './chess512.jpg',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/framer-motion@10.16.4',
  'https://esm.sh/htm@3.1.1'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
