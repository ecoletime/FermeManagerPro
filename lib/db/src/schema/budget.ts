import { pgTable, text, serial, timestamp, numeric, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetCategoriesTable = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  budget: numeric("budget", { precision: 14, scale: 2 }).notNull(),
  depense: numeric("depense", { precision: 14, scale: 2 }).notNull().default("0"),
  couleur: text("couleur"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const depensesTable = pgTable("depenses", {
  id: serial("id").primaryKey(),
  categorieId: integer("categorie_id").notNull(),
  description: text("description").notNull(),
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBudgetCategorieSchema = createInsertSchema(budgetCategoriesTable).omit({ id: true, createdAt: true });
export const insertDepenseSchema = createInsertSchema(depensesTable).omit({ id: true, createdAt: true });

export type InsertBudgetCategorie = z.infer<typeof insertBudgetCategorieSchema>;
export type BudgetCategorie = typeof budgetCategoriesTable.$inferSelect;
export type InsertDepense = z.infer<typeof insertDepenseSchema>;
export type Depense = typeof depensesTable.$inferSelect;
