const CACHE = 'blkb-jugend-v1';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './img/logo.svg',
  './img/logo-white.svg',
  './img/hero.jpg',
  './img/icon-512.svg',
  './img/jugend1.jpg',
  './img/jugend2.jpg',
  './img/jugend3.jpg',
  './img/jugend4.png',
  './img/jugend5.jpg',
  './img/jugend6.jpg',
  './img/liestal-panorama.jpg',
  './img/liestal-toerli.jpg',
  './img/liestal-toerli2.jpg',
  './img/liestal-turm.jpg',
  './img/fun-games.jpg',
  './img/fun-games2.jpg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request);
    })
  );
});
