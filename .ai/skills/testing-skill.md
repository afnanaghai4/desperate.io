# Testing Skill

## Philosophy

Prefer meaningful coverage over high numbers.

Good tests should prove:

- business behavior works
- invalid input is rejected
- authorization boundaries are respected
- users cannot access each other's data
- database persistence works
- external services are mocked
- failures are handled safely

## Backend Unit Tests

Use backend unit tests for:

- service logic
- validation helper behavior
- response parsing
- error handling
- business rules

### Placement

Colocate with source files under `backend/src/**`, using `*.spec.ts` naming:

```text
backend/src/
  jobs/
    job.service.ts
    job.service.spec.ts      ← unit test here
  analysis/
    analysis.service.ts
    analysis.service.spec.ts  ← unit test here
```

### Dependencies

Mock these always:

- repositories (use `@nestjs/testing`)
- external services
- OpenAI API
- any network calls

Never use real services in unit tests.

## Backend E2E Tests

Use e2e tests for:

- real HTTP endpoint behavior
- JWT-protected routes
- request validation
- database persistence
- ownership checks
- deletion/cascade behavior
- pagination

### Placement

Place all e2e tests under `backend/test/`:

```text
backend/test/
  app.e2e-spec.ts          ← auth flow test
  jobs.e2e-spec.ts         ← job endpoints
  analysis.e2e-spec.ts     ← analysis endpoints
  helpers/
    test-request.ts        ← shared test utilities
    test-data.ts           ← shared fixtures
```

### Helpers

Shared setup and utilities should go under `backend/test/helpers/` for reuse across e2e test files.

## Local vs Docker Testing Strategy

Use both local tests and Docker/CI-style verification.

### Local Tests

Local tests are for fast development feedback:

- useful while writing and debugging tests
- good for unit tests and quick coverage checks
- faster than Docker-based tests
- from `backend/` directory:
  - `npm run test` — unit tests only
  - `npm run test:cov` — unit tests with coverage
  - `npm run test:e2e` — e2e tests (requires postgres running via `docker-compose up postgres`)

### Docker/CI-Style Tests

Docker/CI-style verification is the final check before PR review:

- must run before opening a PR
- especially important for e2e tests that depend on PostgreSQL
- matches CI behavior as closely as possible
- from `backend/` directory, run:
  - `npm run lint`
  - `npm run test:cov -- --runInBand`
  - `npm run test:e2e -- --runInBand`
  - `npm run build`
- from repo root, run:
  - `docker-compose up desperate_test`

**Rule:** Local tests are for development speed. Docker/CI-style verification is the final confidence check before PR review.

If Docker verification cannot be run, the PR must explain why.

## Frontend Tests

Use frontend tests for:

- user-visible behavior
- form submission behavior
- validation/error messages
- loading states
- empty states
- success states
- API error states

### What To Avoid

Do not:

- test Tailwind classes directly
- write brittle snapshot tests
- test implementation details
- test internal state instead of behavior

## External Services

Never call real external APIs in tests.

Always mock:

- OpenAI API
- any job-link scraping/fetching service if present
- any third-party network dependency

Example for OpenAI:

```typescript
jest.mock('../ai-orchestrator/ai-orchestrator.service', () => ({
  AiOrchestratorService: {
    analyzeJob: jest.fn().mockResolvedValue({
      summary: 'Test summary',
      keywords: ['test'],
    }),
  },
}));
```

## Coverage Priorities

Current priority order:

1. Backend Jobs module
2. Backend Analysis module
3. Backend Users/Profile module
4. Backend Project Recommendation module
5. Frontend job creation flow
6. Frontend analysis flow
7. Frontend recommendations
8. CI coverage reports and thresholds

## What Not To Do

Do not:

- change API contracts for the sake of tests
- redesign UI to make testing easier
- introduce new testing libraries without approval
- change database schema without approval
- write shallow tests just to raise coverage numbers
- hide failing behavior by weakening assertions
- skip final Docker verification without explaining why
- call real external APIs in tests
- commit tests that depend on real credentials or secrets
