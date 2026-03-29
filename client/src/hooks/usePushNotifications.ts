import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

export function usePushNotifications(userId: number | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Check if Push Notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !userId) return;

    const registerServiceWorker = async () => {
      try {
        // Register Service Worker
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });
        console.log('[usePushNotifications] Service Worker registered:', registration);

        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('[usePushNotifications] Already subscribed');
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('[usePushNotifications] Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [isSupported, userId]);

  const subscribe = async () => {
    if (!isSupported || !userId) {
      console.error('[usePushNotifications] Push notifications not supported or no user');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error('[usePushNotifications] VAPID public key not found');
        return;
      }

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('[usePushNotifications] Subscribed to push notifications:', newSubscription);

      // Save subscription to server using tRPC
      const auth = newSubscription.getKey('auth');
      const p256dh = newSubscription.getKey('p256dh');
      
      if (auth && p256dh) {
        try {
          await trpc.band.subscribeToPush.mutate({
            userId,
            subscription: {
              endpoint: newSubscription.endpoint,
              keys: {
                auth: arrayBufferToBase64(auth),
                p256dh: arrayBufferToBase64(p256dh),
              },
            },
          });
          console.log('[usePushNotifications] Subscription saved to server');
        } catch (err) {
          console.error('[usePushNotifications] Failed to save subscription:', err);
        }
      }

      setSubscription(newSubscription);
      setIsSubscribed(true);
    } catch (error) {
      console.error('[usePushNotifications] Subscription failed:', error);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      // Unsubscribe from push notifications
      await subscription.unsubscribe();

      // Notify server using tRPC
      try {
        await trpc.band.unsubscribeFromPush.mutate({
          endpoint: subscription.endpoint,
        });
        console.log('[usePushNotifications] Unsubscription saved to server');
      } catch (err) {
        console.error('[usePushNotifications] Failed to unsubscribe:', err);
      }

      setSubscription(null);
      setIsSubscribed(false);
      console.log('[usePushNotifications] Unsubscribed from push notifications');
    } catch (error) {
      console.error('[usePushNotifications] Unsubscription failed:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function arrayBufferToBase64(buffer: any): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
