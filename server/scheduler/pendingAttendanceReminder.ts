/**
 * Scheduler for checking pending attendance and sending WhatsApp reminders
 * Runs daily at 12:00 PM (noon) Hong Kong time
 * Checks for events scheduled tomorrow with pending attendance
 */

import { getDb } from "../db";
import { bandEvents, bandAttendance, bandSystemData, bandMembers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface PendingEvent {
  eventId: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  pendingMembers: string[];
  totalMembers: number;
  pendingCount: number;
}

/**
 * Check for events tomorrow with pending attendance
 * Returns array of events with pending confirmations
 */
export async function checkPendingAttendanceForTomorrow(): Promise<PendingEvent[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get tomorrow's date in Hong Kong timezone
    const now = new Date();
    const hkNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
    const tomorrow = new Date(hkNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    console.log(`[PendingAttendanceReminder] Checking for events on ${tomorrowStr}`);

    // Get all events for tomorrow
    const tomorrowEvents = await db
      .select()
      .from(bandEvents)
      .where(eq(bandEvents.date, tomorrowStr));

    if (tomorrowEvents.length === 0) {
      console.log(`[PendingAttendanceReminder] No events found for ${tomorrowStr}`);
      return [];
    }

    console.log(`[PendingAttendanceReminder] Found ${tomorrowEvents.length} events for tomorrow`);

    // For each event, check for pending attendance
    const pendingEvents: PendingEvent[] = [];

    for (const event of tomorrowEvents) {
      const attendanceRecords = await db
        .select()
        .from(bandAttendance)
        .where(eq(bandAttendance.eventId, event.id));

      // Count pending (unknown status)
      const pendingRecords = attendanceRecords.filter(a => a.status === 'unknown');
      
      if (pendingRecords.length > 0) {
        // Get member names for pending records
        const pendingMemberIds = pendingRecords.map(r => r.memberId);
        const allMembers = await db.select().from(bandMembers);
        const pendingMembers = pendingMemberIds
          .map(id => allMembers.find(m => m.id === id)?.name || `成員 #${id}`)
          .filter(Boolean);
        
        pendingEvents.push({
          eventId: event.id,
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          type: event.type,
          pendingMembers,
          totalMembers: attendanceRecords.length,
          pendingCount: pendingRecords.length,
        });
      }
    }

    console.log(`[PendingAttendanceReminder] Found ${pendingEvents.length} events with pending attendance`);
    return pendingEvents;
  } catch (error) {
    console.error('[PendingAttendanceReminder] Error checking pending attendance:', error);
    return [];
  }
}

/**
 * Generate WhatsApp message for pending attendance reminder
 */
export function generatePendingAttendanceMessage(events: PendingEvent[]): string {
  if (events.length === 0) {
    return '';
  }

  let message = '🎵 *慢半拍 - 待確認出席提醒*\n\n';
  message += `明日有 ${events.length} 個活動有待確認出席的成員：\n\n`;

  events.forEach((event, index) => {
    message += `*${index + 1}. ${event.title}*\n`;
    message += `📅 ${event.date} ${event.startTime}-${event.endTime}\n`;
    message += `📍 ${event.location}\n`;
    message += `⏳ 待確認：${event.pendingCount}/${event.totalMembers} 人\n`;
    message += `🔗 https://adagio.manus.space/\n\n`;
  });

  message += '請登入系統查看詳情並跟進。';
  return message;
}

/**
 * Send pending attendance reminder via WhatsApp
 */
export async function sendPendingAttendanceReminder(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.log('[PendingAttendanceReminder] Database not available');
      return false;
    }

    // Get admin's WhatsApp number
    const systemData = await db.select().from(bandSystemData).limit(1);
    if (!systemData || systemData.length === 0 || !systemData[0].adminWhatsAppNumber) {
      console.log('[PendingAttendanceReminder] Admin WhatsApp number not configured');
      return false;
    }

    const adminWhatsAppNumber = systemData[0].adminWhatsAppNumber;

    // Check for pending attendance
    const pendingEvents = await checkPendingAttendanceForTomorrow();
    if (pendingEvents.length === 0) {
      console.log('[PendingAttendanceReminder] No pending attendance to remind about');
      return true; // Not an error, just no reminders needed
    }

    // Generate message
    const message = generatePendingAttendanceMessage(pendingEvents);
    if (!message) {
      console.log('[PendingAttendanceReminder] No message generated');
      return true;
    }

    // Generate WhatsApp link
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${adminWhatsAppNumber.replace(/\D/g, '')}?text=${encodedMessage}`;

    console.log(`[PendingAttendanceReminder] Generated WhatsApp link for ${adminWhatsAppNumber}`);
    console.log(`[PendingAttendanceReminder] Message: ${message.substring(0, 100)}...`);
    
    // In a real scenario, you might want to:
    // 1. Store the reminder in the database
    // 2. Send via WhatsApp Business API
    // 3. Log the reminder for audit purposes
    
    // For now, we just log it
    console.log('[PendingAttendanceReminder] Reminder ready to send (manual action required)');
    
    return true;
  } catch (error) {
    console.error('[PendingAttendanceReminder] Error sending reminder:', error);
    return false;
  }
}

/**
 * Initialize the scheduler
 * This should be called once when the server starts
 */
export function initPendingAttendanceScheduler() {
  console.log('[PendingAttendanceReminder] Initializing scheduler');

  // Run at 12:00 PM Hong Kong time every day
  // Using node-cron or similar library would be ideal, but for now we'll use setInterval
  
  const scheduleNextRun = () => {
    const now = new Date();
    const hkNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
    
    // Calculate next 12:00 PM
    let nextRun = new Date(hkNow);
    nextRun.setHours(12, 0, 0, 0);
    
    // If it's already past 12:00 PM, schedule for tomorrow
    if (nextRun <= hkNow) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const delayMs = nextRun.getTime() - hkNow.getTime();
    
    console.log(`[PendingAttendanceReminder] Next run scheduled at ${nextRun.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })} (in ${Math.round(delayMs / 1000 / 60)} minutes)`);
    
    setTimeout(() => {
      sendPendingAttendanceReminder().then(() => {
        scheduleNextRun(); // Schedule next run
      });
    }, delayMs);
  };
  
  scheduleNextRun();
}
