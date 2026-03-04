import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

let socket: Socket | null = null;

/**
 * 全局 Socket.IO 連接管理
 * 確保只有一個連接實例，避免無限重新連接
 */
function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('[Realtime Sync] Connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Realtime Sync] Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[Realtime Sync] Connection error:', error);
    });
  }

  return socket;
}

/**
 * 實時同步 hook
 * 監聽 Socket.IO 事件並自動更新 tRPC 查詢緩存
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    // 事件監聽器映射
    const eventHandlers = {
      'event:added': () => {
        console.log('[Realtime Sync] Event added, invalidating events query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getEvents']] });
      },
      'event:updated': () => {
        console.log('[Realtime Sync] Event updated, invalidating events query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getEvents']] });
      },
      'event:deleted': () => {
        console.log('[Realtime Sync] Event deleted, invalidating events query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getEvents']] });
      },
      'member:added': () => {
        console.log('[Realtime Sync] Member added, invalidating members query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getMembers']] });
      },
      'member:updated': () => {
        console.log('[Realtime Sync] Member updated, invalidating members query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getMembers']] });
      },
      'member:deleted': () => {
        console.log('[Realtime Sync] Member deleted, invalidating members query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getMembers']] });
      },
      'attendance:changed': () => {
        console.log('[Realtime Sync] Attendance changed, invalidating events query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getEvents']] });
      },
      'holiday:added': () => {
        console.log('[Realtime Sync] Holiday added, invalidating holidays query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getHolidays']] });
      },
      'system:updated': () => {
        console.log('[Realtime Sync] System updated, invalidating system data query');
        queryClient.invalidateQueries({ queryKey: [['band', 'getSystemData']] });
      },
    };

    // 註冊所有事件監聽器
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler as any);
    });

    // 清理函數：不移除監聽器，保持連接活躍
    return () => {
      // 不在這裡斷開連接，保持全局連接
      // 只有在應用卸載時才斷開
    };
  }, [queryClient]);
}
