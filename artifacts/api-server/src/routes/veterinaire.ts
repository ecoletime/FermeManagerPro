import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, visitesVeterinaireTable } from "@workspace/db";
import {
  CreateVisiteVeterinaireBody,
  UpdateVisiteVeterinaireParams,
  UpdateVisiteVeterinaireBody,
  DeleteVisiteVeterinaireParams,
  GetVisitesVeterinaireResponse,
  UpdateVisiteVeterinaireResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapVisite(r: typeof visitesVeterinaireTable.$inferSelect) {
  return { ...r, date: String(r.date), cout: r.cout, createdAt: r.createdAt.toISOString() };
}

router.get("/veterinaire", async (_req, res): Promise<void> => {
  const rows = await db.select().from(visitesVeterinaireTable).orderBy(visitesVeterinaireTable.createdAt);
  res.json(GetVisitesVeterinaireResponse.parse(rows.map(mapVisite)));
});

router.post("/veterinaire", async (req, res): Promise<void> => {
  const parsed = CreateVisiteVeterinaireBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(visitesVeterinaireTable).values(parsed.data).returning();
  res.status(201).json(mapVisite(row));
});

router.put("/veterinaire/:id", async (req, res): Promise<void> => {
  const params = UpdateVisiteVeterinaireParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateVisiteVeterinaireBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(visitesVeterinaireTable).set(parsed.data).where(eq(visitesVeterinaireTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Visite non trouvée" }); return; }
  res.json(UpdateVisiteVeterinaireResponse.parse(mapVisite(row)));
});

router.delete("/veterinaire/:id", async (req, res): Promise<void> => {
  const params = DeleteVisiteVeterinaireParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(visitesVeterinaireTable).where(eq(visitesVeterinaireTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Visite non trouvée" }); return; }
  res.sendStatus(204);
});

export default router;
