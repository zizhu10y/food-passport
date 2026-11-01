// Offline cache for 美食护照. Bump VERSION when the shell file list changes.
const VERSION = 'fp-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return; // e.g. Google Maps links: always online

  // The page itself: try the network first so updates show on the next open; fall back to the cache when offline or slow.
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(VERSION).then(async cache => {
      const net = fetch(req).then(res => { if (res && res.ok) cache.put('index.html', res.clone()); return res; });
      const slow = new Promise(r => setTimeout(r, 3000));
      const res = await Promise.race([net.catch(() => null), slow]);
      return res || (await cache.match('index.html')) || net;
    }));
    return;
  }

  // Everything else: serve from cache right away, refresh the cache in the background (stale-while-revalidate).
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = req;
    const cached = await cache.match(key);
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
