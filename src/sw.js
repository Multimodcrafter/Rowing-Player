const VERSION = "0.2.0";
const CACHE_NAME = `rowing-player-${VERSION}`;

module.exports = {
    VERSION: VERSION
};

const APP_STATIC_RESOURCES = [
    "/",
    "/index.html",
    "/editor.html",
    "/css/mystyles.css",
    "/css/fontawesome.min.css",
    "/css/solid.min.css",
    "/js/player.js",
    "/js/editor.js",
    "/webfonts/fa-solid-900.ttf",
    "/webfonts/fa-solid-900.woff2",
    "/rowingplayer.svg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll(APP_STATIC_RESOURCES);
      })(),
    );
});


self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
        const names = await caches.keys();
        await Promise.all(
            names.map((name) => {
            if (name !== CACHE_NAME) {
                return caches.delete(name);
            }
            }),
        );
        await clients.claim();
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request.url);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response(null, { status: 404 });
        })(),
    );
});