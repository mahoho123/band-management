/**
 * Manual test script to trigger the pending attendance reminder scheduler - Version 2
 * This version checks attendance data more carefully
 */

import { getDb } from "./db";
import {
  bandEvents,
  bandAttendance,
  bandMembers,
  bandSystemData,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { checkPendingAttendanceForTomorrow, generatePendingAttendanceMessage } from "./scheduler/pendingAttendanceReminder";

async function runTest() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not available");
      process.exit(1);
    }

    console.log("=== WhatsApp Notification Test V2 ===\n");

    // Step 1: Set admin WhatsApp number
    console.log("Step 1: Setting admin WhatsApp number...");
    const systemData = await db.select().from(bandSystemData).limit(1);

    if (systemData.length > 0) {
      await db
        .update(bandSystemData)
        .set({ adminWhatsAppNumber: "+85254029146" })
        .where(eq(bandSystemData.id, systemData[0].id));
      console.log("✓ Admin WhatsApp number set to: +85254029146\n");
    } else {
      console.log("✗ No system data found\n");
      process.exit(1);
    }

    // Step 2: Get test members
    console.log("Step 2: Getting test members...");
    const members = await db.select().from(bandMembers).limit(3);

    if (members.length === 0) {
      console.log("✗ No members found. Please create members first.\n");
      process.exit(1);
    }

    console.log(`✓ Found ${members.length} members`);
    members.forEach((m) => console.log(`  - ${m.name} (ID: ${m.id})`));
    console.log();

    // Step 3: Get tomorrow's date
    console.log("Step 3: Getting tomorrow's date...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(
      tomorrow.getMonth() + 1
    ).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    console.log(`✓ Tomorrow's date: ${tomorrowStr}\n`);

    // Step 4: Find or create event for tomorrow
    console.log("Step 4: Finding or creating event for tomorrow...");
    const existingEvents = await db
      .select()
      .from(bandEvents)
      .where(eq(bandEvents.date, tomorrowStr));

    let testEventId: number;
    if (existingEvents.length > 0) {
      testEventId = existingEvents[0].id;
      console.log(
        `✓ Using existing event: "${existingEvents[0].title}" (ID: ${testEventId})`
      );
    } else {
      const insertResult = await db.insert(bandEvents).values({
        title: "🧪 自動通知測試活動",
        date: tomorrowStr,
        startTime: "19:00",
        endTime: "21:00",
        location: "測試地點",
        type: "rehearsal",
        notes: "Test event for WhatsApp notification",
      });
      testEventId = (insertResult as any).insertId || insertResult[0];
      console.log(
        `✓ Created test event: "自動通知測試活動" (ID: ${testEventId})`
      );
    }
    console.log();

    // Step 5: Clear and set attendance status
    console.log("Step 5: Setting attendance status...");
    
    // First, delete all existing attendance for this event
    const existingAttendance = await db
      .select()
      .from(bandAttendance)
      .where(eq(bandAttendance.eventId, testEventId));
    
    if (existingAttendance.length > 0) {
      console.log(`  Clearing ${existingAttendance.length} existing attendance records...`);
      for (const record of existingAttendance) {
        await db
          .delete(bandAttendance)
          .where(eq(bandAttendance.id, record.id));
      }
    }

    // Now add new attendance records
    for (let i = 0; i < members.length; i++) {
      const status = i === 0 ? "going" : "unknown"; // First confirmed, others pending

      await db.insert(bandAttendance).values({
        eventId: testEventId,
        memberId: members[i].id,
        status: status as any,
      });

      console.log(
        `  ✓ ${members[i].name}: ${status === "going" ? "✓ Going" : "⏳ Pending"}`
      );
    }
    console.log();

    // Step 6: Verify attendance was set
    console.log("Step 6: Verifying attendance records...");
    const attendanceRecords = await db
      .select()
      .from(bandAttendance)
      .where(eq(bandAttendance.eventId, testEventId));
    
    console.log(`✓ Found ${attendanceRecords.length} attendance records:`);
    attendanceRecords.forEach((record) => {
      const member = members.find((m) => m.id === record.memberId);
      console.log(
        `  - ${member?.name} (ID: ${record.memberId}): ${record.status}`
      );
    });
    console.log();

    // Step 7: Run the scheduler check
    console.log("Step 7: Running scheduler check...");
    const pendingEvents = await checkPendingAttendanceForTomorrow();
    console.log(
      `✓ Found ${pendingEvents.length} event(s) with pending attendance\n`
    );

    if (pendingEvents.length > 0) {
      pendingEvents.forEach((event) => {
        console.log(`📅 Event: ${event.title}`);
        console.log(`   Date: ${event.date}`);
        console.log(`   Time: ${event.startTime}-${event.endTime}`);
        console.log(`   Location: ${event.location}`);
        console.log(`   Pending members: ${event.pendingMembers.join(", ")}`);
        console.log(`   Status: ${event.pendingCount}/${event.totalMembers} pending\n`);
      });

      // Step 8: Generate WhatsApp message
      console.log("Step 8: Generating WhatsApp message...");
      const message = generatePendingAttendanceMessage(pendingEvents);
      console.log("Generated message:");
      console.log("---");
      console.log(message);
      console.log("---\n");

      // Step 9: Generate WhatsApp link
      console.log("Step 9: Generating WhatsApp link...");
      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://wa.me/85254029146?text=${encodedMessage}`;
      console.log("WhatsApp link:");
      console.log(whatsappLink);
      console.log(
        "\n✅ SUCCESS! You can click this link to send the message via WhatsApp\n"
      );
    } else {
      console.log("⚠️ No pending attendance found for tomorrow\n");
    }

    console.log("=== Test Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

runTest();
