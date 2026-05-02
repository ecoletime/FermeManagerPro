import { Router, type IRouter } from "express";
import { db, animauxTable, maintenanceTable, employesTable, naissancesTable, logesTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardAlertesResponse,
  GetDashboardActiviteRecenteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const animaux = await db.select().from(animauxTable);
  const totalAnimaux = animaux.length;
  const animauxMalades = animaux.filter(a => a.statut === "Malade").length;

  const employes = await db.select().from(employesTable);
  const employesPresents = employes.filter(e => e.statut === "Actif").length;

  const tasks = await db.select().from(maintenanceTable);
  const maintenancesActives = tasks.filter(t => t.statut !== "termine" && t.statut !== "annule").length;

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const naissances = await db.select().from(naissancesTable);
  const naissancesMois = naissances.filter(n => String(n.date) >= firstOfMonth).length;

  const loges = await db.select().from(logesTable);
  const animauxLoges = loges.reduce((s, l) => s + l.occupe, 0);
  const totalCap = loges.reduce((s, l) => s + (l.capacite ?? 0), 0);
  const tauxOccupation = totalCap > 0 ? (animauxLoges / totalCap) * 100 : 0;

  const urgentTasks = tasks.filter(t => t.priorite === "urgente" && t.statut !== "termine").length;

  res.json(GetDashboardSummaryResponse.parse({
    totalAnimaux, animauxMalades, employesPresents, maintenancesActives, naissancesMois, tauxOccupation, stockCritique: urgentTasks,
  }));
});

router.get("/dashboard/alertes", async (_req, res): Promise<void> => {
  const alertes = [];
  let id = 1;
  const tasks = await db.select().from(maintenanceTable);
  const urgentTasks = tasks.filter(t => t.priorite === "urgente" && t.statut !== "termine" && t.statut !== "annule");
  for (const t of urgentTasks.slice(0, 3)) {
    alertes.push({ id: id++, type: "urgente" as const, message: `Maintenance urgente: ${t.titre}`, createdAt: t.createdAt.toISOString() });
  }
  const animaux = await db.select().from(animauxTable);
  const malades = animaux.filter(a => a.statut === "Malade");
  if (malades.length > 0) {
    alertes.push({ id: id++, type: "attention" as const, message: `${malades.length} animal(aux) malade(s): ${malades.slice(0,3).map(a=>a.tag).join(", ")}`, createdAt: new Date().toISOString() });
  }
  res.json(GetDashboardAlertesResponse.parse(alertes));
});

router.get("/dashboard/activite-recente", async (_req, res): Promise<void> => {
  const activites = [];
  let id = 1;
  const tasks = await db.select().from(maintenanceTable);
  for (const t of tasks.slice(-3).reverse()) {
    activites.push({ id: id++, icone: "tool", message: `Maintenance: ${t.titre}`, badge: t.statut, badgeType: t.priorite === "urgente" ? "red" : "amber", createdAt: t.createdAt.toISOString() });
  }
  const naissances = await db.select().from(naissancesTable);
  for (const n of naissances.slice(-2).reverse()) {
    activites.push({ id: id++, icone: "piggy", message: `Naissance - ${n.mere} (${n.vivants} porcelets)`, badge: "Récent", badgeType: "green", createdAt: n.createdAt.toISOString() });
  }
  activites.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(GetDashboardActiviteRecenteResponse.parse(activites.slice(0, 8)));
});

export default router;
