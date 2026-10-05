/* Pocket Notes service worker.
 * Bump VERSION when you change this file's caching logic. */
const VERSION = 'v1'
const STATIC_CACHE = `static-${VERSION}`
const PAGES_CACHE = `pages-${VERSION}`
const OFFLINE_URL = '/offline'

// Precache. Each URL is cached on its own, so one failure can't break installation.
const PRECACHE = ['/', OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES_CACHE)
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[sw] precache failed for', url, err)
          })
        )
      )
    })()
  )
  // Note: we do NOT skipWaiting() here. The page asks for it via SKIP_WAITING
  // so users aren't switched to a new version mid-session.
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC_CACHE, PAGES_CACHE]
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // 1) Page navigations: network first, then cached copy, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request)
          if (res.ok) {
            const copy = res.clone()
            caches.open(PAGES_CACHE).then((c) => c.put(request, copy))
          }
          return res
        } catch {
          const cached = await caches.match(request, { ignoreSearch: true })
          return cached || (await caches.match(OFFLINE_URL)) || Response.error()
        }
      })()
    )
    return
  }

  // 2) Hashed build assets: cache first (they never change for a given URL)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const res = await fetch(request)
        if (res.ok) {
          const copy = res.clone()
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy))
        }
        return res
      })()
    )
    return
  }

  // 3) Icons, images, fonts: stale-while-revalidate
  if (/\.(png|jpg|jpeg|svg|webp|avif|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE)
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || network
      })()
    )
  }
})
