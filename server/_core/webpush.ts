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
 * Uses the admin's single subscription stored in bandSystemData
 */
export async function sendPushNotificationToAdmins(
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Get admin's subscription from system data
    const subscriptionJson = await getAdminPushSubscription();
    
    if (!subscriptionJson) {
      console.log('[webpush] No admin subscription found');
      return;
    }

    let subscription: any;
    try {
      subscription = JSON.parse(subscriptionJson);
    } catch (error) {
      console.error('[webpush] Failed to parse admin subscription:', error);
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      eventId: payload.eventId,
      url: payload.url || '/',
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh,
          },
        },
        notificationPayload
      );
      console.log('[webpush] Notification sent to admin');
    } catch (error: any) {
      if (error.statusCode === 410) {
        console.log('[webpush] Admin subscription expired, removing...');
      } else {
        console.error('[webpush] Error sending notification to admin:', error);
      }
    }
  } catch (error) {
    console.error('[webpush] Error sending push notification to admin:', error);
  }
}
