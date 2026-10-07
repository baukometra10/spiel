const CACHE_NAME = "koko-painter-v3";

const FILES = [
  "./",
  "./index.html",
  "./studio.html",
  "./gallery.html",
  "./reward.html",
  "./parent.html",
  "./settings.html",
  "./css/style.css",
  "./storage.js",
  "./drawing.js",
  "./js/install.js",
  "./js/gallery.js",
  "./js/origin-warning.js",
  "./js/welcome-magic.js",

  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/app-icon.svg",
  "./flower.svg",
  "./butterfly.svg",
  "./castle.svg",
  "./cat.svg",
  "./unicorn.svg",
  "./rainbow.svg",
  "./princess.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return undefined;
        })
      );
    })
  );
});
