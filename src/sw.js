export const VERSION = "0.3.2";
const CACHE_NAME = `rowing-player-${VERSION}`;

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
    "/rowingplayer.svg",
    "/rowingplayer.json"
];

self.addEventListener("install", (event) => {
    console.log("sw install event fired");
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.log("sw install cache opened");
            cache.addAll(APP_STATIC_RESOURCES);
            console.log("sw install cacheresources added");
        })(),
    );
});


self.addEventListener("activate", (event) => {
    console.log("sw activate event fiered");
    event.waitUntil(
        (async () => {
            const names = await caches.keys();
            console.log("sw activate cache opened");
            await Promise.all(
                names.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log("deleting stale cache: " + name);
                        return caches.delete(name);
                    }
                }),
            );
            console.log("stale caches deleted");
            await clients.claim();
            console.log("client claimed");
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    console.log("Fetch event fired");
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request.url);
            if (cachedResponse) {
                return cachedResponse;
            }
            console.log("tried to fetch inexistent resource: " + event.request.url);
            return new Response(null, { status: 404 });
        })(),
    );
});