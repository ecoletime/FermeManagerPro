import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, budgetCategoriesTable, depensesTable } from "@workspace/db";
import {
  CreateBudgetCategorieBody,
  CreateDepenseBody,
  GetBudgetCategoriesResponse,
  GetDepensesResponse,
  GetBudgetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapCategorie(r: typeof budgetCategoriesTable.$inferSelect) {
  return { ...r, budget: Number(r.budget), depense: Number(r.depense), createdAt: r.createdAt.toISOString() };
}
function mapDepense(r: typeof depensesTable.$inferSelect, categorieNom?: string | null) {
  return { ...r, date: String(r.date), montant: Number(r.montant), categorieNom: categorieNom ?? null, createdAt: r.createdAt.toISOString() };
}

router.get("/budget/stats", async (_req, res): Promise<void> => {
  const cats = await db.select().from(budgetCategoriesTable);
  const depenses = await db.select().from(depensesTable).orderBy(desc(depensesTable.date));
  const budgetTotal = cats.reduce((s, c) => s + Number(c.budget), 0);
  const depenseTotal = cats.reduce((s, c) => s + Number(c.depense), 0);
  const solde = budgetTotal - depenseTotal;

  const monthlyMap: Record<string, number> = {};
  for (const d of depenses) {
    const mois = String(d.date).slice(0, 7);
    monthlyMap[mois] = (monthlyMap[mois] ?? 0) + Number(d.montant);
  }
  const depensesMensuelles = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, montant]) => ({ mois, montant }));

  res.json(GetBudgetStatsResponse.parse({
    budgetTotal, depenseTotal, solde,
    parCategorie: cats.map(mapCategorie),
    depensesMensuelles,
  }));
});

router.get("/budget/categories", async (_req, res): Promise<void> => {
  const rows = await db.select().from(budgetCategoriesTable).orderBy(budgetCategoriesTable.createdAt);
  res.json(GetBudgetCategoriesResponse.parse(rows.map(mapCategorie)));
});

router.post("/budget/categories", async (req, res): Promise<void> => {
  const parsed = CreateBudgetCategorieBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(budgetCategoriesTable).values(parsed.data).returning();
  res.status(201).json(mapCategorie(row));
});

router.get("/budget/depenses", async (_req, res): Promise<void> => {
  const rows = await db.select().from(depensesTable).orderBy(desc(depensesTable.date));
  const cats = await db.select().from(budgetCategoriesTable);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.nom]));
  res.json(GetDepensesResponse.parse(rows.map(r => mapDepense(r, catMap[r.categorieId]))));
});

router.post("/budget/depenses", async (req, res): Promise<void> => {
  const parsed = CreateDepenseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(depensesTable).values(parsed.data).returning();
  const [cat] = await db.select().from(budgetCategoriesTable).where(eq(budgetCategoriesTable.id, row.categorieId));
  if (cat) {
    await db.update(budgetCategoriesTable)
      .set({ depense: String(Number(cat.depense) + Number(row.montant)) })
      .where(eq(budgetCategoriesTable.id, cat.id));
  }
  res.status(201).json(mapDepense(row, cat?.nom));
});

export default router;
