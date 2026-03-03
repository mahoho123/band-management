import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getIO } from "../_core/index";
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
        io.emit("system:updated");
      }
      return result;
    }),

  updateSystemPassword: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .mutation(async ({ input }) => {
      const result = await updateBandSystemData(input.adminPassword);
      const io = getIO();
      if (io) {
        io.emit("system:updated");
      }
      return result;
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
        io.emit("member:added");
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
        io.emit("member:updated");
      }
      return result;
    }),

  deleteMember: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await deleteBandMember(input.id);
      const io = getIO();
      if (io) {
        io.emit("member:deleted");
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
      if (io) {
        io.emit("event:added");
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
        io.emit("event:updated");
      }
      return result;
    }),

  deleteEvent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await deleteBandEvent(input.id);
      const io = getIO();
      if (io) {
        io.emit("event:deleted");
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
        status: z.enum(["going", "not-going", "pending"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await setAttendance(input.eventId, input.memberId, input.status);
      const io = getIO();
      if (io) {
        io.emit("attendance:changed");
      }
      return result;
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
        io.emit("holiday:added");
      }
      return result;
    }),
});
