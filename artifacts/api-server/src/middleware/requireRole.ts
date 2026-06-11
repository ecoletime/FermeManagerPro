import type { Request, Response, NextFunction } from "express";

export function getRole(req: Request): string {
  return (req.headers["x-role"] as string | undefined) || "employee";
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (getRole(req) !== "admin") {
    res.status(403).json({ error: "Accès refusé : droits administrateur requis" });
    return;
  }
  next();
}
