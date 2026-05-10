# Coverage Workflow

## Goal

Improve meaningful test coverage without breaking the running application.

## Workflow

### Step 1 — Pick One Issue

Work on one issue at a time.

Do not combine multiple modules in one PR.

Recommended work order:

1. Backend Jobs module coverage
2. Backend Analysis module coverage
3. Backend Users/Profile module coverage
4. Backend Project Recommendation module coverage
5. Frontend Jobs flow tests
6. Frontend Analysis flow tests
7. CI coverage reports and thresholds

### Step 2 — Inspect Existing Code

Before writing tests, inspect:

- relevant service/controller files in the module
- existing test files in the same module (patterns to follow)
- existing e2e test helpers under `backend/test/helpers/`
- `backend/package.json` and `frontend/package.json` for available scripts
- module entities and DTOs involved
- CI workflows if coverage metrics matter

### Step 3 — List Missing Test Cases

Document what coverage gaps exist:

- happy path tests (normal behavior)
- validation failure tests (invalid input)
- authorization failure tests (user cannot access)
- ownership tests (user can only access own data)
- persistence tests (data survives in database)
- deletion/cascade tests (correct cleanup behavior)
- pagination tests (if applicable)
- external service failure tests (safe error handling)
- edge cases relevant to the module

### Step 4 — Write Tests

Rules:

- Write unit tests for service logic (colocate in `src/**/*.spec.ts`)
- Write e2e tests for HTTP endpoints (place in `backend/test/`)
- Mock all external services (OpenAI, third-party APIs)
- Use existing test helpers where possible (`backend/test/helpers/`)
- Only add new helpers if they reduce duplication across tests
- Keep assertions specific and meaningful
- Test behavior, not implementation details

### Step 5 — Run Local Feedback Checks

Use local commands for fast feedback while developing.

Local testing gives quick turnaround while writing tests.

#### Backend local testing

From `backend/` directory:

```bash
npm run test              # unit tests only
npm run test:cov          # unit tests with coverage report
npm run test:e2e          # e2e tests (requires postgres running)
```

For e2e tests, ensure postgres is running in another terminal:

```bash
docker-compose up postgres
```

#### Frontend local testing

From `frontend/` directory:

```bash
npm run lint              # check code style
npm run type-check        # verify TypeScript
npm run build             # verify production build
```

### Step 6 — Run Final Verification

Before marking a coverage task complete or opening a PR, run the closest available CI/Docker-style verification.

This is the final confidence check before code review.

#### Backend final verification

From `backend/` directory, run:

```bash
npm run lint
npm run test:cov -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

Then from the repo root, run:

```bash
docker-compose up desperate_test
```

The `--runInBand` flag ensures tests run serially (not in parallel), which is safer for database-dependent tests.

The `desperate_test` container matches the CI environment as closely as possible.

#### If Docker verification cannot be run

State clearly in the PR:
- what Docker commands were attempted
- what error occurred
- why the verification could not be completed

**Rule:**
Local tests are for development speed. Docker/CI-style verification is the final confidence check before PR review.

### Step 7 — Prepare PR

Open a PR with this information:

```
## Issue
Closes #123 (or reference the issue)

## Summary
Brief description of coverage added (e.g., "Add unit and e2e tests for Jobs module")

## Tests Added
- List new test files
- Brief description of coverage areas
- Examples:
  - `backend/src/jobs/job.service.spec.ts` — service logic tests
  - `backend/test/jobs.e2e-spec.ts` — HTTP endpoint tests

## Commands Run
### Local Testing
- npm run test
- npm run test:cov
- npm run test:e2e

### Final Verification
- npm run lint
- npm run test:cov -- --runInBand
- npm run test:e2e -- --runInBand
- npm run build
- docker-compose up desperate_test ✓

## Coverage
Before: 45%
After: 68%

## Production Code Changes
None (or explain if bugs were fixed)

## Known Limitations
None
```

### Step 8 — Review and Merge

After opening the PR:

- CI will run automated checks
- Wait for human code review
- Address any feedback
- Human owner performs final merge (do not auto-merge)

## Anti-Patterns To Avoid

Do not:

- Open huge PRs (keep to one module per PR)
- Include unrelated refactors in coverage PRs
- Change API contracts just to make tests easier
- Weaken test assertions to make them pass
- Add shallow tests only to increase line coverage numbers
- Call real OpenAI APIs or external services in tests
- Skip final Docker/CI verification without explanation
- Commit API keys or secrets
- Remove or weaken authorization checks
- Move files or refactor code not related to testing
- Introduce new test frameworks without approval

## Example Task

### Issue: "Increase backend Jobs module test coverage"

**Step 1:** Pick this one issue

**Step 2:** Inspect:
- `backend/src/jobs/job.service.ts` — what does it do?
- `backend/src/jobs/job.controller.ts` — what endpoints exist?
- `backend/src/entities/job.entity.ts` — what fields?
- `backend/test/app.e2e-spec.ts` — what's already tested?

**Step 3:** List gaps:
- No unit tests for job creation validation
- No e2e test for pagination
- No e2e test for ownership check (user A cannot view user B's job)
- No test for job deletion

**Step 4:** Write tests:
- Unit tests for `job.service.ts` (create, validate, list)
- E2E tests for `POST /jobs`, `GET /jobs/:id`, `DELETE /jobs/:id`

**Step 5:** Run local tests:
```bash
npm run test
npm run test:cov
npm run test:e2e
```

**Step 6:** Run final verification:
```bash
npm run lint
npm run test:cov -- --runInBand
npm run test:e2e -- --runInBand
npm run build
docker-compose up desperate_test if available
```

**Step 7:** Open PR with coverage results and command results

**Step 8:** Wait for review and merge
