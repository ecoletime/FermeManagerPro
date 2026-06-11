import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  nom: text("nom").notNull(),
  prenom: text("prenom").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("employee"),
  modules: text("modules").array().notNull().default([]),
  actif: boolean("actif").notNull().default(true),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
