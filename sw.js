self.addEventListener('install', event => {
  // Yeni bir Service Worker kurmaya çalışma, sadece eskisini atla.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Tüm 'istanbulin-cache' ile başlayan önbellekleri bul ve sil.
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('istanbulin-cache-'))
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      // Kendini de devreden çıkar ve kontrolü tarayıcıya geri ver.
      console.log('Tüm eski önbellekler temizlendi. Service Worker devreden çıkarılıyor.');
      return self.clients.claim();
    })
  );
});
