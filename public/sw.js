// Tan-Sang (ตาลสั่ง) Minimal & Pragmatic Service Worker
const CACHE_NAME = 'tan-sang-pwa-v1';

const PRECACHE_ASSETS = [
  '/offline',
  '/site.webmanifest',
  '/favicon.ico',
  '/logo.png',
  '/brand-mascot.png',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: Precache offline shell & static branding assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up outdated caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigations (with offline fallback), Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Bypass API calls to protect live order session integrity
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle page navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline').then((response) => {
          return response || caches.match('/');
        });
      })
    );
    return;
  }

  // Handle static assets (images, fonts, static chunks)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
  }
});
