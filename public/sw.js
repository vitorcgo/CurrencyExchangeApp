// Service worker do PWA. Guarda o app shell e as respostas da API para
// permitir abrir o painel offline com a última série carregada.
const CACHE_PREFIX = 'fx-terminal-'
const CACHE_NAME = `${CACHE_PREFIX}v2`
const scope = self.registration.scope
const INDEX_URL = new URL('index.html', scope).href
const PRECACHE_URL = new URL('precache-manifest.json', scope).href

const APP_SHELL = [
  new URL('./', scope).href,
  INDEX_URL,
  new URL('icon.svg', scope).href,
  new URL('icon-192.png', scope).href,
  new URL('icon-512.png', scope).href,
  new URL('manifest.webmanifest', scope).href,
]

async function loadPrecacheList() {
  try {
    const response = await fetch(PRECACHE_URL, { cache: 'no-cache' })
    if (!response.ok) return []
    const files = await response.json()
    if (!Array.isArray(files)) return []

    return files
      .filter((file) => typeof file === 'string' && !file.startsWith('http'))
      .map((file) => new URL(file, scope).href)
  } catch {
    return []
  }
}

async function precache() {
  const cache = await caches.open(CACHE_NAME)
  const generated = await loadPrecacheList()
  const files = [...new Set([...APP_SHELL, ...generated])]
  await cache.addAll(files)
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function networkFirstApi(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) {
      try {
        await cache.put(request, response.clone())
      } catch {
        // cache cheio ou resposta não armazenável
      }
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached

    return new Response(
      JSON.stringify({ error: 'Sem conexão e sem resposta em cache.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok) {
      try {
        await cache.put(INDEX_URL, response.clone())
      } catch {
        // cache cheio ou resposta não armazenável
      }
    }
    return response
  } catch {
    const cached = await cache.match(INDEX_URL)
    return cached || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      try {
        await cache.put(request, response.clone())
      } catch {
        // cache cheio ou resposta não armazenável
      }
    }
    return response
  } catch {
    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.hostname === 'api.frankfurter.dev') {
    event.respondWith(networkFirstApi(request))
    return
  }

  if (url.origin !== self.location.origin) return
  if (url.pathname.endsWith('/sw.js')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  event.respondWith(cacheFirst(request))
})
