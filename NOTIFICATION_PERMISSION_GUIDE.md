# Web Push 通知權限請求指南

## 如何在應用中請求通知權限

### 方法 1：使用 Notification.requestPermission()（推薦）

```typescript
// 請求通知權限
async function requestNotificationPermission() {
  try {
    // 檢查瀏覽器是否支援通知 API
    if (!('Notification' in window)) {
      console.error('您的瀏覽器不支援通知功能');
      return false;
    }

    // 檢查當前權限狀態
    console.log('當前通知權限:', Notification.permission);
    
    // 如果已經授予權限，直接返回
    if (Notification.permission === 'granted') {
      console.log('已授予通知權限');
      return true;
    }

    // 如果已經拒絕，提示用戶在瀏覽器設定中修改
    if (Notification.permission === 'denied') {
      console.warn('通知權限已被拒絕，請在瀏覽器設定中修改');
      return false;
    }

    // 請求權限（permission 為 'default' 時）
    console.log('正在請求通知權限...');
    const permission = await Notification.requestPermission();
    
    console.log('用戶的選擇:', permission);
    
    if (permission === 'granted') {
      console.log('✅ 用戶已授予通知權限');
      return true;
    } else if (permission === 'denied') {
      console.warn('❌ 用戶拒絕了通知權限');
      return false;
    }
    
  } catch (error) {
    console.error('請求通知權限時出錯:', error);
    return false;
  }
}
```

### 方法 2：在 React 組件中使用

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function NotificationPermissionButton() {
  const [permission, setPermission] = useState<NotificationPermission>(
    Notification.permission
  );

  const handleRequestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        alert('✅ 已授予通知權限！');
      } else if (result === 'denied') {
        alert('❌ 您拒絕了通知權限');
      }
    } catch (error) {
      console.error('請求權限失敗:', error);
    }
  };

  return (
    <div>
      <p>當前通知權限: {permission}</p>
      {permission !== 'granted' && (
        <Button onClick={handleRequestPermission}>
          請求通知權限
        </Button>
      )}
    </div>
  );
}
```

### 方法 3：完整的通知權限檢查和請求流程

```typescript
async function setupNotifications() {
  // 1. 檢查瀏覽器支援
  if (!('Notification' in window)) {
    console.error('瀏覽器不支援通知');
    return false;
  }

  // 2. 檢查 Service Worker 支援
  if (!('serviceWorker' in navigator)) {
    console.error('瀏覽器不支援 Service Worker');
    return false;
  }

  // 3. 檢查 Push API 支援
  if (!('PushManager' in window)) {
    console.error('瀏覽器不支援 Web Push');
    return false;
  }

  // 4. 檢查當前權限狀態
  const currentPermission = Notification.permission;
  console.log('當前通知權限:', currentPermission);

  // 5. 如果已拒絕，提示用戶修改瀏覽器設定
  if (currentPermission === 'denied') {
    console.warn('通知權限已被拒絕。請按以下步驟修改:');
    console.warn('1. 點擊地址欄左側的鎖定圖標 🔒');
    console.warn('2. 找到「通知」設定');
    console.warn('3. 將其改為「允許」');
    return false;
  }

  // 6. 如果權限為 default，請求用戶授權
  if (currentPermission === 'default') {
    console.log('正在請求通知權限...');
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.error('用戶拒絕了通知權限');
      return false;
    }
  }

  // 7. 權限已授予，可以進行推播訂閱
  console.log('✅ 通知權限已授予，可以訂閱推播通知');
  return true;
}
```

## 通知權限狀態說明

| 狀態 | 含義 | 操作 |
|------|------|------|
| `'default'` | 用戶未做出選擇 | 調用 `Notification.requestPermission()` 請求 |
| `'granted'` | 用戶已授予權限 | 可以直接發送通知 |
| `'denied'` | 用戶已拒絕權限 | 提示用戶在瀏覽器設定中修改 |

## 瀏覽器中修改通知權限的步驟

### Chrome / Edge / Brave
1. 點擊地址欄左側的鎖定圖標 🔒
2. 在下拉菜單中找到「通知」
3. 將其改為「允許」或「拒絕」

### Firefox
1. 點擊地址欄左側的資訊圖標 ℹ️
2. 在下拉菜單中找到「通知」
3. 將其改為「允許」或「拒絕」

### Safari (macOS)
1. 打開 Safari 偏好設定
2. 進入「網站」標籤
3. 在左側選擇「通知」
4. 找到該網站並修改設定

## 最佳實踐

1. **在用戶交互後請求權限** - 不要在頁面加載時立即請求，應在用戶點擊按鈕後請求
2. **提供清晰的說明** - 告訴用戶為什麼需要通知權限
3. **優雅降級** - 如果用戶拒絕，應提供其他通知方式（如 Email、WhatsApp）
4. **檢查 Service Worker** - 確保 Service Worker 已註冊後再訂閱推播
5. **處理權限變更** - 定期檢查權限狀態，以防用戶在瀏覽器設定中修改

## 常見問題

**Q: 為什麼 Notification.requestPermission() 沒有彈出對話框？**
A: 可能的原因：
- 用戶已經拒絕過該網站的通知（permission 為 'denied'）
- 瀏覽器設定中禁用了通知
- 不是由用戶交互觸發的（某些瀏覽器要求用戶交互）

**Q: 如何重新請求已被拒絕的權限？**
A: 用戶需要在瀏覽器設定中手動修改該網站的通知權限。代碼無法強制重新請求。

**Q: 在 iOS Safari 中是否支援 Web Push？**
A: 不支援。iOS Safari 不支援 Web Push API。建議改用其他通知方式（如 Email、WhatsApp）。
