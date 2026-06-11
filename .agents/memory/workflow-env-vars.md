---
name: Workflow env vars for FermeManager artifacts
description: Why the API/web workflows need PORT (and BASE_PATH) injected manually
---

The artifacts (`api-server`, `ferme-manager`) have valid `.replit-artifact/artifact.toml`
but are NOT registered in the agent artifact system (`listArtifacts()` returns empty,
and the `screenshot` app_preview tool can't find them by dir name). They run as plain
workflows instead.

**Rule:** When (re)configuring these as plain workflows, inject the env vars the artifact
system would normally provide, or startup crashes:
- API Server: `PORT=8080 pnpm --filter @workspace/api-server run dev` (else `index.ts`
  throws "PORT environment variable is required").
- Frontend: `PORT=21491 BASE_PATH=/ pnpm --filter @workspace/ferme-manager run dev`
  (else `vite.config.ts` throws "BASE_PATH environment variable is required").

**Why:** The imported project's `artifact.toml` declares these in `[services.env]`, but
since the artifacts aren't registered the env injection never happens for manual workflows.

**How to apply:** Use the dev domain (`$REPLIT_DEV_DOMAIN`) + `external_url` screenshot to
visually verify the frontend, since `app_preview` screenshots fail without registration.
