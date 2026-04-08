import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getIO } from "../_core/index";
import { getDb } from "../db";
import { sendPushNotificationToAdmins } from "../_core/webpush";
import { and, eq } from "drizzle-orm";
import { bandMembers, bandEvents, bandSystemData, BandMember, BandEvent, BandHoliday } from "../../drizzle/schema";
import { getFromCache, setInCache, deleteFromCache, clearCacheByPrefix, CACHE_KEYS } from "../cache";
import {
  getBandMembers,
  addBandMember,
  deleteBandMember,
  updateBandMember,
  getBandEvents,
  addBandEvent,
  updateBandEvent,
  deleteBandEvent,
  getBandAttendance,
  setAttendance,
  getBandHolidays,
  addBandHoliday,
  getBandSystemData,
  initBandSystemData,
  updateBandSystemData,
  createNotification,
  getUnreadNotifications,
  savePushSubscription,
  getPushSubscriptionsForUser,
  deletePushSubscription,
  updateAdminPushSubscription,
  getAdminPushSubscription,
} from "../db";

export const bandRouter = router({
  // System Data
  getSystemData: publicProcedure.query(async () => {
    return await getBandSystemData();
  }),

  initSystem: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .mutation(async ({ input }) => {
      const result = await initBandSystemData(input.adminPassword);
      const io = getIO();
      if (io) {
        io.sockets.emit("system:updated");
      }
      return result;
    }),

  updateSystemPassword: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .mutation(async ({ input }) => {
      const result = await updateBandSystemData(input.adminPassword);
      const io = getIO();
      if (io) {
        io.sockets.emit("system:updated");
      }
      return result;
    }),

  // Password Verification
  verifyAdminPassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
      const systemData = await getBandSystemData();
      if (!systemData) {
        return { success: false, message: "系統未初始化" };
      }
      if (input.password === systemData.adminPassword) {
        return { success: true, message: "主管密碼驗證成功" };
      }
      return { success: false, message: "主管密碼錯誤" };
    }),

  verifyMemberPassword: publicProcedure
    .input(z.object({ memberId: z.number(), password: z.string() }))
    .mutation(async ({ input }) => {
      const members = await getBandMembers();
      const member = members?.find((m) => m.id === input.memberId);
      if (!member) {
        return { success: false, message: "成員不存在" };
      }
      if (!member.password) {
        return { success: false, message: "成員未設定密碼" };
      }
      if (input.password === member.password) {
        return { success: true, message: "成員密碼驗證成功" };
      }
      return { success: false, message: "成員密碼錯誤" };
    }),

  // Members - 使用緩存
  getMembers: publicProcedure.query(async () => {
    const cached = getFromCache<BandMember[]>(CACHE_KEYS.MEMBERS);
    if (cached) {
      return cached;
    }
    const members = await getBandMembers();
    if (members) {
      setInCache(CACHE_KEYS.MEMBERS, members);
    }
    return members;
  }),

  addMember: publicProcedure
    .input(
      z.object({
        name: z.string(),
        instrument: z.string().optional(),
        color: z.string().default("blue"),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await addBandMember(input);
      deleteFromCache(CACHE_KEYS.MEMBERS);
      const io = getIO();
      if (io) {
        io.sockets.emit("member:added");
      }
      return result;
    }),

  updateMember: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        instrument: z.string().optional(),
        color: z.string().optional(),
        password: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await updateBandMember(id, data);
      deleteFromCache(CACHE_KEYS.MEMBERS);
      const io = getIO();
      if (io) {
        io.sockets.emit("member:updated");
      }
      return result;
    }),

  deleteMember: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await deleteBandMember(input.id);
      deleteFromCache(CACHE_KEYS.MEMBERS);
      clearCacheByPrefix("attendance:");
      const io = getIO();
      if (io) {
        io.sockets.emit("member:deleted");
      }
      return result;
    }),

  // Events - 使用緩存
  getEvents: publicProcedure.query(async () => {
    type EventWithAttendance = BandEvent & { attendance: Record<string, string> };
    const cached = getFromCache<EventWithAttendance[]>(CACHE_KEYS.EVENTS);
    if (cached) {
      return cached;
    }
    const events = await getBandEvents();
    if (events) {
      setInCache(CACHE_KEYS.EVENTS, events);
    }
    return events;
  }),

  addEvent: publicProcedure
    .input(
      z.object({
        title: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        location: z.string(),
        type: z.enum(["rehearsal", "performance", "meeting", "other"]),
        notes: z.string().optional(),
        isCompleted: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const result = await addBandEvent(input);
      deleteFromCache(CACHE_KEYS.EVENTS);
      deleteFromCache(CACHE_KEYS.EVENTS_BY_DATE(input.date));
      const io = getIO();
      console.log('[Band Router] addEvent - io instance:', io ? 'exists' : 'null');
      if (io) {
        console.log('[Band Router] Emitting event:added');
        io.sockets.emit("event:added");
      } else {
        console.log('[Band Router] WARNING: io is null, cannot emit event');
      }
      
      // Send WhatsApp notification to admin
      try {
        const typeText = input.type === "rehearsal" ? "排練" : input.type === "performance" ? "演出" : input.type === "meeting" ? "會議" : "其他";
        const message = `🎵 新增活動\n【${input.title}】\n📅 ${input.date}\n🕐 ${input.startTime} - ${input.endTime}\n📍 ${input.location}\n類型：${typeText}`;
        const adminWhatsApp = "+85254029146";
        console.log(`[WhatsApp] ${message}`);
      } catch (error) {
        console.error("[WhatsApp Error]", error);
      }
      
      return result;
    }),

  updateEvent: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        date: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        type: z.enum(["rehearsal", "performance", "meeting", "other"]).optional(),
        notes: z.string().optional(),
        isCompleted: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await updateBandEvent(id, data);
      deleteFromCache(CACHE_KEYS.EVENTS);
      if (input.date) {
        deleteFromCache(CACHE_KEYS.EVENTS_BY_DATE(input.date));
      }
      const io = getIO();
      if (io) {
        io.sockets.emit("event:updated");
      }
      
      // Send WhatsApp notification to admin
      try {
        const typeText = data.type === "rehearsal" ? "排練" : data.type === "performance" ? "演出" : data.type === "meeting" ? "會議" : "其他";
        const message = `🎵 編輯活動\n【${data.title || "活動"}】\n📅 ${data.date || "日期未變更"}\n🕐 ${data.startTime || "時間"} - ${data.endTime || "時間"}\n📍 ${data.location || "地點未變更"}${data.type ? `\n類型：${typeText}` : ""}`;
        const adminWhatsApp = "+85254029146";
        console.log(`[WhatsApp] ${message}`);
      } catch (error) {
        console.error("[WhatsApp Error]", error);
      }
      
      return result;
    }),

  deleteEvent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await deleteBandEvent(input.id);
      const io = getIO();
      if (io) {
        io.sockets.emit("event:deleted");
      }
      return result;
    }),

  // Attendance - 使用緩存
  getAttendance: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const cached = getFromCache(CACHE_KEYS.ATTENDANCE(input.eventId));
      if (cached) {
        return cached;
      }
      const attendance = await getBandAttendance(input.eventId);
      if (attendance) {
        setInCache(CACHE_KEYS.ATTENDANCE(input.eventId), attendance);
      }
      return attendance;
    }),

  setAttendance: publicProcedure
    .input(
      z.object({
        eventId: z.number(),
        memberId: z.number(),
        status: z.enum(["going", "not-going", "unknown"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await setAttendance(input.eventId, input.memberId, input.status);
      deleteFromCache(CACHE_KEYS.ATTENDANCE(input.eventId));
      const io = getIO();
      if (io) {
        io.sockets.emit("attendance:changed", {
          eventId: input.eventId,
          memberId: input.memberId,
          status: input.status,
        });
      }
      
      // Send Web Push notification to admin
      try {
        console.log('[setAttendance] Attempting to send push notification...');
        const db = await getDb();
        if (db) {
          const memberResult = await db.select().from(bandMembers).where(eq(bandMembers.id, input.memberId));
          const member = memberResult.length > 0 ? memberResult[0] : null;
          console.log('[setAttendance] Member found:', member?.name);
          
          const eventResult = await db.select().from(bandEvents).where(eq(bandEvents.id, input.eventId));
          const event = eventResult.length > 0 ? eventResult[0] : null;
          console.log('[setAttendance] Event found:', event?.title);
          
          if (member && event) {
            const statusText = input.status === "going" ? "✅ 已確認出席" : input.status === "not-going" ? "❌ 已確認不出席" : "❓ 待確認";
            const logoUrl = '/logo.png'; // Use local logo file
            
            // Format event details for notification
            const eventDetails = `📅 ${event.date}\n🕐 ${event.startTime} - ${event.endTime}\n📍 ${event.location}`;
            const notificationBody = `${member.name}\n${statusText}\n\n${event.title}\n${eventDetails}`;
            
            console.log('[setAttendance] Sending push notification with status:', statusText);
            const eventTag = `attendance-event-${input.eventId}-${input.memberId}`;
            
            await sendPushNotificationToAdmins({
              title: "🎵 出席狀態更新",
              body: notificationBody,
              eventId: input.eventId,
              url: "/",
              icon: logoUrl,
              badge: logoUrl,
              eventTag: eventTag,
            }).catch(err => console.error("[setAttendance] Push notification error:", err));
            console.log('[setAttendance] Push notification sent successfully');
          } else {
            console.log('[setAttendance] Member or event not found, skipping push notification');
          }
        } else {
          console.log('[setAttendance] Database not available');
        }
      } catch (error) {
        console.error("[setAttendance] Error sending push notification:", error);
      }

      return { success: true };
    }),

  // Notifications
  getUnreadNotifications: publicProcedure.query(async () => {
    return await getUnreadNotifications();
  }),

  // Holidays - 使用緩存
  getHolidays: publicProcedure.query(async () => {
    const cached = getFromCache<BandHoliday[]>(CACHE_KEYS.HOLIDAYS);
    if (cached) {
      return cached;
    }
    const holidays = await getBandHolidays();
    if (holidays) {
      setInCache(CACHE_KEYS.HOLIDAYS, holidays);
    }
    return holidays;
  }),

  addHoliday: publicProcedure
    .input(
      z.object({
        date: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      deleteFromCache(CACHE_KEYS.HOLIDAYS);
      const result = await addBandHoliday(input);
      const io = getIO();
      if (io) {
        io.sockets.emit("holiday:added");
      }
      return result;
    }),

  // Web Push Subscriptions
  subscribeToPush: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({
            auth: z.string(),
            p256dh: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[subscribeToPush] User", input.userId, "subscribing to push notifications");
      const result = await savePushSubscription(input.userId, input.subscription);
      return { success: true, message: "Subscribed to push notifications" };
    }),

  unsubscribeFromPush: publicProcedure
    .input(
      z.object({
        endpoint: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[unsubscribeFromPush] Unsubscribing endpoint:", input.endpoint);
      await deletePushSubscription(input.endpoint);
      return { success: true, message: "Unsubscribed from push notifications" };
    }),

  getPushSubscriptions: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getPushSubscriptionsForUser(input.userId);
    }),

  // Admin Web Push Subscriptions
  updateAdminPushSubscription: publicProcedure
    .input(
      z.object({
        subscription: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[updateAdminPushSubscription] Updating admin subscription");
      const result = await updateAdminPushSubscription(input.subscription);
      return { success: true, message: "Admin subscription updated" };
    }),

  getAdminPushSubscription: publicProcedure.query(async () => {
    console.log("[getAdminPushSubscription] Fetching admin subscriptions");
    const subscriptions = await getAdminPushSubscription();
    return subscriptions || [];
  }),

  savePushSubscription: publicProcedure
    .input(
      z.object({
        subscription: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[savePushSubscription] Saving push subscription");
      try {
        const subscriptionData = JSON.parse(input.subscription);
        const result = await savePushSubscription(0, subscriptionData);
        console.log("[savePushSubscription] Subscription saved successfully");
        return { success: true, message: "Push subscription saved" };
      } catch (error) {
        console.error("[savePushSubscription] Error saving subscription:", error);
        throw error;
      }
    }),
});
