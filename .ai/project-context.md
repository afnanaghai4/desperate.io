# Project Context — desperate.io

## 1. Project Purpose

**Desperate.io** is a full-stack web application that helps job seekers in Germany enhance their relevance for software, backend, and cloud engineering positions. The platform uses AI-driven analysis to provide intelligent job fit assessments and personalized project recommendations.

Key functionality:
- User authentication and profile management
- Job listing input (text or URL)
- AI-powered job analysis using OpenAI API
- Interview chance percentage estimation
- Personalized project recommendations based on job requirements
- Keyword extraction and matching (job vs. user profile)

## 2. Current Tech Stack

### Frontend
- **Framework**: Next.js 16.2.3 (with App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Library**: Lucide React (^1.7.0) for icons
- **React**: 19.2.4
- **React DOM**: 19.2.4
- **HTTP Client**: Custom fetch-based `apiFetch` utility with credentials support

### Backend
- **Framework**: NestJS 11 (Node.js)
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16
- **ORM**: TypeORM 0.3.28
- **Authentication**: JWT with Passport.js (HTTP-only cookie storage in production)
- **Password Hashing**: bcrypt
- **AI Integration**: OpenAI API (v6.34.0)
- **Validation**: class-validator, class-transformer
- **Testing**: Jest 30, Supertest 7 for e2e

### Infrastructure
- **Containerization**: Docker (Node.js 20 Alpine base)
- **Orchestration**: Docker Compose (backend, frontend, PostgreSQL, test container)
- **CI/CD**: GitHub Actions

## 3. Repository Structure

```
desperate.io/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── .ai/
│   ├── project-context.md      # This file
│   ├── agents/
│   ├── skills/
│   └── workflows/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── auth/               # JWT authentication
│   │   ├── users/              # User management & profiles
│   │   ├── jobs/               # Job CRUD operations
│   │   ├── analysis/           # Job analysis service
│   │   ├── project-recommendation/  # Recommendation generation
│   │   ├── ai-orchestrator/    # OpenAI API integration
│   │   ├── health/             # Health check endpoint
│   │   ├── entities/           # TypeORM entities
│   │   ├── common/             # Enums, constants, types
│   │   └── migrations/         # Database migrations
│   ├── test/                   # E2E tests
│   │   ├── helpers/            # E2E test utilities
│   │   └── app.e2e-spec.ts
│   ├── coverage/               # Test coverage reports
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig*.json
├── frontend/                   # Next.js frontend application
│   ├── app/                    # App router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── dashboard/         # Dashboard page
│   │   ├── jobs/              # Job management pages
│   │   ├── login/             # Login page
│   │   ├── signup/            # Registration page
│   │   └── profile/           # User profile page
│   ├── components/            # Reusable React components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── job/
│   │   ├── layout/
│   │   ├── profile/
│   │   └── ui/
│   ├── lib/                   # API clients and utilities
│   │   ├── api.ts            # Base API fetch utility
│   │   ├── auth-api.ts       # Auth endpoints
│   │   ├── job-api.ts        # Job endpoints
│   │   └── users-api.ts      # User/profile endpoints
│   ├── types/                # TypeScript type definitions
│   │   ├── job.ts
│   │   └── job-analysis.ts
│   ├── public/               # Static assets
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yaml        # Multi-service orchestration
├── README.md
└── .gitignore
```

## 4. Backend Architecture

### NestJS Modules

The backend is organized as a modular monolith using NestJS best practices:

**Core Modules:**

1. **AuthModule** (`auth/`)
   - Handles user registration, login, logout
   - JWT strategy and validation
   - HTTP-only cookie management
   - Protected by `JwtAuthGuard`
   - Services: `AuthService`
   - Controllers: `AuthController`

2. **UsersModule** (`users/`)
   - User profile CRUD operations
   - User data retrieval
   - Services: `UsersService`
   - Controllers: `UsersController`

3. **JobModule** (`jobs/`)
   - Job creation (from text or URL)
   - Job listing with pagination
   - Job retrieval by ID
   - Job deletion
   - Services: `JobService`
   - Controllers: `JobController`
   - DTOs: `CreateJobDto`, `GetJobsQueryDto`
   - Pipes: `ValidateJobInputPipe`

4. **AnalysisModule** (`analysis/`)
   - AI job analysis orchestration
   - Analysis persistence to database
   - Analysis retrieval
   - Services: `AnalysisService`
   - Controllers: `AnalysisController`

5. **ProjectRecommendationModule** (`project-recommendation/`)
   - Project recommendation storage and retrieval
   - Services: `ProjectRecommendationService` (exists; may be used internally or for future features)
   - Controllers: `ProjectRecommendationController` (currently has no exposed endpoints)

6. **AiOrchestratorModule** (`ai-orchestrator/`)
   - OpenAI API integration
   - Job fit analysis
   - Response parsing and validation
   - Services: `AiOrchestratorService`

7. **HealthModule** (`health/`)
   - Health check endpoint
   - Services: `HealthService`
   - Controllers: `HealthController`

**Common Utilities:**

- `common/enums/`: `UserRole`, `InputType`, `DifficultyLevel`
- `common/constants/`: Shared constants
- `common/types/`: Shared TypeScript types

**Database:**
- Uses TypeORM with PostgreSQL
- Database synchronization on startup (configurable via `DB_SYNC`)
- Migrations system in place

## 5. Frontend Architecture

### Next.js App Router Structure

**Pages (under `/app`):**

1. **`page.tsx`** (Homepage)
   - Landing/homepage content
   - Uses `Homepage` component from `components/homepage/`

2. **`dashboard/`** (Dashboard)
   - User dashboard

3. **`jobs/`** (Job Management)
   - `page.tsx` - Job listing page (with pagination)
   - `create/page.tsx` - Job creation form
   - `[id]/page.tsx` - Job detail and analysis page

4. **`login/page.tsx`** (Authentication)
   - Login form

5. **`signup/page.tsx`** (Authentication)
   - Registration form

6. **`profile/page.tsx`** (User Profile)
   - View and edit user profile
   - Personal info and professional experience

7. **`profile/setup/page.tsx`** (Profile Setup)
   - Profile onboarding/setup flow (separate from main profile view)

### Frontend Route Protection

- Protected App Router routes are wrapped by `frontend/app/(protected)/layout.tsx`, which renders `ProtectedShell`.
- Profile setup is wrapped by `frontend/app/(auth-only)/profile/setup/layout.tsx`, which renders `ProtectedShell` with `requireProfile={false}` and `showNavbar={false}`.
- `ProtectedShell` is the active frontend route/profile guard. It checks authentication through `checkAuth()` and, when `requireProfile` is enabled, verifies profile existence through `getProfile()`.
- `ProfileGuard` is currently redundant because it is defined but not imported or rendered by the current app route structure.
- Client-side route guards provide user-flow routing only; backend JWT guards remain the security boundary for API access.

### Component Organization

- **`components/auth/`**: Login, signup, auth-related components
- **`components/dashboard/`**: Dashboard UI components
- **`components/job/`**: Job listing, detail, creation components
- **`components/layout/`**: Navigation, header, footer
- **`components/profile/`**: Profile display and edit components
- **`components/ui/`**: Reusable UI primitives

### API Integration

API clients are organized by domain in `lib/`:

- **`api.ts`**: Base `apiFetch()` utility
  - Centralizes request/response handling
  - Sends credentials (HTTP-only cookies) with `credentials: 'include'`
  - Parses JSON responses and extracts error messages from backend response (`response.message` or `response.error`)
- **`auth-api.ts`**: Login, signup, logout endpoints
- **`job-api.ts`**: Job CRUD and analysis endpoints
- **`users-api.ts`**: User profile endpoints

**Authentication Approach:**
- HTTP-only cookies for JWT storage (set by backend)
- Credentials are automatically sent with all requests via `credentials: 'include'`
- In dev/test, token is also returned in response body for convenience

**JWT Extraction** (in backend `jwt.strategy.ts`):
- Primary: Extract from HTTP-only cookie (`accessToken` cookie)
- Fallback: Extract from `Authorization: Bearer <token>` header
- This dual strategy supports both browser cookies and API clients (mobile apps, Postman, etc.)

### Type Definitions

- **`types/job.ts`**: Job type definition and InputType union
- **`types/job-analysis.ts`**: Analysis response types

### Layout

- Root layout in `layout.tsx` with global styles and provider setup
- Global CSS in `globals.css` (Tailwind-based)

## 6. Main User Flows Implemented

Based on the code, these complete flows are implemented:

### User Authentication Flow
1. **Signup** → `POST /auth/register` with username, email, password
2. **Login** → `POST /auth/login` with email, password → HTTP-only cookie set
3. **Profile Check** → `GET /auth/me` (protected) → returns user email
4. **Logout** → `POST /auth/logout` → clears HTTP-only cookie

### User Profile Flow
1. **Get Profile** → `GET /users/profile` (protected) → returns user profile details
2. **Create Profile** → `POST /users/profile` (protected) with profile data
3. **Update Profile** → `PATCH /users/profile` (protected) with updated profile data

### Protected Frontend Navigation
1. **Protected route access** → `(protected)` layout renders `ProtectedShell`
2. **Authentication check** → `ProtectedShell` calls `checkAuth()`
3. **Profile requirement check** → protected routes call `getProfile()` when `requireProfile` is enabled
4. **Incomplete profile routing** → users without a complete profile are routed to `/profile/setup`
5. **Profile setup access** → profile setup uses `ProtectedShell requireProfile={false}` so authenticated users can complete onboarding

### Job Management Flow
1. **Create Job** → `POST /jobs` (protected) with job text or link
2. **List Jobs** → `GET /jobs?skip=0&take=10` (protected) with pagination
3. **Get Job Detail** → `GET /jobs/:id` (protected) → returns job + cached analysis if exists
4. **Delete Job** → `DELETE /jobs/:id` (protected)

### Job Analysis Flow
1. **Request Analysis** → `POST /analysis/analyze-fit` (protected) with jobId
2. **AI Processing** → OpenAI API call with user profile + job description
3. **Parse Response** → Structured analysis with strengths, weaknesses, percentage, keywords
4. **Save to Database** → Analysis + project recommendations persisted
5. **Return to Frontend** → Analysis displayed on job detail page

### Project Recommendations
- Generated automatically during job analysis
- Stored in database linked to analysis
- Returned as part of job analysis response

## 7. Backend API Surface

### Auth Endpoints (`/auth`)

| Method | Path | Controller | Auth | Purpose |
|--------|------|-----------|------|---------|
| POST | `/auth/register` | AuthController | None | Register new user |
| POST | `/auth/login` | AuthController | None | User login, sets HTTP-only cookie |
| GET | `/auth/me` | AuthController | JWT | Get authenticated user info |
| POST | `/auth/logout` | AuthController | None | Logout, clear cookie |

### Jobs Endpoints (`/jobs`)

| Method | Path | Controller | Auth | Purpose |
|--------|------|-----------|------|---------|
| POST | `/jobs` | JobController | JWT | Create job |
| GET | `/jobs` | JobController | JWT | List user's jobs (paginated) |
| GET | `/jobs/:id` | JobController | JWT | Get job detail + analysis if exists |
| DELETE | `/jobs/:id` | JobController | JWT | Delete job |

### Analysis Endpoints (`/analysis`)

| Method | Path | Controller | Auth | Purpose |
|--------|------|-----------|------|---------|
| POST | `/analysis/analyze-fit` | AnalysisController | JWT | Request AI job analysis |

### Users Endpoints (`/users`)

| Method | Path | Controller | Auth | Purpose |
|--------|------|-----------|------|---------|
| GET | `/users/profile` | UsersController | JWT | Get user profile |
| PATCH | `/users/profile` | UsersController | JWT | Update user profile |
| POST | `/users/profile` | UsersController | JWT | Create user profile |

### Health Endpoints

| Method | Path | Controller | Auth | Purpose |
|--------|------|-----------|------|---------|
| GET | `/health` | HealthController | None | Health check |

**Note**: `HealthController` in `HealthModule` is the single owner of the `/health` endpoint. Duplicate route definition has been removed from `AppController`.
- `email` (string, unique)
- `passwordHash` (string, not selected by default)
- `role` (enum: UserRole, default: USER)
- `profileDetails` (JSONB, nullable)
- `createdAt` (timestamp)
- **Relationships**: OneToMany → Job

**Job** (`jobs` table)
- `jobId` (PK, auto-increment)
- `userId` (FK → User, cascade delete)
- `inputType` (enum: TEXT | LINK)
- `jobTitle` (string, nullable)
- `jobText` (text, nullable)
- `jobLink` (string, nullable)
- `companyName` (string, nullable)
- `createdAt` (timestamp)
- **Constraints**: CHECK constraint ensures either jobText or jobLink is set (not both)
- **Relationships**: ManyToOne → User, OneToOne → Analysis

**Analysis** (`analyses` table)
- `analysisId` (PK, auto-increment)
- `jobId` (FK → Job, unique, cascade delete)
- `jobTitle` (string)
- `companyName` (string, nullable)
- `strongPoints` (JSONB array)
- `weakPoints` (JSONB array)
- `roleDirection` (string, nullable)
- `skills` (JSONB array)
- `tools` (JSONB array)
- `cloudPlatforms` (JSONB array)
- `databases` (JSONB array)
- `frameworks` (JSONB array)
- `baselineInterviewChancePercent` (float)
- `seniority` (string, nullable)
- `domain` (string, nullable)
- `extractedKeywords` (JSONB, nullable) - contains jobKeywords, profileKeywords, matchedKeywords
- `createdAt` (timestamp)
- **Relationships**: OneToOne → Job, OneToMany → ProjectRecommendation (cascade delete)

**ProjectRecommendation** (`project_recommendations` table)
- `recommendationId` (PK, auto-increment)
- `analysisId` (FK → Analysis, cascade delete)
- `title` (string)
- `description` (text)
- `difficultyLevel` (enum: DifficultyLevel)
- `timeline` (string)
- `techStack` (JSONB array)
- `skills` (JSONB array)
- `milestones` (JSONB array of {week, tasks[], deliverable})
- `cvPoints` (JSONB array)
- `improvedInterviewChancePercent` (float)
- `displayOrder` (integer)
- **Relationships**: ManyToOne → Analysis (cascade delete)

### Database Migrations

Located in `backend/src/migrations/`:
1. `1724000001000-AddAnalysisMetadataColumns.ts` - Initial analysis columns
2. `1724000002000-AddFullResponseColumn.ts` - Full response storage
3. `1725000003000-AddExtractedKeywordsColumn.ts` - Keyword extraction
4. `1726000004000-AddProjectRecommendationColumns.ts` - Recommendation data

## 9. Testing Structure

### Unit Tests

- **Location**: Colocated beside services under `backend/src/**/*.spec.ts`
- **Test Runner**: Jest 30
- **Existing Tests**:
  - `backend/src/app.controller.spec.ts` - Health endpoint test
  - `backend/src/auth/auth.service.spec.ts` - Auth service unit tests (mocking bcrypt, JWT)

**Configuration** (Jest in `backend/package.json`):
- Root dir: `src/`
- Test regex: `.*\.spec\.ts$`
- Coverage directory: `../coverage`
- Environment: Node.js
- Module transformer: ts-jest

### E2E Tests

- **Location**: `backend/test/`
- **Main File**: `backend/test/app.e2e-spec.ts`
- **Test Utilities**: `backend/test/helpers/test-request.ts`

**Configuration** (E2E in `backend/test/jest-e2e.json`):
- Test regex: `.e2e-spec.ts$`
- Module aliasing for src imports

**E2E Test Coverage** (currently):
- Auth registration flow
- Auth login flow
- Auth protected endpoint (`/auth/me`)
- Health endpoint
- Uses test agent that maintains cookies across requests

### Test Execution

**Unit Tests:**
```bash
npm test              # Run once
npm run test:watch   # Watch mode
npm run test:cov     # With coverage
```

**E2E Tests:**
```bash
docker-compose up desperate_test  # In Docker
npm run test:e2e                 # Locally (requires postgres running)
```

**Environment Variables:**
- `.env` - Production/dev config
- `.env.test` - Test config (do not commit)
- `.env.example` - Safe template for .env
- `.env.test.example` - Safe template for .env.test

### Test Database

- Shares PostgreSQL container with backend
- Uses `.env.test` configuration
- E2E tests use unique timestamps in test data to avoid conflicts

### Coverage

- Coverage reports generated in `backend/coverage/`
- Includes `lcov.info`, `coverage-final.json`, and HTML report
- Currently collected from test runs

## 10. CI/CD and Docker

### Docker Setup

**Services** (in `docker-compose.yaml`):

1. **postgres** - PostgreSQL 16
   - Container: `desperate_postgres`
   - Port: 5432 (configurable via POSTGRES_PORT)
   - Volumes: `postgres_data` for persistence
   - Health check enabled

2. **backend** - NestJS Application
   - Container: `desperate_backend`
   - Build: `./backend/Dockerfile`
   - Port: 4000 (configurable via BACKEND_PORT)
   - Depends on: postgres health check

3. **desperate_test** - E2E Test Runner
   - Build: Same as backend
   - Runs: `npm run test:e2e`
   - Depends on: postgres health check
   - Restarts: no (exits after tests)

**Dockerfile** (backend):
- Base: `node:20-alpine`
- Workdir: `/app`
- Caches: npm dependencies before code copy
- Build: `npm run build` (NestJS compilation)
- Entrypoint: `npm run start:prod`

### GitHub Actions CI

**Workflow** (`.github/workflows/ci.yml`):

**Triggers:** Pull requests and pushes to `master` branch

**Dependencies:**
- `CODECOV_TOKEN` GitHub secret must be set for Codecov upload step to succeed (if used)

**Jobs:**

1. **Frontend CI** (`frontend-ci`)
   - Node.js 20
   - Steps:
     - Install dependencies (`npm ci`)
     - Lint (`npm run lint`)
     - Type check (`npm run type-check`)
     - Build (`npm run build`)

2. **Backend CI** (`backend-ci`)
   - Node.js 20
   - PostgreSQL 16 service (test database)
   - Steps:
     - Install dependencies (`npm ci`)
     - Lint (`npm run lint`)
     - Coverage report: `npm run test:cov -- --runInBand` (generates lcov.info)
     - Unit tests execution: Commented out as separate step (`# npm run test -- --runInBand`), but may be included in coverage command
     - E2E tests: `npm run test:e2e -- --runInBand` (runs after coverage)
     - Codecov upload: Requires `CODECOV_TOKEN` GitHub secret; `fail_ci_if_error: true` means CI fails if upload fails
     - Build: `npm run build` (final step, validates TypeScript compilation)

**CI Environment Variables** (for backend tests):
- `NODE_ENV=test`
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=desperate_test`
- `DB_SYNC=true`
- `JWT_SECRET=super_secret_jwt_key_change_this`
- `JWT_EXPIRES_IN=1d`

## 11. Current Project Stage

The application is in **running/stabilization stage** with core features implemented:

**Completed:**
- User authentication (registration, login, JWT)
- User profile management
- Job CRUD operations with pagination
- AI job analysis integration with OpenAI
- Project recommendations generation
- Database schema with migrations
- Docker containerization
- GitHub Actions CI pipeline
- E2E test setup for auth flows
- Basic unit tests for auth service

**Current Priorities (based on code analysis):**
- Test coverage is minimal (mainly auth tests; jobs, analysis, users modules lack tests)
- Backend unit tests should be expanded across all modules
- Frontend testing is not yet set up
- Coverage thresholds not configured in CI
- Deployment documentation appears incomplete

**Observations:**
- The modular architecture is clean and follows NestJS best practices
- Database design is well-structured with proper relationships
- OpenAI integration is abstracted in ai-orchestrator module
- Frontend and backend communication uses secure HTTP-only cookies
- CI/CD foundation exists but needs coverage enforcement

## 12. Current Priorities for AI Agents

Safe, focused priorities for future development:

**Immediate (High Impact):**
1. **Expand backend unit test coverage** - Jobs, analysis, users services lack tests (auth has some coverage)
2. **Add jobs module tests** - Create, list, delete operations
3. **Add analysis service tests** - Mocking OpenAI API responses, database persistence
4. **Add users module tests** - Profile CRUD operations

**Near Term:**
5. **Configure coverage thresholds in CI** - Fail builds below threshold; currently coverage is collected but not enforced
6. **Improve E2E test coverage** - Jobs creation/deletion, analysis flow, profile management
7. **Add project-recommendation tests** - Entity and service tests
8. **Add frontend component tests** - Test key user flow components

**Future:**
9. **Add database migration tests** - Verify migrations run correctly
10. **Prepare production deployment docs** - Environment setup, secrets management, scaling

## 13. Safety Rules for AI Agents

- **Do not push directly to main.** Always create feature branches.
- **Do not auto-merge PRs.** Require manual review.
- **Keep PRs small and focused.** One concern per PR.
- **Do not change API contracts unless explicitly requested.** Maintain backward compatibility.
- **Do not redesign the UI unless explicitly requested.** Keep existing component structure.
- **Do not introduce microservices yet.** Preserve the current modular monolith architecture.
- **Do not introduce Kubernetes.** Keep Docker Compose as the orchestration strategy.
- **Do not add new infrastructure unless explicitly requested.** Use existing services (postgres, docker-compose).
- **Do not call the real OpenAI API in tests.** Always mock external API calls.
- **Mock external services in tests.** Jest mocks or test doubles for all external dependencies.
- **Preserve the current modular monolith architecture.** Keep backend as single NestJS app.
- **Preserve the existing test file placement conventions.** Unit tests colocated, e2e in `/test`.
- **Do not commit secrets or real environment values.** Use `.example` files only.
- **If production code must change during a test task, explain why clearly.** Justify any changes to non-test files.

## 14. Open Questions / Needs Verification

1. **Frontend test setup** - No frontend tests are configured; is this intentional?
2. **Coverage thresholds** - Are there minimum coverage percentage requirements?
3. **E2E test database cleanup** - How is test data cleaned between test runs?
4. **Deployment readiness** - Are there production deployment docs or secrets management strategy?
5. **OpenAI API costs** - Is cost monitoring in place for API usage?
6. **User data retention** - Are there data retention/deletion policies for user jobs and analyses?
7. **Load testing** - Has the system been tested under load?
8. **SSL/TLS configuration** - How is production SSL/TLS configured?
9. **Database backup strategy** - What is the backup and restore procedure?
10. **Rate limiting** - Are API rate limits configured?
