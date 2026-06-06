import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const journalAuditTable = pgTable("journal_audit", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  utilisateur: text("utilisateur").notNull().default("inconnu"),
  role: text("role").notNull().default("employee"),
  action: text("action").notNull(),
  module: text("module").notNull(),
  description: text("description").notNull(),
  methode: text("methode").notNull(),
  chemin: text("chemin").notNull(),
  statut: integer("statut").notNull(),
});

export type JournalAudit = typeof journalAuditTable.$inferSelect;
