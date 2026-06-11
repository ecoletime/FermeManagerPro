import { Router, type IRouter } from "express";
import { db, accouplementsTable, naissancesTable, sevragesTable } from "@workspace/db";
import {
  CreateAccouplementBody,
  CreateNaissanceBody,
  CreateSevrageBody,
  GetAccouplementsResponse,
  GetNaissancesResponse,
  GetSevragesResponse,
  GetReproductionStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapAcc(r: typeof accouplementsTable.$inferSelect) {
  return { ...r, date: String(r.date), dateMiseBasPrevue: r.dateMiseBasPrevue ? String(r.dateMiseBasPrevue) : null, createdAt: r.createdAt.toISOString() };
}
function mapNaissance(r: typeof naissancesTable.$inferSelect) {
  return { ...r, date: String(r.date), poidsMovyen: r.poidsMovyen, createdAt: r.createdAt.toISOString() };
}
function mapSevrage(r: typeof sevragesTable.$inferSelect) {
  return { ...r, date: String(r.date), poidsMoyen: r.poidsMoyen, createdAt: r.createdAt.toISOString() };
}

router.get("/reproduction/stats", async (_req, res): Promise<void> => {
  const accs = await db.select().from(accouplementsTable);
  const naissances = await db.select().from(naissancesTable);
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const miseBasImminentes = accs.filter(a => {
    if (!a.dateMiseBasPrevue || a.statut !== "Gestante") return false;
    const diff = (new Date(a.dateMiseBasPrevue).getTime() - new Date(today).getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  const truiesGestantes = accs.filter(a => a.statut === "Gestante").length;
  const naissancesMois = naissances.filter(n => String(n.date) >= firstOfMonth).length;
  const lastNaissance = naissances.at(-1);
  const porceletsASevrer = lastNaissance ? lastNaissance.vivants : 0;

  res.json(GetReproductionStatsResponse.parse({ miseBasImminentes, truiesGestantes, naissancesMois, porceletsASevrer }));
});

router.get("/reproduction/accouplements", async (_req, res): Promise<void> => {
  const rows = await db.select().from(accouplementsTable).orderBy(accouplementsTable.createdAt);
  res.json(GetAccouplementsResponse.parse(rows.map(mapAcc)));
});

router.post("/reproduction/accouplements", async (req, res): Promise<void> => {
  const parsed = CreateAccouplementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(accouplementsTable).values(parsed.data).returning();
  res.status(201).json(mapAcc(row));
});

router.get("/reproduction/naissances", async (_req, res): Promise<void> => {
  const rows = await db.select().from(naissancesTable).orderBy(naissancesTable.createdAt);
  res.json(GetNaissancesResponse.parse(rows.map(mapNaissance)));
});

router.post("/reproduction/naissances", async (req, res): Promise<void> => {
  const parsed = CreateNaissanceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(naissancesTable).values(parsed.data).returning();
  res.status(201).json(mapNaissance(row));
});

router.get("/reproduction/sevrages", async (_req, res): Promise<void> => {
  const rows = await db.select().from(sevragesTable).orderBy(sevragesTable.createdAt);
  res.json(GetSevragesResponse.parse(rows.map(mapSevrage)));
});

router.post("/reproduction/sevrages", async (req, res): Promise<void> => {
  const parsed = CreateSevrageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(sevragesTable).values(parsed.data).returning();
  res.status(201).json(mapSevrage(row));
});

export default router;
