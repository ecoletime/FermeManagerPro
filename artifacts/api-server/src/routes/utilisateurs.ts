import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUtilisateurBody,
  UpdateUtilisateurParams,
  UpdateUtilisateurBody,
  DeleteUtilisateurParams,
  GetUtilisateursResponse,
  UpdateUtilisateurResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapUser(r: typeof usersTable.$inferSelect) {
  const { password: _password, ...rest } = r;
  return { ...rest, createdAt: r.createdAt.toISOString() };
}

router.get("/utilisateurs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(GetUtilisateursResponse.parse(rows.map(mapUser)));
});

router.post("/utilisateurs", async (req, res): Promise<void> => {
  const parsed = CreateUtilisateurBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json(mapUser(row));
});

router.put("/utilisateurs/:id", async (req, res): Promise<void> => {
  const params = UpdateUtilisateurParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateUtilisateurBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { password, ...rest } = parsed.data;
  const values = password ? { ...rest, password } : rest;
  const [row] = await db.update(usersTable).set(values).where(eq(usersTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
  res.json(UpdateUtilisateurResponse.parse(mapUser(row)));
});

router.delete("/utilisateurs/:id", async (req, res): Promise<void> => {
  const params = DeleteUtilisateurParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [row] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
  res.sendStatus(204);
});

export default router;
