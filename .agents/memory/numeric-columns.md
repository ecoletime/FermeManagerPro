---
name: Drizzle numeric columns use mode "number"
description: Convention for numeric/decimal columns and why; how to read them in routes
---

All `numeric(...)` columns in `lib/db/src/schema/*` use `{ mode: "number" }` so Drizzle
accepts/returns JS numbers, matching the number-based API contract (api-zod generated from
`lib/api-spec/openapi.yaml`).

**Why:** Drizzle's default for `numeric` is the TS type `string`. Routes insert/update with
numbers (api-zod models them as numbers), which previously caused ~18 typecheck errors even
though runtime worked (esbuild skips typecheck; Postgres coerces). `mode: "number"` fixes it
at the root.

**How to apply:**
- New numeric/decimal columns: always add `, mode: "number" }` to the config, and use numeric
  defaults (`.default(0)`, NOT `.default("0")`).
- This is a TYPE-only change — the SQL column type is unchanged, so it needs NO db migration.
- In route read mappers the value is already `number | null`; pass it through directly
  (`poids: r.poids`). Do NOT use `x ? Number(x) : null` — that truthiness guard turns a stored
  `0` into `null`. Use `x` or `x ?? fallback`.
- JS `number` is IEEE-754; for `numeric(14,2)` money this is generally fine but exact decimal
  arithmetic should be done DB-side if strict precision is ever required.
