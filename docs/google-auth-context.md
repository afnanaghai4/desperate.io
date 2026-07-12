# Google Sign-In Context

## Purpose

This note summarizes the current discussion about adding Google sign-in/sign-up to desperate.io. It exists so future agents can recover the OAuth context without relying on the full chat history.

## Current Auth State

- The app already supports email/password registration and login.
- The backend owns authentication and issues its own JWT.
- The JWT is stored in an `accessToken` HTTP-only cookie.
- The frontend calls backend auth endpoints through `apiFetch()` with `credentials: 'include'`.
- Protected frontend routes rely on `ProtectedShell`, but backend JWT guards remain the real security boundary.
- Before PR 1, the `User` entity required `passwordHash`. PR 1 extracts password hashes into `password_credentials`, which prepares the app for users authenticated through non-password providers.

## Recommended Google Auth Model

- Add Google as an additional identity provider, not as a replacement for email/password auth.
- Use OpenID Connect authorization code flow through the backend.
- Frontend Google button should redirect to a backend endpoint such as `GET /auth/google`.
- Backend generates per-attempt `state`, `nonce`, and PKCE code verifier/challenge values.
- Backend redirects the browser to Google with `state`, `nonce`, an S256 PKCE code challenge, and scopes: `openid email profile`.
- Google redirects back to backend callback with an authorization code.
- Backend validates `state`, exchanges the code with the PKCE verifier, verifies Google's ID token including `nonce`, then finds or creates the local user.
- Backend then issues the same app JWT it already uses and sets the existing `accessToken` HTTP-only cookie.
- Frontend receives a redirect back to `/dashboard` or `/profile/setup`.

## Account Linking Guidance

- Use Google's `sub` claim as the stable provider identifier.
- Prefer a separate table such as `auth_accounts` / `user_identities` with:
  - `userId`
  - `provider`, for example `google`
  - `providerUserId`, Google's `sub`
  - `providerEmail`
  - timestamps
  - unique index on `(provider, providerUserId)`
- If a Google identity already exists, log in the linked local user.
- If no Google identity exists but a local user with the same email exists, do not blindly link unless the email is trustworthy and verified. The safer default is to require the user to sign in with password first and link Google from account settings.
- If no user exists, create a local user from the verified Google email, generate a collision-safe username, attach the Google identity, and route to profile setup if needed.

## Security Requirements

- Verify Google ID tokens server-side.
- Validate token signature, issuer, audience, expiry, and `email_verified`.
- Generate `state` for each authorization attempt, bind it to the initiating browser/session, validate it during callback handling, and invalidate it after one use.
- Generate `nonce` for each authorization attempt, bind it to the initiating browser/session, validate it during ID-token verification, and invalidate it after one use.
- Use PKCE with S256 for the authorization-code flow, storing the code verifier server-side until the callback token exchange.
- Keep Google client secret backend-only.
- Use exact redirect URI allowlisting in Google Cloud.
- Use HTTPS in production.
- Keep app JWT cookies HTTP-only and Secure in production.
- Do not store Google access or refresh tokens unless the app needs Google API access.
- Mock Google/OAuth in tests. Do not call real Google services in CI.

## Likely Implementation Areas

- Backend auth module: Google redirect and callback endpoints.
- Backend auth service: Google token verification, local user lookup/creation, JWT issuance.
- Backend persistence: provider identity table/entity/migration and user creation changes.
- Frontend login/signup forms: add "Continue with Google" button that navigates to backend OAuth start endpoint.
- Tests: unit tests for callback/linking logic and e2e tests with mocked Google verification, including invalid/replayed `state`, mismatched `nonce`, invalid issuer/audience/expiry, unverified email, and same-email account blocking.

## Recommended Implementation Order

- Start with backend and data model first; frontend depends on the backend OAuth start/callback routes.
- User prefers the cleaner long-term auth model instead of simply making `users.passwordHash` nullable.
- Schema changes must be represented by explicit migration scripts under `backend/src/migrations`. Entity changes alone are not acceptable as the schema-change mechanism.
- Any PR that adds/removes/changes persisted fields or tables must include the matching migration and tests around the migrated behavior.
- Split implementation into multiple PRs:
  1. Refactor local password credentials into separate persistence while preserving existing email/password behavior.
  2. Add provider identity persistence and backend Google OpenID Connect v1 behavior.
  3. Add frontend Google buttons and frontend tests.
  4. Optional hardening/docs follow-up if needed.
