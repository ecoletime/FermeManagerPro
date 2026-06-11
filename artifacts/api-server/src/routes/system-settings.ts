import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, systemSettingsTable } from "@workspace/db";
import {
  GetSystemSettingsResponse,
  UpdateSystemSettingsBody,
  UpdateSystemSettingsResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireRole";

const router: IRouter = Router();

function mapSettings(r: typeof systemSettingsTable.$inferSelect) {
  return { ...r, updatedAt: r.updatedAt.toISOString() };
}

async function ensureSettings() {
  const [existing] = await db.select().from(systemSettingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(systemSettingsTable).values({}).returning();
  return created;
}

router.get("/system-settings", async (_req, res): Promise<void> => {
  const row = await ensureSettings();
  res.json(GetSystemSettingsResponse.parse(mapSettings(row)));
});

router.put("/system-settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSystemSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const current = await ensureSettings();
  const [row] = await db
    .update(systemSettingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(systemSettingsTable.id, current.id))
    .returning();
  res.json(UpdateSystemSettingsResponse.parse(mapSettings(row)));
});

export default router;
