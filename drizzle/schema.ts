import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Band Management System Tables
export const bandMembers = mysqlTable("band_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  instrument: varchar("instrument", { length: 255 }),
  color: varchar("color", { length: 50 }).default("blue").notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BandMember = typeof bandMembers.$inferSelect;
export type InsertBandMember = typeof bandMembers.$inferInsert;

export const bandEvents = mysqlTable("band_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["rehearsal", "performance", "meeting", "other"]).notNull(),
  notes: text("notes"),
  isCompleted: int("isCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BandEvent = typeof bandEvents.$inferSelect;
export type InsertBandEvent = typeof bandEvents.$inferInsert;

export const bandAttendance = mysqlTable("band_attendance", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  memberId: int("memberId").notNull(),
  status: mysqlEnum("status", ["going", "not-going", "unknown"]).default("unknown").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BandAttendance = typeof bandAttendance.$inferSelect;
export type InsertBandAttendance = typeof bandAttendance.$inferInsert;

export const bandHolidays = mysqlTable("band_holidays", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BandHoliday = typeof bandHolidays.$inferSelect;
export type InsertBandHoliday = typeof bandHolidays.$inferInsert;

export const bandSystemData = mysqlTable("band_system_data", {
  id: int("id").autoincrement().primaryKey(),
  adminPassword: varchar("adminPassword", { length: 255 }).notNull(),
  isSetup: int("isSetup").default(0).notNull(),
  adminSubscription: text("adminSubscription"), // JSON string for admin's push subscription
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BandSystemData = typeof bandSystemData.$inferSelect;
export type InsertBandSystemData = typeof bandSystemData.$inferInsert;

// Notifications table
export const bandNotifications = mysqlTable("band_notifications", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  memberId: int("memberId").notNull(),
  type: mysqlEnum("type", ["attendance-changed"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BandNotification = typeof bandNotifications.$inferSelect;
export type InsertBandNotification = typeof bandNotifications.$inferInsert;
// Web Push Subscriptions table
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
