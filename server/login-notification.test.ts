import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

describe("post-login notification setup", () => {
  it("requests permission from the admin login gesture and opens setup", () => {
    expect(homeSource).toContain("requestNotificationPermissionFromLogin");
    expect(homeSource).toContain("setShowPushNotificationSettings(true)");
    expect(homeSource).toContain("autoEnable={autoEnableNotifications}");
  });

  it("auto-subscribes when permission was already granted", () => {
    expect(subscriptionSource).toContain("autoEnable?: boolean");
    expect(subscriptionSource).toContain('Notification.permission === "granted"');
    expect(subscriptionSource).toContain("void handleSubscribe()");
  });

  it("hides the public reminder banner after Band notification setup is ready", () => {
    expect(equipmentSource).toContain("notificationReady?: boolean");
    expect(equipmentSource).toContain("!notificationReady && showReminderNotice");
  });
});
