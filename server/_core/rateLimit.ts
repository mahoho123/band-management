import { TRPCError } from "@trpc/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 12;

export function getRequestIdentifier(req: { ip?: string; headers: Record<string, unknown> }): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() : "";
  return req.ip || forwardedIp || "unknown";
}

export function assertPasswordRateLimit(identifier: string): void {
  const now = Date.now();
  const current = attempts.get(identifier);

  if (!current || current.resetAt <= now) {
    attempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "嘗試次數過多，請稍後再試",
    });
  }

  current.count += 1;
}

export function resetPasswordRateLimitForTests(): void {
  attempts.clear();
}
