# Bizpark--AI-BE

## Architecture

```
┌──────────────┐     ┌──────────┐     ┌──────────────────┐
│  Bizpark.API │────▶│  Redis   │◀────│ Bizpark.Runner.Py│
│  (NestJS)    │     │  (Queue) │     │  (FastAPI)       │
│  Port 3000   │     └──────────┘     │  Port 3001       │
└──────┬───────┘                      └────────┬─────────┘
       │         ┌──────────────┐              │
       │         │ Bizpark.Admin│              │
       │         │ (NestJS)     │              │
       │         │ Port 3002    │              │
       │         └──────┬───────┘              │
       │                │                      │
       ▼                ▼                      ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL (Neon)                   │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐        │
│  │ api     │  │ admin   │  │ runner   │ schemas │
│  └─────────┘  └─────────┘  └──────────┘        │
└─────────────────────────────────────────────────┘
```

| Package | Description | Port | Tech |
|---|---|---|---|
| **Bizpark.Core** | Shared library (entities, DTOs, DB config) | — | TypeScript |
| **Bizpark.API** | REST API (auth, business, website, agents) | 3000 | NestJS |
| **Bizpark.Runner.Py** | BullMQ worker (AI agent task processor) | 3001 | FastAPI |
| **Bizpark.Admin** | Admin API (template management) | 3002 | NestJS |

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL ([Neon](https://neon.tech) recommended)
- Redis (Docker / [Upstash](https://upstash.com) / Memurai)

## Quick Start

### 1. First-time setup (run once)

```bash
# Copy and configure env
cp Bizpark.Core/.env.example Bizpark.Core/.env
# Edit .env — set DATABASE_URL, REDIS_HOST, REDIS_PORT

# Install, bootstrap DB, run migrations, build
cd Bizpark.Core
npm install
npm run db:bootstrap
npm run migration:run:app
npm run migration:run:admin
npm run migration:run:runner
npm run build
```

See [`FIRST_TIME_SETUP.md`](./FIRST_TIME_SETUP.md) for details.

### 2. Start Redis

```bash
docker run -d --name bizpark-redis -p 6379:6379 redis:7
```

### 3. Setup Runner (one time)

```bash
cd Bizpark.Runner.Py
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### 4. Run services (separate terminals)

```bash
# Terminal 1 — API
cd Bizpark.API
npm install
npm run start:dev

# Terminal 2 — Runner (FastAPI)
cd Bizpark.Runner.Py
venv\Scripts\activate
python run.py

# Terminal 3 — Admin
cd Bizpark.Admin
npm install
npm run start:dev
```

## API Endpoints

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |

### Business — `/api/business`
| Method | Route | Description |
|---|---|---|
| POST | `/api/business` | Create business |
| GET | `/api/business` | List businesses |
| GET | `/api/business/:id` | Get business |
| POST | `/api/business/:id/website` | Save website config |
| POST | `/api/business/:id/website/deploy` | Deploy website |

### Agents — `/api/agents`
| Method | Route | Description |
|---|---|---|
| POST | `/api/agents/tasks` | Create agent task |
| GET | `/api/agents/tasks` | List tasks |
| GET | `/api/agents/tasks/:taskId` | Get task status |

### Templates — `/api/templates`
| Method | Route | Description |
|---|---|---|
| POST | `/api/templates` | Create template |
| GET | `/api/templates` | List templates |
| GET | `/api/templates/type/:type` | Get by type |
| GET | `/api/templates/:id` | Get by ID |

## Scripts

### Bizpark.Core
| Script | Description |
|---|---|
| `npm run build` | Compile shared library |
| `npm run db:bootstrap` | Create schemas + tables + enums |
| `npm run migration:run:app` | Run API migrations |
| `npm run migration:run:admin` | Run Admin migrations |
| `npm run migration:run:runner` | Run Runner migrations |
| `npm run migration:revert:app` | Revert last API migration |
| `npm run migration:revert:admin` | Revert last Admin migration |
| `npm run migration:revert:runner` | Revert last Runner migration |

### Bizpark.API / Admin (NestJS)
| Script | Description |
|---|---|
| `npm run start:dev` | Dev mode with hot reload |
| `npm run start:debug` | Debug mode |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run lint` | Lint + auto-fix |

### Bizpark.Runner.Py (FastAPI)
| Command | Description |
|---|---|
| `python run.py` | Start runner (dev with hot reload) |
| `pip install -r requirements.txt` | Install dependencies |

## Environment Variables

All services share [`Bizpark.Core/.env`](./Bizpark.Core/.env.example)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `APPLICATION_DATABASE_URL` | API service DB connection |
| `ADMIN_DATABASE_URL` | Admin service DB connection |
| `RUNNER_DATABASE_URL` | Runner service DB connection |
| `APPLICATION_DB_SCHEMA` | API schema name (`api`) |
| `ADMIN_DB_SCHEMA` | Admin schema name (`admin`) |
| `RUNNER_DB_SCHEMA` | Runner schema name (`runner`) |
| `REDIS_HOST` | Redis host (`localhost`) |
| `REDIS_PORT` | Redis port (`6379`) |

## Database Schema

Single PostgreSQL database with 3 isolated schemas:

```
neondb
├── api      → User, Business, BusinessUser, Website
├── admin    → Template
└── runner   → AgentTask
```
