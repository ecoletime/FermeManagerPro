import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, batimentsTable, logesTable, allocationsTable } from "@workspace/db";
import {
  CreateBatimentBody,
  CreateLogeBody,
  CreateAllocationBody,
  GetBatimentsResponse,
  GetLogesResponse,
  GetAllocationsResponse,
  GetLogesStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapBatiment(r: typeof batimentsTable.$inferSelect) {
  return { ...r, superficie: r.superficie, createdAt: r.createdAt.toISOString() };
}
function mapLoge(r: typeof logesTable.$inferSelect, batimentNom?: string | null) {
  return { ...r, superficie: r.superficie, batimentNom: batimentNom ?? null, createdAt: r.createdAt.toISOString() };
}
function mapAllocation(r: typeof allocationsTable.$inferSelect, logeNom?: string | null, batimentNom?: string | null) {
  return { ...r, date: String(r.date), logeNom: logeNom ?? null, batimentNom: batimentNom ?? null, createdAt: r.createdAt.toISOString() };
}

router.get("/loges/stats", async (_req, res): Promise<void> => {
  const bats = await db.select().from(batimentsTable);
  const loges = await db.select().from(logesTable);
  const animauxLoges = loges.reduce((s, l) => s + l.occupe, 0);
  const totalCap = loges.reduce((s, l) => s + (l.capacite ?? 0), 0);
  const tauxOccupation = totalCap > 0 ? (animauxLoges / totalCap) * 100 : 0;
  res.json(GetLogesStatsResponse.parse({ totalBatiments: bats.length, totalLoges: loges.length, animauxLoges, tauxOccupation }));
});

router.get("/loges/batiments", async (_req, res): Promise<void> => {
  const rows = await db.select().from(batimentsTable).orderBy(batimentsTable.createdAt);
  res.json(GetBatimentsResponse.parse(rows.map(mapBatiment)));
});

router.post("/loges/batiments", async (req, res): Promise<void> => {
  const parsed = CreateBatimentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(batimentsTable).values(parsed.data).returning();
  res.status(201).json(mapBatiment(row));
});

router.get("/loges/loges", async (_req, res): Promise<void> => {
  const rows = await db.select().from(logesTable).orderBy(logesTable.createdAt);
  const bats = await db.select().from(batimentsTable);
  const batMap = Object.fromEntries(bats.map(b => [b.id, b.nom]));
  res.json(GetLogesResponse.parse(rows.map(r => mapLoge(r, batMap[r.batimentId]))));
});

router.post("/loges/loges", async (req, res): Promise<void> => {
  const parsed = CreateLogeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(logesTable).values(parsed.data).returning();
  const [bat] = await db.select().from(batimentsTable).where(eq(batimentsTable.id, row.batimentId));
  res.status(201).json(mapLoge(row, bat?.nom));
});

router.get("/loges/allocations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(allocationsTable).orderBy(allocationsTable.createdAt);
  const loges = await db.select().from(logesTable);
  const bats = await db.select().from(batimentsTable);
  const logeMap = Object.fromEntries(loges.map(l => [l.id, l]));
  const batMap = Object.fromEntries(bats.map(b => [b.id, b.nom]));
  res.json(GetAllocationsResponse.parse(rows.map(r => {
    const loge = logeMap[r.logeId];
    return mapAllocation(r, loge?.nom, loge ? batMap[loge.batimentId] : null);
  })));
});

router.post("/loges/allocations", async (req, res): Promise<void> => {
  const parsed = CreateAllocationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(allocationsTable).values(parsed.data).returning();
  const [loge] = await db.select().from(logesTable).where(eq(logesTable.id, row.logeId));
  const [bat] = loge ? await db.select().from(batimentsTable).where(eq(batimentsTable.id, loge.batimentId)) : [undefined];
  res.status(201).json(mapAllocation(row, loge?.nom, bat?.nom));
});

export default router;
