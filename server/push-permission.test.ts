import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/AdminPushSubscription.tsx"),
  "utf8",
);

describe("push permission error handling", () => {
  it("treats denied permission as a recoverable state instead of throwing", () => {
    expect(source).toContain("const DENIED_PERMISSION_MESSAGE");
    expect(source).toContain("setPermissionDenied(true)");
    expect(source).toContain("setError(DENIED_PERMISSION_MESSAGE)");
    expect(source).toContain("return;");
  });

  it("provides a manual permission recheck action", () => {
    expect(source).toContain("重新檢查權限");
    expect(source).toContain("onClick={() => void handleSubscribe()}");
  });

  it("keeps unsupported-browser and service-worker failures explicit", () => {
    expect(source).toContain("瀏覽器不支援 Service Worker");
    expect(source).toContain("瀏覽器不支援 Web Push");
    expect(source).toContain("Service Worker 啟動超時");
  });
});
