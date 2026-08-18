import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getIO } from "../_core/socket";
import { enqueueBackgroundTask } from "../_core/background";
import { assertPasswordRateLimit, getRequestIdentifier } from "../_core/rateLimit";
import { isHashedPassword, verifyPassword } from "../_core/passwords";
import { getDb } from "../db";
import { sendPushNotificationToAdmins } from "../_core/webpush";
import { queueAttendanceNotification, AttendanceChange } from "../attendanceSideEffects";
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
  updateViceAdminPassword,
  verifyViceAdminPassword,
  createNotification,
  getUnreadNotifications,
  acknowledgeNotification,
  savePushSubscription,
  getPushSubscriptionsForUser,
  deletePushSubscription,
  updateAdminPushSubscription,
  getAdminPushSubscription,
} from "../db";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format time object to 12-hour format string
 */
function formatTimeObjectTo12(
  timeObj: { hour: string; minute: string; period: string } | null | undefined
): string {
  if (!timeObj) return "待定";

  const periodMap: Record<string, string> = {
    AM: "上午",
    PM: "下午",
    pending: "待定",
    morning: "上午",
    afternoon: "下午",
    evening: "晚上",
    上午: "上午",
    下午: "下午",
    晚上: "晚上",
    待定: "待定",
  };

  const chinesePeriod = periodMap[timeObj.period] || timeObj.period;

  // If hour and minute are both --, return the time slot (period) name
  if (timeObj.hour === "--" && timeObj.minute === "--") {
    return chinesePeriod;
  }

  // If only one is --, still show the period
  if (timeObj.hour === "--" || !timeObj.hour) return chinesePeriod;

  return `${chinesePeriod} ${timeObj.hour}:${String(parseInt(timeObj.minute)).padStart(2, "0")}`;
}

