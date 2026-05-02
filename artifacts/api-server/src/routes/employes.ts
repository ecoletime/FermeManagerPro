import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, employesTable } from "@workspace/db";
import {
  CreateEmployeBody,
  UpdateEmployeParams,
  UpdateEmployeBody,
  DeleteEmployeParams,
  GetEmployesResponse,
  UpdateEmployeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapEmploye(r: typeof employesTable.$inferSelect) {
  return { ...r, dateEmbauche: r.dateEmbauche ? String(r.dateEmbauche) : null, salaire: r.salaire ? Number(r.salaire) : null, createdAt: r.createdAt.toISOString() };
}

router.get("/employes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(employesTable).orderBy(employesTable.createdAt);
  res.json(GetEmployesResponse.parse(rows.map(mapEmploye)));
});

router.post("/employes", async (req, res): Promise<void> => {
  const parsed = CreateEmployeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(employesTable).values(parsed.data).returning();
  res.status(201).json(mapEmploye(row));
});

router.put("/employes/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateEmployeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(employesTable).set(parsed.data).where(eq(employesTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Employé non trouvé" }); return; }
  res.json(UpdateEmployeResponse.parse(mapEmploye(row)));
});

router.delete("/employes/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(employesTable).where(eq(employesTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Employé non trouvé" }); return; }
  res.sendStatus(204);
});

export default router;
