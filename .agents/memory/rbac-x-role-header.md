---
name: RBAC via x-role header
description: How server-side RBAC is enforced in the API server and why it is not a real security boundary
---

# RBAC is enforced via a client-supplied `x-role` header

The Express API (`artifacts/api-server`) enforces admin-only access with a `requireAdmin`
middleware that reads the role from the request `x-role` header. The frontend sets this
header from `localStorage` (`ferme_auth` role) in `App.tsx`. Admin-mounted routers:
budget, journal-audit, utilisateurs, system-settings.

**Why:** This matched the incremental "server-side RBAC" finding and the session plan,
which explicitly specified `x-role` as the mechanism. There is no token/session auth in
this app — login just returns the user row; passwords are stored plaintext.

**How to apply:** This is NOT a true security boundary — any client can send
`x-role: admin` to bypass it. If a future task needs real access control, replace the
header trust with a verifiable identity (signed JWT or server session) and derive the
role from the verified identity, not the header. Until then, treat admin gating as a
UX/role convenience, not a security guarantee.
