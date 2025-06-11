const CACHE_NAME = 'istanbulin-cache-v1'; // Önbellek sürümü, bunu değiştirince önbellek yenilenir.
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
        console.log('Önbellek açıldı');
        // ÖNEMLİ: addAll atomik bir işlemdir. Biri bile başarısız olursa, hepsi başarısız olur.
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
        return fetch(event.request).then(
          (networkResponse) => {
            // Ağdan gelen cevap geçerliyse, hem döndür hem de bir kopyasını önbelleğe al
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              // Sadece kendi origin'imizden gelen istekleri önbelleğe alıyoruz.
              // Diğerleri (örn: harita katmanları) önbelleğe alınmayacak.
              return networkResponse;
            }

            // Cevabı klonla. Bir kopyası önbelleğe, diğeri tarayıcıya gidecek.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          // Ağ hatası durumunda (çevrimdışı), burada çevrimdışı sayfası gösterilebilir.
          // Şimdilik basit tutuyoruz.
          console.log('Ağ isteği başarısız oldu:', error);
        });
      })
  );
});
