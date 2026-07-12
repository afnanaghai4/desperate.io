# Desperate.io

Desperate.io is a full-stack AI-powered job and project recommendation platform for software, backend, and cloud engineering job seekers. Users can maintain a profile, save job opportunities, run job-fit analysis, and receive project recommendations tailored to the role.

## Tech Stack

### Backend

- **Runtime**: Node.js 20
- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16
- **ORM**: TypeORM 0.3
- **Authentication**: JWT token with Passport.js
- **AI Integration**: OpenAI API through the `ai-orchestrator` module
- **Testing**: Jest 30, Supertest, backend unit and e2e tests

### Frontend

- **Framework**: Next.js 16 with App Router
- **React**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **HTTP Client**: Custom fetch-based API client
- **Testing**: Vitest 2, Testing Library, jsdom

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: Docker Compose for PostgreSQL, backend, and backend e2e test runner
- **CI**: GitHub Actions for frontend lint/type-check/build and backend lint/coverage/e2e/build

## Project Structure

```text
desperate.io/
|-- .ai/                         # Agent context, skills, and workflows
|-- .github/workflows/ci.yml      # GitHub Actions CI
|-- backend/                      # NestJS backend
|   |-- src/
|   |   |-- ai-orchestrator/      # OpenAI integration and response validation
|   |   |-- analysis/             # Job analysis controller/service/link extraction
|   |   |-- auth/                 # Account access
|   |   |-- common/               # Shared enums and validation helpers
|   |   |-- entities/             # TypeORM entities
|   |   |-- health/               # Health endpoint
|   |   |-- jobs/                 # Job CRUD and input validation
|   |   |-- migrations/           # Existing TypeORM migrations
|   |   |-- project-recommendation/ # Placeholder module; persistence is via Analysis
|   |   |-- users/                # User/profile management
|   |   |-- app.module.ts
|   |   `-- main.ts
|   |-- test/                     # Backend e2e tests and helpers
|   |-- TESTING.md
|   `-- package.json
|-- frontend/                     # Next.js frontend
|   |-- app/                      # App Router pages, route groups, and layouts
|   |   |-- login/
|   |   |-- signup/
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- components/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   |-- homepage/
|   |   |-- job/
|   |   |-- layout/
|   |   |-- profile/
|   |   `-- ui/
|   |-- lib/                      # API clients and frontend utilities
|   |-- test/                     # Vitest setup and smoke test
|   |-- types/                    # Frontend TypeScript types
|   |-- vitest.config.ts
|   `-- package.json
|-- docker-compose.yaml
`-- README.md
```

## Implemented Features

- User registration, login, and logout
- User profile create/get/update
- Profile-completeness guided onboarding
- Job creation from text or link
- Job listing with pagination
- Job detail and deletion
- AI job-fit analysis through OpenAI
- Re-analysis support for saved analyses
- Project recommendations stored with analysis results
- Backend e2e coverage for health, jobs, analysis, profile, and account flows
- Frontend Vitest coverage for jobs, dashboard, profile, and account components

## Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose
- PostgreSQL 16, either through Docker Compose or a local installation
- OpenAI access for running live analysis features

## Application Areas

- **Account and Profile**: onboarding and profile data management
- **Jobs**: create, list, inspect, and delete saved job opportunities
- **Analysis**: evaluate job fit and persist analysis results
- **Recommendations**: store project ideas generated from analysis results
- **Health**: lightweight backend health check

## Environment

Create local environment files from the available examples and configure values for your machine. Use placeholders like `your_password` and `your_api_key`; do not use real values in documentation.

Backend `.env` format:

```env
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=desperate_db
DB_SYNC=true
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=your_model
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

Backend `.env.test` format:

```env
PORT=4000
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=desperate_db_test
DB_SYNC=true
JWT_SECRET=your_test_jwt_secret
JWT_EXPIRES_IN=1d
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=your_model
GOOGLE_CLIENT_ID=your_test_google_client_id
GOOGLE_CLIENT_SECRET=your_test_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

Frontend `.env.local` format:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Docker Compose also reads root-level variables for PostgreSQL and backend port configuration.

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd desperate.io
```

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create frontend environment configuration:

```bash
cd ..
cp frontend/.env.example frontend/.env.local
```

Create backend environment configuration in `backend/.env` using your local database and AI provider values. The test environment shape is available in `backend/.env.test.example`.

## Running Locally

Start PostgreSQL with Docker Compose from the repo root:

```bash
docker-compose up postgres
```

Start the backend:

```bash
cd backend
npm run start:dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

## Frontend Development

From `frontend/`:

```bash
# Start the development server
npm run dev

