// sw.js - Service Worker untuk background sync
const CACHE_NAME = 'fleet-tracker-v1';
const urlsToCache = [
  '/',
  '/dashboard.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch dengan cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Background Sync untuk data offline
self.addEventListener('sync', event => {
  if (event.tag === 'sync-fleet-data') {
    event.waitUntil(syncFleetData());
  }
});

async function syncFleetData() {
  const pendingData = await getPendingData();
  for (const data of pendingData) {
    await sendToServer(data);
  }
  await clearPendingData();
}

// Notifikasi push
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: data.url || '/dashboard.html'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/dashboard.html')
  );
});