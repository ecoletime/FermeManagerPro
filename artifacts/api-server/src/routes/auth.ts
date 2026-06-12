import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, passwordResetCodesTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  ResetRequestBody,
  ResetRequestResponse,
  ResetPasswordBody,
  ResetPasswordResponse,
} from "@workspace/api-zod";
import { signToken } from "../lib/token";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 4;

function mapUser(r: typeof usersTable.$inferSelect) {
  const { password: _password, ...rest } = r;
  return { ...rest, createdAt: r.createdAt.toISOString() };
}

function generateCode(): string {
  return String(crypto.randomInt(10000, 100000));
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function codeMatches(hash: string, code: string): boolean {
  const a = Buffer.from(hash);
  const b = Buffer.from(hashCode(code));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function sendResetEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "FermeManager Pro <onboarding@resend.dev>",
        to: [email],
        subject: "Votre code de réinitialisation",
        html: `<p>Votre code de réinitialisation est <strong>${code}</strong>.</p><p>Il expire dans 10 minutes.</p>`,
      }),
    });
    return response.ok;
  } catch (err) {
    logger.error({ err }, "Failed to send reset email");
    return false;
  }
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
  const token = signToken({ sub: row.id, username: row.username, role: row.role });
  res.json(LoginResponse.parse({ ...mapUser(row), token }));
});

router.post("/auth/reset-request", async (req, res): Promise<void> => {
  const parsed = ResetRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const identifier = parsed.data.username.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.username}) = ${identifier}`)
    .limit(1);

  // Always respond identically to avoid user enumeration: the response shape
  // and values must not reveal whether the account exists or whether an email
  // was actually delivered. Real delivery status stays in server logs only.
  if (!user || !user.actif) {
    res.json(ResetRequestResponse.parse({ ok: true, sent: true, devCode: null }));
    return;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await db.delete(passwordResetCodesTable).where(eq(passwordResetCodesTable.username, user.username));
  await db.insert(passwordResetCodesTable).values({
    username: user.username,
    codeHash: hashCode(code),
    expiresAt,
    attempts: 0,
  });

  const sent = await sendResetEmail(user.email, code);
  logger.info({ username: user.username, sent }, "Password reset code issued");
  const devCode = process.env.NODE_ENV !== "production" ? code : null;
  res.json(ResetRequestResponse.parse({ ok: true, sent: true, devCode }));
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (parsed.data.password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: "Mot de passe trop court" });
    return;
  }
  const identifier = parsed.data.username.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.username}) = ${identifier}`)
    .limit(1);
  if (!user) { res.status(400).json({ error: "Code invalide ou expiré" }); return; }

  const [rec] = await db
    .select()
    .from(passwordResetCodesTable)
    .where(eq(passwordResetCodesTable.username, user.username))
    .limit(1);

  if (!rec || rec.expiresAt.getTime() < Date.now() || rec.attempts >= MAX_ATTEMPTS) {
    if (rec) await db.delete(passwordResetCodesTable).where(eq(passwordResetCodesTable.username, user.username));
    res.status(400).json({ error: "Code invalide ou expiré" });
    return;
  }

  if (!codeMatches(rec.codeHash, parsed.data.code.trim())) {
    await db
      .update(passwordResetCodesTable)
      .set({ attempts: rec.attempts + 1 })
      .where(eq(passwordResetCodesTable.username, user.username));
    res.status(400).json({ error: "Code invalide ou expiré" });
    return;
  }

  await db.update(usersTable).set({ password: parsed.data.password }).where(eq(usersTable.id, user.id));
  await db.delete(passwordResetCodesTable).where(eq(passwordResetCodesTable.username, user.username));
  res.json(ResetPasswordResponse.parse({ ok: true }));
});

export default router;
