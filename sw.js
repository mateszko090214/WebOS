/* VoidOS service worker — network-first with a cache fallback, not
   cache-first. A cache-first strategy can trap a user on a stale, possibly
   broken version indefinitely with no obvious way to fix it; network-first
   means anyone online always gets the current index.html/style.css/
   script.js, and the cache only kicks in when there's genuinely no network.
   skipWaiting()+clients.claim() make a new version take over immediately
   instead of waiting for every open tab to close first. */
const CACHE_NAME = 'voidos-v1';
const CORE_ASSETS = ['./', './index.html', './style.css', './script.js', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // fonts etc. — let the browser handle these normally

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
