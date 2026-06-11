import { pgTable, text, serial, timestamp, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const batimentsTable = pgTable("batiments", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  code: text("code").notNull().unique(),
  vocation: text("vocation"),
  superficie: numeric("superficie", { precision: 8, scale: 2, mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const logesTable = pgTable("loges", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  type: text("type").notNull(),
  batimentId: integer("batiment_id").notNull(),
  capacite: integer("capacite"),
  occupe: integer("occupe").notNull().default(0),
  superficie: numeric("superficie", { precision: 8, scale: 2, mode: "number" }),
  statut: text("statut").notNull().default("Active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const allocationsTable = pgTable("allocations", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  animalTag: text("animal_tag").notNull(),
  logeId: integer("loge_id").notNull(),
  raison: text("raison"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBatimentSchema = createInsertSchema(batimentsTable).omit({ id: true, createdAt: true });
export const insertLogeSchema = createInsertSchema(logesTable).omit({ id: true, createdAt: true });
export const insertAllocationSchema = createInsertSchema(allocationsTable).omit({ id: true, createdAt: true });

export type InsertBatiment = z.infer<typeof insertBatimentSchema>;
export type Batiment = typeof batimentsTable.$inferSelect;
export type InsertLoge = z.infer<typeof insertLogeSchema>;
export type Loge = typeof logesTable.$inferSelect;
export type InsertAllocation = z.infer<typeof insertAllocationSchema>;
export type Allocation = typeof allocationsTable.$inferSelect;
