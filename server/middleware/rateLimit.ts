import NodeCache from "node-cache";

const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (identifier: string) => {
    const key = `ratelimit:${identifier}`;
    const current = (rateLimitCache.get(key) as number) || 0;

    if (current >= finalConfig.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimitCache.getTtl(key),
      };
    }

    rateLimitCache.set(key, current + 1, finalConfig.windowMs / 1000);

    return {
      allowed: true,
      remaining: finalConfig.maxRequests - (current + 1),
      resetTime: rateLimitCache.getTtl(key),
    };
  };
}

// 預設限制器
export const globalRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

// 嚴格限制器（用於寫入操作）
export const strictRateLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60000,
});
