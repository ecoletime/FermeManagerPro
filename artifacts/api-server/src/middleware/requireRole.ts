import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "../lib/token";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers["authorization"];
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice(7).trim());
    if (payload) req.user = payload;
  }
  next();
}

export function getRole(req: Request): string {
  return req.user?.role ?? "employee";
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Accès refusé : droits administrateur requis" });
    return;
  }
  next();
}
