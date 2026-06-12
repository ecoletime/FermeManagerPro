import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const passwordResetCodesTable = pgTable("password_reset_codes", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PasswordResetCode = typeof passwordResetCodesTable.$inferSelect;
