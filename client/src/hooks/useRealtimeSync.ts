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
      'attendance:changed': (data?: { eventId: number; memberId: number; status: string }) => {
        console.log('[Realtime Sync] Attendance changed', data);
        if (data?.eventId && data?.memberId && data?.status) {
          // 直接更新 cache 中的 attendance，避免整個 refetch 造成 UI 閃爍
          queryClient.setQueryData(
            [['band', 'getEvents'], { type: 'query' }],
            (oldData: any) => {
              if (!Array.isArray(oldData)) return oldData;
              return oldData.map((event: any) => {
                if (event.id !== data.eventId) return event;
                return {
                  ...event,
                  attendance: {
                    ...event.attendance,
                    [data.memberId]: data.status,
                  },
                };
              });
            }
          );
        } else {
          // fallback: 完整 refetch（其他設備的更新）
          queryClient.invalidateQueries({ queryKey: [['band', 'getEvents']] });
        }
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

    // 清理函數：移除本次 effect 添加的監聽器，防止記憶體洩漏
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler as any);
      });
    };
  }, [queryClient]);
}
