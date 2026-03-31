# Testing Guide

## Unit Tests

Run unit tests locally:
```bash
npm test
```

Run unit tests in watch mode:
```bash
npm run test:watch
```

Run unit tests with coverage:
```bash
npm run test:cov
```

## E2E Tests

### Option 1: Run in Docker (Recommended for Production-like Testing)

This approach runs tests in an isolated Docker container, similar to production CI/CD pipelines:

```bash
docker-compose up desperate_test
```

The `desperate_test` container:
- Uses `.env.test` for configuration
- Connects to the shared PostgreSQL container
- Runs `npm run test:e2e` automatically
- Cleans up after completion

### Option 2: Run Locally

Make sure Docker and PostgreSQL are running:

```bash
docker-compose up postgres
```

Then run tests from your machine:

```bash
npm run test:e2e
```

## Environment Files

- **`.env`** - Production/development configuration (for docker-compose backend service)
- **`.env.test`** - Test configuration (used by desperate_test container and local e2e tests)
- **`.env.example`** - Example for developers (safe to commit)
- **`.env.test.example`** - Example for test environment (safe to commit)

## Notes

- Do NOT commit `.env` or `.env.test` files
- Always keep `.example` files up to date
- E2E tests share the PostgreSQL database with the backend service
- Use unique test data to avoid conflicts between test runs