export const bandRouter = router({
  // System Data
  getSystemData: publicProcedure.query(async () => {
    const systemData = await getBandSystemData();
    if (!systemData) return null;
    const { adminPassword: _adminPassword, viceAdminPassword: _viceAdminPassword, ...publicData } = systemData;
    return publicData;
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
    .mutation(async ({ input, ctx }) => {
      assertPasswordRateLimit(`admin:${getRequestIdentifier(ctx.req)}`);
      const systemData = await getBandSystemData();
      if (!systemData) {
        return { success: false, message: "系統未初始化" };
      }
      if (verifyPassword(input.password, systemData.adminPassword)) {
        return { success: true, message: "主管密碼驗證成功" };
      }
      return { success: false, message: "主管密碼錯誤" };
    }),

  verifyViceAdminPassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertPasswordRateLimit(`vice-admin:${getRequestIdentifier(ctx.req)}`);
      return await verifyViceAdminPassword(input.password);
    }),

  updateViceAdminPassword: publicProcedure
    .input(z.object({ viceAdminPassword: z.string() }))
    .mutation(async ({ input }) => {
      const result = await updateViceAdminPassword(input.viceAdminPassword);
      const io = getIO();
      if (io) {
        io.sockets.emit("system:updated");
      }
      return { success: true, message: "副主席密碼已更新" };
    }),

  verifyMemberPassword: publicProcedure
    .input(z.object({ memberId: z.number(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertPasswordRateLimit(`member:${input.memberId}:${getRequestIdentifier(ctx.req)}`);
      const members = await getBandMembers();
      const member = members?.find((m) => m.id === input.memberId);
      if (!member) {
        return { success: false, message: "成員不存在" };
      }
      if (!member.password) {
        return { success: false, message: "成員未設定密碼" };
      }
      if (verifyPassword(input.password, member.password)) {
        if (!isHashedPassword(member.password)) {
          await updateBandMember(input.memberId, { password: input.password });
        }
        // Notify admin after the successful response path, without blocking login.
        enqueueBackgroundTask("member-login notification", async () => {
          const now = new Date();
          const timeStr = now.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong', hour12: true, hour: 'numeric', minute: '2-digit' });
          const dateStr = now.toLocaleDateString('zh-HK', { timeZone: 'Asia/Hong_Kong', month: 'long', day: 'numeric', weekday: 'short' });
          const notifTitle = `👤 ${member.name} 已登入`;
          const notifMessage = `${member.name}（${member.instrument || '成員'}）於 ${dateStr} ${timeStr} 登入系統`;
          await createNotification({
            memberId: input.memberId,
            title: notifTitle,
            message: notifMessage,
            type: 'member-added',
          });
          await sendPushNotificationToAdmins({
            title: notifTitle,
            body: notifMessage,
            url: '/',
            icon: '/logo.png',
            badge: '/logo.png',
          });
        });
        return { success: true, message: "成員密碼驗證成功" };
      }
      return { success: false, message: "成員密碼錯誤" };
    }),

  // Members - 使用緩存，Data Shaping：移除密碼明文，改用 hasPassword 標誌
  getMembers: publicProcedure.query(async () => {
    type MemberPublic = { id: number; name: string; instrument: string | null; color: string; hasPassword: boolean };
    const cached = getFromCache<MemberPublic[]>(CACHE_KEYS.MEMBERS);
    if (cached) {
      return cached;
    }
    const members = await getBandMembers();
    // Strip sensitive/redundant fields: replace password with hasPassword flag, remove createdAt/updatedAt
    const shaped = members.map(({ id, name, instrument, color, password }) => ({
      id,
      name,
      instrument: instrument ?? null,
      color,
      hasPassword: !!password,
    }));
    if (shaped) {
      setInCache(CACHE_KEYS.MEMBERS, shaped);
    }
    return shaped;
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
        startTime: z.object({
          hour: z.string(),
          minute: z.string(),
          period: z.string(),
        }).optional().nullable(),
        endTime: z.object({
          hour: z.string(),
          minute: z.string(),
          period: z.string(),
        }).optional().nullable(),
        timeSlot: z.enum(["pending", "morning", "afternoon", "evening"]).optional().nullable(),
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
      
      enqueueBackgroundTask("event-added notification", async () => {
        const typeText = input.type === "rehearsal" ? "排練" : input.type === "performance" ? "演出" : input.type === "meeting" ? "會議" : "其他";
        const startTimeStr = formatTimeObjectTo12(input.startTime);
        const endTimeStr = formatTimeObjectTo12(input.endTime);
        await createNotification({
          title: `🎵 新增活動：${input.title}`,
          message: `類型：${typeText}\n日期：${input.date}\n時間：${startTimeStr} - ${endTimeStr}\n地點：${input.location}`,
          type: "event-added",
        });
      });
      
      return result;
    }),

  updateEvent: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        date: z.string().optional(),
        startTime: z.object({
          hour: z.string(),
          minute: z.string(),
          period: z.string(),
        }).optional().nullable(),
        endTime: z.object({
          hour: z.string(),
          minute: z.string(),
          period: z.string(),
        }).optional().nullable(),
        timeSlot: z.enum(["pending", "morning", "afternoon", "evening"]).optional().nullable(),
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
      
      enqueueBackgroundTask("event-updated notification", async () => {
        const typeText = data.type === "rehearsal" ? "排練" : data.type === "performance" ? "演出" : data.type === "meeting" ? "會議" : "其他";
        const startTimeStr = data.startTime ? formatTimeObjectTo12(data.startTime) : "未變更";
        const endTimeStr = data.endTime ? formatTimeObjectTo12(data.endTime) : "未變更";
        await createNotification({
          eventId: id,
          title: `🎵 編輯活動：${data.title || "活動"}`,
          message: `日期：${data.date || "未變更"}\n時間：${startTimeStr} - ${endTimeStr}\n地點：${data.location || "未變更"}${data.type ? `\n類型：${typeText}` : ""}`,
          type: "event-updated",
        });
      });
      
      return result;
    }),

  deleteEvent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await deleteBandEvent(input.id);
      // 清除 EVENTS cache 和相關的 attendance cache
      deleteFromCache(CACHE_KEYS.EVENTS);
      clearCacheByPrefix("attendance:");
      const io = getIO();
      if (io) {
        io.sockets.emit("event:deleted");
      }
      enqueueBackgroundTask("event-deleted notification", async () => {
        await createNotification({
          eventId: input.id,
          title: `🗑️ 刪除活動 #${input.id}`,
          message: `活動 ID ${input.id} 已被刪除`,
          type: "event-deleted",
        });
      });
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
      // Clear both attendance cache AND events cache so the next getEvents refetch
      // returns the updated attendance data instead of stale cached data.
      deleteFromCache(CACHE_KEYS.ATTENDANCE(input.eventId));
      deleteFromCache(CACHE_KEYS.EVENTS);
      const io = getIO();
      if (io) {
        io.sockets.emit("attendance:changed", {
          eventId: input.eventId,
          memberId: input.memberId,
          status: input.status,
        });
      }
      
      queueAttendanceNotification(input);

      return { success: true, whatsappUrl: "https://wa.me/85254029146" };
    }),

  setAttendanceBatch: publicProcedure
    .input(z.object({ changes: z.array(z.object({
      eventId: z.number(),
      memberId: z.number(),
      status: z.enum(["going", "not-going", "unknown"]),
    })).min(1).max(100) }))
    .mutation(async ({ input }) => {
      await Promise.all(input.changes.map(change => setAttendance(change.eventId, change.memberId, change.status)));
      const eventIds = [...new Set(input.changes.map(change => change.eventId))];
      const io = getIO();
      for (const eventId of eventIds) {
        deleteFromCache(CACHE_KEYS.ATTENDANCE(eventId));
      }
      deleteFromCache(CACHE_KEYS.EVENTS);
      for (const change of input.changes) {
        io?.sockets.emit("attendance:changed", change);
        queueAttendanceNotification(change);
      }
      return {
        success: true,
        updated: input.changes.length,
        whatsappUrl: "https://wa.me/85254029146",
      };
    }),

  // Notifications
  getUnreadNotifications: publicProcedure.query(async () => {
    return await getUnreadNotifications();
  }),

  acknowledgeNotification: publicProcedure
    .input(
      z.object({
        id: z.number(),
        deviceId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await acknowledgeNotification(input.id, input.deviceId);
      const io = getIO();
      if (io) {
        io.sockets.emit("notification:acknowledged", {
          id: input.id,
          deviceId: input.deviceId,
        });
      }
      return { success: true };
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
