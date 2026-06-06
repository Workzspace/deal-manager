// Service worker for Property Ledger.
//
// What it does:
//  - Caches the app's files (the "shell") so it opens instantly and even works
//    offline once it has been loaded at least once.
//  - For API calls (/api/...) it always tries the network first so you see the
//    latest data; if the network is down it falls back to the last cached copy.
//
// Bump CACHE_VERSION whenever you change the app to force phones to update.
const CACHE_VERSION = 'property-ledger-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Remove old caches from previous versions.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never cache writes

  const url = new URL(request.url);

  // API calls: network-first, fall back to cache when offline.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // App files: cache-first, fall back to network.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      // Cache same-origin static assets as we fetch them (JS/CSS bundles).
      if (url.origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
      }
      return res;
    }).catch(() => caches.match('/index.html')))
  );
});
