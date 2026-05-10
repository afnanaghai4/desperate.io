# AGENTS.md

## Project Summary

This is **desperate.io**, a full-stack AI-powered job/project recommendation platform with:

- **Frontend:** Next.js (React 19, TypeScript, Tailwind CSS)
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL with TypeORM
- **Containerization:** Docker Compose
- **CI/CD:** GitHub Actions
- **AI Integration:** OpenAI API
- **Authentication:** JWT-based

The app is already running with core user flows implemented, including job creation, analysis, and AI-powered project recommendations.

## Current Priority

**Test coverage only.**

Priority order for test implementation:

1. Backend Jobs module coverage
2. Backend Analysis module coverage
3. Backend Users/Profile coverage
4. Backend Project Recommendation coverage
5. Frontend tests for completed user flows
6. Coverage reporting and thresholds in CI

## Read First

Before making any changes, agents must read:

- `.ai/project-context.md` — overall architecture and context
- `.ai/agents/test-coverage-agent.md` — test coverage strategy
- `.ai/skills/testing-skill.md` — testing best practices
- `.ai/skills/backend-safety-skill.md` — backend safety rules
- `.ai/skills/pr-safety-skill.md` — PR safety requirements
- `.ai/workflows/coverage-workflow.md` — coverage workflow details

## Safety Rules

- **Do not push directly to main.** Always use feature branches and PRs.
- **Do not auto-merge PRs.** Manual review required.
- **Keep PRs small and focused.** One issue or task per PR.
- **Work on one issue or task at a time.** Avoid context switching.
- **Do not change API contracts unless explicitly requested.**
- **Do not redesign the UI unless explicitly requested.**
- **Do not introduce microservices.** Preserve the modular monolith.
- **Do not introduce Kubernetes.** Use Docker Compose only.
- **Do not add new infrastructure.** Work within existing limits.
- **Do not call the real OpenAI API in tests.** Mock all external services.
- **Mock external services in tests.** No real API calls.
- **Preserve the current modular monolith architecture.** Maintain separation by module, not by microservice.
- **Preserve existing test file placement conventions.** Follow the current structure strictly.
- **Do not commit secrets or real environment values.** Use `.env.example` and `.gitignore`.
- **If production code must change during a test task, explain why clearly.** Document in PR.

## Backend Test Placement

- **Unit tests:** Go beside the service/module under `backend/src/**/*.spec.ts`
- **E2E tests:** Go under `backend/test/**/*.e2e-spec.ts`
- **Shared E2E helpers:** Go under `backend/test/helpers/`

## E2E Testing Workflow

**Option 1 (Docker - Recommended for final verification and CI/CD parity):**
- Runs tests in an isolated container matching production environment
- Database (`desperate_db_test`) is created automatically
- Command: `docker-compose up desperate_test`

**Option 2 (Local - Recommended for fast development feedback):**
- Runs tests on your machine with PostgreSQL in Docker
- Faster feedback loop during development
- Setup: `docker-compose up postgres` (in one terminal)
- Command: `npm run test:e2e` (in backend/ directory in another terminal)
- First time only: `docker exec desperate_postgres createdb -U postgres desperate_db_test`

## Test Execution Strategy for Agents

Agents should use local commands for fast feedback while developing tests.

Before marking a task complete or opening a PR, agents must run the closest available CI/Docker-style verification.

For backend coverage tasks:

1. During development, agents may run:
   - `npm run test`
   - `npm run test:cov`
   - `npm run test:e2e`

2. Before PR completion, agents should run:
   - `npm run lint`
   - `npm run test:cov -- --runInBand`
   - `npm run test:e2e -- --runInBand`
   - `npm run build`

3. If the Docker test service is available, agents should also run:
   - `docker-compose up desperate_test`

4. If Docker verification cannot be run, the agent must state this clearly in the PR and explain why.

Rule:
Local tests are for development speed. Docker/CI-style verification is the final confidence check before PR review.

## Commands

### Backend

- **Lint:** `npm run lint` (backend/)
- **Unit tests:** `npm run test` (backend/)
- **Coverage:** `npm run test:cov` (backend/)
- **E2E tests (Option 1 - Docker):** `docker-compose up desperate_test`
- **E2E tests (Option 2 - Local):** `docker-compose up postgres` then `npm run test:e2e` (backend/)
- **Build:** `npm run build` (backend/)
- **Start (dev):** `npm run start:dev` (backend/)

### Frontend

- **Lint:** `npm run lint` (frontend/)
- **Type check:** `npm run type-check` (frontend/)
- **Build:** `npm run build` (frontend/)
- **Start (dev):** `npm run dev` (frontend/)
- **Tests:** Needs verification (no test script configured)

## PR Expectations

Every PR should include:

- **Linked issue** (if applicable)
- **Summary** — clear description of changes
- **Files changed** — list of modified files
- **Tests added** — new test files and coverage gained
- **Commands run** — what was executed locally
- **Coverage before/after** (if relevant) — coverage reports
- **Production code changes, if any** — explanation of why
- **Known limitations** — any caveats or follow-up work

## PR Review Focus

Review agents must check for:

- **Missing tests** — every feature should have test coverage
- **Fake or shallow coverage** — tests that don't actually exercise code
- **Auth/ownership bugs** — JWT validation, role checks, data isolation
- **Broken API contracts** — unintended changes to request/response shapes
- **Accidental UI redesign** — unplanned visual changes
- **Unnecessary refactors** — changes beyond the task scope
- **Real OpenAI calls in tests** — must be mocked
- **Committed secrets** — no API keys, tokens, or credentials
- **CI failures** — lint, test, or build failures
- **Database schema risks** — migrations without backward compatibility
