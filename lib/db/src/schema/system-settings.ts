import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const systemSettingsTable = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  farmName: text("farm_name").notNull().default("FermeManager Pro"),
  language: text("language").notNull().default("fr"),
  currency: text("currency").notNull().default("FCFA"),
  darkMode: boolean("dark_mode").notNull().default(false),
  autoBackup: boolean("auto_backup").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettingsTable).omit({ id: true, updatedAt: true });
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettingsTable.$inferSelect;
