import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const pickRequests = pgTable("pick_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 40 }).notNull(),
  customer: varchar("customer", { length: 120 }).notNull().default(""),
  message: text("message").notNull(),
  priority: varchar("priority", { length: 12 }).notNull().default("normal"),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  attachment: text("attachment"),
  attachmentName: varchar("attachment_name", { length: 180 }),
  createdBy: varchar("created_by", { length: 80 }).notNull(),
  pickedBy: varchar("picked_by", { length: 80 }),
  completedBy: varchar("completed_by", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  pickedAt: timestamp("picked_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const requestEvents = pgTable("request_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").references(() => pickRequests.id, { onDelete: "cascade" }).notNull(),
  orderNumber: varchar("order_number", { length: 40 }).notNull(),
  actor: varchar("actor", { length: 80 }).notNull(),
  action: varchar("action", { length: 24 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceSettings = pgTable("workspace_settings", {
  id: integer("id").primaryKey().default(1),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  tone: varchar("tone", { length: 16 }).notNull().default("chime"),
  repeatSeconds: integer("repeat_seconds").notNull().default(15),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  volume: integer("volume").notNull().default(65),
});
