import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employesTable = pgTable("employes", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  poste: text("poste").notNull(),
  telephone: text("telephone"),
  email: text("email"),
  dateEmbauche: date("date_embauche"),
  statut: text("statut").notNull().default("Actif"),
  salaire: numeric("salaire", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmployeSchema = createInsertSchema(employesTable).omit({ id: true, createdAt: true });
export type InsertEmploye = z.infer<typeof insertEmployeSchema>;
export type Employe = typeof employesTable.$inferSelect;
