const CACHE_NAME = 'repuestos-fuji-simple';

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando versión simple...');
  self.skipWaiting();
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Eliminando cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones de red de forma básica
self.addEventListener('fetch', (event) => {
  console.log('SW: Fetch para', event.request.url);
  
  // Simplemente pasar todas las peticiones a la red
  event.respondWith(
    fetch(event.request).catch(() => {
      // En caso de error, retornar respuesta básica
      return new Response('Sin conexión', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' }
      });
    })
  );
});