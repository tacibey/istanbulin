// Önbellek sürümünü tekrar artırıyoruz ki bu yeni kurallar devreye girsin.
const CACHE_NAME = 'istanbulin-dynamic-cache-v1';

// Uygulama iskeleti - Bunlar her zaman önbellekten gelsin.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

// Dinamik içerik - Bunlar için Stale-While-Revalidate kullanılacak.
const DYNAMIC_CONTENT_URLS = [
    '/markers.json'
];

// Kurulum: Uygulama iskeletini önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker kuruluyor: Uygulama iskeleti önbelleğe alınıyor.');
        return cache.addAll(APP_SHELL_URLS);
      })
  );
});

// Aktivasyon: Eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('istanbulin-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch: İstekleri yönet
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Sadece kendi origin'imizden veya unpkg'den gelen GET isteklerini yönet
  if (request.method !== 'GET' || (!url.origin.startsWith(self.location.origin) && !url.origin.includes('unpkg.com'))) {
    return;
  }

  // Stale-While-Revalidate stratejisi (markers.json için)
  if (DYNAMIC_CONTENT_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          // Önbellekte varsa onu anında döndür, arka planda ağı kontrol et.
          // Yoksa, ağdan gelmesini bekle.
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Cache First stratejisi (Uygulama iskeleti için)
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});
