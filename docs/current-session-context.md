# Current Session Context

This document is intentionally sanitized. Do not add secrets, access keys, tokens, cloud account IDs, public IPs, DNS names, SSH key paths, real environment values, or provider resource details here.

## Current Goal

The current focus is production deployment debugging after the MVP EC2 backend and Vercel frontend deployment.

## Deployment State

- Frontend is deployed on Vercel.
- Backend is deployed on EC2 behind Caddy.
- Backend health check works.
- Google authentication works after backend/frontend environment alignment.
- Database schema was created during deployment, then `DB_SYNC` was turned back off.
- Production environment values must remain outside the repo.

## Latest User-Reported Issue

The user reported an internal server error when analyzing a job through a link.

## First Investigation Result

Production backend logs showed the request reached the analysis flow. The failure was not from CORS, link extraction, database schema, or OpenAI configuration.

The backend threw:

```text
User profile must have at least one experience entry to analyze job fit.
```

That means the logged-in user's profile did not have at least one valid experience entry for the AI analysis prompt. The code threw this as a plain `Error`, so NestJS returned it as `500 Internal Server Error`.

Expected behavior should be a client-facing `400 Bad Request` explaining that the user must complete profile experience details before running analysis.

## First Local Change Already Started

Before the user interrupted, a local edit was made in:

- `backend/src/ai-orchestrator/ai-orchestrator.service.ts`

The local edit changes profile/input validation failures from plain `Error` to Nest HTTP exceptions:

- Missing request body -> `BadRequestException`
- Invalid user ID -> `BadRequestException`
- Missing profile experience -> `BadRequestException`
- Invalid experience entry -> `BadRequestException`
- Missing skills on an experience -> `BadRequestException`
- Missing user profile -> `NotFoundException`

This change has not been tested yet and has not been deployed.

## Second Investigation Result

After the user updated their profile, link-based analysis reached OpenAI and OpenAI returned JSON, but the backend still returned `500 Internal Server Error`.

Production logs showed:

```text
OpenAI response JSON does not match expected JobAnalysisResponse schema
```

The logged response had:

```json
"analysis": {
  "strengths": [],
  "weaknesses": [
    "Lack of professional experience in AI field",
    "No proficiency in Python",
    "No experience with NLP solutions",
    "No containerization expertise"
  ]
}
```

The backend validator rejected the response because it required at least one strength. For a low-match role, an empty strengths list is a valid response. The same job worked when pasted manually because the pasted description likely produced a slightly different model response with at least one strength.

## Second Local Change Started

Local edits were made in:

- `backend/src/ai-orchestrator/ai-orchestrator.service.ts`
- `backend/src/ai-orchestrator/ai-orchestrator.service.spec.ts`

The validator now allows:

- empty `analysis.strengths` for low-match jobs
- empty `analysis.weaknesses` for near-perfect matches

It still requires both fields to be arrays and still rejects empty strings inside those arrays.

Focused test run:

```text
npm run test -- ai-orchestrator.service.spec.ts --runInBand
```

Result:

```text
Test Suites: 1 passed
Tests: 2 passed
```

This change has not been deployed.

## Recommended Next Steps

1. Add focused unit coverage for the analysis/profile validation regression.
2. Run the relevant backend tests.
3. Commit the fix on a branch and open a PR if the user wants this handled through GitHub.
4. After merge, pull latest code on EC2 and restart the backend container.
5. Separately, the user should complete their profile experience data in the app so analysis can actually run.

## Safety Notes

- Do not print or inspect `.env` values.
- Do not commit deployment details or cloud resource identifiers.
- Do not push directly to the default branch.
- Do not auto-merge PRs.
