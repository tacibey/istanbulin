// DEĞİŞİKLİK: Önbellek sürümünü v2'ye yükselttik.
const CACHE_NAME = 'istanbulin-cache-v2'; 
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/markers.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

// 1. Kurulum (Install) Olayı: Gerekli dosyaları önbelleğe al.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Yeni Service Worker kuruluyor, önbellek oluşturuluyor: ' + CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Aktivasyon (Activate) Olayı: Eski önbellekleri temizle.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Bu service worker'a ait olmayan veya eski sürüm olanları sil
          return cacheName.startsWith('istanbulin-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Eski önbellek siliniyor:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// 3. Getirme (Fetch) Olayı: Ağ isteklerini yönet.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Önbellekte varsa, oradan döndür
        if (response) {
          return response;
        }
        // Önbellekte yoksa, ağdan getirmeyi dene
        return fetch(event.request);
        // Not: Önceki ağdan alıp önbelleğe ekleme mantığını kaldırdım.
        // Bu, önbelleğin sadece kurulumda dolmasını sağlar ve daha stabildir.
      })
  );
});
