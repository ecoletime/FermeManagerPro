---
name: Express sub-router middleware scope
description: Why path-less router.use(mw) inside a sub-router blocks the whole API, and how to scope role guards.
---

# Scoping middleware guards in this Express API

The API composes feature routers in `artifacts/api-server/src/routes/index.ts` with `router.use(featureRouter)` — every sub-router is mounted at root `/`.

**Rule:** Do NOT put a path-less guard like `router.use(requireAdmin)` at the top of a feature router. A sub-router mounted at `/` receives every request, so its path-less `.use()` middleware runs for ALL traffic and, if it doesn't call `next()`, blocks the entire API (every employee request 403s), not just that feature's routes.

**How to apply:** Scope guards by path prefix in `index.ts`, e.g. `router.use("/budget", requireAdmin)` and `router.use("/journal-audit", requireAdmin)`, placed before the feature routers. The guard then only fires for matching paths and falls through to the matching feature router for authorized roles.

**Why:** Discovered when admin-only guards added inside `budget.ts`/`journal-audit.ts` caused 403 on unrelated routes (sante/reproduction/etc.) because `journalAuditRouter` is mounted early at root.

Role comes from the `x-role` header (`getRole(req)` in `middleware/requireRole.ts`); admins are `"admin"`, everyone else treated as employee.
