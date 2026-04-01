import NodeCache from 'node-cache';

/**
 * S 級升級：內存緩存系統
 * 使用 node-cache 實現簡單的內存緩存
 * 
 * 緩存策略：
 * - 讀取操作（getMembers、getEvents）：緩存 5 分鐘
 * - 寫入操作：立即清除相關緩存
 * - 緩存命中率預期：80%+
 */

// 創建緩存實例（5 分鐘 TTL）
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// 緩存鍵定義
export const CACHE_KEYS = {
  MEMBERS: 'members',
  EVENTS: 'events',
  EVENTS_BY_DATE: (date: string) => `events:${date}`,
  ATTENDANCE: (eventId: number) => `attendance:${eventId}`,
  HOLIDAYS: 'holidays',
  SYSTEM_DATA: 'system_data',
} as const;

/**
 * 獲取緩存值
 */
export function getFromCache<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * 設置緩存值
 */
export function setInCache<T>(key: string, value: T, ttl?: number): void {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

/**
 * 刪除緩存值
 */
export function deleteFromCache(key: string): void {
  cache.del(key);
}

/**
 * 清除所有緩存
 */
export function clearAllCache(): void {
  cache.flushAll();
}

/**
 * 清除特定前綴的緩存（例如清除所有 events:* 的緩存）
 */
export function clearCacheByPrefix(prefix: string): void {
  const keys = cache.keys();
  keys.forEach((key: string) => {
    if (key.startsWith(prefix)) {
      cache.del(key);
    }
  });
}

/**
 * 獲取緩存統計信息
 */
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    stats: cache.getStats(),
  };
}

/**
 * 緩存裝飾器（用於自動緩存函數結果）
 */
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 檢查緩存
  const cached = getFromCache<T>(key);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  // 執行函數並緩存結果
  return fn().then(result => {
    setInCache(key, result, ttl);
    return result;
  });
}

export default cache;
