---
name: Auth & RBAC (signed token)
description: How authentication and admin RBAC are enforced in the API server
---

# Auth is a server-signed HMAC token; RBAC derives role from it

Login (`/api/auth/login`) issues a compact HMAC-SHA256 token (`base64url(payload).sig`,
12h expiry) signed with `JWT_SECRET`. The client stores it in `localStorage` (`ferme_auth`)
and sends it as `Authorization: Bearer <token>` via the api-client's `setAuthTokenGetter`.
Server: `authenticate` middleware (registered in `app.ts` before `auditMiddleware`) verifies
the token and sets `req.user`; `requireAuth` gates all data routers (401 if no/invalid token);
`requireAdmin` reads `req.user.role` (401 unauth, 403 non-admin). Admin-gated bases:
budget, journal-audit, utilisateurs, system-settings.

**Why:** The previous RBAC trusted a client-supplied `x-role` header, which any client could
forge. Role is now derived only from the verified token payload. `x-role` was removed from the
client; `x-utilisateur` is kept for audit attribution only (not security).

**How to apply:**
- `JWT_SECRET` is a required env var; the server fails fast at startup if it is missing.
- Never reintroduce header-based role trust. Any new protected router must sit below the
  `requireAuth` gate in `routes/index.ts`; public routes (health, auth login/reset) go above it.
- KNOWN REMAINING HOLE: `/auth/reset-password` is unauthenticated and resets by username alone
  (the OTP/code check is client-side only, so bypassable via direct API call). This permits
  account takeover (incl. admin) and undermines the auth boundary. Fix needs server-side
  code/OTP storage + validation + rate limiting before relying on auth for real security.
- Passwords are still stored plaintext (out of scope so far).
