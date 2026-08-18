import { and, eq } from "drizzle-orm";
import { bandEvents, bandMembers } from "../drizzle/schema";
import { enqueueBackgroundTask } from "./_core/background";
import { sendPushNotificationToAdmins } from "./_core/webpush";
import { createNotification, getDb } from "./db";
import { formatTimeObjectTo12 } from "./attendanceFormatting";

export type AttendanceChange = {
  eventId: number;
  memberId: number;
  status: "going" | "not-going" | "unknown";
};

export function queueAttendanceNotification(change: AttendanceChange): void {
  enqueueBackgroundTask("attendance notification", async () => {
    const db = await getDb();
    if (!db) return;
    const [memberResult, eventResult] = await Promise.all([
      db.select().from(bandMembers).where(eq(bandMembers.id, change.memberId)),
      db.select().from(bandEvents).where(eq(bandEvents.id, change.eventId)),
    ]);
    const member = memberResult[0];
    const event = eventResult[0];
    if (!member || !event) return;

    const statusText = change.status === "going" ? "✅ 已確認出席" : change.status === "not-going" ? "❌ 已確認不出席" : "❓ 待確認";
    const logoUrl = "/logo.png";
    const eventDetails = `📅 ${event.date}\n🕐 ${formatTimeObjectTo12(event.startTime)} - ${formatTimeObjectTo12(event.endTime)}\n📍 ${event.location}`;
    const notificationBody = `${member.name}\n${statusText}\n\n${event.title}\n${eventDetails}`;

    await createNotification({
      eventId: change.eventId,
      memberId: change.memberId,
      title: "🎵 出席狀態更新",
      message: `${member.name} ${statusText}\n\n${event.title}\n${eventDetails}`,
      type: "attendance-changed",
    });
    await sendPushNotificationToAdmins({
      title: "🎵 出席狀態更新",
      body: notificationBody,
      eventId: change.eventId,
      url: "/",
      icon: logoUrl,
      badge: logoUrl,
      eventTag: `attendance-event-${change.eventId}-${change.memberId}`,
    });
  });
}
