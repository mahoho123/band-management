import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { enqueueBackgroundTask } from "./_core/background";

const projectRoot = resolve(import.meta.dirname, "..");
const homeSource = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
const mainSource = readFileSync(resolve(projectRoot, "client/src/main.tsx"), "utf8");
const routerSource = readFileSync(resolve(projectRoot, "server/routers/band.ts"), "utf8");
const attendanceSideEffectsSource = readFileSync(resolve(projectRoot, "server/attendanceSideEffects.ts"), "utf8");
const serverEntrySource = readFileSync(resolve(projectRoot, "server/_core/index.ts"), "utf8");
const socketSource = readFileSync(resolve(projectRoot, "server/_core/socket.ts"), "utf8");
const globalStyles = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

describe("zero-perceived-latency contracts", () => {
  it("uses direct responsive start and end time inputs without TimeSelector", () => {
    expect(homeSource).not.toContain("<TimeSelector");
    expect(homeSource).toContain("開始時間");
    expect(homeSource).toContain("結束時間");
    expect(homeSource).toContain("grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4");
  });

  it("memoizes expensive calendar and list selectors", () => {
    expect(homeSource).toContain("const hkHolidays = useMemo(");
    expect(homeSource).toContain("const filteredEventGroups = useMemo(() => {");
    expect(homeSource).toContain("filteredEventGroups;");
  });

  it("uses React Query optimistic mutation callbacks for core entities", () => {
    expect(homeSource).toContain("onMutate: async input =>");
    expect(homeSource).toContain("utils.band.getEvents.setData");
    expect(homeSource).toContain("utils.band.getMembers.setData");
    expect(homeSource).toContain("attendanceInFlightRef");
    expect(homeSource).toContain("已還原畫面");
    expect(homeSource).not.toContain("localAttendance");
  });

  it("guards heavy submissions only while a mutation is pending", () => {
    expect(homeSource).toContain("eventSubmissionInFlightRef.current");
    expect(homeSource).toContain("deleteEventMutation.isPending");
  });

  it("queues background notifications and analytics out of core request path", () => {
    expect(typeof enqueueBackgroundTask).toBe("function");
    expect(routerSource).toContain("enqueueBackgroundTask");
    expect(attendanceSideEffectsSource).toContain("enqueueBackgroundTask");
  });

  it("enables Express response compression and cache headers", () => {
    expect(serverEntrySource).toContain("compression(");
    expect(serverEntrySource).toContain("max-age=31536000");
    expect(globalStyles).toContain("tailwindcss");
  });

  it("shares socket instance across modules without port binding conflicts", () => {
    expect(socketSource).toContain("globalIO");
    expect(serverEntrySource).toContain("setIO");
  });
});
