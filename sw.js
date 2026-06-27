const CACHE_NAME = 'sxiphone-v22';
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
            })
          )
        );
      })
      .then((results) => {
        const failed = results.filter((r) => r.status === 'rejected');
        const succeeded = results.filter((r) => r.status === 'fulfilled');
        console.log(`[SW] Cached ${succeeded.length} assets, ${failed.length} failed`);
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
        const deletePromises = cacheNames
          .filter((name) => name.startsWith('sxiphone-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          });
        
        deletePromises.push(
          caches.open(CACHE_NAME).then(async (cache) => {
            const keys = await cache.keys();
            console.log('[SW] Current cache has', keys.length, 'entries');
            
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000;
            const ONE_WEEK = 7 * ONE_DAY;
            
            const staleKeys = keys.filter(req => {
              const cached = cache.match(req);
              return true;
            });
            
            for (const key of keys) {
              const response = await cache.match(key);
              if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                  const cacheDate = new Date(dateHeader).getTime();
                  if (now - cacheDate > ONE_WEEK) {
                    console.log('[SW] Removing stale cache entry:', key.url);
                    await cache.delete(key);
                  }
                }
              }
            }
          }).catch(e => console.warn('[SW] Cache cleanup error:', e))
        );
        
        return Promise.all(deletePromises);
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
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('./index.html').then((fallback) => {
              return fallback || new Response(FALLBACK_HTML, {
                headers: { 'Content-Type': 'text/html' }
              });
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
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_CLEARED', success: true });
        }
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAN_OLD_ENTRIES') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const now = Date.now();
        const maxAge = event.data.maxAge || (7 * 24 * 60 * 60 * 1000);
        let cleaned = 0;
        
        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const cacheDate = new Date(dateHeader).getTime();
                if (now - cacheDate > maxAge) {
                  await cache.delete(request);
                  cleaned++;
                }
              }
            }
          } catch (e) {
            console.warn('[SW] Error checking cache entry:', e);
          }
        }
        
        console.log(`[SW] Cleaned ${cleaned} old cache entries`);
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_CLEANED', cleaned });
        }
      })()
    );
  }
  
  if (event.data && event.data.type === 'FORCE_CLEANUP_IOS') {
    event.waitUntil(
      (async () => {
        console.log('[SW] iOS force cleanup initiated');
        
        const allCaches = await caches.keys();
        const currentCache = await caches.open(CACHE_NAME);
        const essentialKeys = await currentCache.keys();
        
        const essentialUrls = new Set(
          essentialKeys
            .filter(req => STATIC_ASSETS.some(asset => req.url.includes(asset)))
            .map(req => req.url)
        );
        
        for (const cacheName of allCaches) {
          if (cacheName !== CACHE_NAME) {
            await caches.delete(cacheName);
            console.log('[SW] Deleted cache:', cacheName);
          }
        }
        
        const cache = await caches.open(CACHE_NAME);
        const allKeys = await cache.keys();
        let deleted = 0;
        
        for (const request of allKeys) {
          if (!essentialUrls.has(request.url)) {
            const url = new URL(request.url);
            const isCDN = CACHE_STRATEGIES.cacheFirst.some(pattern => request.url.includes(pattern));
            
            if (isCDN) {
              const response = await cache.match(request);
              if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                  const cacheDate = new Date(dateHeader).getTime();
                  const age = Date.now() - cacheDate;
                  if (age > 24 * 60 * 60 * 1000) {
                    await cache.delete(request);
                    deleted++;
                  }
                }
              }
            }
          }
        }
        
        console.log(`[SW] iOS cleanup complete: deleted ${deleted} non-essential entries`);
        
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          console.log('[SW] Storage estimate:', {
            usage: Math.round(estimate.usage / 1024 / 1024) + 'MB',
            quota: Math.round(estimate.quota / 1024 / 1024) + 'MB',
            percent: Math.round(estimate.usage / estimate.quota * 100) + '%'
          });
        }
        
        if (event.source) {
          event.source.postMessage({ 
            type: 'IOS_CLEANUP_COMPLETE', 
            deleted,
            timestamp: Date.now()
          });
        }
      })()
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

// === iOS PWA Client 匹配輔助函式 ===
// iOS Safari 的 URL 比對需要更寬鬆的處理
const normalizeUrl = (url) => {
    try {
        const parsed = new URL(url, self.registration.scope);
        // 移除 query string 和 hash，只比對基本路徑
        return parsed.origin + parsed.pathname.replace(/\/$/, '');
    } catch (e) {
        return url;
    }
};

