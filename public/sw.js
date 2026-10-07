// Minimal service worker for The Sun Malaysia PWA.
// Goal: satisfy installability requirements (Chrome/Android need an active SW
// with a fetch handler to fire `beforeinstallprompt`) and provide just enough
// offline app-shell support to survive a dropped connection — without ever
// caching the WordPress REST API responses, so news content always stays fresh.

const CACHE_NAME = 'thesun-shell-v3'
const APP_SHELL = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never intercept API calls (thesun.my WP REST, our /api/*, open-meteo, etc.) — always network.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // RSS/Atom feeds are dynamic — never cache them (would serve stale feeds).
  if (/(^|\/)feed\/?$/.test(url.pathname) || /\/feed\//.test(url.pathname)) return

  // App-shell navigations: network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  // Static same-origin assets (JS/CSS/images/icons): cache-first, then network.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok) {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      }
      return res
    }).catch(() => cached))
  )
})
