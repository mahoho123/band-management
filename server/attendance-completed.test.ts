import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/Home.tsx"),
  "utf8",
);

function handlerSource(startMarker: string, endMarker: string): string {
  const start = homeSource.indexOf(startMarker);
  const end = homeSource.indexOf(endMarker, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return homeSource.slice(start, end);
}

describe("completed event attendance", () => {
  it("allows members to update their own attendance after an event ends", () => {
    const handler = handlerSource(
      "const handleAttendanceChange = (",
      "// Handle individual member attendance change",
    );

    expect(handler).toContain("submitAttendanceChange(eventId, currentUser.id as number, status)");
    expect(handler).not.toContain("isEventEnded(event)");
    expect(handler).not.toContain("不能修改出席狀態");
  });

  it("allows admins to update any member attendance after an event ends", () => {
    const handler = handlerSource(
      "const handleAttendanceChangeForMember = (",
      "const handleSetAttendance =",
    );

    expect(handler).toContain("submitAttendanceChange(eventId, memberId, status)");
    expect(handler).not.toContain("isEventEnded(event)");
    expect(handler).not.toContain("此活動已結束，不能修改出席狀態");
  });

  it("keeps the member self-service handler available for completed events", () => {
    const handler = handlerSource(
      "const handleSetAttendance =",
      "// ============================================\n  // MEMBER MANAGEMENT",
    );

    expect(handler).toContain("submitAttendanceChange(selectedEventId, currentUser.id as number, status)");
    expect(handler).not.toContain("isEventEnded(event)");
    expect(handler).not.toContain("不能修改出席狀態");
  });
});
