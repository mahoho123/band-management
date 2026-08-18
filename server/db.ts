import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bandMembers, bandEvents, bandAttendance, bandHolidays, bandSystemData, bandNotifications, pushSubscriptions, BandMember, BandEvent, BandAttendance, BandHoliday, BandSystemData, BandNotification, PushSubscription, InsertBandMember, InsertBandEvent, InsertBandAttendance, InsertBandHoliday, InsertBandSystemData, InsertBandNotification, InsertPushSubscription } from "../drizzle/schema";
import { ENV } from './_core/env';
import { hashPassword, isHashedPassword, verifyPassword } from './_core/passwords';
import { desc } from "drizzle-orm";

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
  const values: InsertBandMember = {
    ...member,
    password: !member.password || isHashedPassword(member.password) ? member.password : hashPassword(member.password),
  };
  const result = await db.insert(bandMembers).values(values);
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
  const values = data.password === undefined || !data.password || isHashedPassword(data.password)
    ? data
    : { ...data, password: hashPassword(data.password) };
  return await db.update(bandMembers).set(values).where(eq(bandMembers.id, id));
}

export async function getBandEvents() {
  const db = await getDb();
  if (!db) return [];
  
  // 使用單一查詢取得所有活動及出席記錄，消除 N+1 查詢問題
  const [events, allAttendance] = await Promise.all([
    db.select().from(bandEvents),
    db.select().from(bandAttendance),
  ]);
  
  // 將出席記錄按 eventId 分組（使用字串 key 確保 JSON 序列化後一致）
  const attendanceByEvent: Record<number, Record<string, string>> = {};
  allAttendance.forEach((a) => {
    if (!attendanceByEvent[a.eventId]) {
      attendanceByEvent[a.eventId] = {};
    }
    attendanceByEvent[a.eventId][String(a.memberId)] = a.status;
  });
  
  // 將出席記錄合併到活動中
  return events.map((event) => ({
    ...event,
    attendance: attendanceByEvent[event.id] ?? {},
  }));
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
  if (!db) return { success: false };
  // Use INSERT ... ON DUPLICATE KEY UPDATE for atomic upsert (requires unique index on eventId+memberId)
  await db.insert(bandAttendance)
    .values({ eventId, memberId, status: status as any })
    .onDuplicateKeyUpdate({ set: { status: status as any, updatedAt: new Date() } });
  return { success: true, eventId, memberId, status };
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

export async function migratePlaintextPasswords(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [systemRows, members] = await Promise.all([
    db.select().from(bandSystemData).limit(1),
    db.select().from(bandMembers),
  ]);
  const system = systemRows[0];
  if (system && (!isHashedPassword(system.adminPassword) || (system.viceAdminPassword && !isHashedPassword(system.viceAdminPassword)))) {
    await db.update(bandSystemData)
      .set({
        adminPassword: isHashedPassword(system.adminPassword) ? system.adminPassword : hashPassword(system.adminPassword),
        viceAdminPassword: system.viceAdminPassword && !isHashedPassword(system.viceAdminPassword)
          ? hashPassword(system.viceAdminPassword)
          : system.viceAdminPassword,
        updatedAt: new Date(),
      })
      .where(eq(bandSystemData.id, system.id));
  }

  await Promise.all(
    members
      .filter(member => Boolean(member.password) && !isHashedPassword(member.password))
      .map(member => db.update(bandMembers)
        .set({ password: hashPassword(member.password), updatedAt: new Date() })
        .where(eq(bandMembers.id, member.id)))
  );
}

export async function initBandSystemData(adminPassword: string) {
  const db = await getDb();
  if (!db) return null;
  const storedPassword = isHashedPassword(adminPassword) ? adminPassword : hashPassword(adminPassword);
  const existing = await db.select().from(bandSystemData).limit(1);
  if (existing.length > 0) {
    return await db.update(bandSystemData).set({ adminPassword: storedPassword, isSetup: 1 }).where(eq(bandSystemData.id, existing[0].id));
  } else {
    return await db.insert(bandSystemData).values({ adminPassword: storedPassword, isSetup: 1 });
  }
}

export async function updateViceAdminPassword(viceAdminPassword: string) {
  const db = await getDb();
  if (!db) return null;
  const storedPassword = isHashedPassword(viceAdminPassword) ? viceAdminPassword : hashPassword(viceAdminPassword);
  const existing = await db.select().from(bandSystemData).limit(1);
  if (existing.length > 0) {
    return await db.update(bandSystemData).set({ viceAdminPassword: storedPassword, updatedAt: new Date() }).where(eq(bandSystemData.id, existing[0].id));
  }
  return null;
}

export async function verifyViceAdminPassword(password: string) {
  const db = await getDb();
  if (!db) return { success: false, message: "系統未初始化" };
  const result = await db.select().from(bandSystemData).limit(1);
  if (!result.length || !result[0].viceAdminPassword) {
    return { success: false, message: "副主席尚未設定密碼，請聯絡主管" };
  }
  if (verifyPassword(password, result[0].viceAdminPassword)) {
    if (!isHashedPassword(result[0].viceAdminPassword)) {
      await db.update(bandSystemData)
        .set({ viceAdminPassword: hashPassword(password), updatedAt: new Date() })
        .where(eq(bandSystemData.id, result[0].id));
    }
    return { success: true, message: "副主席密碼驗證成功" };
  }
  return { success: false, message: "副主席密碼錯誤" };
}

export async function updateBandSystemData(adminPassword: string) {
  const storedPassword = isHashedPassword(adminPassword) ? adminPassword : hashPassword(adminPassword);
  const db = await getDb();
  if (!db) {
    console.log("[updateBandSystemData] Database not available");
    return null;
  }
  
  try {
    const existing = await db.select().from(bandSystemData).limit(1);
    console.log("[updateBandSystemData] Existing records:", existing);
    
    if (existing.length > 0) {
      const updateResult = await db
        .update(bandSystemData)
        .set({
          adminPassword: storedPassword,
          updatedAt: new Date()
        })
        .where(eq(bandSystemData.id, existing[0].id));
      
      // Verify the update by selecting the record again
      const updated = await db
        .select()
        .from(bandSystemData)
        .where(eq(bandSystemData.id, existing[0].id))
        .limit(1);
      
      console.log("[updateBandSystemData] Updated record:", updated);
      
      if (updated.length > 0) return updated[0];
    }

    return null;
  } catch (error) {
    console.error("[updateBandSystemData] Error:", error);
    throw error;
  }
}

// Notification queries
export async function createNotification(notification: InsertBandNotification) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(bandNotifications).values(notification);
}

