/* ArenaPlus PWA service worker.
   Minimal on purpose: it exists so browsers treat the page as an installable app.
   No offline caching, every request goes straight to the network. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () { /* pass-through */ });
