/*
 * Service Worker — Modelle Única (sem lib).
 * cache-first p/ estáticos (_next/static, imagens), network-first p/ produtos
 * visitados (fallback /offline), NUNCA intercepta /admin, /api nem Supabase.
 */
const VERSION = "v5-1";
const STATIC_CACHE = `mu-static-${VERSION}`;
const PAGE_CACHE = `mu-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((c) => c.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

function isPage(url) {
  return (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/produto/") &&
    url.search === ""
  );
}

/** Nunca cacheia admin, api, rotas autenticadas ou requests não-GET. */
function isBypass(url, req) {
  return (
    req.method !== "GET" ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.in") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (isBypass(url, req)) return;

  if (isStatic(url)) {
    // cache-first
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  if (isPage(url)) {
    // network-first com fallback offline
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit || caches.match(OFFLINE_URL))
            .then((hit) => hit || new Response("Você está offline", { status: 503 }))
        )
    );
  }
});
