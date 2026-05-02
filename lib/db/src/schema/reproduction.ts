import { pgTable, text, serial, timestamp, integer, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accouplementsTable = pgTable("accouplements", {
  id: serial("id").primaryKey(),
  truie: text("truie").notNull(),
  verrat: text("verrat").notNull(),
  date: date("date").notNull(),
  dateMiseBasPrevue: date("date_mise_bas_prevue"),
  statut: text("statut").notNull().default("Gestante"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const naissancesTable = pgTable("naissances", {
  id: serial("id").primaryKey(),
  mere: text("mere").notNull(),
  pere: text("pere").notNull(),
  date: date("date").notNull(),
  totalNes: integer("total_nes").notNull(),
  vivants: integer("vivants").notNull(),
  mortNes: integer("mort_nes").notNull().default(0),
  poidsMovyen: numeric("poids_moyen", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sevragesTable = pgTable("sevrages", {
  id: serial("id").primaryKey(),
  mere: text("mere").notNull(),
  date: date("date").notNull(),
  nbSevres: integer("nb_sevres").notNull(),
  ageJours: integer("age_jours"),
  poidsMoyen: numeric("poids_moyen", { precision: 6, scale: 2 }),
  destination: text("destination"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAccouplementSchema = createInsertSchema(accouplementsTable).omit({ id: true, createdAt: true });
export const insertNaissanceSchema = createInsertSchema(naissancesTable).omit({ id: true, createdAt: true });
export const insertSevrageSchema = createInsertSchema(sevragesTable).omit({ id: true, createdAt: true });

export type InsertAccouplement = z.infer<typeof insertAccouplementSchema>;
export type Accouplement = typeof accouplementsTable.$inferSelect;
export type InsertNaissance = z.infer<typeof insertNaissanceSchema>;
export type Naissance = typeof naissancesTable.$inferSelect;
export type InsertSevrage = z.infer<typeof insertSevrageSchema>;
export type Sevrage = typeof sevragesTable.$inferSelect;
