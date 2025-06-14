const CACHE_NAME = 'istanbulin-dynamic-cache-v2'; // Cache versiyonunu artırdım

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
      .then(() => self.skipWaiting()) // Yeni SW'nin hemen aktif olmasını sağla
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
    }).then(() => self.clients.claim()) // SW'nin kontrolü hemen almasını sağla
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Sadece GET isteklerini ve belirli domain'leri handle et
  if (request.method !== 'GET') {
    return;
  }

  // markers.json için Network-First stratejisi
  if (url.pathname.endsWith('/markers.json')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // AĞDAN GELEN YANITI ÖNBELLEĞE KAYDET
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // AĞ HATASI OLURSA ÖNBELLEKTEN GETİR
          return caches.match(request);
        })
    );
    return;
  }

  // Diğer tüm istekler için Cache-First stratejisi (Uygulama İskeleti)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(networkResponse => {
        // İsteğe bağlı olarak, dinamik olarak yüklenen diğer kaynakları da önbelleğe alabilirsiniz.
        return caches.open(CACHE_NAME).then(cache => {
            // Sadece belirli kaynakları cache'le, örneğin unpkg.com'dan gelenler
           if (url.origin.includes('unpkg.com') || url.origin.includes('cartocdn.com')) {
               cache.put(request, networkResponse.clone());
           }
           return networkResponse;
        });
      });
    })
  );
});
