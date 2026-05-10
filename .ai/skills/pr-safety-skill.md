# PR Safety Skill

## Branch Rules

Never work directly on `main` or `master`.

Always use a feature branch with a descriptive name.

### Branch Naming Examples

- `agent/test-jobs-coverage` — test coverage for jobs module
- `agent/test-analysis-coverage` — test coverage for analysis module
- `agent/test-users-profile-coverage` — test coverage for users/profile
- `agent/frontend-jobs-tests` — new frontend tests
- `agent/fix-auth-bug` — bugfix found during testing

## PR Size

Keep PRs small and focused.

One PR should cover:
- one issue, or
- one closely related task

### What Not To Mix

Avoid PRs that mix:

- tests and deployment/infrastructure
- backend and frontend unless explicitly required
- refactors and feature work
- documentation and large code changes
- multiple modules at once
- test coverage and new features

If your work spans multiple modules, open separate PRs for each.

## PR Description Template

Every PR must include:

```
## Issue
Closes #123 (if applicable)

## Summary
Brief description of what this PR adds or fixes.

## Files Changed
- backend/src/jobs/job.service.spec.ts — new unit tests
- backend/test/jobs.e2e-spec.ts — new e2e tests
- backend/src/jobs/job.service.ts — fixed bug (see below)

## Tests Added
- Unit tests for job creation with TEXT input
- Unit tests for job creation with LINK input
- E2E test for pagination
- E2E test for ownership check

## Commands Run
- npm run lint ✓
- npm run test ✓
- npm run test:cov ✓
- npm run test:e2e ✓
- npm run build ✓
- docker-compose up desperate_test ✓

## Coverage
- Before: 45%
- After: 68%

## Production Code Changes
None (or if changes were made, explain why)

## Known Limitations
None (or list any known issues)
```

## Test Reporting Requirements

For coverage-related PRs, explicitly state:

- which local test commands were run
- which Docker/CI-style commands were run
- whether `docker-compose up desperate_test` was executed
- if Docker verification was not run, explain why
- coverage metrics before/after if available

Example:

```
## Test Verification
### Local (Development)
- npm run test ✓
- npm run test:cov ✓
- npm run test:e2e ✓

### Docker/CI
- docker-compose up desperate_test ✓

Coverage: 45% → 68%
```

## Merge Rules

- Do not auto-merge
- Do not approve your own PR
- Wait for CI to pass
- Wait for human review
- Human owner performs the final merge

## Pre-Submit Checklist

Before marking work complete and opening a PR:

### Code Quality

- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] no unrelated files were changed
- [ ] no secrets or API keys in code/comments

### Tests

- [ ] meaningful test coverage was added
- [ ] no real OpenAI calls in tests
- [ ] no real external API calls in tests
- [ ] mocks are properly set up
- [ ] local tests pass: `npm run test` and `npm run test:e2e`

### Backend Verification

- [ ] `npm run lint` (backend/)
- [ ] `npm run test:cov -- --runInBand` (backend/)
- [ ] `npm run test:e2e -- --runInBand` (backend/)
- [ ] `npm run build` (backend/)
- [ ] `docker-compose up desperate_test` (repo root) if available

### API/Contract Safety

- [ ] no unexpected endpoint changes
- [ ] no unexpected response field removals
- [ ] no unexpected status code changes
- [ ] JWT auth still works
- [ ] ownership checks still work

### Documentation

- [ ] PR description is complete
- [ ] test verification results documented
- [ ] production code changes explained (if any)
- [ ] limitations noted

## Review Checklist

For review agents checking PRs, verify:

- [ ] CI passes
- [ ] tests are meaningful (not shallow coverage)
- [ ] no unrelated files changed
- [ ] no secrets committed
- [ ] no API contracts changed unexpectedly
- [ ] no UI redesign happened unexpectedly
- [ ] no real external API calls in tests
- [ ] production code changes are justified
- [ ] test verification is documented (local + Docker)
- [ ] known limitations are stated
- [ ] branch is not on main/master
- [ ] PR is focused and reasonable size
- [ ] all required commands were run before PR

## Common Issues To Catch

### Red Flags

- PR mixes test coverage with new features
- Docker verification was not run (without explanation)
- Real API keys or secrets in the code
- API contracts changed without explanation
- Tests added but local verification results not shown
- Unrelated files changed
- Large PRs covering multiple modules

### Questions To Ask

- What local tests were run?
- Was Docker verification run? If not, why not?
- Coverage before and after?
- Any production code changes? Why?
- Is this PR focused on one task?
- Could this be split into smaller PRs?

## Handling Coverage Tasks

For coverage-related PRs specifically:

### What Should Be Included

- new test files only
- minimal production code changes (bug fixes only)
- clear test verification (local + Docker results)
- coverage metrics

### What Should NOT Be Included

- new features (save for separate PR)
- refactoring (save for separate PR)
- UI changes (save for separate PR)
- large production code rewrites

### Approval Criteria

A coverage PR is ready to merge when:

1. ✓ Tests are meaningful (cover behavior, not just lines)
2. ✓ Coverage metrics improved
3. ✓ Local verification results shown
4. ✓ Docker verification run (or explained why not)
5. ✓ No unrelated changes
6. ✓ No secrets committed
7. ✓ No real API calls in tests
