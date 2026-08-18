import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/Home.tsx"),
  "utf8",
);
const subscriptionSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/AdminPushSubscription.tsx"),
  "utf8",
);
const equipmentSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/EquipmentLoanView.tsx"),
  "utf8",
);
const adminLoginBlock = homeSource.slice(
  homeSource.indexOf("const handleAdminLogin"),
  homeSource.indexOf("const handleMemberLogin"),
);

describe("post-login notification setup", () => {
  it("does not request permission or open setup automatically after admin login", () => {
    expect(adminLoginBlock).not.toContain("requestNotificationPermissionFromLogin");
    expect(adminLoginBlock).not.toContain("setShowPushNotificationSettings(true)");
    expect(adminLoginBlock).toContain('showToast("主管登入成功", "success")');
  });

  it("keeps notification setup available through the manual settings flow", () => {
    expect(homeSource).toContain("autoEnable={autoEnableNotifications}");
    expect(homeSource).toContain("title=\"推播通知設定\"");
  });

  it("retains auto-subscribe support when setup is opened manually", () => {
    expect(subscriptionSource).toContain("autoEnable?: boolean");
    expect(subscriptionSource).toContain('Notification.permission === "granted"');
    expect(subscriptionSource).toContain("void handleSubscribe()");
  });

  it("hides the public reminder banner after Band notification setup is ready", () => {
    expect(equipmentSource).toContain("notificationReady?: boolean");
    expect(equipmentSource).toContain("!notificationReady && showReminderNotice");
  });
});
