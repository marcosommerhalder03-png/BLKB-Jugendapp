const CACHE     = 'blkb-jugend-v51';
const IMG_CACHE = 'blkb-jugend-img-v1';

// Pre-cache shell + assets (now split across 3 files)
const PRECACHE = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './img/logo-white.svg',
  './img/logo.svg',
  './img/icon-192.png',
  './img/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(PRECACHE); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE && k !== IMG_CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Images → cache-first (serve instantly, cache on first hit)
  if (/\.(jpg|jpeg|png|svg|gif|webp)(\?|$)/i.test(url)) {
    e.respondWith(
      caches.open(IMG_CACHE).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(res) {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // HTML, JS, CSS, manifest → network-first (always fresh, offline fallback)
  e.respondWith(
    fetch(e.request).then(function(res) {
      if (res.ok) {
        var clone = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      }
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
