// sxiphone Service Worker
// 用于支持 PWA 安装、离线功能和推送通知

const CACHE_NAME = 'sxiphone-v7';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/main.js',
  '/sw.js',
  '/apps/screenshots/current.png',
  '/apps/screenshots/icon-192x192.png',
  '/apps/screenshots/icon-152x152.png',
  '/apps/screenshots/icon-120x120.png',
  '/apps/screenshots/icon-96x96.png',
  '/apps/screenshots/icon-72x72.png',
  '/apps/screenshots/icon-48x48.png',
  '/apps/screenshots/apple-touch-icon.png'
];

const CACHE_STRATEGIES = {
  networkFirst: ['/api/', '/chat'],
  cacheFirst: ['/apps/screenshots/', '/fonts/', 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
  staleWhileRevalidate: ['/style.css', '/main.js', '/apps/']
};

// 安装事件
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

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
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

// 判断请求类型
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

// Stale-While-Revalidate 策略
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

// 请求拦截 - 智能缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跨域请求使用 cacheFirst 或 networkFirst
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

  // 导航请求 - 网络优先
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

  // 静态资源 - 缓存优先
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

  // 其他请求 - Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// 消息处理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // 處理顯示通知的請求
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.showNotification(title, options);
  }
});

// 推送事件處理
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

// 通知點擊處理
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  // 如果有自定義動作
  if (action && data.actions) {
    const actionData = data.actions.find(a => a.action === action);
    if (actionData?.url) {
      event.waitUntil(
        clients.openWindow(actionData.url)
      );
      return;
    }
  }
  
  // 點擊通知後打開應用
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 如果已經有打開的窗口，聚焦它
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // 發送消息給頁面處理
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data
            });
            return client.focus();
          }
        }
        // 否則打開新窗口
        if (clients.openWindow) {
          const url = data.url || '/';
          return clients.openWindow(url);
        }
      })
  );
});

// 通知關閉處理
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  const data = event.notification.data || {};
  
  // 通知頁面通知已關閉
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

// 後台同步處理（可選）
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // 這裡可以添加同步邏輯
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker loaded with push notification support');
