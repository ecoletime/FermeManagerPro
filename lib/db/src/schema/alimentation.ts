import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const repasTable = pgTable("repas", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  heure: text("heure").notNull(),
  batiment: text("batiment").notNull(),
  aliment: text("aliment").notNull(),
  quantiteDistribuee: numeric("quantite_distribuee", { precision: 10, scale: 2, mode: "number" }).notNull(),
  quantiteRefusee: numeric("quantite_refusee", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  distribue_par: text("distribue_par"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stocksTable = pgTable("stocks", {
  id: serial("id").primaryKey(),
  aliment: text("aliment").notNull().unique(),
  quantite: numeric("quantite", { precision: 10, scale: 2, mode: "number" }).notNull(),
  capaciteMax: numeric("capacite_max", { precision: 10, scale: 2, mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const livraisonsTable = pgTable("livraisons", {
  id: serial("id").primaryKey(),
  fournisseur: text("fournisseur").notNull(),
  date: date("date").notNull(),
  aliment: text("aliment").notNull(),
  quantite: numeric("quantite", { precision: 10, scale: 2, mode: "number" }).notNull(),
  prixTotal: numeric("prix_total", { precision: 12, scale: 2, mode: "number" }),
  qualite: text("qualite"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRepasSchema = createInsertSchema(repasTable).omit({ id: true, createdAt: true });
export const insertStockSchema = createInsertSchema(stocksTable).omit({ id: true, updatedAt: true });
export const insertLivraisonSchema = createInsertSchema(livraisonsTable).omit({ id: true, createdAt: true });

export type InsertRepas = z.infer<typeof insertRepasSchema>;
export type Repas = typeof repasTable.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocksTable.$inferSelect;
export type InsertLivraison = z.infer<typeof insertLivraisonSchema>;
export type Livraison = typeof livraisonsTable.$inferSelect;
