import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const viewSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/EquipmentLoanView.tsx"),
  "utf8",
);

describe("equipment-loan reminder guidance", () => {
  it("shows safe guidance when the embedded platform is not authenticated", () => {
    expect(viewSource).toContain("未登入或未允許通知時，手機不會收到交還提醒");
    expect(viewSource).toContain("登入後允許通知／推播");
    expect(viewSource).toContain("開啟器材平台登入");
  });

  it("keeps the guidance dismissible without blocking the iframe", () => {
    expect(viewSource).toContain('onClick={() => setShowReminderNotice(false)}');
    expect(viewSource).toContain("<iframe");
  });
});
