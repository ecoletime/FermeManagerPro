import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fournisseursTable = pgTable("fournisseurs", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  categorie: text("categorie").notNull(),
  telephone: text("telephone"),
  email: text("email"),
  adresse: text("adresse"),
  produits: text("produits"),
  statut: text("statut").notNull().default("Actif"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFournisseurSchema = createInsertSchema(fournisseursTable).omit({ id: true, createdAt: true });
export type InsertFournisseur = z.infer<typeof insertFournisseurSchema>;
export type Fournisseur = typeof fournisseursTable.$inferSelect;
