// 3D Model Viewer PWA Service Worker
const CACHE_NAME = '3d-viewer-v1.2.0';
const STATIC_CACHE = '3d-viewer-static-v1.2.0';
const DYNAMIC_CACHE = '3d-viewer-dynamic-v1.2.0';

// Core files to cache for offline functionality
const CORE_FILES = [
  './',
  './index.html',
  './main.js',
  './starthost.bat',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.ico'
];

// External CDN resources to cache
const CDN_RESOURCES = [
  'https://unpkg.com/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/KTX2Loader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/draco_decoder.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/draco_decoder.wasm',
  'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/draco_wasm_wrapper.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache core application files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching core files...');
        return cache.addAll(CORE_FILES);
      }),
      
      // Cache CDN resources
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('🌐 Caching CDN resources...');
        return Promise.allSettled(
          CDN_RESOURCES.map(url => 
            cache.add(url).catch(err => 
              console.warn('⚠️ Failed to cache:', url, err)
            )
          )
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (request.url.includes('chrome-extension://') || 
      request.url.includes('moz-extension://')) {
    return; // Skip extension requests
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('📦 Serving from cache:', request.url);
        return cachedResponse;
      }
      
      // Not in cache, try to fetch from network
      return fetch(request).then((response) => {
        // Don't cache failed requests
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Determine which cache to use
        let cacheName = DYNAMIC_CACHE;
        if (CORE_FILES.some(file => request.url.endsWith(file))) {
          cacheName = STATIC_CACHE;
        }
        
        // Clone the response before caching
        const responseToCache = response.clone();
        
        caches.open(cacheName).then((cache) => {
          // Only cache certain file types
          if (shouldCache(request.url)) {
            console.log('💾 Caching new resource:', request.url);
            cache.put(request, responseToCache);
          }
        });
        
        return response;
      }).catch(() => {
        // Network failed, try to serve offline fallback
        console.log('🔌 Network failed for:', request.url);
        
        // For HTML requests, serve the main page
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
        
        // For other requests, return a generic offline response
        return new Response(
          JSON.stringify({ 
            error: 'Offline', 
            message: 'This resource is not available offline' 
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
            statusText: 'Service Unavailable'
          }
        );
      });
    })
  );
});

// Helper function to determine if a resource should be cached
function shouldCache(url) {
  const cacheableExtensions = [
    '.js', '.css', '.html', '.json', '.wasm', '.glb', '.gltf',
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.otf'
  ];
  
  // Cache if it's a CDN resource we know about
  if (CDN_RESOURCES.some(resource => url.includes(resource))) {
    return true;
  }
  
  // Cache if it has a cacheable extension
  return cacheableExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Handle background sync for uploading when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-upload') {
    console.log('🔄 Background sync triggered');
    // Handle any pending uploads when connection is restored
  }
});

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('🔔 Push notification received:', data);
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: './manifest.json', // Will use the icon from manifest
        badge: './manifest.json',
        tag: 'notification'
      })
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

console.log('🎯 3D Model Viewer Service Worker loaded');