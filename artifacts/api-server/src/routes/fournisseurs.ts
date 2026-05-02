import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, fournisseursTable } from "@workspace/db";
import {
  CreateFournisseurBody,
  UpdateFournisseurParams,
  UpdateFournisseurBody,
  DeleteFournisseurParams,
  GetFournisseursResponse,
  UpdateFournisseurResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapFournisseur(r: typeof fournisseursTable.$inferSelect) {
  return { ...r, createdAt: r.createdAt.toISOString() };
}

router.get("/fournisseurs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(fournisseursTable).orderBy(fournisseursTable.createdAt);
  res.json(GetFournisseursResponse.parse(rows.map(mapFournisseur)));
});

router.post("/fournisseurs", async (req, res): Promise<void> => {
  const parsed = CreateFournisseurBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(fournisseursTable).values(parsed.data).returning();
  res.status(201).json(mapFournisseur(row));
});

router.put("/fournisseurs/:id", async (req, res): Promise<void> => {
  const params = UpdateFournisseurParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateFournisseurBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(fournisseursTable).set(parsed.data).where(eq(fournisseursTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Fournisseur non trouvé" }); return; }
  res.json(UpdateFournisseurResponse.parse(mapFournisseur(row)));
});

router.delete("/fournisseurs/:id", async (req, res): Promise<void> => {
  const params = DeleteFournisseurParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(fournisseursTable).where(eq(fournisseursTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Fournisseur non trouvé" }); return; }
  res.sendStatus(204);
});

export default router;
