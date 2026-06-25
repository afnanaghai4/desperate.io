# PR Review Workflow

## Goal

Run a manual Codex PR Review Agent after a pull request is created, so the PR gets a focused quality check before human review.

## When To Use

Use this workflow after creating or substantially updating a PR when the user asks for a review sub-agent, extra PR review, or agent-driven review pass.

Do not use this workflow as a replacement for human review.

## Workflow

### Step 1 - Create Or Update The PR

The main agent creates or updates the PR with:

- linked issue, if applicable
- summary
- files changed
- tests added
- commands run
- production code changes, if any
- known limitations

### Step 2 - Spawn The Review Agent

Spawn a sub-agent with the PR Review Agent instructions and provide:

- PR number and URL
- source branch and base branch
- linked issue
- PR title and body
- changed files or diff summary
- commands run
- known limitations
- user constraints or project rules that matter

The review agent reports findings in the current Codex session first.

### Step 3 - Triage Findings

The main agent reviews each finding:

- Fix valid blocking findings before handing off for human review.
- Fix non-blocking findings when they are small and clearly in scope.
- Skip findings that are not valid or out of scope, with a short reason.
- Avoid broad refactors unless they are required to fix a concrete bug.

### Step 4 - Verify Changes

Run the smallest relevant checks for any fixes, then run broader checks when the PR scope requires them.

For backend coverage work, prefer:

- `npm run lint`
- `npm run test:cov -- --runInBand`
- `npm run test:e2e -- --runInBand`
- `npm run build`

For frontend work, prefer:

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run build`

If Docker verification cannot be run, document why.

### Step 5 - Optional GitHub Summary

Post a GitHub PR comment only when useful:

- findings were found
- fixes were pushed
- the user asked for an audit trail

The comment should summarize:

- findings addressed
- findings skipped and why
- commands run after the review pass

## Output Expectations

The final handoff should include:

- PR link
- whether the review agent found issues
- what was fixed
- what was skipped
- verification commands and results
- any remaining risk

## Boundaries

The PR Review Agent does not approve, merge, or replace human review. It is a pre-review quality gate for agent-created PRs.
