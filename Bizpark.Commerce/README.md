# Bizpark.Commerce

Multi-tenant ecommerce backend service for BizSpark AI.

Each business (tenant) on the platform gets its own isolated PostgreSQL schema
(`tenant_<tenantId>`) created automatically on first request.

---

## Modules

| Module | Routes | Description |
|---|---|---|
| `auth` | `/api/commerce/auth` | Customer register & login (JWT) |
| `catalog` | `/api/commerce/catalog` | Product listing & management |
| `inventory` | `/api/commerce/inventory` | Stock tracking |
| `customers` | `/api/commerce/customers` | Customer profiles |
| `cart` | `/api/commerce/cart` | Add / remove / clear cart items |
| `checkout` | `/api/commerce/checkout` | Begin & complete checkout |
| `orders` | `/api/commerce/orders` | Order history & management |
| `shipping` | `/api/commerce/shipping` | Shipping methods & quotes |
| `subscriptions` | `/api/commerce/subscriptions` | Subscription billing primitives |
| `payments` | `/api/commerce/payments` | Payment intents & webhooks (Stripe scaffold) |

---

## Prerequisites

- Node.js 20+
- Redis (for BullMQ `commerce-jobs` queue)
- PostgreSQL — **Neon cloud** (separate project from main Bizpark DB)

### Start Redis (Docker)

```bash
docker run -d --name bizpark-redis -p 6379:6379 redis:alpine
```

> If `bizpark-redis` container already exists and is stopped:
> ```bash
> docker start bizpark-redis
> ```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**.env values:**

```env
# Neon PostgreSQL — separate DB from main Bizpark project
# Each tenant gets auto-created schema: tenant_<tenantId>
COMMERCE_DATABASE_URL="postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require"

# Redis — shared with Bizpark.API (same Redis instance is fine)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# JWT secret for customer auth tokens
JWT_SECRET="change-me-to-a-strong-secret"

# Server port (default 3003)
PORT="3003"

# Set to "true" to log SQL queries
TYPEORM_LOGGING="false"
```

---

## How to Run

### Step 1 — Install dependencies

```bash
cd Bizpark.Commerce
npm install
```

### Step 2 — Start dev server

```bash
npm run start:dev
```

Server starts at **http://localhost:3003**

---

## How Tenants Work

Every request **must** include the tenant header:

```
x-tenant-id: <businessId>
```

On the first request for a new tenant, Commerce automatically:
1. Creates a new PostgreSQL schema `tenant_<businessId>` in Neon
2. Creates all tables inside it (`synchronize: true`)
3. Serves the request

No manual migrations needed for Commerce.

---

## Database Architecture

```
Neon PostgreSQL (Commerce project)
└── neondb
    ├── tenant_abc123        ← Business A (auto-created)
    │   ├── product
    │   ├── cart
    │   ├── cart_item
    │   ├── order
    │   ├── order_item
    │   ├── customer
    │   ├── inventory_item
    │   ├── shipping_method
    │   └── subscription
    │
    ├── tenant_xyz789        ← Business B (auto-created)
    │   └── ...same tables...
    │
    └── tenant_...           ← One schema per business
```

> This is a **separate Neon project** from the main `Bizpark.API` / `Bizpark.Admin` / `Bizpark.Runner` databases.

---

## Running All Services Together

| Service | Port | DB |
|---|---|---|
| Bizpark.API | 3000 | Neon (main project) |
| Bizpark.Runner.Py | 3001 | Neon (main project) |
| Bizpark.Admin | 3002 | Neon (main project) |
| **Bizpark.Commerce** | **3003** | **Neon (commerce project)** |
| Redis | 6379 | Shared by API + Commerce |

---

## Next Build Steps

1. Wire Stripe for real payment processing.
2. Add tenant metadata lookup from `Bizpark.API` (domain → tenantId resolution).
3. Add idempotency keys for checkout and webhook handlers.
4. Add tests for tenant isolation on every module.
5. Connect `commerce-jobs` queue to actual background job processors.
