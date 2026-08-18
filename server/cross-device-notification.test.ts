import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const swSource = readFileSync(
  resolve(import.meta.dirname, "../client/public/service-worker.js"),
  "utf8",
);
const routerSource = readFileSync(
  resolve(import.meta.dirname, "./routers/band.ts"),
  "utf8",
);

describe("cross-device notification deduplication & acknowledgement", () => {
  it("includes acknowledgment endpoint and broadcast logic in router", () => {
    expect(routerSource).toContain("acknowledgeNotification");
    expect(routerSource).toContain("notification:acknowledged");
  });

  it("posts notification acknowledgement from service worker when clicked", () => {
    expect(swSource).toContain("band.acknowledgeNotification");
    expect(swSource).toContain("notificationId");
  });
});
