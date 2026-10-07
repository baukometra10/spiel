const CACHE_NAME = "koko-painter-v7";
const APP_VERSION = "7";

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
  "./js/koko-voice.js",
  "./js/koko-songs.js",
  "./js/pwa-update.js",
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
  "./dog.svg",
  "./fish.svg",
  "./car.svg",
  "./heart.svg",
  "./icecream.svg",
  "./sun.svg",
  "./teddy.svg",
  "./balloon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const isNavigate = request.mode === "navigate";
  const isHtmlJsCss =
    isNavigate ||
    /\.(?:html|js|css)(?:\?|$)/i.test(new URL(request.url).pathname);

  if (isHtmlJsCss) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            if (isNavigate) return caches.match("./index.html");
            return undefined;
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
      );
    })
  );
});
