import webpush from 'web-push';
import { ENV } from './env';
import { getPushSubscriptionsForUser, getAllPushSubscriptions, getAdminPushSubscription } from '../db';

// Configure web-push
if (ENV.vapidPrivateKey && ENV.vapidPublicKey) {
  webpush.setVapidDetails(
    'mailto:admin@band-management.local',
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  eventId?: number;
  url?: string;
  icon?: string; // URL to notification icon/logo
  badge?: string; // URL to notification badge
  tag?: string; // Notification tag for grouping
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: number,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    const subscriptions = await getPushSubscriptionsForUser(userId);
    
    if (subscriptions.length === 0) {
      console.log(`[webpush] No subscriptions found for user ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      eventId: payload.eventId,
      url: payload.url || '/',
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          notificationPayload
        );
        console.log(`[webpush] Notification sent to user ${userId}`);
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Subscription has expired or been revoked
          console.log(`[webpush] Subscription expired for user ${userId}, removing...`);
          // Could delete the subscription here if needed
        } else {
          console.error(`[webpush] Error sending notification to user ${userId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`[webpush] Error sending push notification to user ${userId}:`, error);
  }
}

/**
 * Send push notification to admin
 * Supports multiple devices/subscriptions
 */
export async function sendPushNotificationToAdmins(
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Get all admin subscriptions for multi-device support
    const subscriptions = await getAdminPushSubscription();
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[webpush] No admin subscriptions found');
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      eventId: payload.eventId,
      url: payload.url || '/',
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag || 'attendance-update',
    });

    // Send to all admin subscriptions
    for (const subscription of subscriptions) {
      try {
        console.log('[webpush] Sending notification to admin device:', subscription.endpoint.substring(0, 50) + '...');
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          notificationPayload
        );
        console.log('[webpush] Notification sent to admin device successfully');
      } catch (error: any) {
        if (error.statusCode === 410) {
          console.log('[webpush] Admin subscription expired, removing...');
          // Could delete the subscription here if needed
        } else {
          console.error('[webpush] Error sending notification to admin device:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('[webpush] Error sending push notification to admin:', error);
  }
}
