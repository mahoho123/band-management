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

    // Use dynamic tag with timestamp to force re-notification on Android
    const notificationTag = data.tag || `attendance-${Date.now()}`;
    const dateTag = data.dateTag || `attendance-date-${data.date}`;
    
    console.log('[Service Worker] Using notification tag:', notificationTag, 'dateTag:', dateTag);

    const options = {
      body: data.body || '您有新的通知',
      tag: notificationTag,
      renotify: true,
      requireInteraction: true,
      icon: data.icon,
      badge: data.badge,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        eventId: data.eventId,
        dateTag: dateTag,
        date: data.date,
      },
    };
    
    console.log('[Service Worker] Notification options:', options);

    // Close old notifications for the same date before showing new one
    event.waitUntil(
      self.registration.getNotifications({ tag: dateTag }).then((notifications) => {
        console.log(`[Service Worker] Found ${notifications.length} existing notifications with tag ${dateTag}`);
        notifications.forEach((notification) => {
          console.log('[Service Worker] Closing old notification:', notification);
          notification.close();
        });
      }).then(() => {
        return self.registration.showNotification(data.title || '樂隊管理系統', options);
      })
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push:', error);
    
    // Fallback for non-JSON data
    const fallbackTag = `attendance-${Date.now()}`;
    event.waitUntil(
      self.registration.showNotification(data.title || '樂隊管理系統', {
        body: event.data.text() || '您有新的通知',
        tag: fallbackTag,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200],
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
