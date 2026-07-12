# Production Follow-Up Notes For PR #89

## Cookie SameSite Policy

The backend currently uses stricter production cookie behavior for the
`accessToken` HTTP-only cookie. This is secure for same-site deployments, but a
split production setup such as Vercel frontend plus a separate backend domain
may need `SameSite=None` with `Secure=true`.

This affects all auth flows, not only Google sign-in:

- email/password login
- registration auto-login
- Google callback login
- logout cookie clearing
- protected frontend route API calls

Recommended follow-up: add deliberate cookie configuration such as
`COOKIE_SAME_SITE` and `COOKIE_SECURE`, then use the same options when setting
and clearing auth cookies.

## Migration Verification

PR #89 adds schema through an explicit migration for `auth_accounts` and
`oauth_login_attempts`. The current backend e2e setup uses `DB_SYNC=true`, so it
verifies entity behavior but does not separately prove that migrations run
successfully against a fresh database.

Recommended follow-up: add a migration verification path using a disposable test
database with `DB_SYNC=false`, then run migrations before a backend smoke or e2e
check.
