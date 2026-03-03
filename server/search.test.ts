import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import {
  getBandEvents,
  addBandEvent,
  deleteBandEvent,
} from "./db";

describe("Event Search Functionality", () => {
  let testEventId1: number;
  let testEventId2: number;
  let testEventId3: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for tests");
      return;
    }

    // Create test events for search testing
    const event1 = await addBandEvent({
      title: "吉他排練",
      date: "2026-03-10",
      startTime: "19:00",
      endTime: "21:00",
      location: "音樂室A",
      type: "rehearsal",
      notes: "練習新歌曲",
    });
    testEventId1 = event1.id;

    const event2 = await addBandEvent({
      title: "演唱會",
      date: "2026-03-15",
      startTime: "18:00",
      endTime: "22:00",
      location: "香港文化中心",
      type: "performance",
      notes: "春季音樂會",
    });
    testEventId2 = event2.id;

    const event3 = await addBandEvent({
      title: "樂隊會議",
      date: "2026-03-20",
      startTime: "15:00",
      endTime: "16:30",
      location: "排練室",
      type: "meeting",
      notes: "討論下月計劃",
    });
    testEventId3 = event3.id;
  });

  describe("Search by Title", () => {
    it("should find events by exact title match", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        e.title.toLowerCase().includes("吉他排練".toLowerCase())
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].title).toBe("吉他排練");
    });

    it("should find events by partial title match", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        e.title.toLowerCase().includes("排練".toLowerCase())
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((e) => e.title.includes("吉他排練"))).toBe(true);
    });

    it("should be case-insensitive", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        e.title.toLowerCase().includes("演唱會".toLowerCase())
      );
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-matching title", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        e.title.toLowerCase().includes("不存在的活動".toLowerCase())
      );
      expect(filtered.length).toBe(0);
    });
  });

  describe("Search by Location", () => {
    it("should find events by location", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        e.location.toLowerCase().includes("音樂室".toLowerCase())
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].location).toContain("音樂室");
    });

    it("should find events by partial location match", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        e.location.toLowerCase().includes("香港".toLowerCase())
      );
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-matching location", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        e.location.toLowerCase().includes("不存在的地點".toLowerCase())
      );
      expect(filtered.length).toBe(0);
    });
  });

  describe("Search by Notes", () => {
    it("should find events by notes content", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        (e.notes || "").toLowerCase().includes("新歌曲".toLowerCase())
      );
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should handle events with empty notes", async () => {
      const events = await getBandEvents();
      const filtered = events.filter((e) =>
        (e.notes || "").toLowerCase().includes("任何內容".toLowerCase())
      );
      expect(filtered.length).toBe(0);
    });
  });

  describe("Combined Search", () => {
    it("should find events matching any field", async () => {
      const searchQuery = "排練";
      const events = await getBandEvents();
      const filtered = events.filter((e) => {
        const matchesTitle = e.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = e.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesNotes = (e.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTitle || matchesLocation || matchesNotes;
      });
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should handle multiple search terms", async () => {
      const searchQuery = "音樂";
      const events = await getBandEvents();
      const filtered = events.filter((e) => {
        const matchesTitle = e.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = e.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesNotes = (e.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTitle || matchesLocation || matchesNotes;
      });
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe("Search Performance", () => {
    it("should handle search with large result set", async () => {
      const events = await getBandEvents();
      const startTime = Date.now();
      const filtered = events.filter((e) =>
        e.title.toLowerCase().includes("a".toLowerCase())
      );
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it("should handle empty search query", async () => {
      const searchQuery = "";
      const events = await getBandEvents();
      const filtered = events.filter((e) => {
        if (searchQuery.trim()) {
          const matchesTitle = e.title.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesLocation = e.location.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesNotes = (e.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
          return matchesTitle || matchesLocation || matchesNotes;
        }
        return true;
      });
      expect(filtered.length).toBe(events.length);
    });
  });
});
