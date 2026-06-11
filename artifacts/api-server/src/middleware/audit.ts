import type { Request, Response, NextFunction } from "express";
import { db, journalAuditTable } from "@workspace/db";

const MODULE_MAP: Record<string, string> = {
  animaux: "Animaux",
  vaccins: "Santé",
  traitements: "Santé",
  quarantaine: "Santé",
  mortalite: "Santé",
  accouplements: "Reproduction",
  naissances: "Reproduction",
  sevrages: "Reproduction",
  stocks: "Alimentation",
  repas: "Alimentation",
  livraisons: "Alimentation",
  batiments: "Loges & Bâtiments",
  loges: "Loges & Bâtiments",
  allocations: "Loges & Bâtiments",
  maintenance: "Maintenance",
  employes: "Employés",
  "visites-veterinaire": "Vétérinaire",
  fournisseurs: "Fournisseurs",
  "budget-categories": "Budget",
  depenses: "Budget",
  notifications: "Notifications",
};

const ACTION_MAP: Record<string, string> = {
  POST: "Création",
  PUT: "Modification",
  PATCH: "Modification",
  DELETE: "Suppression",
};

const SPECIAL_ACTIONS: Array<{ pattern: RegExp; method: string; action: string; module: string }> = [
  { pattern: /^\/api\/maintenance\/\d+\/terminer$/, method: "PATCH", action: "Tâche terminée", module: "Maintenance" },
  { pattern: /^\/api\/notifications\/\d+\/lue$/, method: "PATCH", action: "Notification lue", module: "Notifications" },
  { pattern: /^\/api\/notifications\/tout-lire$/, method: "POST", action: "Toutes notifications lues", module: "Notifications" },
  { pattern: /^\/api\/auth\/reset-email$/, method: "POST", action: "Email de réinitialisation envoyé", module: "Système" },
];

function parseRoute(url: string, method: string): { module: string; action: string; description: string } {
  const cleanUrl = url.split("?")[0];

  for (const special of SPECIAL_ACTIONS) {
    if (special.method === method && special.pattern.test(cleanUrl)) {
      return { module: special.module, action: special.action, description: `${special.action} — ${cleanUrl}` };
    }
  }

  const stripped = cleanUrl.replace(/^\/api/, "");
  const segments = stripped.split("/").filter(Boolean);
  const base = segments[0] ?? "inconnu";
  const hasId = segments.length > 1 && /^\d+$/.test(segments[1]);

  const module = MODULE_MAP[base] ?? base;
  const action = ACTION_MAP[method] ?? method;
  const label = base.replace(/-/g, " ");
  const description = hasId
    ? `${action} — ${label} #${segments[1]}`
    : `${action} — ${label}`;

  return { module, action, description };
}

const SKIP_PATHS = new Set(["/api/journal-audit", "/api/healthz"]);
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  const cleanPath = req.url.split("?")[0];
  if (SKIP_PATHS.has(cleanPath)) {
    next();
    return;
  }

  const utilisateur = req.user?.username || (req.headers["x-utilisateur"] as string | undefined) || "inconnu";
  const role = req.user?.role || "employee";

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    const { module, action, description } = parseRoute(req.url, req.method);
    db.insert(journalAuditTable).values({
      utilisateur,
      role,
      action,
      module,
      description,
      methode: req.method,
      chemin: cleanPath,
      statut: res.statusCode,
    }).catch(() => {});
  });

  next();
}
