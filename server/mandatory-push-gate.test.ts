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

describe("mandatory per-device notification gate", () => {
  it("enforces devicePushSubscribed gate when currentUser is present in Home.tsx", () => {
    expect(homeSource).toContain("currentUser && !devicePushSubscribed");
    expect(homeSource).toContain("必須開啟本裝置推播通知");
    expect(homeSource).toContain("副主席或主管若在多台裝置登入，每台裝置皆須各自啟用一次通知");
  });

  it("supports onSubscribedChange callback in AdminPushSubscription.tsx", () => {
    expect(subSource).toContain("onSubscribedChange");
    expect(subSource).toContain("onSubscribedChange?.(true)");
  });
});
