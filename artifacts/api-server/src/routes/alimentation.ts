import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, repasTable, stocksTable, livraisonsTable } from "@workspace/db";
import {
  CreateRepasBody,
  CreateStockBody,
  UpdateStockParams,
  UpdateStockBody,
  CreateLivraisonBody,
  GetRepasResponse,
  GetStocksResponse,
  GetLivraisonsResponse,
  GetAlimentationStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapRepas(r: typeof repasTable.$inferSelect) {
  return { ...r, date: String(r.date), quantiteDistribuee: Number(r.quantiteDistribuee), quantiteRefusee: Number(r.quantiteRefusee), createdAt: r.createdAt.toISOString() };
}
function mapStock(r: typeof stocksTable.$inferSelect) {
  return { ...r, quantite: Number(r.quantite), capaciteMax: Number(r.capaciteMax), updatedAt: r.updatedAt.toISOString() };
}
function mapLivraison(r: typeof livraisonsTable.$inferSelect) {
  return { ...r, date: String(r.date), quantite: Number(r.quantite), prixTotal: r.prixTotal ? Number(r.prixTotal) : null, createdAt: r.createdAt.toISOString() };
}

router.get("/alimentation/stats", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const repasToday = await db.select().from(repasTable).where(eq(repasTable.date, today));
  const distribuéAujourdhui = repasToday.reduce((s, r) => s + Number(r.quantiteDistribuee), 0);
  const stocks = await db.select().from(stocksTable);
  const stockRestant = stocks.reduce((s, r) => s + Number(r.quantite), 0);
  const repasEffectues = repasToday.length;
  const totalDistribue = repasToday.reduce((s, r) => s + Number(r.quantiteDistribuee), 0);
  const totalRefuse = repasToday.reduce((s, r) => s + Number(r.quantiteRefusee), 0);
  const tauxConsommation = totalDistribue > 0 ? ((totalDistribue - totalRefuse) / totalDistribue) * 100 : 100;
  res.json(GetAlimentationStatsResponse.parse({ distribuéAujourdhui, stockRestant, repasEffectues, tauxConsommation }));
});

router.get("/alimentation/repas", async (_req, res): Promise<void> => {
  const rows = await db.select().from(repasTable).orderBy(repasTable.createdAt);
  res.json(GetRepasResponse.parse(rows.map(mapRepas)));
});

router.post("/alimentation/repas", async (req, res): Promise<void> => {
  const parsed = CreateRepasBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(repasTable).values(parsed.data).returning();
  res.status(201).json(mapRepas(row));
});

router.get("/alimentation/stocks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(stocksTable);
  res.json(GetStocksResponse.parse(rows.map(mapStock)));
});

router.post("/alimentation/stocks", async (req, res): Promise<void> => {
  const parsed = CreateStockBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(stocksTable).values(parsed.data).returning();
  res.status(201).json(mapStock(row));
});

router.put("/alimentation/stocks/:id", async (req, res): Promise<void> => {
  const params = UpdateStockParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateStockBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(stocksTable).set(parsed.data).where(eq(stocksTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Stock non trouvé" }); return; }
  res.json(mapStock(row));
});

router.get("/alimentation/livraisons", async (_req, res): Promise<void> => {
  const rows = await db.select().from(livraisonsTable).orderBy(livraisonsTable.createdAt);
  res.json(GetLivraisonsResponse.parse(rows.map(mapLivraison)));
});

router.post("/alimentation/livraisons", async (req, res): Promise<void> => {
  const parsed = CreateLivraisonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(livraisonsTable).values(parsed.data).returning();
  res.status(201).json(mapLivraison(row));
});

export default router;
