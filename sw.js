// Glass Closet service worker
// Bump this version string any time you change index.html or any cached asset,
// otherwise phones will keep serving the old cached copy.
const CACHE_NAME = 'glass-closet-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './glass-closet-look.png',
  './mirrorshatter.jpg',
  './glasscloset.png',
  './kissprint.png',
  './gossip-icon.png',
  './crack.mp3',
  './item-select.mp3',
  './true-item-select.mp3',
  './shutter.mp3',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache the core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll fails entirely if ANY one file 404s, so cache individually
      // and just skip whatever isn't there yet instead of breaking install.
      return Promise.all(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[sw] could not cache', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting(); // Forces the new worker to activate immediately
});

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // Takes control of the page immediately
});

// Fetch: NETWORK-FIRST strategy. 
// Always checks the server for updates. If offline, falls back to cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we get a good response from the internet, clone it and update the cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If the internet is down (or GitHub Pages is glitching), use the cache
        return caches.match(event.request);
      })
  );
});
