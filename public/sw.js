const CACHE_NAME = 'dzinr-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort cache of assets
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Pre-cache warning: some resources could not be cached on install', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Let chrome-extension, APIs, and Firebase Auth use default network behaviour
  if (e.request.url.startsWith('chrome-extension') || e.request.url.includes('firestore') || e.request.url.includes('identitytoolkit')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Cache successful local document/asset GET requests
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          e.request.method === 'GET'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback or offline page
        return caches.match('/');
      });
    })
  );
});
