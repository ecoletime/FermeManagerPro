import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const animauxTable = pgTable("animaux", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull().unique(),
  type: text("type").notNull(),
  sexe: text("sexe").notNull(),
  dateNaissance: date("date_naissance"),
  poids: numeric("poids", { precision: 8, scale: 2, mode: "number" }),
  mere: text("mere"),
  pere: text("pere"),
  batiment: text("batiment"),
  statut: text("statut").notNull().default("Sain"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnimalSchema = createInsertSchema(animauxTable).omit({ id: true, createdAt: true });
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animauxTable.$inferSelect;
