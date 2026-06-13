const CACHE_NAME = 'zodiac-game-v1';
const ASSETS = [
  'Zodiac12.html',
  'manifest.json',
  'zodiac-192.png',
  'zodiac-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
