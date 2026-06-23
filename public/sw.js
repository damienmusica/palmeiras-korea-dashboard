// Conservative service worker for the Palmeiras Korea Dashboard PWA.
// - Static immutable assets (/_next/static, local crest/icons): cache-first.
// - Everything else (pages, /api): network-first with cache fallback (offline).
// - Cross-origin requests (e.g. player photos) are left untouched.
// Network-first keeps content fresh online; the cache only serves when offline.

const CACHE = "pmk-cache-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ignore cross-origin

  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/teams") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.webmanifest";

  if (isStatic) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Network-first for navigations & data; fall back to cache when offline.
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(request);
        if (res.ok && request.headers.get("accept")?.includes("text/html")) {
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
        }
        return res;
      } catch {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(request);
        return hit || (await cache.match("/")) || Response.error();
      }
    })(),
  );
});
