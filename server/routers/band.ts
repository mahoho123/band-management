import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getIO } from "../_core/index";
import { getDb } from "../db";
import { and, eq } from "drizzle-orm";
import { bandMembers, bandEvents, bandSystemData } from "../../drizzle/schema";
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

  // Members
  getMembers: publicProcedure.query(async () => {
    return await getBandMembers();
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
      const io = getIO();
      if (io) {
        io.sockets.emit("member:deleted");
      }
      return result;
    }),

  // Events
  getEvents: publicProcedure.query(async () => {
    return await getBandEvents();
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

  // Attendance
  getAttendance: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      return await getBandAttendance(input.eventId);
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
      const io = getIO();
      if (io) {
        io.sockets.emit("attendance:changed", {
          eventId: input.eventId,
          memberId: input.memberId,
          status: input.status,
        });
      }
      
      let whatsappUrl = "";
      // Send WhatsApp notification to admin
      try {
        const db = await getDb();
        if (db) {
          const memberResult = await db.select().from(bandMembers).where(eq(bandMembers.id, input.memberId));
          const member = memberResult.length > 0 ? memberResult[0] : null;
          
          const eventResult = await db.select().from(bandEvents).where(eq(bandEvents.id, input.eventId));
          const event = eventResult.length > 0 ? eventResult[0] : null;
          
          if (member && event) {
            const statusText = input.status === "going" ? "✓ 已確認出席" : input.status === "not-going" ? "✗ 無法出席" : "？待確認";
            const message = `🎵 [${member.name}] 已更新 [${event.title}] 的出席狀態為 ${statusText}`;
            const adminWhatsApp = "+85254029146";
            whatsappUrl = `https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            console.log(`[WhatsApp] ${message}`);
          }
        }
      } catch (error) {
        console.error("[WhatsApp Error]", error);
      }
      
      const returnValue = { ...result, whatsappUrl };
      console.log('[setAttendance] Returning:', returnValue);
      return returnValue;
    }),

  // Holidays
  getHolidays: publicProcedure.query(async () => {
    return await getBandHolidays();
  }),

  addHoliday: publicProcedure
    .input(
      z.object({
        date: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await addBandHoliday(input);
      const io = getIO();
      if (io) {
        io.sockets.emit("holiday:added");
      }
      return result;
    }),
});