export async function getNotifications() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bandNotifications).orderBy(desc(bandNotifications.createdAt));
}

export async function getUnreadNotifications() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bandNotifications).where(eq(bandNotifications.isRead, 0)).orderBy(desc(bandNotifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(bandNotifications).set({ isRead: 1 }).where(eq(bandNotifications.id, id));
}

export async function acknowledgeNotification(id: number, deviceId: string) {
  const db = await getDb();
  if (!db) return null;
  return await db
    .update(bandNotifications)
    .set({
      status: "acknowledged",
      isRead: 1,
      ackByDevice: deviceId,
    })
    .where(eq(bandNotifications.id, id));
}

export async function markAllNotificationsAsRead() {
  const db = await getDb();
  if (!db) return null;
  return await db.update(bandNotifications).set({ isRead: 1 }).where(eq(bandNotifications.isRead, 0));
}

// Push Subscription queries
export async function savePushSubscription(userId: number, subscription: any) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing subscription
      return await db
        .update(pushSubscriptions)
        .set({
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing[0].id));
    } else {
      // Insert new subscription
      return await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
      });
    }
  } catch (error) {
    console.error("[savePushSubscription] Error:", error);
    throw error;
  }
}

export async function getPushSubscriptionsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  } catch (error) {
    console.error("[getPushSubscriptionsForUser] Error:", error);
    return [];
  }
}

export async function getAllPushSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(pushSubscriptions);
  } catch (error) {
    console.error("[getAllPushSubscriptions] Error:", error);
    return [];
  }
}

export async function deletePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    return await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  } catch (error) {
    console.error("[deletePushSubscription] Error:", error);
    throw error;
  }
}

// Admin Push Subscription queries
export async function updateAdminPushSubscription(subscription: string | null) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const existing = await db.select().from(bandSystemData).limit(1);
    if (existing.length > 0) {
      return await db
        .update(bandSystemData)
        .set({ adminSubscription: subscription })
        .where(eq(bandSystemData.id, existing[0].id));
    }
    return null;
  } catch (error) {
    console.error("[updateAdminPushSubscription] Error:", error);
    throw error;
  }
}

// Admin user ID constant
const ADMIN_USER_ID = 0;

export async function getAdminPushSubscription() {
  // Returns all admin subscriptions for multi-device support
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ADMIN_USER_ID));
  } catch (error) {
    console.error("[getAdminPushSubscription] Error:", error);
    return [];
  }
}

// Admin WhatsApp Number queries
