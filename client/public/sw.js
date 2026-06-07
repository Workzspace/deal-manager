// Service worker for Deal Manager.
//
// Strategy:
//  - The page (HTML) uses NETWORK-FIRST so you always get the latest version
//    after a deploy; it falls back to the cached page only when offline.
//  - Hashed build assets (JS/CSS, which never change for a given filename) use
//    CACHE-FIRST for instant loads.
//  - API calls (/api/...) use NETWORK-FIRST so data is fresh, with the last
//    response cached as an offline fallback.
//
// Bump CACHE_VERSION whenever the caching logic changes (clears old caches).
const CACHE_VERSION = 'deal-manager-v2';
const APP_SHELL = ['/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Remove caches from previous versions so stale files don't linger.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never cache writes

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ignore cross-origin (e.g. fonts CDN)

  // API: network-first, fall back to last cached response when offline.
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

  // Page navigations: network-first so a new deploy is picked up immediately.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Hashed static assets: cache-first (immutable), then network.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
