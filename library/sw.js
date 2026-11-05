// The Lantern Library service worker: makes the app installable and opens it offline.
const CACHE = "lantern-v1";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
    e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
    self.clients.claim();
});
self.addEventListener("fetch", (e) => {
    const url = new URL(e.request.url);
    if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/audio/")) return;
    e.respondWith(fetch(e.request).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request)));
});
