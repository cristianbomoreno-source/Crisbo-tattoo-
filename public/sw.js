/*
 * Service Worker de OFINK — offline shell, sin dependencias (spec §3).
 * Estrategia:
 *  - install: precache de la cáscara mínima (/login, /offline, manifest, íconos).
 *  - navegaciones y datos GET same-origin: network-first → cae a caché → /offline.
 *  - estáticos same-origin (/_next/static, /icons, fuentes): stale-while-revalidate.
 *  - Supabase y todo lo que no sea GET: PASA DIRECTO a red (nunca se cachea).
 *  - activate: limpia versiones viejas. Subir CACHE en cada release.
 */
const CACHE = 'ofink-v53'
const OFFLINE_URL = '/offline.html'
const PRECACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// Permite forzar la activación inmediata del SW nuevo desde el botón
// "Buscar actualizaciones" de Ajustes, sin esperar a que se cierren todas
// las pestañas abiertas.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// Push nativo (cotizaciones nuevas del bot, por ahora): muestra la
// notificación aunque la app esté cerrada. El payload viene de
// `sendPushToStudio` — { title, body, link } — y `link` queda guardado en
// `notification.data` para usarlo al hacer click.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || 'OFINK'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { link: data.link || '/dashboard' },
    })
  )
})

// Click en la notificación: siempre lleva al link que vino en el push (el
// proyecto/cotización correspondiente) — reusa una pestaña ya abierta de
// OFINK si existe, si no abre una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          return client.navigate(link).then(() => client.focus())
        }
      }
      return self.clients.openWindow(link)
    })
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:css|js|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo GET; el resto (POST/server actions) va directo a red.
  if (request.method !== 'GET') return
  // Nunca interferir con Supabase ni con otros orígenes ajenos.
  if (url.origin !== self.location.origin) return
  if (url.hostname.endsWith('supabase.co')) return

  // Navegaciones (HTML/RSC): network-first con fallback a caché y /offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached || (await caches.match(OFFLINE_URL)) || Response.error()
        })
    )
    return
  }

  // Estáticos: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // Resto de GET same-origin (datos/RSC): network-first → caché.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request))
  )
})
