const CACHE_NAME = "ionic-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/assets/icon/favicon.png",
  "/assets/icon/icon.png",
  "/assets/icon/icon-192.png",
  "/assets/icon/icon-384.png",
  "/manifest.json",
  "/build/main.js",
  "/build/main.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Return cached response
      }
      return fetch(event.request); // Otherwise, fetch from network
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
