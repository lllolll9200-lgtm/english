// Service worker: зберігає файли застосунку, щоб він працював без інтернету.
// Після змін у index.html збільш номер версії — і телефон підтягне оновлення.
const CACHE = 'eng-tracker-v4';
const ASSETS = [
  './',
  './index.html',
  './phrases.json?v=4',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Сторінку беремо з мережі (щоб бачити оновлення), а без інтернету — з кешу
  if (req.mode === 'navigate') {
    e.respondWith(
      // no-cache: не беремо застарілу сторінку з HTTP-кешу браузера
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Решта файлів — спершу з кешу
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
