# Docker Compose Explanation

This project uses Docker Compose to run the backend database stack and backend e2e test runner in a repeatable local environment.

The implementation is defined in `docker-compose.yaml`. It currently orchestrates:

- `postgres` - PostgreSQL 16 database
- `backend` - NestJS backend API
- `desperate_test` - backend e2e test runner

The frontend is not currently part of the Compose stack. It is expected to run locally from `frontend/` with `npm run dev`.

## Compose Services

### Postgres

```yaml
postgres:
  image: postgres:16
  container_name: desperate_postgres
  restart: unless-stopped
  ports:
    - "${POSTGRES_PORT}:5432"
  environment:
    POSTGRES_DB: ${POSTGRES_DB}
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

The `postgres` service uses the official `postgres:16` image. It exposes the container database port `5432` through a configurable host port from the root `.env` file.

Database configuration is also read from the root `.env` file:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`

The service stores database files in the named volume `postgres_data`. This keeps local database state across container restarts and avoids losing data every time the container is recreated.

The health check uses `pg_isready` to verify that Postgres is ready to accept connections. This matters because a database container can be "started" before the database process is actually ready.

### Backend

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: desperate_backend
  restart: unless-stopped
  ports:
    - "${BACKEND_PORT}:4000"
  env_file:
    - ./backend/.env
  depends_on:
    postgres:
      condition: service_healthy
```

The `backend` service builds the NestJS backend from `backend/Dockerfile`. It maps a configurable host port to container port `4000`, loads runtime variables from `backend/.env`, and waits for Postgres to pass its health check before starting.

The backend Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --quiet && npm cache clean --force

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
```

This image:

1. Uses Node.js 20 Alpine.
2. Sets `/app` as the working directory.
3. Copies only package files first so dependency installation can be cached.
4. Installs dependencies with `npm ci`.
5. Copies the backend source.
6. Builds the NestJS app.
7. Runs the compiled app with `npm run start:prod`.

The backend reads database settings through NestJS `ConfigModule` and TypeORM in `backend/src/app.module.ts`:

```ts
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: Number(configService.get<string>('DB_PORT')),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    synchronize: configService.get<string>('DB_SYNC') === 'true',
  }),
})
```

Inside Docker Compose, service names become DNS names. For that reason, a backend container should connect to the database with:

```env
DB_HOST=postgres
```

Using `DB_HOST=localhost` inside the backend container would point to the backend container itself, not the Postgres container.

### E2E Test Runner

```yaml
desperate_test:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: desperate_test
  restart: no
  env_file:
    - ./backend/.env.test
  environment:
    NODE_ENV: test
    DB_HOST: postgres
  command: npm run test:e2e
  depends_on:
    postgres:
      condition: service_healthy
```

The `desperate_test` service reuses the backend Docker image but overrides the command to run:

```bash
npm run test:e2e
```

It loads test-specific variables from `backend/.env.test`, forces `NODE_ENV=test`, and explicitly sets `DB_HOST=postgres` so the tests connect to the Compose database service.

This gives e2e tests a production-like runtime while still keeping them isolated from normal local application execution.

## Why This Approach Fits This Project

Docker Compose is a good fit because desperate.io is currently a modular monolith with a backend API, a PostgreSQL database, and backend e2e tests. The project does not need a full distributed platform to run locally or verify backend behavior.

The current approach provides:

- Reproducible local database setup.
- A consistent backend container build.
- Backend e2e tests against a real Postgres database.
- Simple service discovery through Compose service names.
- Persistent database storage through a named volume.
- Startup coordination through database health checks.
- Low infrastructure complexity.

This matches the current project rules: preserve the modular monolith, use Docker Compose, avoid Kubernetes, and avoid adding unnecessary infrastructure.

## Alternative Approaches

### Run Everything Manually

One option is to run Postgres, the backend, and the frontend manually:

```bash
docker-compose up postgres
cd backend
npm run start:dev
cd ../frontend
npm run dev
```

This is useful during development because backend and frontend hot reload are easy. The downside is that every developer's local Node.js/npm setup can drift, and it does not prove that the backend container builds and runs correctly.

### Dockerize Only Postgres

Another option is to use Docker only for Postgres and always run the backend locally. This is fast and convenient, but weaker for final verification because it skips the backend container runtime.

### Add The Frontend To Compose

The project could add a frontend service later:

```yaml
frontend:
  build:
    context: ./frontend
  ports:
    - "3000:3000"
  depends_on:
    - backend
```

That would require a `frontend/Dockerfile`, which does not currently exist. This can be useful for production-like local demos, but it is not necessary for the current backend/database/test workflow.

### Use Kubernetes

Kubernetes would model the same system with Deployments, Services, ConfigMaps, Secrets, PersistentVolumeClaims, readiness probes, and possibly an Ingress.

That would be excessive for this project right now. Kubernetes adds operational complexity that is not justified by a single backend service, a database, and a test runner. The project rules also explicitly say not to introduce Kubernetes.

### Use A Managed Database

A managed database such as RDS, Supabase, or Neon can be useful for staging or production. It is less ideal for local e2e testing because tests should be repeatable, isolated, and independent of shared external state.

### Use Testcontainers

Testcontainers could start PostgreSQL programmatically from Jest. That can be a clean testing pattern, but this repository already has a clear Docker Compose e2e workflow. Switching would add another infrastructure pattern without a clear need.

## Summary

The current Compose setup is intentionally practical. It gives the project a real PostgreSQL database, a production-built backend image, and a Docker-based e2e test runner without introducing more infrastructure than the application needs.

For this project stage, Docker Compose is the right level of orchestration: stronger and more reproducible than fully manual local setup, but much simpler than Kubernetes or cloud-managed development dependencies.
