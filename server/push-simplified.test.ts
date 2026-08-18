import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/AdminPushSubscription.tsx"),
  "utf8",
);

describe("simplified push subscription UX", () => {
  it("hides setup buttons and shows success message when already subscribed", () => {
    expect(source).toContain("推播通知已成功啟用！此裝置已完成常駐背景接收");
    expect(source).not.toContain("停用推播通知");
  });

  it("retains recheck permission flow when permission was denied", () => {
    expect(source).toContain("重新檢查權限");
  });
});
