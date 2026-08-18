import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { enqueueBackgroundTask } from "./_core/background";

const projectRoot = resolve(import.meta.dirname, "..");
const homeSource = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
const mainSource = readFileSync(resolve(projectRoot, "client/src/main.tsx"), "utf8");
const routerSource = readFileSync(resolve(projectRoot, "server/routers/band.ts"), "utf8");
const globalStyles = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

describe("zero-perceived-latency contracts", () => {
  it("uses React Query optimistic mutation callbacks for core entities", () => {
    expect(homeSource).toContain("onMutate: async input =>");
    expect(homeSource).toContain("utils.band.getEvents.setData");
    expect(homeSource).toContain("utils.band.getMembers.setData");
    expect(homeSource).toContain("attendanceInFlightRef");
    expect(homeSource).toContain("已還原畫面");
    expect(homeSource).not.toContain("localAttendance");
  });

  it("prefetches the next view on pointer and keyboard focus", () => {
    expect(homeSource).toContain("prefetchViewData(\"calendar\")");
    expect(homeSource).toContain("prefetchViewData(\"list\")");
    expect(homeSource).toContain("prefetchViewData(\"members\")");
    expect(homeSource).toContain("getEvents.prefetch");
    expect(homeSource).toContain("getMembers.prefetch");
  });

  it("configures stale-while-revalidate query defaults", () => {
    expect(mainSource).toContain("staleTime: 30_000");
    expect(mainSource).toContain("gcTime: 5 * 60_000");
    expect(mainSource).toContain("refetchOnReconnect: true");
  });

  it("queues non-critical notifications after the core mutation path", () => {
    expect(routerSource).toContain('enqueueBackgroundTask("attendance notification"');
    expect(routerSource).toContain('enqueueBackgroundTask("event-added notification"');
    expect(routerSource).toContain('enqueueBackgroundTask("event-updated notification"');
    expect(routerSource).toContain('enqueueBackgroundTask("event-deleted notification"');
    expect(routerSource).toContain('enqueueBackgroundTask("member-login notification"');
  });

  it("executes queued work asynchronously", async () => {
    const calls: string[] = [];
    enqueueBackgroundTask("test", () => calls.push("done"));
    expect(calls).toEqual([]);
    await new Promise<void>(resolvePromise => setImmediate(resolvePromise));
    expect(calls).toEqual(["done"]);
  });

  it("keeps interaction feedback compositor-friendly", () => {
    expect(globalStyles).toContain("will-change: transform, background-color, border-color");
    expect(globalStyles).toContain("backface-visibility: hidden");
    expect(globalStyles).toContain("prefers-reduced-motion: reduce");
    expect(globalStyles).toContain("transition: transform 0.1s linear");
  });
});
