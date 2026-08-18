import { beforeEach, describe, expect, it } from "vitest";
import { clearAllCache, getFromCache, setInCache } from "./cache";

describe("capacity regression smoke benchmarks", () => {
  beforeEach(() => clearAllCache());

  it("serves a cached 200-event dataset to 200 simulated readers within 100ms", async () => {
    const events = Array.from({ length: 200 }, (_, id) => ({ id, title: `event-${id}` }));
    setInCache("capacity:events", events);
    const start = performance.now();

    await Promise.all(Array.from({ length: 200 }, async () => {
      const cached = getFromCache<typeof events>("capacity:events");
      expect(cached?.length).toBe(200);
    }));

    expect(performance.now() - start).toBeLessThan(100);
  });

  it("serves 500 concurrent cache readers without blocking on network or database work", async () => {
    setInCache("capacity:shared", { ready: true });
    const start = performance.now();

    await Promise.all(Array.from({ length: 500 }, async () => {
      expect(getFromCache<{ ready: boolean }>("capacity:shared")).toEqual({ ready: true });
    }));

    expect(performance.now() - start).toBeLessThan(100);
  });
});
