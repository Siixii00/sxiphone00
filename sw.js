const CACHE_NAME = 'sxiphone-v8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/main.js',
  '/sw.js',
  '/apps/screenshots/icon-192x192.png',
  '/apps/screenshots/apple-touch-icon.png'
];

const CACHE_STRATEGIES = {
  networkFirst: ['/api/', '/chat'],
  cacheFirst: ['https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
  staleWhileRevalidate: ['/style.css', '/main.js', '/apps/scripts/']
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[SW] Cache addAll failed:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('sxiphone-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

function getCacheStrategy(url) {
  const urlStr = url.toString();
  
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (urlStr.includes(pattern)) return 'networkFirst';
  }
  
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (urlStr.includes(pattern)) return 'cacheFirst';
  }
  
  for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (urlStr.includes(pattern)) return 'staleWhileRevalidate';
  }
  
  return 'networkFirst';
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    const strategy = getCacheStrategy(url);
    if (strategy === 'cacheFirst') {
      event.respondWith(
        caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return fetch(request).then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
          })
      );
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  const isStaticAsset = STATIC_ASSETS.some(asset => {
    const normalizedAsset = asset.startsWith('/') ? asset : '/' + asset;
    return url.pathname === normalizedAsset;
  });
  
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.showNotification(title, options);
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
      })
    );
  }
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'sxiphone',
    body: '您有新通知',
    icon: '/apps/screenshots/icon-192x192.png',
    badge: '/apps/screenshots/icon-48x48.png',
    tag: 'default',
    data: {}
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.warn('[SW] Failed to parse push data:', e);
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/apps/screenshots/icon-192x192.png',
    badge: data.badge || '/apps/screenshots/icon-48x48.png',
    tag: data.tag || 'sx-notification',
    vibrate: [200, 100, 200],
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  if (action && data.actions) {
    const actionData = data.actions.find(a => a.action === action);
    if (actionData?.url) {
      event.waitUntil(
        clients.openWindow(actionData.url)
      );
      return;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          const url = data.url || '/';
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  const data = event.notification.data || {};
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_CLOSED',
            data: data
          });
        });
      })
  );
});

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(Promise.resolve());
  }
});

console.log('[SW] Service Worker loaded with push notification support');