# Run linting
npm run lint

# Run TypeScript checks
npm run type-check

# Run frontend tests
npm run test

# Build for production
npm run build

# Start the production build
npm run start
```

## Docker

The current `docker-compose.yaml` defines:

- `postgres` - PostgreSQL 16
- `backend` - NestJS backend
- `desperate_test` - backend e2e test runner

It does not currently define a frontend service.

Run backend plus PostgreSQL:

```bash
docker-compose up --build backend
```

Run Docker-based backend e2e verification:

```bash
docker-compose up desperate_test
```

Stop services:

```bash
docker-compose down
```

## Testing

### Backend

From `backend/`:

```bash
npm run lint
npm run test
npm run test:cov
npm run test:e2e
npm run build
```

For final backend verification before review:

```bash
npm run lint
npm run test:cov -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

Backend unit tests live under `backend/src/**/*.spec.ts`. Backend e2e tests live under `backend/test/**/*.e2e-spec.ts`.

Current backend coverage includes account flows, job management, analysis persistence, profile operations, and validation helpers.

### Frontend

From `frontend/`:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

Frontend tests use Vitest with jsdom and Testing Library. Current coverage includes account forms, job flows, dashboard widgets, profile setup, and profile-completeness utilities.

## CI

GitHub Actions currently runs:

- Frontend: `npm ci`, `npm run lint`, `npm run type-check`, `npm run build`
- Backend: `npm ci`, `npm run lint`, `npm run test:cov -- --runInBand`, Codecov upload, `npm run test:e2e -- --runInBand`, `npm run build`

Known CI gaps:

- Frontend Vitest tests exist but are not currently run in CI.
- Backend coverage is reported, but repository-level coverage thresholds are not enforced.

## Current Test-Coverage Priorities

The project is in a coverage-hardening phase. Current priorities are reviewing coverage output, filling meaningful backend and frontend gaps, adding frontend test execution to CI, and defining practical coverage thresholds.

## Database and Migrations

TypeORM entities are defined in `backend/src/entities/`. Migration files exist in `backend/src/migrations/`:

- `1724000001000-AddAnalysisMetadataColumns.ts`
- `1724000002000-AddFullResponseColumn.ts`
- `1725000003000-AddExtractedKeywordsColumn.ts`
- `1726000004000-AddProjectRecommendationColumns.ts`

The current `backend/package.json` does not define convenience npm scripts such as `migration:run`, `migration:generate`, or `migration:revert`. Add explicit scripts or use TypeORM CLI commands deliberately if migration execution/generation work is required.

## Development Rules

- Do not push directly to `main` or `master`.
- Keep PRs small and focused.
- Do not change API contracts unless explicitly requested.
- Do not redesign the UI unless explicitly requested.
- Preserve the NestJS modular monolith.
- Do not introduce microservices, Kubernetes, or new infrastructure.
- During coverage tasks, avoid production code changes unless a real bug is found and covered by a test.

## Code Quality

The project uses ESLint, Prettier, TypeScript, Jest, and Vitest for code quality and test coverage.

Recommended checks before opening a PR:

```bash
# Backend
cd backend
npm run lint
npm run test
npm run build

# Frontend
cd ../frontend
npm run lint
npm run type-check
npm run test
npm run build
```

## Performance Considerations

- Backend APIs use pagination for job lists.
- Database entities and relationships are structured for user-scoped job, analysis, and recommendation data.
- Frontend pages use the Next.js App Router with component-level organization.
- AI analysis results are persisted so previously generated analysis can be reused or re-analyzed.

## Troubleshooting

### Database Connection Issues

- Confirm PostgreSQL is running.
- Check backend database variables.
- For local e2e, ensure the test database exists if running outside Docker.

### Port Already in Use

- Backend: change `PORT` in the backend environment file.
- Frontend: run Next.js on another port, for example `npm run dev -- --port 3001`.
- PostgreSQL: change the Docker Compose PostgreSQL port variable or stop the conflicting local database process.

### OpenAI Errors

- Confirm your OpenAI configuration is present for real analysis runs.
- Confirm the selected model is available for your account.
- Check usage limits if analysis requests fail unexpectedly.
- Tests should use mocked OpenAI behavior.

### Missing Environment Variables

- Create `backend/.env` for local backend runs.
- Create `backend/.env.test` for local backend e2e tests.
- Create `frontend/.env.local` from `frontend/.env.example`.
- Use the formats in the Environment section and replace placeholders such as `your_password` and `your_api_key`.

## License

UNLICENSED
