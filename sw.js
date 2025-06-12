// Önbellek sürümünü tekrar artırıyoruz ki bu yeni kural devreye girsin.
const CACHE_NAME = 'istanbulin-cache-v3'; 

// DEĞİŞİKLİK: '/' ve '/index.html' listesinden kaldırıldı!
// Artık sadece uygulamanın iskeleti ve verisi önbelleğe alınıyor.
const urlsToCache = [
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/markers.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Yeni Service Worker kuruluyor, v3');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('istanbulin-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Eski önbellek siliniyor:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Sadece GET isteklerini yönet
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // Önce önbelleğe bak
    caches.match(event.request)
      .then(cachedResponse => {
        // Önbellekte varsa, onu kullan
        if (cachedResponse) {
          return cachedResponse;
        }
        // Önbellekte yoksa, ağdan iste.
        // index.html için bu blok çalışacak.
        return fetch(event.request);
      })
  );
});
