# Backend Safety Skill

## Architecture

The backend is a NestJS modular monolith.

Rules:

- Preserve the modular monolith structure
- Do not introduce microservices
- Do not introduce Kubernetes
- Do not perform large refactors
- Keep controllers thin (routing and validation only)
- Keep business logic in services
- Keep module boundaries clear
- Do not move files unless explicitly requested
- Each module should be independently testable

## API Contracts

API contracts are the interface between frontend and backend.

Rules:

- Do not change endpoint paths unless explicitly requested
- Do not rename request/response fields unless explicitly requested
- Do not remove fields from existing responses
- Do not change HTTP status codes unless fixing a confirmed bug
- Do not add required fields to existing endpoints without a migration plan
- If an API contract change is necessary, explain it clearly in the PR with:
  - what changed
  - why it was necessary
  - how frontend will adapt

## Authentication and Authorization

Rules:

- Preserve JWT-based authentication
- Protected routes must remain protected
- User-specific resources must enforce ownership checks
- Never expose password hashes
- Never expose API keys or secrets in responses
- Never trust userId from request body if authenticated user is available from JWT
- Always extract userId from the JWT token in protected routes:
  ```typescript
  @UseGuards(JwtAuthGuard)
  @Post()
  createJob(@Req() req) {
    const userId = req.user.id; // from JWT
    // NOT from req.body.userId
  }
  ```

## Database

Rules:

- Do not change entities casually
- Do not add migrations unless explicitly requested
- Be careful with cascade delete behavior
- Preserve existing relationships between entities
- Do not change database synchronization (synchronize flag) without approval
- Do not change TypeORM migration strategy without approval
- Test persistence behavior in e2e tests:
  - data is saved to database
  - deleted data is removed
  - cascade deletes work as expected

## OpenAI / AI Orchestrator

Rules:

- Do not call real OpenAI APIs in tests
- Mock OpenAI responses in all tests
- Preserve response validation and error handling
- Handle malformed or unexpected AI responses safely
- Do not expose OPENAI_API_KEY in logs or error messages
- Never log full API responses that might contain sensitive data

Example safe error handling:

```typescript
try {
  const analysis = await this.aiOrchestrator.analyzeJob(content);
  // validate structure
  if (!analysis.summary || !analysis.keywords) {
    throw new Error('Invalid AI response structure');
  }
  return analysis;
} catch (error) {
  // Log safely without exposing API details
  this.logger.error('AI analysis failed', { jobId });
  throw new BadRequestException('Analysis failed');
}
```

## Error Handling

Rules:

- Use clear NestJS exceptions (BadRequestException, UnauthorizedException, etc.)
- Do not swallow errors silently
- Log errors for debugging but do not leak sensitive details
- Return useful error messages to frontend without exposing internal details
- Do not expose stack traces in production responses
- Handle edge cases explicitly (null checks, validation, etc.)

## Test-Aware Backend Changes

During coverage tasks, production backend code should only change if a real bug is discovered.

### When Not To Change Production Code

Do not change production code just to make tests easier to write.

### When To Change Production Code

Only change production code if:
- A real bug is discovered while writing tests
- The bug prevents correct behavior
- The fix is necessary for the code to work properly

### If Production Code Must Change

When you discover and fix a bug during coverage work:

1. Add or update a test proving the bug exists
2. Explain the bug in the PR:
   - what incorrect behavior was found
   - why it's a bug
   - what test proves it
3. Explain why the fix was necessary
4. Keep the fix as small as possible
5. Run full backend verification before opening the PR

### Recommended Final Verification

Before marking coverage work complete or opening a PR:

From `backend/` directory:

- `npm run lint` — check code style
- `npm run test:cov -- --runInBand` — unit tests with coverage
- `npm run test:e2e -- --runInBand` — e2e tests
- `npm run build` — verify production build

From repo root:

- `docker-compose up desperate_test` — final Docker/CI-style verification

If Docker verification cannot be run, explain why in the PR.

## Module Structure

Current backend modules:

- `auth/` — JWT authentication, login/register
- `users/` — user profile and account
- `jobs/` — job creation, listing, analysis requests
- `analysis/` — job analysis results and storage
- `project-recommendation/` — recommended projects based on analysis
- `ai-orchestrator/` — OpenAI integration and response parsing
- `health/` — health check endpoint
- `common/` — shared constants, types, enums
- `entities/` — TypeORM entities (User, Job, Analysis, ProjectRecommendation)

Keep these boundaries clear. Do not add cross-module logic to controllers.

## What Not To Do

Do not:

- change entity schemas without approval
- introduce new ORM or database layers
- add microservices
- refactor module structure
- rename files or move code
- change authentication mechanism
- `docker-compose up desperate_test` — final Docker/CI-style verification if available
- expose secrets in logs
- weaken validation rules
- remove ownership checks
- silently fail on errors
