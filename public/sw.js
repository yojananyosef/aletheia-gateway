/**
 * Service Worker AletheiaGateway (offline shell).
 *
 * Estrategia:
 * - App shell (`/`, manifiesto, iconos): precache en install, cache-first.
 * - `/data/*.json`: runtime cache-first (los JSON son inmutables por build;
 *   `cacheBust()` añade `?v=` y cada `?v=` distinto se cachea aparte).
 * - Navegaciones: network-first con fallback a `/` cacheado.
 *
 * Al cambiar el shell, subir `SHELL_CACHE` (p. ej. `aletheia-shell-v2`).
 */

const SHELL_CACHE = 'aletheia-shell-v1';
const DATA_CACHE = 'aletheia-data-v1';

const PRECACHE = ['/', '/projection', '/manifest.webmanifest', '/favicon.svg', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        }),
    ),
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Datos JSON: cache-first (inmutables por ?v= de build).
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(cacheFirst(request, DATA_CACHE));
    return;
  }

  // Shell precacheado: cache-first.
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Navegaciones: network-first con fallback al shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/')),
    );
  }
});
