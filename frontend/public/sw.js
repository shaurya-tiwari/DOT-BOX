const CACHE = 'dotbox-v1'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // Network first for API/WS, cache first for static assets
  if (e.request.url.includes('/api/') || e.request.url.includes('/ws/')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
