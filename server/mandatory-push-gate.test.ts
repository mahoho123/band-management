import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/Home.tsx"),
  "utf8",
);

const subSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/AdminPushSubscription.tsx"),
  "utf8",
);

describe("mobile login notification experience", () => {
  it("does not render a mandatory notification gate after login", () => {
    expect(homeSource).not.toContain("currentUser && !devicePushSubscribed");
    expect(homeSource).not.toContain("必須開啟本裝置推播通知");
    expect(homeSource).not.toContain("setDevicePushSubscribed");
  });

  it("keeps the notification subscription component available for manual setup", () => {
    expect(homeSource).toContain("AdminPushSubscription");
    expect(subSource).toContain("重新檢查權限");
    expect(subSource).toContain("推播通知");
  });
});
