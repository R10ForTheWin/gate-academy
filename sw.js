const CACHE = 'gate-academy-v13';
const PRECACHE = ['./', './index.html', './content.js', './app.js', './manifest.json', './professor-oreo.png', './logo.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './oreo-dance.mp4', './oreo-puddle.mp4', './oreo-greenscreen.mp4'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the app's own files so updates show up right away; cache as offline fallback.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.status === 200 && new URL(req.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
