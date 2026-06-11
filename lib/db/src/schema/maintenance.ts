import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const maintenanceTable = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  titre: text("titre").notNull(),
  categorie: text("categorie").notNull(),
  priorite: text("priorite").notNull().default("normale"),
  statut: text("statut").notNull().default("en_attente"),
  lieu: text("lieu"),
  dateSignalement: date("date_signalement"),
  dateResolution: date("date_resolution"),
  coutEstime: numeric("cout_estime", { precision: 12, scale: 2, mode: "number" }),
  coutReel: numeric("cout_reel", { precision: 12, scale: 2, mode: "number" }),
  responsable: text("responsable"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMaintenanceSchema = createInsertSchema(maintenanceTable).omit({ id: true, createdAt: true });
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type MaintenanceTask = typeof maintenanceTable.$inferSelect;
