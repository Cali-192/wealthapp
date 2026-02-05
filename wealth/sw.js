const CACHE_NAME = 'wealth-manager-v1';
const assets = [
  './',
  './index.html',
  './wealth.css',
  './wealth.js',
  'https://cdn-icons-png.flaticon.com/512/2488/2488749.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
];

// Instalimi i Service Worker dhe ruajtja e skedarëve në cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Aktivizimi dhe fshirja e cache-ve të vjetra
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});

// Shërbimi i skedarëve nga cache kur nuk ka rrjet
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});