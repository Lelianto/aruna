const CACHE_NAME = 'aruna-cache-v1';
const APP_SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle simple, same-origin GET requests. Next.js dev/HMR traffic
  // (webpack-hmr, RSC data requests) and cross-origin/non-http(s) requests
  // are left alone so the SW never intercepts them.
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;
  if (request.url.includes('/_next/webpack-hmr')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      // Fall back to network, but never let a rejected fetch (offline,
      // aborted navigation, etc.) become an unhandled promise rejection.
      return fetch(request).catch(() => {
        return cached || Response.error();
      });
    })
  );
});
