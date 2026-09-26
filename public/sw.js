/**
 * Service Worker AletheiaGateway (shell offline).
 *
 * Estrategia:
 * - Navegaciones: SIEMPRE red primero (si no, un usuario que ya visitó la app
 *   seguiría viendo el HTML viejo del shell cacheado). Sin red, fallback al shell.
 * - `/data/*.json`: cache-first. Los JSON son inmutables por build porque
 *   `cacheBust()` añade `?v=<BUILD_ID>`; cada versión se guarda en su propia caché.
 * - Iconos/manifest: cache-first.
 *
 * La versión de las cachés sale del propio `?v=` con el que se registra el
 * worker (`cacheBust('/sw.js')`), así que cada despliegue instala un worker
 * nuevo, purga las cachés de builds anteriores y no puede quedar HTML viejo
 * servido desde disco.
 */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const SHELL_CACHE = `aletheia-shell-${VERSION}`;
const DATA_CACHE = `aletheia-data-${VERSION}`;
const KEEP = [SHELL_CACHE, DATA_CACHE];

const PRECACHE = ['/', '/projection', '/manifest.webmanifest', '/favicon.svg', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll es todo-o-nada: si un recurso falla, no se instala el worker.
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
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

function networkFirstShell(request) {
  return fetch(request)
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
      }
      return res;
    })
    .catch(() => caches.match('/').then((hit) => hit || Response.error()));
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

  // Navegaciones primero: una recarga tiene que traer el HTML del deploy actual.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request));
    return;
  }

  // Datos JSON: cache-first (cada `?v=` distinto se cachea aparte).
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(cacheFirst(request, DATA_CACHE));
    return;
  }

  // Estáticos del shell: cache-first.
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }
});
