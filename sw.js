'use strict';

/* Service worker: полный офлайн.
   Стратегия stale-while-revalidate: отдаём из кэша мгновенно,
   в фоне обновляем. Навигация без сети падает на index.html. */

const VERSION = 'fox-islands-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/utils.js',
  './js/audio.js',
  './js/config.js',
  './js/auth.js',
  './js/cloud.js',
  './js/pwa.js',
  './js/data.js',
  './js/drag.js',
  './js/engine.js',
  './js/games/counting.js',
  './js/games/digits.js',
  './js/games/compare.js',
  './js/games/sorting.js',
  './js/games/shapes.js',
  './js/games/symmetry.js',
  './js/games/patterns.js',
  './js/games/memory.js',
  './js/games/addition.js',
  './js/games/subtraction.js',
  './js/games/dots.js',
  './js/games/missing.js',
  './js/games/odd_one.js',
  './js/games/shadow.js',
  './js/games/feed.js',
  './js/games/puzzle.js',
  './js/games/size_order.js',
  './js/games/houses.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
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
  if (url.origin !== self.location.origin) return; // Google GSI и прочее — мимо кэша

  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      const network = fetch(req)
        .then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) return cached;
      const fresh = await network;
      if (fresh) return fresh;
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      return Response.error();
    })
  );
});
