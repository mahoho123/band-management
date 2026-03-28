import webpush from 'web-push';
import { ENV } from './env';
import { getPushSubscriptionsForUser, getAllPushSubscriptions } from '../db';

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
 * Send push notification to all admin users
 */
export async function sendPushNotificationToAdmins(
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Get all subscriptions (in a real app, you'd filter by admin role)
    const allSubscriptions = await getAllPushSubscriptions();
    
    if (allSubscriptions.length === 0) {
      console.log('[webpush] No subscriptions found for admins');
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      eventId: payload.eventId,
      url: payload.url || '/',
    });

    for (const subscription of allSubscriptions) {
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
        console.log(`[webpush] Notification sent to admin user ${subscription.userId}`);
      } catch (error: any) {
        if (error.statusCode === 410) {
          console.log(`[webpush] Subscription expired for user ${subscription.userId}, removing...`);
        } else {
          console.error(`[webpush] Error sending notification to user ${subscription.userId}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('[webpush] Error sending push notifications to admins:', error);
  }
}
