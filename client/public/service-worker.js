// Service Worker for Web Push Notifications

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const options = {
      body: data.body || '您有新的通知',
      tag: data.tag || 'attendance-notification',
      requireInteraction: true,
      icon: data.icon, // Display logo as notification icon
      badge: data.badge, // Display logo as notification badge
      data: {
        url: data.url || '/',
        eventId: data.eventId,
      },
    };
    
    console.log('[Service Worker] Notification options:', options);

    event.waitUntil(
      self.registration.showNotification(data.title || '樂隊管理系統', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push:', error);
    
    // Fallback for non-JSON data
    event.waitUntil(
      self.registration.showNotification(data.title || '樂隊管理系統', {
        body: event.data.text() || '您有新的通知',
        tag: 'attendance-notification',
        requireInteraction: true,
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event);
});
