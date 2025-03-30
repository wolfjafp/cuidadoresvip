/**
 * Service Worker - CuidadoresVIP
 * v1.0.0 - Optimizado para rendimiento
 * 
 * Este service worker permite:
 * - Cachear recursos estáticos para mejorar velocidad de carga
 * - Funcionalidad offline básica
 * - Estrategias de caché optimizadas
 */

const CACHE_NAME = 'cuidadoresvip-cache-v1';
const OFFLINE_PAGE = '/offline.html';
const OFFLINE_IMG = '/assets/images/offline-paw.svg';

// Recursos para cachear inicialmente
const PRECACHE_URLS = [
  '/',
  '/index.html',
  OFFLINE_PAGE,
  OFFLINE_IMG,
  '/assets/css/main.css',
  '/assets/css/animations.css',
  '/assets/js/main.js',
  '/assets/js/whatsapp-integration.js',
  '/assets/images/logo.webp',
  '/assets/images/paw-pattern-new.svg',
  '/assets/images/sobre-nosotros.jpg',
  '/manifest.json'
];

// Instalar el service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar cachés antiguas
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Estrategia de caché: Stale-While-Revalidate para recursos estáticos
 * - Recursos de cachéables: CSS, JS, imágenes, fuentes
 * - Devuelve recurso cacheado mientras actualiza caché en segundo plano
 */
const staleWhileRevalidate = async (event) => {
  const cachedResponse = await caches.match(event.request);
  
  const fetchAndCache = fetch(event.request)
    .then(response => {
      // Verificar si la respuesta es válida para cachear
      if (response && response.status === 200 && response.type === 'basic') {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseToCache));
      }
      return response;
    })
    .catch(error => {
      // Si la red falla y es una página, mostrar offline page
      if (event.request.mode === 'navigate') {
        return caches.match(OFFLINE_PAGE);
      }
      
      // Si es una imagen, devolver imagen offline
      if (event.request.destination === 'image') {
        return caches.match(OFFLINE_IMG);
      }
      
      // Para otros recursos, propagar el error
      throw error;
    });
  
  return cachedResponse || fetchAndCache;
};

/**
 * Estrategia de caché: Network First para API y datos dinámicos
 * - Recursos como formularios, endpoints de API
 * - Intenta red primero, si falla usa caché
 */
const networkFirst = async (event) => {
  try {
    const response = await fetch(event.request);
    
    // Cachear respuesta exitosa
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      caches.open(CACHE_NAME)
        .then(cache => cache.put(event.request, responseToCache));
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse || Promise.reject('offline');
  }
};

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorar solicitudes de analytics
  if (url.hostname.includes('google-analytics.com') || 
      url.hostname.includes('googletagmanager.com')) {
    return;
  }
  
  // Ignorar POST y otras solicitudes no GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estrategia Network First para documentos HTML y API
  if (event.request.mode === 'navigate' || 
      url.pathname.includes('/api/') || 
      event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirst(event));
    return;
  }
  
  // Estrategia Stale-While-Revalidate para recursos estáticos
  if (
    event.request.destination === 'style' || 
    event.request.destination === 'script' || 
    event.request.destination === 'image' || 
    event.request.destination === 'font' ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }
  
  // Estrategia predeterminada para otras solicitudes
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => cachedResponse || fetch(event.request))
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
      })
  );
});

// Sincronización en segundo plano para formularios enviados sin conexión
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForm());
  }
});

// Manejar formularios enviados sin conexión
async function syncContactForm() {
  try {
    // Obtener formularios pendientes del IndexedDB o localStorage
    const pendingForms = await getPendingForms();
    
    // Enviar cada formulario pendiente
    for (const formData of pendingForms) {
      await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      // Eliminar formulario enviado de pendientes
      await removePendingForm(formData.id);
    }
    
    // Notificar al usuario que los formularios se enviaron
    if (pendingForms.length > 0) {
      self.registration.showNotification('CuidadoresVIP', {
        body: 'Tu mensaje ha sido enviado correctamente',
        icon: '/assets/images/logo.webp'
      });
    }
  } catch (error) {
    console.error('Error sincronizando formularios:', error);
  }
}

// Función auxiliar para obtener formularios pendientes
async function getPendingForms() {
  // Implementación simplificada usando localStorage
  try {
    const pendingFormsData = localStorage.getItem('pendingForms');
    return pendingFormsData ? JSON.parse(pendingFormsData) : [];
  } catch (error) {
    return [];
  }
}

// Función auxiliar para eliminar formulario pendiente
async function removePendingForm(id) {
  try {
    const pendingForms = await getPendingForms();
    const updatedForms = pendingForms.filter(form => form.id !== id);
    localStorage.setItem('pendingForms', JSON.stringify(updatedForms));
  } catch (error) {
    console.error('Error eliminando formulario pendiente:', error);
  }
}

// Notificar al cliente cuando el service worker se actualiza
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 