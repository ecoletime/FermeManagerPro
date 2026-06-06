import { Router, type IRouter } from "express";
import { desc, eq, and, type SQL } from "drizzle-orm";
import { db, journalAuditTable } from "@workspace/db";

const router: IRouter = Router();

function mapRow(r: typeof journalAuditTable.$inferSelect) {
  return { ...r, timestamp: r.timestamp.toISOString() };
}

router.get("/journal-audit", async (req, res): Promise<void> => {
  const { module: mod, utilisateur, limit: limitParam } = req.query as Record<string, string | undefined>;

  const conditions: SQL[] = [];
  if (mod) conditions.push(eq(journalAuditTable.module, mod));
  if (utilisateur) conditions.push(eq(journalAuditTable.utilisateur, utilisateur));

  const limit = Math.min(Number(limitParam) || 500, 1000);

  const rows = conditions.length
    ? await db.select().from(journalAuditTable)
        .where(and(...conditions))
        .orderBy(desc(journalAuditTable.timestamp))
        .limit(limit)
    : await db.select().from(journalAuditTable)
        .orderBy(desc(journalAuditTable.timestamp))
        .limit(limit);

  res.json(rows.map(mapRow));
});

export default router;
