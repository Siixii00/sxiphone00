const CACHE_NAME = 'sxiphone-v17';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './main.js',
  './dock.js',
  './dock.css',
  './apps/widget/widget.js',
  './apps/widget/widget.css',
  './apps/widget/widget.html',
  './apps/widget/ios-styles.css',
  './apps/widget/core/state.js',
  './apps/widget/core/storage.js',
  './apps/widget/edit-mode.js',
  './apps/widget/services/weather.js',
  './apps/widget/services/calendar.js',
  './apps/widget/components/color-picker.js',
  './apps/widget/utils/dragdrop.js',
  './apps/screenshots/icon-192x192.png',
  './apps/screenshots/apple-touch-icon.png',
  './apps/screenshots/icon-48x48.png',
  './apps/screenshots/icon-120x120.png',
  './apps/screenshots/icon-152x152.png',
  './apps/screenshots/current.png'
];

const CACHE_STRATEGIES = {
  networkFirst: ['/api/', '/chat'],
  cacheFirst: ['https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
  staleWhileRevalidate: ['style.css', 'main.js', '/apps/scripts/'],
  weatherAPI: ['api.open-meteo.com', 'nominatim.openstreetmap.org']
};

const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>sxiphone</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden}
body{background:#0b0c12;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center}
.loader{text-align:center}
.loader-title{font-size:28px;font-weight:200;margin-bottom:16px;opacity:0.9}
.loader-spinner{width:32px;height:32px;border:2px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="loader">
<div class="loader-title">sxiphone</div>
<div class="loader-spinner"></div>
</div>
</body>
</html>`;

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return Promise.allSettled(
          STATIC_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`[SW] Failed to cache: ${asset}`, err.message);
              throw err;
            })
          )
        );
      })
      .then((results) => {
        const failed = results.filter((r) => r.status === 'rejected');
        const succeeded = results.filter((r) => r.status === 'fulfilled');
        console.log(`[SW] Cached ${succeeded.length} assets, ${failed.length} failed`);
        if (failed.length > 0) {
          console.warn('[SW] Some assets failed to cache, but continuing installation');
        }
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
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

function isWeatherAPI(url) {
  return CACHE_STRATEGIES.weatherAPI.some(api => url.hostname.includes(api));
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

async function handleWeatherAPI(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    if (isWeatherAPI(url)) {
      event.respondWith(handleWeatherAPI(request));
      return;
    }
    
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

  const isAppSubdirectory = url.pathname.includes('/apps/');
  if (isAppSubdirectory) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(new Request(self.registration.scope + 'index.html'))
        .then((cachedResponse) => {
          if (cachedResponse) {
            fetch(request)
              .then((response) => {
                if (response.ok) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(new Request(self.registration.scope + 'index.html'), response.clone());
                  });
                }
              })
              .catch(() => {});
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(new Request(self.registration.scope + 'index.html'), responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response(FALLBACK_HTML, {
                headers: { 'Content-Type': 'text/html' }
              });
            });
        })
    );
    return;
  }

  const isStaticAsset = STATIC_ASSETS.some(asset => {
    const assetUrl = new URL(asset, self.registration.scope).href;
    return url.href === assetUrl || url.href === assetUrl.replace(/\/$/, '/index.html');
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
    icon: 'apps/screenshots/icon-192x192.png',
    badge: 'apps/screenshots/icon-48x48.png',
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
    icon: data.icon || 'apps/screenshots/icon-192x192.png',
    badge: data.badge || 'apps/screenshots/icon-48x48.png',
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
          const url = data.url || self.registration.scope;
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
