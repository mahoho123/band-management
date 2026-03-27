import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

interface Notification {
  id: number;
  eventId: number;
  memberId: number;
  type: string;
  title: string;
  message: string;
  isRead: number;
  createdAt: Date;
}

export function NotificationBar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 查詢未讀通知
  const { data: unreadNotifications, refetch } = trpc.band.getUnreadNotifications.useQuery();

  useEffect(() => {
    if (unreadNotifications) {
      setNotifications(unreadNotifications);
      setUnreadCount(unreadNotifications.length);
    }
  }, [unreadNotifications]);

  // 定期刷新通知（每 5 秒）
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              您有 <span className="text-red-600">{unreadCount}</span> 條新通知
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {notifications[0]?.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showNotifications ? '隱藏' : '查看'}
          </button>
          <button
            onClick={() => setShowNotifications(false)}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 通知詳情面板 */}
      {showNotifications && (
        <div className="bg-white border-t border-blue-200 max-h-96 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString('zh-HK')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
