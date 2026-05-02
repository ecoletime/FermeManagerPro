import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vaccinsTable = pgTable("vaccins", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull(),
  vaccin: text("vaccin").notNull(),
  date: date("date").notNull(),
  dose: text("dose"),
  rappel: date("rappel"),
  administrePar: text("administre_par"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const traitementsTable = pgTable("traitements", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull(),
  typeTraitement: text("type_traitement").notNull(),
  produit: text("produit").notNull(),
  dose: text("dose"),
  dateDebut: date("date_debut").notNull(),
  dateFin: date("date_fin"),
  statut: text("statut").notNull().default("En cours"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quarantaineTable = pgTable("quarantaine", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull(),
  motif: text("motif").notNull(),
  dateDebut: date("date_debut").notNull(),
  dureeJours: integer("duree_jours").notNull(),
  statut: text("statut").notNull().default("En cours"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mortaliteTable = pgTable("mortalite", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull(),
  date: date("date").notNull(),
  cause: text("cause").notNull(),
  confirme_par: text("confirme_par"),
  observations: text("observations"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVaccinSchema = createInsertSchema(vaccinsTable).omit({ id: true, createdAt: true });
export const insertTraitementSchema = createInsertSchema(traitementsTable).omit({ id: true, createdAt: true });
export const insertQuarantaineSchema = createInsertSchema(quarantaineTable).omit({ id: true, createdAt: true });
export const insertMortaliteSchema = createInsertSchema(mortaliteTable).omit({ id: true, createdAt: true });

export type InsertVaccin = z.infer<typeof insertVaccinSchema>;
export type Vaccin = typeof vaccinsTable.$inferSelect;
export type InsertTraitement = z.infer<typeof insertTraitementSchema>;
export type Traitement = typeof traitementsTable.$inferSelect;
export type InsertQuarantaine = z.infer<typeof insertQuarantaineSchema>;
export type Quarantaine = typeof quarantaineTable.$inferSelect;
export type InsertMortalite = z.infer<typeof insertMortaliteSchema>;
export type Mortalite = typeof mortaliteTable.$inferSelect;
