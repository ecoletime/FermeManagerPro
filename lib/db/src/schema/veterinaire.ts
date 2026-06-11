import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitesVeterinaireTable = pgTable("visites_veterinaire", {
  id: serial("id").primaryKey(),
  veterinaire: text("veterinaire").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull(),
  animauxConcernes: text("animaux_concernes"),
  diagnostic: text("diagnostic"),
  traitement: text("traitement"),
  cout: numeric("cout", { precision: 12, scale: 2, mode: "number" }),
  statut: text("statut").notNull().default("Planifiee"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisiteVeterinaireSchema = createInsertSchema(visitesVeterinaireTable).omit({ id: true, createdAt: true });
export type InsertVisiteVeterinaire = z.infer<typeof insertVisiteVeterinaireSchema>;
export type VisiteVeterinaire = typeof visitesVeterinaireTable.$inferSelect;
