/*
 * Service worker.
 *
 * Its one job: make the app open with no connection. The app's own files
 * are cached on install and served from cache first, so an instructor who
 * has not had a signal for a week still gets a working form.
 *
 * API responses are NOT cached here. The app's own storage holds the
 * curriculum and the queue, and a stale cached API response pretending to
 * be fresh would be worse than an honest failure.
 */

// Bump this whenever a shell file changes.
//
// The fetch handler below is cache-first, which is what makes the app open
// with no signal — and also means a phone that has already installed the
// app keeps serving the old files until its second load. Changing the
// cache name makes the activate handler drop the old one, so the update
// lands the first time the device has a connection rather than silently a
// visit later. Queued entries are in IndexedDB and are not touched by this.
const CACHE = 'training-log-v7';

const SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/store.js',
  '/i18n.js',
  '/sync.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept the API. Requests must succeed or fail honestly so the
  // queue can decide what to do.
  if (url.pathname.startsWith('/api/')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) {
        // Serve from cache, and quietly refresh it for next time.
        fetch(event.request)
          .then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, res));
          })
          .catch(() => {});
        return hit;
      }
      return fetch(event.request).catch(() =>
        caches.match('/index.html')
      );
    })
  );
});
