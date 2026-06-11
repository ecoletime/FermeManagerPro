import { Router, type IRouter } from "express";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { db, animauxTable } from "@workspace/db";
import {
  CreateAnimalBody,
  GetAnimauxQueryParams,
  GetAnimalParams,
  UpdateAnimalParams,
  UpdateAnimalBody,
  DeleteAnimalParams,
  GetAnimauxResponse,
  GetAnimalResponse,
  UpdateAnimalResponse,
  GetAnimauxStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/animaux/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(animauxTable);
  const parType: Record<string, number> = {};
  const parStatut: Record<string, number> = {};
  for (const a of all) {
    parType[a.type] = (parType[a.type] ?? 0) + 1;
    parStatut[a.statut] = (parStatut[a.statut] ?? 0) + 1;
  }
  res.json(GetAnimauxStatsResponse.parse({ total: all.length, parType, parStatut }));
});

router.get("/animaux", async (req, res): Promise<void> => {
  const params = GetAnimauxQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions: SQL[] = [];
  if (params.data.statut) conditions.push(eq(animauxTable.statut, params.data.statut));
  if (params.data.type) conditions.push(eq(animauxTable.type, params.data.type));
  if (params.data.tag) conditions.push(ilike(animauxTable.tag, `%${params.data.tag}%`));

  const rows = conditions.length
    ? await db.select().from(animauxTable).where(and(...conditions)).orderBy(animauxTable.createdAt)
    : await db.select().from(animauxTable).orderBy(animauxTable.createdAt);

  res.json(GetAnimauxResponse.parse(rows.map(r => ({
    ...r,
    poids: r.poids,
    createdAt: r.createdAt.toISOString(),
  }))));
});

router.post("/animaux", async (req, res): Promise<void> => {
  const parsed = CreateAnimalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(animauxTable).values(parsed.data).returning();
  res.status(201).json(GetAnimalResponse.parse({ ...row, poids: row.poids, createdAt: row.createdAt.toISOString() }));
});

router.get("/animaux/:id", async (req, res): Promise<void> => {
  const params = GetAnimalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.select().from(animauxTable).where(eq(animauxTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Animal non trouvé" }); return; }
  res.json(GetAnimalResponse.parse({ ...row, poids: row.poids, createdAt: row.createdAt.toISOString() }));
});

router.put("/animaux/:id", async (req, res): Promise<void> => {
  const params = UpdateAnimalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateAnimalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(animauxTable).set(parsed.data).where(eq(animauxTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Animal non trouvé" }); return; }
  res.json(UpdateAnimalResponse.parse({ ...row, poids: row.poids, createdAt: row.createdAt.toISOString() }));
});

router.delete("/animaux/:id", async (req, res): Promise<void> => {
  const params = DeleteAnimalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(animauxTable).where(eq(animauxTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Animal non trouvé" }); return; }
  res.sendStatus(204);
});

export default router;
