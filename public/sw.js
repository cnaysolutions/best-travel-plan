// Service Worker for Best Holiday Plan PWA
// Version: 1.0.0

const CACHE_NAME = 'best-holiday-plan-v1';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/icons/favicon.ico',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png',
  '/backgrounds/travel-bg.png'
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch: Network-first for API calls, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (Supabase, external APIs, analytics)
  if (url.origin !== self.location.origin) return;

  // For navigation requests: try network first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest version of the page
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, images): cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cache immediately but update in background
          const fetchPromise = fetch(request).then((response) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
            return response;
          });
          return cached;
        }
        // Not in cache: fetch, cache, return
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }
});
