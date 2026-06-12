// IronRank Service Worker - manual implementation (no Workbox to keep bundle small)
// Strategy:
//   - App shell: cache-first (pre-cached on install)
//   - JS/CSS/HTML: stale-while-revalidate
//   - API (none for now): network-first
//   - Fonts: cache-first with 1-year TTL
//   - Images: cache-first

const CACHE_VERSION = "ironrank-v2.1.0";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const APP_SHELL = [
  "/ironrank/",
  "/ironrank/index.html",
  "/ironrank/manifest.json",
  "/ironrank/favicon.svg",
  "/ironrank/icons.svg",
  "/ironrank/exercises.json",
  "/ironrank/strength_standards.json",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  console.log("[SW] Installing", CACHE_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => null))
      .then(() => self.skipWaiting()),
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: route by request type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip cross-origin except fonts/images
  if (url.origin !== self.location.origin) {
    if (
      url.hostname === "fonts.googleapis.com" ||
      url.hostname === "fonts.gstatic.com"
    ) {
      event.respondWith(cacheFirst(request, FONT_CACHE, 60 * 60 * 24 * 365));
    }
    return;
  }

  // Navigation (HTML): network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((r) => r || caches.match("/ironrank/index.html")),
        ),
    );
    return;
  }

  // Static assets (JS, CSS, images, json): stale-while-revalidate
  if (
    url.pathname.startsWith("/ironrank/assets/") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png")
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request)),
  );
});

async function cacheFirst(request, cacheName, maxAgeSec) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const dateHeader = cached.headers.get("sw-cache-date");
    if (dateHeader) {
      const age = (Date.now() - parseInt(dateHeader, 10)) / 1000;
      if (age < maxAgeSec) return cached;
    } else {
      return cached;
    }
  }
  try {
    const res = await fetch(request);
    if (res.ok) {
      const headers = new Headers(res.headers);
      headers.set("sw-cache-date", String(Date.now()));
      const body = await res.clone().blob();
      cache.put(request, new Response(body, { status: res.status, statusText: res.statusText, headers }));
      return res;
    }
    return cached || res;
  } catch (err) {
    return cached;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// Listen for messages from the app (e.g., skip waiting)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
