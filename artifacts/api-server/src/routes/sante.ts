import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vaccinsTable, traitementsTable, quarantaineTable, mortaliteTable, animauxTable } from "@workspace/db";
import {
  CreateVaccinBody,
  CreateTraitementBody,
  CreateQuarantaineBody,
  CreateMortBody,
  GetVaccinsResponse,
  GetTraitementsResponse,
  GetQuarantaineResponse,
  GetMortaliteResponse,
  GetSanteStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapVaccin(r: typeof vaccinsTable.$inferSelect) {
  return { ...r, date: String(r.date), rappel: r.rappel ? String(r.rappel) : null, createdAt: r.createdAt.toISOString() };
}
function mapTraitement(r: typeof traitementsTable.$inferSelect) {
  return { ...r, dateDebut: String(r.dateDebut), dateFin: r.dateFin ? String(r.dateFin) : null, createdAt: r.createdAt.toISOString() };
}
function mapQuarantaine(r: typeof quarantaineTable.$inferSelect) {
  return { ...r, dateDebut: String(r.dateDebut), createdAt: r.createdAt.toISOString() };
}
function mapMort(r: typeof mortaliteTable.$inferSelect) {
  return { ...r, date: String(r.date), createdAt: r.createdAt.toISOString() };
}

router.get("/sante/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(animauxTable);
  const malades = all.filter(a => a.statut === "Malade").length;
  const vaccins = await db.select().from(vaccinsTable);
  const quarantaine = await db.select().from(quarantaineTable).where(eq(quarantaineTable.statut, "En cours"));
  const today = new Date().toISOString().slice(0, 10);
  const morts = await db.select().from(mortaliteTable);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const decesMois = morts.filter(m => String(m.date) >= firstOfMonth).length;
  const vaccinsAFaire = vaccins.filter(v => v.rappel && String(v.rappel) <= today).length;
  res.json(GetSanteStatsResponse.parse({ malades, vaccinsAFaire, enQuarantaine: quarantaine.length, decesMois }));
});

router.get("/sante/vaccins", async (_req, res): Promise<void> => {
  const rows = await db.select().from(vaccinsTable).orderBy(vaccinsTable.createdAt);
  res.json(GetVaccinsResponse.parse(rows.map(mapVaccin)));
});

router.post("/sante/vaccins", async (req, res): Promise<void> => {
  const parsed = CreateVaccinBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(vaccinsTable).values(parsed.data).returning();
  res.status(201).json(mapVaccin(row));
});

router.delete("/sante/vaccins/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.delete(vaccinsTable).where(eq(vaccinsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Non trouvé" }); return; }
  res.sendStatus(204);
});

router.get("/sante/traitements", async (_req, res): Promise<void> => {
  const rows = await db.select().from(traitementsTable).orderBy(traitementsTable.createdAt);
  res.json(GetTraitementsResponse.parse(rows.map(mapTraitement)));
});

router.post("/sante/traitements", async (req, res): Promise<void> => {
  const parsed = CreateTraitementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(traitementsTable).values(parsed.data).returning();
  res.status(201).json(mapTraitement(row));
});

router.get("/sante/quarantaine", async (_req, res): Promise<void> => {
  const rows = await db.select().from(quarantaineTable).orderBy(quarantaineTable.createdAt);
  res.json(GetQuarantaineResponse.parse(rows.map(mapQuarantaine)));
});

router.post("/sante/quarantaine", async (req, res): Promise<void> => {
  const parsed = CreateQuarantaineBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(quarantaineTable).values(parsed.data).returning();
  res.status(201).json(mapQuarantaine(row));
});

router.get("/sante/mortalite", async (_req, res): Promise<void> => {
  const rows = await db.select().from(mortaliteTable).orderBy(mortaliteTable.createdAt);
  res.json(GetMortaliteResponse.parse(rows.map(mapMort)));
});

router.post("/sante/mortalite", async (req, res): Promise<void> => {
  const parsed = CreateMortBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(mortaliteTable).values(parsed.data).returning();
  res.status(201).json(mapMort(row));
});

router.delete("/sante/traitements/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.delete(traitementsTable).where(eq(traitementsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Non trouvé" }); return; }
  res.sendStatus(204);
});

router.delete("/sante/quarantaine/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.delete(quarantaineTable).where(eq(quarantaineTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Non trouvé" }); return; }
  res.sendStatus(204);
});

router.delete("/sante/mortalite/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db.delete(mortaliteTable).where(eq(mortaliteTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Non trouvé" }); return; }
  res.sendStatus(204);
});

export default router;
