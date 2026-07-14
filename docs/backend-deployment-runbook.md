# Backend Deployment Runbook

This runbook is intentionally sanitized. Do not add secrets, SSH key paths, public IPs, cloud account IDs, provider resource identifiers, or real environment values.

## Deployment Flow

Backend deployment is handled by GitHub Actions after the `CI` workflow completes successfully on `master`.

The deployment workflow:

1. Connects to the production server over SSH using GitHub Actions secrets.
2. Changes into the configured app directory.
3. Fetches and fast-forwards to the latest `master`.
4. Rebuilds and restarts the backend service with `docker compose`.
5. Runs a production health check against the backend from inside the server.

The production health check is:

```bash
curl --fail --silent --show-error http://127.0.0.1:4000/health
```

If the health check fails, the GitHub Actions deployment job fails and the deployment should be investigated before any further release work.

## Manual Rollback To Previous Known-Good Commit

Use this when a deployment reaches production but the backend is unhealthy or a production regression is confirmed.

SSH into the production server, then run:

```bash
cd "$EC2_APP_DIR"
git log --oneline -5
```

Identify the previous known-good commit, then roll back the checked-out code and restart the backend:

```bash
git checkout <previous-good-commit>
docker compose -f docker-compose.prod.yaml up -d --build backend
docker compose -f docker-compose.prod.yaml ps
curl --fail --silent --show-error http://127.0.0.1:4000/health
```

If the health check passes, production is back on the previous known-good commit.

## Restore Git State After Emergency Rollback

An emergency rollback leaves the server checked out at a detached commit. After the bad change is reverted or fixed on `master`, restore the server to normal tracking state:

```bash
cd "$EC2_APP_DIR"
git fetch origin master
git checkout master
git pull --ff-only origin master
docker compose -f docker-compose.prod.yaml up -d --build backend
curl --fail --silent --show-error http://127.0.0.1:4000/health
```

## Preferred Follow-Up For Bad Merged PRs

For a bad PR that was already merged, prefer a GitHub revert PR after the emergency rollback:

1. Revert the bad PR in GitHub.
2. Wait for CI to pass.
3. Merge the revert PR into `master`.
4. Let CD deploy the reverted `master`.
5. Confirm the backend health check passes.

This keeps the production server and `master` aligned.

## Limitations

- This rollback process assumes no destructive database migration was deployed.
- The current deployment rebuilds the backend image on the server instead of deploying immutable registry images.
- Future improvement: build and tag backend Docker images in CI, push them to a registry, and roll back by redeploying the previous image tag.
