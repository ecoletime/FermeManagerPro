import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

function mapRow(r: typeof notificationsTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

router.get("/notifications/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));
  const nonLues = all.filter(n => !n.lue).length;
  const total = all.length;
  const modMap: Record<string, number> = {};
  for (const n of all) modMap[n.module] = (modMap[n.module] ?? 0) + 1;
  const parModule = Object.entries(modMap).map(([module, count]) => ({ module, count }));
  res.json({ nonLues, total, parModule });
});

router.get("/notifications", async (req, res): Promise<void> => {
  const { module: mod, utilisateur, nonLues } = req.query as Record<string, string | undefined>;
  const conditions = [];
  if (mod) conditions.push(eq(notificationsTable.module, mod));
  if (utilisateur) conditions.push(eq(notificationsTable.utilisateur, utilisateur));
  if (nonLues === "true") conditions.push(eq(notificationsTable.lue, false));

  const rows = conditions.length
    ? await db.select().from(notificationsTable).where(and(...conditions)).orderBy(desc(notificationsTable.createdAt))
    : await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));

  res.json(rows.map(mapRow));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const body = req.body;
  if (
    typeof body?.utilisateur !== "string" ||
    typeof body?.module !== "string" ||
    typeof body?.action !== "string" ||
    typeof body?.detail !== "string"
  ) {
    res.status(400).json({ error: "invalid body" });
    return;
  }

  const [row] = await db.insert(notificationsTable).values({
    utilisateur: body.utilisateur,
    role: typeof body.role === "string" ? body.role : "admin",
    module: body.module,
    action: body.action,
    detail: body.detail,
    lue: typeof body.lue === "boolean" ? body.lue : false,
  }).returning();
  res.status(201).json(mapRow(row));
});

router.patch("/notifications/:id/lue", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const [row] = await db.update(notificationsTable).set({ lue: true }).where(eq(notificationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapRow(row));
});

router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const [row] = await db.delete(notificationsTable).where(eq(notificationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ok: true });
});

router.post("/notifications/tout-lire", async (_req, res): Promise<void> => {
  const rows = await db.update(notificationsTable).set({ lue: true }).where(eq(notificationsTable.lue, false)).returning();
  res.json({ updated: rows.length });
});

export default router;
