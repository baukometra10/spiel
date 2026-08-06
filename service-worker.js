
const CACHE_NAME =
"lolo-painter-v1";



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


"./manifest.json",


"./icons/icon-192.png",


"./icons/icon-512.png",


"./butterfly.png",


"./castle.png",


"./cat.png",


"./unicorn.png",


"./rainbow.png",


"./princess.png"


];





self.addEventListener(
"install",
async event=>{
event.waitUntil(
caches.open(
CACHE_NAME
)
.then(
cache=>
cache.addAll(FILES)
)
);
self.skipWaiting();
});







self.addEventListener(
"fetch",
event=>{
event.respondWith(
    caches.match(event.request)
    .then(response => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
event.waitUntil(self.clients.claim());
});