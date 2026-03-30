import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle2, AlertCircle } from "lucide-react";

export function AdminPushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const savePushSubscriptionMutation = trpc.band.savePushSubscription.useMutation();

  // Check if already subscribed on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (!("serviceWorker" in navigator)) {
          setError("您的瀏覽器不支援 Service Worker");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          setIsSubscribed(true);
        }
      } catch (err) {
        console.error("[AdminPushSubscription] Error checking subscription:", err);
      }
    };

    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("[AdminPushSubscription] Starting subscription process...");
      
      // Check browser support
      if (!("serviceWorker" in navigator)) {
        throw new Error("您的瀏覽器不支援 Service Worker");
      }
      console.log("[AdminPushSubscription] Service Worker supported");

      if (!("PushManager" in window)) {
        throw new Error("您的瀏覽器不支援 Web Push");
      }
      console.log("[AdminPushSubscription] PushManager supported");

      // Get service worker registration
      console.log("[AdminPushSubscription] Waiting for service worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("[AdminPushSubscription] Service worker ready:", registration);

      // Request notification permission
      console.log("[AdminPushSubscription] Current notification permission:", Notification.permission);
      
      if (Notification.permission === "denied") {
        // Permission was previously denied - provide clear instructions
        const instructions = "您已拒絕通知權限。\n\n請在瀏覽器設定中允許通知:\n1. 點擊地址欄左側的鎖定圖標\n2. 找到『通知』設定\n3. 將其改為『允許』\n4. 重新點擊『啟用推播通知』按鈕";
        setError(instructions);
        setIsLoading(false);
        return;
      }

      if (Notification.permission !== "granted") {
        console.log("[AdminPushSubscription] Requesting notification permission...");
        const permission = await Notification.requestPermission();
        console.log("[AdminPushSubscription] Permission result:", permission);
        if (permission !== "granted") {
          throw new Error("您拒絕了通知權限");
        }
      }
      console.log("[AdminPushSubscription] Notification permission granted");

      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      console.log("[AdminPushSubscription] VAPID public key:", vapidPublicKey ? "present" : "missing");
      if (!vapidPublicKey) {
        throw new Error("VAPID 公鑰未配置");
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, "+")
          .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Subscribe to push notifications
      console.log("[AdminPushSubscription] Subscribing to push notifications...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log("[AdminPushSubscription] Push subscription successful:", subscription);

      // Extract subscription data (PushSubscription object is not directly serializable)
      console.log("[AdminPushSubscription] Extracting subscription keys...");
      const auth = subscription.getKey('auth');
      const p256dh = subscription.getKey('p256dh');
      console.log("[AdminPushSubscription] Auth key present:", !!auth, "P256dh key present:", !!p256dh);
      
      if (!auth || !p256dh) {
        throw new Error("無法獲取訂閱密鑰");
      }

      // Convert to base64 for storage
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          auth: arrayBufferToBase64(auth),
          p256dh: arrayBufferToBase64(p256dh),
        },
      };
      
      const subscriptionJson = JSON.stringify(subscriptionData);
      console.log("[AdminPushSubscription] Subscription data:", subscriptionData);
      console.log("[AdminPushSubscription] Sending to server...");

      // Save subscription to database (will be stored in push_subscriptions table for multi-device support)
      await savePushSubscriptionMutation.mutateAsync({
        subscription: subscriptionJson,
      });
      console.log("[AdminPushSubscription] Subscription saved to server successfully");

      setIsSubscribed(true);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "訂閱失敗";
      console.error("[AdminPushSubscription] Error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("您的瀏覽器不支援 Service Worker");
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await updateAdminSubscriptionMutation.mutateAsync({
          subscription: null,
        });
        setIsSubscribed(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "取消訂閱失敗";
      console.error("[AdminPushSubscription] Error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          推播通知設定
        </CardTitle>
        <CardDescription>
          啟用推播通知後，當成員改變出席狀態時，您會立即在瀏覽器/手機上收到通知
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-700">推播通知已成功啟用！</div>
          </div>
        )}

        <div className="space-y-3">
          {isSubscribed ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">推播通知已啟用</span>
              </div>
              <Button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? "處理中..." : "停用推播通知"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "啟用中..." : "啟用推播通知"}
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-600 space-y-2">
          <p>💡 <strong>提示：</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>首次啟用時，瀏覽器會請求通知權限</li>
            <li>請點擊「允許」以接收推播通知</li>
            <li>啟用後，成員改變出席狀態時您會立即收到通知</li>
            <li>通知會在瀏覽器/手機上顯示，無需打開應用</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
