const CACHE_NAME = 'dark-chess-pwa-v1';
const ASSETS = [
  './game.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm',
  'https://cdn.jsdelivr.net/npm/framer-motion@10.16.4/+esm',
  'https://cdn.jsdelivr.net/npm/htm@3.1.1/+esm',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/265f.png',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/128x128/265f.png',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/512x512/265f.png',
  // 音效與 BGM 離線快取資源清單
  'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // UI_Click (竹筒敲擊感)
  'https://assets.mixkit.co/active_storage/sfx/1110/1110-84.wav', // Piece_Flip (木質滑動翻轉)
  'https://assets.mixkit.co/active_storage/sfx/1111/1111-84.wav', // Piece_Move (常規木質落子)
  'https://assets.mixkit.co/active_storage/sfx/1653/1653-84.wav', // Piece_Capture (沉重碎裂撞擊)
  'https://assets.mixkit.co/active_storage/sfx/923/923-84.wav',   // General_Threat (驚悚突發弦音)
  'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav', // Game_Win (歡慶五聲與環境雨聲結合)
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // BGM (示範用禪意環境輕音樂，可替換為您產出的 Suno 音檔)
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
