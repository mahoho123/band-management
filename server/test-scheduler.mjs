/**
 * Manual test script to trigger the pending attendance reminder scheduler
 * This script:
 * 1. Sets up test data (activity for tomorrow with pending attendance)
 * 2. Sets admin WhatsApp number
 * 3. Manually triggers the scheduler check
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  bandEvents,
  bandAttendance,
  bandMembers,
  bandSystemData,
} from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function runTest() {
  try {
    // Create database connection
    const db = drizzle(DATABASE_URL);

    console.log("=== WhatsApp Notification Test ===\n");

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

    // Step 2: Get or create test members
    console.log("Step 2: Getting test members...");
    const members = await db.select().from(bandMembers).limit(3);
    
    if (members.length === 0) {
      console.log("✗ No members found. Please create members first.\n");
      process.exit(1);
    }
    
    console.log(`✓ Found ${members.length} members`);
    members.forEach((m) => console.log(`  - ${m.name} (ID: ${m.id})`));
    console.log();

    // Step 3: Create test activity for tomorrow
    console.log("Step 3: Creating test activity for tomorrow...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(
      tomorrow.getMonth() + 1
    ).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    // Check if activity already exists for tomorrow
    const existingEvents = await db
      .select()
      .from(bandEvents)
      .where(eq(bandEvents.date, tomorrowStr));

    let testEventId;
    if (existingEvents.length > 0) {
      testEventId = existingEvents[0].id;
      console.log(
        `✓ Using existing event: ${existingEvents[0].title} (ID: ${testEventId})`
      );
    } else {
      const insertResult = await db.insert(bandEvents).values({
        title: "🧪 自動通知測試活動",
        date: tomorrowStr,
        startTime: "19:00",
        endTime: "21:00",
        location: "測試地點",
        type: "rehearsal",
        notes: "This is a test event for WhatsApp notification",
      });
      testEventId = insertResult[0];
      console.log(
        `✓ Created test event: 自動通知測試活動 (ID: ${testEventId}) for ${tomorrowStr}`
      );
    }
    console.log();

    // Step 4: Set attendance status (some pending, some confirmed)
    console.log("Step 4: Setting attendance status...");
    for (let i = 0; i < members.length; i++) {
      const status = i === 0 ? "going" : "unknown"; // First member confirmed, others pending
      
      // Check if attendance record exists
      const existing = await db
        .select()
        .from(bandAttendance)
        .where(
          eq(bandAttendance.eventId, testEventId) &&
            eq(bandAttendance.memberId, members[i].id)
        );

      if (existing.length > 0) {
        await db
          .update(bandAttendance)
          .set({ status })
          .where(eq(bandAttendance.id, existing[0].id));
      } else {
        await db.insert(bandAttendance).values({
          eventId: testEventId,
          memberId: members[i].id,
          status,
        });
      }

      console.log(`  - ${members[i].name}: ${status === "going" ? "✓ Going" : "⏳ Pending"}`);
    }
    console.log();

    // Step 5: Import and run the scheduler check
    console.log("Step 5: Running scheduler check...");
    const { checkPendingAttendanceForTomorrow, generatePendingAttendanceMessage } =
      await import("./scheduler/pendingAttendanceReminder.js");

    const pendingEvents = await checkPendingAttendanceForTomorrow();
    console.log(`✓ Found ${pendingEvents.length} event(s) with pending attendance\n`);

    if (pendingEvents.length > 0) {
      pendingEvents.forEach((event) => {
        console.log(`Event: ${event.title}`);
        console.log(`  Date: ${event.date}`);
        console.log(`  Time: ${event.startTime}-${event.endTime}`);
        console.log(`  Location: ${event.location}`);
        console.log(`  Pending members: ${event.pendingMembers.join(", ")}`);
        console.log(`  Status: ${event.pendingCount}/${event.totalMembers} pending\n`);
      });

      // Step 6: Generate WhatsApp message
      console.log("Step 6: Generating WhatsApp message...");
      const message = generatePendingAttendanceMessage(pendingEvents);
      console.log("Generated message:");
      console.log("---");
      console.log(message);
      console.log("---\n");

      // Step 7: Generate WhatsApp link
      console.log("Step 7: Generating WhatsApp link...");
      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://wa.me/85254029146?text=${encodedMessage}`;
      console.log("WhatsApp link:");
      console.log(whatsappLink);
      console.log("\n✓ You can click this link to send the message via WhatsApp\n");
    } else {
      console.log("✗ No pending attendance found for tomorrow\n");
    }

    console.log("=== Test Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

runTest();