const isSameOriginClient = (clientUrl, scope) => {
    try {
        const clientOrigin = new URL(clientUrl).origin;
        const scopeOrigin = new URL(scope).origin;
        return clientOrigin === scopeOrigin;
    } catch (e) {
        return clientUrl.includes(self.location.origin);
    }
};

// 改進的 client 匹配邏輯 - 支援 iOS PWA 的多種 URL 格式
const findMatchingClient = async (url) => {
    const clientList = await clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
    });
    
    console.log('[SW] Client 匹配 - 目標 URL:', url);
    console.log('[SW] Client 匹配 - 現有 clients:', clientList.length);
    
    // 優先尋找完全匹配的 client
    for (const client of clientList) {
        console.log('[SW] Client 匹配 - 檢查:', client.url);
        if (client.url === url && 'focus' in client) {
            console.log('[SW] Client 匹配 - 找到完全匹配');
            return client;
        }
    }
    
    // iOS PWA: 尋找同源且路徑相似的 client（忽略 query string）
    const targetPath = normalizeUrl(url);
    for (const client of clientList) {
        const clientPath = normalizeUrl(client.url);
        if (clientPath === targetPath && 'focus' in client) {
            console.log('[SW] Client 匹配 - 找到路徑匹配（忽略 query string）');
            return client;
        }
    }
    
    // iOS PWA: 最寬鬆的匹配 - 只要同源且有 index.html
    for (const client of clientList) {
        if (isSameOriginClient(client.url, self.registration.scope) && 
            client.url.includes('index.html') || 
            client.url.endsWith('/')) {
            console.log('[SW] Client 匹配 - 找到同源 client');
            return client;
        }
    }
    
    // iOS PWA: 最後嘗試 - 任何同源的 client
    for (const client of clientList) {
        if (isSameOriginClient(client.url, self.registration.scope) && 'focus' in client) {
            console.log('[SW] Client 匹配 - 找到同源 client（fallback）');
            return client;
        }
    }
    
    console.log('[SW] Client 匹配 - 未找到匹配的 client');
    return null;
};

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  // 如果有特定 action 且有對應 URL
  if (action && data.actions) {
    const actionData = data.actions.find(a => a.action === action);
    if (actionData?.url) {
      event.waitUntil(
        findMatchingClient(actionData.url).then((client) => {
          if (client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data
            });
            return client.focus();
          }
          // 只在完全沒有 client 時才開新視窗
          console.log('[SW] Notification click - 需要開啟新視窗:', actionData.url);
          return clients.openWindow(actionData.url);
        })
      );
      return;
    }
  }
  
  // 預設行為 - 嘗試 focus 現有視窗
  event.waitUntil(
    findMatchingClient(data.url || self.registration.scope).then((client) => {
      if (client) {
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          data: data
        });
        return client.focus();
      }
      // 只在完全沒有 client 時才開新視窗
      const url = data.url || self.registration.scope;
      console.log('[SW] Notification click - 需要開啟新視窗:', url);
      return clients.openWindow(url);
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

// === iOS PWA 診斷與生命週期管理 ===
self.addEventListener('message', (event) => {
    // 回應 client 的狀態查詢
    if (event.data && event.data.type === 'SW_PING') {
        console.log('[SW] 收到 PING，回應 PONG');
        if (event.source) {
            event.source.postMessage({
                type: 'SW_PONG',
                timestamp: Date.now(),
                scope: self.registration.scope
            });
        }
    }
    
    // 返回 client 給診斷
    if (event.data && event.data.type === 'SW_GET_CLIENTS') {
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                console.log('[SW] Client 狀態請求 - 回應:', clientList.length, '個 clients');
                if (event.source) {
                    event.source.postMessage({
                        type: 'SW_CLIENTS_LIST',
                        clients: clientList.map(c => ({
                            id: c.id,
                            url: c.url,
                            focused: c.focused,
                            visibilityState: c.visibilityState
                        })),
                        timestamp: Date.now()
                    });
                }
            });
    }
});

// iOS Safari 特殊處理：當 PWA 從背景恢復時確認 client 狀態
self.addEventListener('activate', (event) => {
    console.log('[SW] iOS 診斷 - Activate 事件');
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                console.log('[SW] iOS 診斷 - Activate後的 clients:', clientList.length);
                clientList.forEach((client, index) => {
                    console.log(`[SW] iOS 診斷 - Client ${index}:`, client.url);
                });
            })
    );
});
