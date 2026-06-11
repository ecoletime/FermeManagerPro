import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, LoginResponse, ResetPasswordBody, ResetPasswordResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function mapUser(r: typeof usersTable.$inferSelect) {
  const { password: _password, ...rest } = r;
  return { ...rest, createdAt: r.createdAt.toISOString() };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const identifier = parsed.data.username.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.username}) = ${identifier} or lower(${usersTable.email}) = ${identifier}`)
    .limit(1);
  if (!row || !row.actif || row.password !== parsed.data.password) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }
  res.json(LoginResponse.parse(mapUser(row)));
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const identifier = parsed.data.username.trim().toLowerCase();
  const [row] = await db
    .update(usersTable)
    .set({ password: parsed.data.password })
    .where(sql`lower(${usersTable.username}) = ${identifier}`)
    .returning();
  if (!row) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
  res.json(ResetPasswordResponse.parse(mapUser(row)));
});

export default router;
