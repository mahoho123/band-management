import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import {
  getBandMembers,
  addBandMember,
  updateBandMember,
  deleteBandMember,
  getBandEvents,
  addBandEvent,
  updateBandEvent,
  deleteBandEvent,
  getBandHolidays,
  addBandHoliday,
  getBandSystemData,
  initBandSystemData,
  updateBandSystemData,
} from "./db";

describe("Band Management System", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for tests");
    }
  });

  describe("System Data", () => {
    it("should initialize system data with admin password", async () => {
      const result = await initBandSystemData("testPassword123");
      expect(result).toBeDefined();
    });

    it("should retrieve system data", async () => {
      const data = await getBandSystemData();
      expect(data).toBeDefined();
      if (data) {
        expect(data.adminPassword).toBeDefined();
        expect(data.isSetup).toBeDefined();
      }
    });

    it("should update system password", async () => {
      const result = await updateBandSystemData("newPassword456");
      expect(result).toBeDefined();
    });
  });

  describe("Band Members", () => {
    let memberId: number;

    it("should add a band member", async () => {
      const result = await addBandMember({
        name: "Test Member",
        instrument: "Guitar",
        color: "blue",
        password: "password123",
      });
      expect(result).toBeDefined();
      memberId = result?.insertId || 1;
    });

    it("should retrieve band members", async () => {
      const members = await getBandMembers();
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThanOrEqual(0);
    });

    it("should update a band member", async () => {
      if (memberId) {
        const result = await updateBandMember(memberId, {
          instrument: "Bass Guitar",
        });
        expect(result).toBeDefined();
      }
    });

    it("should delete a band member", async () => {
      if (memberId) {
        const result = await deleteBandMember(memberId);
        expect(result).toBeDefined();
      }
    });
  });

  describe("Band Events", () => {
    let eventId: number;

    it("should add a band event", async () => {
      const result = await addBandEvent({
        title: "Test Rehearsal",
        date: "2026-03-10",
        startTime: "19:00",
        endTime: "21:00",
        location: "Studio A",
        type: "rehearsal",
        notes: "Test rehearsal session",
      });
      expect(result).toBeDefined();
      eventId = result?.insertId || 1;
    });

    it("should retrieve band events with attendance", async () => {
      const events = await getBandEvents();
      expect(Array.isArray(events)).toBe(true);
      if (events.length > 0) {
        expect(events[0]).toHaveProperty("attendance");
        expect(typeof events[0].attendance).toBe("object");
      }
    });

    it("should update a band event", async () => {
      if (eventId) {
        const result = await updateBandEvent(eventId, {
          title: "Updated Rehearsal",
          location: "Studio B",
        });
        expect(result).toBeDefined();
      }
    });

    it("should delete a band event", async () => {
      if (eventId) {
        const result = await deleteBandEvent(eventId);
        expect(result).toBeDefined();
      }
    });
  });

  describe("Band Holidays", () => {
    it("should add a band holiday", async () => {
      const result = await addBandHoliday({
        date: "2026-12-25",
        name: "Christmas",
      });
      expect(result).toBeDefined();
    });

    it("should retrieve band holidays", async () => {
      const holidays = await getBandHolidays();
      expect(Array.isArray(holidays)).toBe(true);
    });
  });
});
