import { and, eq } from "drizzle-orm";
import { bands, bandMemberships, type InsertBand } from "../drizzle/schema";
import { getDb } from "./db";

export async function listAccessibleBands(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bands.id,
      name: bands.name,
      slug: bands.slug,
      logoUrl: bands.logoUrl,
      primaryColor: bands.primaryColor,
      role: bandMemberships.role,
      membershipStatus: bandMemberships.status,
    })
    .from(bandMemberships)
    .innerJoin(bands, eq(bands.id, bandMemberships.bandId))
    .where(and(eq(bandMemberships.userId, userId), eq(bandMemberships.status, "active")));
}

export async function createBandWorkspace(input: InsertBand, ownerUserId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(bands).values(input);
  const bandId = Number(result[0]?.insertId ?? 0);
  if (!bandId) return null;
  await db.insert(bandMemberships).values({
    bandId,
    userId: ownerUserId,
    role: "owner",
    status: "active",
  });
  return { id: bandId, ...input, role: "owner" as const, membershipStatus: "active" as const };
}

export async function getBandMembership(userId: number, bandId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(bandMemberships)
    .where(and(eq(bandMemberships.userId, userId), eq(bandMemberships.bandId, bandId), eq(bandMemberships.status, "active")))
    .limit(1);
  return result[0] ?? null;
}

export async function addBandMembership(bandId: number, userId: number, role: "admin" | "member" = "member") {
  const db = await getDb();
  if (!db) return null;
  return db.insert(bandMemberships).values({ bandId, userId, role, status: "active" });
}
