const CACHE_NAME = 'istanbulin-assets-v1';

const URLS_TO_CACHE = [
  // HTML dosyası burada yok! Sadece statik varlıklar.
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
        console.log('Varlık önbelleği oluşturuluyor.');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name.startsWith('istanbulin-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.mode === 'navigate') {
    // HTML sayfaları için her zaman ağı dene.
    event.respondWith(fetch(request));
    return;
  }

  // Diğer her şey için (CSS, JS, JSON, resimler), önce önbelleğe bak.
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request);
      })
  );
});
