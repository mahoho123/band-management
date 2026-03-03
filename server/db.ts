import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bandMembers, bandEvents, bandAttendance, bandHolidays, bandSystemData, BandMember, BandEvent, BandAttendance, BandHoliday, BandSystemData, InsertBandMember, InsertBandEvent, InsertBandAttendance, InsertBandHoliday, InsertBandSystemData } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// Band Management System queries
export async function getBandMembers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bandMembers);
}

export async function addBandMember(member: InsertBandMember) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(bandMembers).values(member);
  return result;
}

export async function deleteBandMember(id: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.delete(bandMembers).where(eq(bandMembers.id, id));
}

export async function updateBandMember(id: number, data: Partial<BandMember>) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(bandMembers).set(data).where(eq(bandMembers.id, id));
}

export async function getBandEvents() {
  const db = await getDb();
  if (!db) return [];
  const events = await db.select().from(bandEvents);
  
  // Fetch attendance for each event
  const eventsWithAttendance = await Promise.all(
    events.map(async (event) => {
      const attendance = await db.select().from(bandAttendance).where(eq(bandAttendance.eventId, event.id));
      const attendanceMap: Record<number, string> = {};
      attendance.forEach((a) => {
        attendanceMap[a.memberId] = a.status;
      });
      return {
        ...event,
        attendance: attendanceMap,
      };
    })
  );
  
  return eventsWithAttendance;
}

export async function addBandEvent(event: InsertBandEvent) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(bandEvents).values(event);
  return result;
}

export async function updateBandEvent(id: number, data: Partial<BandEvent>) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(bandEvents).set(data).where(eq(bandEvents.id, id));
}

export async function deleteBandEvent(id: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.delete(bandEvents).where(eq(bandEvents.id, id));
}

export async function getBandAttendance(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bandAttendance).where(eq(bandAttendance.eventId, eventId));
}

export async function setAttendance(eventId: number, memberId: number, status: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(bandAttendance).where(and(eq(bandAttendance.eventId, eventId), eq(bandAttendance.memberId, memberId)));
  if (existing.length > 0) {
    return await db.update(bandAttendance).set({ status: status as any }).where(and(eq(bandAttendance.eventId, eventId), eq(bandAttendance.memberId, memberId)));
  } else {
    return await db.insert(bandAttendance).values({ eventId, memberId, status: status as any });
  }
}

export async function getBandHolidays() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bandHolidays);
}

export async function addBandHoliday(holiday: InsertBandHoliday) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(bandHolidays).values(holiday).onDuplicateKeyUpdate({ set: { name: holiday.name } });
}

export async function getBandSystemData() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bandSystemData).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function initBandSystemData(adminPassword: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(bandSystemData).limit(1);
  if (existing.length > 0) {
    return await db.update(bandSystemData).set({ adminPassword, isSetup: 1 }).where(eq(bandSystemData.id, existing[0].id));
  } else {
    return await db.insert(bandSystemData).values({ adminPassword, isSetup: 1 });
  }
}

export async function updateBandSystemData(adminPassword: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(bandSystemData).limit(1);
  if (existing.length > 0) {
    return await db.update(bandSystemData).set({ adminPassword }).where(eq(bandSystemData.id, existing[0].id));
  }
}
