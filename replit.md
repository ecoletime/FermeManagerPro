# FermeManager Pro

Système de gestion de ferme porcine — full-stack React + Vite with PostgreSQL backend.

## Architecture

Monorepo managed with pnpm. Key packages:

- `artifacts/ferme-manager` — React + Vite frontend (port via `$PORT`)
- `artifacts/api-server` — Express API server (port 8080, path `/api`)
- `lib/db` — Drizzle ORM schema and database client
- `lib/api-spec` — OpenAPI spec (`openapi.yaml`)
- `lib/api-zod` — Zod schemas generated from OpenAPI
- `lib/api-client-react` — React Query hooks generated from OpenAPI

## Credentials (development only)

- Admin: `admin` / `admin123`
- Employé: `employe` / `emp123`

## Modules (11 total)

1. **Dashboard** — Résumé, alertes, activité récente, graphiques
2. **Animaux** — Registre du troupeau, filtres, CRUD
3. **Santé** — Vaccins, traitements, quarantaine, mortalité
4. **Reproduction** — Accouplements, naissances, sevrages
5. **Alimentation** — Stocks (barres de progression), repas, livraisons
6. **Loges** — Bâtiments, loges, allocations
7. **Maintenance** — Tâches avec priorités (urgente/haute/normale/basse), CRUD
8. **Employés** — Gestion du personnel, salaires (FCFA)
9. **Vétérinaire** — Visites vétérinaires planifiées et terminées
10. **Fournisseurs** — Gestion des fournisseurs
11. **Budget** — Admin-only. Catégories budgétaires, dépenses, graphiques (FCFA)

## Database Schema

Tables: `animaux`, `batiments`, `loges`, `allocations`, `employes`, `stocks`, `repas`, `livraisons`, `vaccins`, `traitements`, `quarantaine`, `mortalite`, `accouplements`, `naissances`, `sevrages`, `maintenance`, `fournisseurs`, `budget_categories`, `depenses`, `visites_veterinaire`

## Key Design Decisions

- Currency: FCFA (Franc CFA), French language throughout
- Auth: Role-based (admin vs employee), stored in React context (localStorage-less session)
- Brand color: `#1A9E6F` (green)
- Routes: all serialized with `.toISOString()` for dates, `Number()` for numerics before Zod parse
- No emojis in UI

## Codegen

```bash
pnpm --filter @workspace/api-spec run codegen
```

Regenerates Zod schemas and React Query hooks from `lib/api-spec/openapi.yaml`.

## Running

Both workflows start automatically:
- API Server: `artifacts/api-server: API Server`
- Frontend: `artifacts/ferme-manager: web`