- Because the feature requires schema changes and both backend/frontend edits, keep PR scope tight and avoid unrelated refactors.
- V1 should block same-email existing password accounts instead of silently linking. Explicit linking is issue #87.

## Google Account Setup Steps

- Use a Google account to access Google Cloud Console.
- Create or select a Google Cloud project for desperate.io.
- Configure the OAuth consent screen:
  - App name: desperate.io
  - User support email: project-owned email if available
  - Developer contact email: project-owned email if available
  - Audience: External unless this is restricted to one Google Workspace organization
  - Scopes: only `openid`, `email`, and `profile`
  - Publishing status: Testing for local/dev, Production only when ready
- Create OAuth credentials:
  - Credential type: OAuth client ID
  - Application type: Web application
  - Authorized JavaScript origins:
    - local frontend, for example `http://localhost:3000`
    - production frontend URL later
  - Authorized redirect URIs:
    - local backend callback, for example `http://localhost:4000/auth/google/callback`
    - production backend callback later
- Copy the generated client ID and client secret into local backend environment variables:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`
  - `FRONTEND_URL`
- Do not commit these values. Add only placeholder examples to `.env.example` if needed.

## Current User Setup Progress

- User has created a Google OAuth client.
- Google Cloud Console now shows `Web client 1` under `OAuth 2.0 Client IDs`.
- Next manual step is to open that client, confirm local origins/redirect URIs, then copy the Client ID and Client Secret for local backend env configuration.
- Repo env placement verified:
  - Root `.env` is used by `docker-compose.yaml` for service wiring such as ports and Postgres variables.
  - `backend/.env` is loaded by the Nest backend when running locally and is also passed to the backend Docker service through `env_file`.
  - Google OAuth app credentials should go in `backend/.env`, not root `.env`.
- User has updated `backend/.env` with the Google OAuth values.
- Next engineering steps after PR 1: backend OAuth endpoints, provider identity persistence, frontend Google buttons, and mocked tests.
- GitHub tracking:
  - Issue #67 now contains the Google sign-in/sign-up v1 scope and security/test expectations.
  - Issue #87 tracks the later explicit Google account-linking flow for existing email/password users.
- PR 1 implementation branch:
  - Branch created: `agent/auth-password-credentials-pr1`.
  - Implemented backend password credential extraction.
  - Added `password_credentials` persistence and migration.
  - Removed password hash mapping from `User`.
  - Updated email/password register/login to store and read password hashes through password credentials.
  - Registration now creates the user and password credential in one transaction.
- Existing public auth endpoints remain unchanged.

## PR 2 Clarifications From Follow-Up Discussion

- `PasswordCredential` from PR #88 is not just a rename of `passwordHash`.
  It separates email/password login from the core `users` record so a user can
  exist without a password hash.
- Google sign-in still needs separate provider identity persistence. This maps
  Google's stable `sub` claim to the local `users.userId`, for example through
  an `auth_accounts` table.
- The expected account shapes after PR 2 are:
  - email/password user: `users` row + `password_credentials` row
  - Google-only user: `users` row + `auth_accounts` row
  - future linked user: `users` row + both credential/account rows
- Entity changes that affect persisted schema must include explicit migration
  scripts under `backend/src/migrations`; do not change the database manually
  and do not rely on TypeORM synchronize as the schema-change mechanism.
- The project remains industry-standard without Redis or a session layer. For
  this modular monolith, DB-backed OAuth attempt storage in PostgreSQL is a
  valid way to store short-lived `state`, `nonce`, and PKCE verifier values.
- Redis or server-side sessions can be considered later if the app needs
  distributed session management, high-volume short-lived state, centralized
  rate limiting, queues, or caching.
- Manual local testing after PR 2 should use real Google credentials only in
  `backend/.env`, with Google Cloud configured for
  `http://localhost:4000/auth/google/callback`. Automated tests must mock
  Google and must not make real network calls.
- Expected local manual flow after backend implementation:
  1. start Postgres with `docker-compose up postgres`
  2. start backend with `npm run start:dev`
  3. start frontend with `npm run dev`
  4. visit `http://localhost:4000/auth/google`
  5. complete Google auth, then confirm the backend sets the existing
     `accessToken` HTTP-only cookie and redirects to the frontend
