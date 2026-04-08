import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";

// ── 平台偵測 ──
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    ('standalone' in navigator && (navigator as any).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

// ── Base64 工具 ──
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function AdminPushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  const savePushSubscriptionMutation = trpc.band.savePushSubscription.useMutation();

  // 檢查是否已訂閱 + 偵測 iOS 未加入主畫面
  useEffect(() => {
    const init = async () => {
      // iOS 但未加入主畫面 → 顯示提示
      if (isIOS() && !isInStandaloneMode()) {
        setShowIOSPrompt(true);
        return;
      }

      try {
        if (!('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) setIsSubscribed(true);
      } catch (err) {
        console.error('[AdminPushSubscription] Error checking subscription:', err);
      }
    };

    init();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // iOS 未加入主畫面
      if (isIOS() && !isInStandaloneMode()) {
        setShowIOSPrompt(true);
        setIsLoading(false);
        return;
      }

      if (!('serviceWorker' in navigator)) {
        throw new Error('❌ 您的瀏覽器不支援 Service Worker。\n請使用 Chrome 或 Safari（iOS 需加入主畫面）。');
      }
      if (!('PushManager' in window)) {
        throw new Error('❌ 您的瀏覽器不支援 Web Push。\n請確保使用最新版本的瀏覽器。');
      }
      if (!('Notification' in window)) {
        throw new Error('❌ 您的瀏覽器不支援 Notification API。');
      }

      // 確保 SW 已就緒
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Service Worker 啟動超時，請重新整理頁面後再試')), 10000)
        ),
      ]);

      // 通知權限
      if (Notification.permission === 'denied') {
        throw new Error(
          '❌ 您已拒絕通知權限。\n\n請在瀏覽器設定中允許通知：\n\n📱 Android Chrome：\n1. 點擊地址欄右側的「⋮」\n2. 設定 → 網站設定 → 通知\n3. 找到此網站並允許\n\n📱 iPhone（需先加入主畫面）：\n1. 點擊 Safari 分享按鈕\n2. 加入主畫面\n3. 從主畫面圖示開啟後重試\n\n💻 電腦：\n1. 點擊地址欄左側的鎖定圖標\n2. 通知 → 允許'
        );
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('❌ 無法獲取通知權限，請在瀏覽器設定中允許通知後重試。');
        }
      }

      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('❌ VAPID 公鑰未配置，請聯絡管理員。');
      }

      // 訂閱 Push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const auth = subscription.getKey('auth');
      const p256dh = subscription.getKey('p256dh');
      if (!auth || !p256dh) {
        throw new Error('❌ 無法獲取訂閱密鑰，請重試。');
      }

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          auth: arrayBufferToBase64(auth),
          p256dh: arrayBufferToBase64(p256dh),
        },
      };

      await savePushSubscriptionMutation.mutateAsync({
        subscription: JSON.stringify(subscriptionData),
      });

      setIsSubscribed(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '❌ 訂閱失敗，請重試。';
      console.error('[AdminPushSubscription] Error:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!('serviceWorker' in navigator)) throw new Error('不支援 Service Worker');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '❌ 取消訂閱失敗，請重試。');
    } finally {
      setIsLoading(false);
    }
  };

  // ── iOS 未加入主畫面提示 ──
  if (showIOSPrompt) {
    return (
      <Card className="w-full border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Smartphone className="w-5 h-5" />
            iPhone 需要加入主畫面
          </CardTitle>
          <CardDescription className="text-amber-700">
            iOS 的 Web Push 通知需要先將網頁加入主畫面
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-amber-800 space-y-2">
            <p className="font-semibold">請按以下步驟操作：</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>在 Safari 底部點擊「分享」按鈕（方框加箭頭圖示）</li>
              <li>向下滑動找到「加入主畫面」</li>
              <li>點擊「加入」確認</li>
              <li>從主畫面的「慢半拍」圖示重新開啟</li>
              <li>回到此頁面啟用推播通知</li>
            </ol>
          </div>
          <div className="text-xs text-amber-600 bg-amber-100 rounded p-2">
            💡 加入主畫面後，即使關閉 Safari 也能在背景收到通知
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          推播通知設定
        </CardTitle>
        <CardDescription>
          啟用後，成員改變出席狀態時，即使關閉網頁也能在手機/電腦上收到通知
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-700">
              {isSubscribed ? '✅ 推播通知已成功啟用！' : '✅ 推播通知已停用'}
            </div>
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
                {isLoading ? '處理中...' : '停用推播通知'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '啟用中...' : '啟用推播通知'}
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-600 space-y-1.5">
          <p className="font-medium">💡 提示：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>首次啟用時，瀏覽器會請求通知權限，請點擊「允許」</li>
            <li>Android：建議加入主畫面以確保背景通知穩定</li>
            <li>iPhone：必須先加入主畫面才能收到背景通知</li>
            <li>支援多設備訂閱，在不同設備分別啟用即可</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
