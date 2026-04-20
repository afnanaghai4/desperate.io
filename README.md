# Desperate.io

A modern full-stack application designed to help job seekers enhance their relevance for software, backend, and cloud engineering positions in Germany. The platform leverages AI-driven analysis to provide intelligent project recommendations and job insights.

## Overview

Desperate.io is a portfolio project built to demonstrate proficiency in:
- Full-stack development with modern frameworks
- Backend API design and implementation
- AI/ML integration for intelligent recommendations
- Database design and management
- DevOps and containerization
- Frontend development with responsive UI

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient and scalable server-side applications
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **AI Integration**: OpenAI API for intelligent analysis
- **Testing**: Jest with unit and e2e tests

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) 16.2.1 - React framework with server-side rendering
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React icons
- **HTTP Client**: Custom API client

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database**: PostgreSQL 16

## Project Structure

```
desperate.io/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── auth/           # Authentication & JWT strategy
│   │   ├── users/          # User management
│   │   ├── jobs/           # Job listings and management
│   │   ├── analysis/       # Job analysis service
│   │   ├── project-recommendation/  # AI-powered recommendations
│   │   ├── ai-orchestrator/  # OpenAI integration
│   │   ├── health/         # Health check endpoints
│   │   ├── entities/       # TypeORM entities
│   │   ├── common/         # Shared utilities and types
│   │   ├── migrations/     # Database migrations
│   │   └── app.module.ts   # Root module
│   ├── test/               # E2E tests
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/               # Next.js frontend application
│   ├── app/               # App router pages
│   │   ├── dashboard/     # Dashboard page
│   │   ├── jobs/          # Jobs listing page
│   │   ├── login/         # Login page
│   │   ├── signup/        # Registration page
│   │   └── profile/       # User profile page
│   ├── components/        # Reusable React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── job/           # Job-related components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # UI components
│   ├── lib/               # Utility functions
│   ├── types/             # TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yaml    # Docker Compose configuration
└── README.md             # This file
```

## Prerequisites

- **Node.js**: v18+ (or v20+ recommended)
- **npm**: v10+ or yarn/pnpm
- **Docker** & **Docker Compose**: For containerized deployment
- **PostgreSQL**: v16 (via Docker or local installation)
- **OpenAI API Key**: For AI-powered features (optional for development)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd desperate.io
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create environment configuration:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=desperate_db
DB_SYNC=true

# JWT
JWT_SECRET=your_secret_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Server
PORT=4000
NODE_ENV=development
```

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
npm install
```

Create environment configuration:

```bash
cp .env.example .env.local
```

Update `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Running the Application

### Option 1: Local Development (Recommended)

#### Start PostgreSQL

If using Docker:

```bash
docker run -d \
  --name desperate_postgres \
  -e POSTGRES_DB=desperate_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16
```

Or use your local PostgreSQL installation and ensure the database is running.

#### Start the Backend

```bash
cd backend
npm run start:dev
```

The backend will start at `http://localhost:4000`

#### Start the Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

The frontend will start at `http://localhost:3000`

### Option 2: Using Docker Compose

Build and start all services:

```bash
docker-compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432

Stop services:

```bash
docker-compose down
```

## Development Workflow

### Backend Development

```bash
cd backend

# Start in watch mode (auto-restart on changes)
npm run start:dev

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with code coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Lint and format code
npm run lint
npm run format

# Build for production
npm run build
```

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type check
npm run type-check
```

## Project Features

### Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes

### Job Management
- Job listing and filtering
- Job creation and management
- Job analysis using AI

### AI Integration
- OpenAI integration for intelligent analysis
- Automated project recommendations
- Job market insights

### User Management
- User profiles
- User preferences
- Recommendation history

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Jobs
- `GET /jobs` - List all jobs
- `POST /jobs` - Create a new job
- `GET /jobs/:id` - Get job details

### Analysis
- `POST /analysis` - Analyze job posting

### Project Recommendations
- `GET /recommendations` - Get AI recommendations
- `POST /recommendations` - Generate recommendations

### Health
- `GET /health` - Health check endpoint

For detailed API documentation, refer to the [backend README](backend/README.md).

## Testing

### Running Backend Tests

```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

Test files are located in `src/**/*.spec.ts` (unit tests) and `test/` (e2e tests).

### Running Frontend Tests

Currently, the frontend uses ESLint for code quality. Run:

```bash
cd frontend
npm run lint
npm run type-check
```

## Database Migrations

The project uses TypeORM for database management.

```bash
cd backend

# Generate a new migration
npm run migration:generate -- --name MigrationName

# Run migrations
npm run migration:run

# Revert migrations
npm run migration:revert
```

Current migrations are stored in `src/migrations/`.

## Deployment

### Docker Deployment

Build the Docker image:

```bash
docker build -t desperate-io-backend ./backend
docker build -t desperate-io-frontend ./frontend
```

Or use Docker Compose for the complete stack:

```bash
docker-compose up -d
```

### Environment Variables for Production

Ensure the following environment variables are set:

**Backend**:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (use a strong, random value)
- `OPENAI_API_KEY`
- `NODE_ENV=production`
- `PORT=4000`

**Frontend**:
- `NEXT_PUBLIC_API_BASE_URL` (production API URL)

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running and accessible
- Check database credentials in `.env`
- Ensure `DB_HOST`, `DB_PORT`, `DB_USERNAME`, and `DB_NAME` are correct

### Port Already in Use
- Backend: Change `PORT` in `.env` (default: 4000)
- Frontend: Use `PORT=3001 npm run dev` to use a different port
- PostgreSQL: Change `POSTGRES_PORT` in Docker Compose or local config (default: 5432)

### OpenAI API Errors
- Verify your `OPENAI_API_KEY` is valid
- Check OpenAI API usage and quota
- Ensure API key has required permissions

### Missing Environment Variables
- Run `cp .env.example .env` in the backend folder
- Run `cp .env.example .env.local` in the frontend folder
- Fill in all required values

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -am 'Add your feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a pull request

## Code Quality

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Jest** for testing

Run quality checks before committing:

```bash
# Backend
cd backend
npm run lint
npm run format
npm run test

# Frontend
cd frontend
npm run lint
npm run type-check
```

## Performance Considerations

- API responses are optimized with pagination
- Database queries use indexes for common lookups
- Frontend uses Next.js optimizations (code splitting, image optimization)
- Caching strategies implemented for API responses

## License

UNLICENSED

## Author

Built as a portfolio project to demonstrate full-stack development capabilities.

---

For more information or issues, please refer to:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
