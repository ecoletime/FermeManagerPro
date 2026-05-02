import { Router, type IRouter } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, maintenanceTable } from "@workspace/db";
import {
  CreateMaintenanceBody,
  GetMaintenancesQueryParams,
  UpdateMaintenanceParams,
  UpdateMaintenanceBody,
  DeleteMaintenanceParams,
  GetMaintenancesResponse,
  UpdateMaintenanceResponse,
  GetMaintenanceStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapTask(r: typeof maintenanceTable.$inferSelect) {
  return {
    ...r,
    dateSignalement: r.dateSignalement ? String(r.dateSignalement) : null,
    dateResolution: r.dateResolution ? String(r.dateResolution) : null,
    coutEstime: r.coutEstime ? Number(r.coutEstime) : null,
    coutReel: r.coutReel ? Number(r.coutReel) : null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/maintenance/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(maintenanceTable);
  const urgentesActives = all.filter(t => t.priorite === "urgente" && t.statut !== "termine" && t.statut !== "annule").length;
  const enCours = all.filter(t => t.statut === "en_cours").length;
  const terminees = all.filter(t => t.statut === "termine").length;
  const coutTotal = all.reduce((s, t) => s + (t.coutReel ? Number(t.coutReel) : 0), 0);
  res.json(GetMaintenanceStatsResponse.parse({ urgentesActives, enCours, terminees, coutTotal }));
});

router.get("/maintenance", async (req, res): Promise<void> => {
  const params = GetMaintenancesQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const conditions: SQL[] = [];
  if (params.data.priorite) conditions.push(eq(maintenanceTable.priorite, params.data.priorite));
  if (params.data.statut) conditions.push(eq(maintenanceTable.statut, params.data.statut));
  if (params.data.categorie) conditions.push(eq(maintenanceTable.categorie, params.data.categorie));
  const rows = conditions.length
    ? await db.select().from(maintenanceTable).where(and(...conditions)).orderBy(maintenanceTable.createdAt)
    : await db.select().from(maintenanceTable).orderBy(maintenanceTable.createdAt);
  res.json(GetMaintenancesResponse.parse(rows.map(mapTask)));
});

router.post("/maintenance", async (req, res): Promise<void> => {
  const parsed = CreateMaintenanceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(maintenanceTable).values(parsed.data).returning();
  res.status(201).json(mapTask(row));
});

router.put("/maintenance/:id", async (req, res): Promise<void> => {
  const params = UpdateMaintenanceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMaintenanceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(maintenanceTable).set(parsed.data).where(eq(maintenanceTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Tâche non trouvée" }); return; }
  res.json(UpdateMaintenanceResponse.parse(mapTask(row)));
});

router.delete("/maintenance/:id", async (req, res): Promise<void> => {
  const params = DeleteMaintenanceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(maintenanceTable).where(eq(maintenanceTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Tâche non trouvée" }); return; }
  res.sendStatus(204);
});

export default router;
