// Cache versiyonunu artırdık. Bu, eski devasa cache'in silinmesini sağlayacak.
const CACHE_NAME = 'istanbulin-dynamic-cache-v3'; 

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap',
  '/Rusch-GoticoAntiqua100G.otf'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker kuruluyor: Uygulama iskeleti önbelleğe alınıyor.');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting()) 
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('istanbulin-') && name !== CACHE_NAME)
          .map(name => {
            console.log('Eski cache siliniyor:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim()) 
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // markers.json için "network first, then cache" stratejisi
  if (url.pathname.endsWith('/markers.json')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Ağ bağlantısı yoksa cache'den ver
          return caches.match(request);
        })
    );
    return;
  }

  // Diğer tüm istekler için "cache first, then network" stratejisi
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Cache'de varsa, oradan ver
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Cache'de yoksa, ağdan iste
      return fetch(request).then(networkResponse => {
        // Sadece belirli kaynakları cache'le
        return caches.open(CACHE_NAME).then(cache => {
           // ÖNEMLİ: Harita parçalarını (tiles) cache'lemiyoruz. Sadece kütüphaneleri alıyoruz.
           if (url.origin.includes('unpkg.com')) {
               cache.put(request, networkResponse.clone());
           }
           return networkResponse;
        });
      });
    })
  );
});
