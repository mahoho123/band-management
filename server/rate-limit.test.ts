import { describe, expect, it, beforeEach } from "vitest";
import {
  assertPasswordRateLimit,
  getRequestIdentifier,
  resetPasswordRateLimitForTests,
} from "./_core/rateLimit";

function makeRequest(ip?: string, forwardedFor?: string) {
  return {
    ip,
    headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : {},
  };
}

describe("password rate limit", () => {
  beforeEach(() => resetPasswordRateLimitForTests());

  it("prefers the direct request IP and falls back to forwarded-for", () => {
    expect(getRequestIdentifier(makeRequest("10.0.0.1", "10.0.0.2"))).toBe("10.0.0.1");
    expect(getRequestIdentifier(makeRequest(undefined, "10.0.0.2, 10.0.0.3"))).toBe("10.0.0.2");
    expect(getRequestIdentifier(makeRequest())).toBe("unknown");
  });

  it("allows the configured burst then rejects additional attempts", () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      expect(() => assertPasswordRateLimit("admin:10.0.0.1")).not.toThrow();
    }
    expect(() => assertPasswordRateLimit("admin:10.0.0.1")).toThrow("嘗試次數過多");
    expect(() => assertPasswordRateLimit("admin:10.0.0.2")).not.toThrow();
  });
});
