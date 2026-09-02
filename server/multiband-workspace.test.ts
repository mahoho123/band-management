import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_BAND_WORKSPACE,
  canAccessBand,
  canManageBand,
  makeBandScopeKey,
} from "../shared/bandWorkspace";

const root = resolve(import.meta.dirname, "..");
const schema = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
const migration = readFileSync(resolve(root, "drizzle/0015_chemical_talisman.sql"), "utf8");
const router = readFileSync(resolve(root, "server/routers/workspaces.ts"), "utf8");
const switcher = readFileSync(resolve(root, "client/src/components/BandWorkspaceSwitcher.tsx"), "utf8");

describe("local-only multi-band workspace foundation", () => {
  it("keeps the current band as the migration default", () => {
    expect(DEFAULT_BAND_WORKSPACE).toEqual({ id: 1, name: "慢半拍", slug: "man-ban-pai" });
  });

  it("defines workspace and membership tables without changing live data", () => {
    expect(schema).toContain('mysqlTable("bands"');
    expect(schema).toContain('mysqlTable("band_memberships"');
    expect(schema).toContain('uniqueIndex("band_memberships_band_user_idx")');
    expect(migration).toContain("CREATE TABLE `bands`");
    expect(migration).toContain("CREATE TABLE `band_memberships`");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("ALTER TABLE `band_");
  });

  it("enforces active membership and management roles in shared contracts", () => {
    expect(canAccessBand({ bandId: 1, status: "active" }, 1)).toBe(true);
    expect(canAccessBand({ bandId: 1, status: "suspended" }, 1)).toBe(false);
    expect(canManageBand({ bandId: 1, status: "active", role: "owner" }, 1)).toBe(true);
    expect(canManageBand({ bandId: 1, status: "active", role: "member" }, 1)).toBe(false);
    expect(makeBandScopeKey(1, "events")).toBe("band:1:events");
  });

  it("exposes protected workspace API procedures", () => {
    expect(router).toContain("protectedProcedure");
    expect(router).toContain("list:");
    expect(router).toContain("create:");
    expect(router).toContain("join:");
    expect(router).toContain("currentUserId");
  });

  it("keeps the future workspace switcher responsive and hidden for one Band", () => {
    expect(switcher).toContain("workspaces.length <= 1");
    expect(switcher).toContain("切換樂隊工作區");
    expect(switcher).toContain("min-w-0");
  });
});
