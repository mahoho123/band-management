// ============================================================
// 慢半拍 Service Worker - 改善版
// 功能：Web Push 通知 + 離線緩存 + 自動更新
// ============================================================

const CACHE_NAME = 'adagio-sw-v2';

// ── 安裝：預緩存核心資源，確保離線也能啟動 ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  // 立即激活，不等待舊 SW 退出
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/logo.png',
      ]).catch((err) => {
        // 緩存失敗不阻止安裝
        console.warn('[SW] Pre-cache failed (non-fatal):', err);
      });
    })
  );
});

// ── 激活：清理舊緩存，立即接管所有頁面 ──
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    Promise.all([
      // 清理舊版本緩存
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      ),
      // 立即接管所有已開啟的頁面（不需要重新整理）
      self.clients.claim(),
    ])
  );
});

// ── Fetch：網絡優先策略，失敗時回退緩存 ──
// 只緩存 GET 請求，API 請求不緩存
self.addEventListener('fetch', (event) => {
  // 跳過非 GET、API 請求和 chrome-extension
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.startsWith('chrome-extension')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 緩存成功的響應（只緩存同源請求）
        if (
          response.ok &&
          response.type === 'basic' &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 網絡失敗時嘗試從緩存返回
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // 對於頁面請求，返回緩存的首頁
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ── Push：接收推送通知 ──
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    data = { title: '慢半拍', body: event.data.text() || '您有新的通知' };
  }

  console.log('[SW] Push data:', data);

  const title = data.title || '慢半拍';
  const eventTag = data.eventTag || `notification-${Date.now()}`;

  const options = {
    body: data.body || '您有新的通知',
    tag: eventTag,
    renotify: true,           // 同 tag 的新通知仍會震動提醒
    requireInteraction: true, // 通知不自動消失（Android/桌面）
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    vibrate: [200, 100, 200, 100, 200],
    timestamp: Date.now(),
    data: {
      url: data.url || '/',
      eventId: data.eventId,
      notifiedAt: Date.now(),
    },
    // Android Chrome 支援 actions
    actions: [
      { action: 'open', title: '查看詳情' },
    ],
  };

  event.waitUntil(
    // 先關閉同 tag 的舊通知，再顯示新通知
    self.registration
      .getNotifications({ tag: eventTag })
      .then((existing) => {
        existing.forEach((n) => n.close());
        return self.registration.showNotification(title, options);
      })
      .catch((err) => {
        console.error('[SW] showNotification failed:', err);
        // 最後防線：不帶 tag 直接顯示
        return self.registration.showNotification(title, {
          body: options.body,
          icon: options.icon,
          vibrate: options.vibrate,
        });
      })
  );
});

// ── Notification Click：點擊通知開啟/聚焦網頁 ──
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked, action:', event.action);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 嘗試聚焦已開啟的視窗
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl, self.location.origin);
          if (clientUrl.origin === targetUrlObj.origin && 'focus' in client) {
            return client.focus().then((c) => {
              // 通知頁面跳轉
              if (c && 'navigate' in c) {
                return (c as WindowClient).navigate(targetUrl);
              }
            });
          }
        }
        // 沒有開啟的視窗，開新視窗
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Notification Close：用戶手動關閉通知 ──
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed by user');
});

// ── Message：接收來自頁面的訊息 ──
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'PING') {
    event.ports?.[0]?.postMessage({ type: 'PONG' });
  }
});
