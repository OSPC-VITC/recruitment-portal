// Service Worker for better chunk caching and error handling
const CACHE_NAME = 'ospc-recruitment-v1';
const CHUNK_CACHE_NAME = 'ospc-chunks-v1';

// Files to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/images/ospc_logo.png',
  '/_next/static/css/',
  '/_next/static/js/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS.filter(url => !url.endsWith('/')));
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== CHUNK_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - handle requests with chunk error recovery
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle chunk files specially
  if (url.pathname.includes('/_next/static/chunks/') || 
      url.pathname.includes('/_next/static/js/') ||
      url.pathname.includes('.js')) {
    
    event.respondWith(
      handleChunkRequest(request)
    );
    return;
  }
  
  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Special handling for chunk requests with retry logic
async function handleChunkRequest(request) {
  const chunkCache = await caches.open(CHUNK_CACHE_NAME);
  
  try {
    // Try network first for chunks to get latest version
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      chunkCache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (networkError) {
    console.warn('Chunk network request failed, trying cache:', request.url);
    
    // Try cache if network fails
    const cachedResponse = await chunkCache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If both network and cache fail, try to recover
    console.error('Chunk request failed completely:', request.url);
    
    // Return a minimal error response that won't break the app
    return new Response(
      `console.error('Failed to load chunk: ${request.url}');`,
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Handle chunk loading errors
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHUNK_ERROR') {
    // Clear chunk cache when chunk errors occur
    caches.delete(CHUNK_CACHE_NAME)
      .then(() => {
        console.log('Chunk cache cleared due to loading error');
        
        // Notify all clients to reload
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CHUNK_CACHE_CLEARED',
              message: 'Chunk cache has been cleared. Please reload the page.'
            });
          });
        });
      });
  }
});

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'chunk-cleanup') {
    event.waitUntil(cleanupChunkCache());
  }
});

async function cleanupChunkCache() {
  try {
    const cache = await caches.open(CHUNK_CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove old chunk entries (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (responseDate < oneHourAgo) {
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to cleanup chunk cache:', error);
  }
}
