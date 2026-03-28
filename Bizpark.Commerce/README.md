# Bizpark.Commerce

Multi-tenant ecommerce backend service for BizSpark AI, built with NestJS + TypeORM + PostgreSQL.

Each business (tenant) gets its own isolated PostgreSQL schema (`tenant_<tenantId>`) created automatically on first request — no manual migrations needed.

---

## Modules

| Module | Base Route | Description |
|---|---|---|
| `auth` | `/api/commerce/auth` | Register, login, profile update, logout (JWT) |
| `catalog` | `/api/commerce/catalog/products` | Product CRUD, soft delete, search, category filter, pagination |
| `catalog/variants` | `/api/commerce/catalog/products/:id/variants` | Product variant management (color, size, etc.) |
| `catalog/categories` | `/api/commerce/catalog/categories` | Category tree (nested parent/child) |
| `inventory` | `/api/commerce/inventory` | Stock tracking with pessimistic locking |
| `customers` | `/api/commerce/customers` | Customer profile management (admin) |
| `cart` | `/api/commerce/cart` | Add, update quantity, remove cart items (per-variant lines) |
| `checkout` | `/api/commerce/checkout` | Atomic checkout with inventory reservation + shipping address |
| `orders` | `/api/commerce/orders` | Order lifecycle, status transitions, customer self-cancel |
| `shipping` | `/api/commerce/shipping` | Shipping methods, rate rules, quotes |
| `subscriptions` | `/api/commerce/subscriptions` | Subscription billing with expiry/renewal tracking |
| `payments` | `/api/commerce/payments` | Payment intents + webhook handler (Stripe scaffold) |

---

## Prerequisites

- Node.js 20+
- Redis (for BullMQ `commerce-jobs` queue)
- PostgreSQL — **Neon cloud** (separate project from main Bizpark DB)

### Start Redis (Docker)

```bash
docker run -d --name bizpark-redis -p 6379:6379 redis:alpine
```

> If `bizpark-redis` already exists and is stopped:
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

# Redis — shared with Bizpark.API (same instance is fine)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# JWT secret for customer auth tokens (REQUIRED in production)
JWT_SECRET="change-me-to-a-strong-secret"

# Server port (default 3003)
PORT="3003"

# Set to "true" to log all SQL queries
TYPEORM_LOGGING="false"
```

---

## How to Run

```bash
cd Bizpark.Commerce
npm install
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
1. Creates PostgreSQL schema `tenant_<businessId>` in Neon
2. Runs `synchronize: true` — creates all tables inside it
3. Serves the request

---

## API Overview

### Authentication

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/bootstrap` | — | Create first admin for a new tenant (409 if exists) |
| POST | `/auth/register` | — | Customer self-registration |
| POST | `/auth/admin/register` | ADMIN | Create additional admin users |
| POST | `/auth/login` | — | Returns JWT access token |
| GET | `/auth/me` | JWT | Get current user profile |
| PATCH | `/auth/profile` | JWT | Update name or change password |
| POST | `/auth/logout` | JWT | Logout (client discards token) |

### Catalog

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/catalog/products` | — | List products (`?search=`, `?categoryId=`, `?page=`, `?limit=`) |
| GET | `/catalog/products/:id` | — | Get single product |
| POST | `/catalog/products` | ADMIN | Create product |
| PATCH | `/catalog/products/:id` | ADMIN | Update product |
| DELETE | `/catalog/products/:id` | ADMIN | Soft delete (preserves order history) |
| GET | `/catalog/products/:id/variants` | — | List variants for a product |
| GET | `/catalog/products/:id/variants/:variantId` | — | Get single variant |
| POST | `/catalog/products/:id/variants` | ADMIN | Create variant (with attributes JSON) |
| PATCH | `/catalog/products/:id/variants/:variantId` | ADMIN | Update variant |
| DELETE | `/catalog/products/:id/variants/:variantId` | ADMIN | Delete variant |
| GET | `/catalog/categories` | — | Get category tree (nested children) |
| GET | `/catalog/categories/:id` | — | Get single category |
| POST | `/catalog/categories` | ADMIN | Create category (with optional parentId) |
| PATCH | `/catalog/categories/:id` | ADMIN | Update category |
| DELETE | `/catalog/categories/:id` | ADMIN | Delete category |

### Cart

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/cart/:customerId` | JWT | Get cart (auto-created if not exists) |
| POST | `/cart/:customerId/items` | JWT | Add item (with optional variantId — separate line per variant) |
| PATCH | `/cart/:customerId/items/:itemId` | JWT | Update item quantity |
| DELETE | `/cart/:customerId/items/:itemId` | JWT | Remove item |

### Checkout

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/checkout/begin` | JWT | Validate cart, return checkout summary |
| POST | `/checkout/complete` | JWT | Atomic: reserve inventory + create order + clear cart. Accepts optional `shippingAddress` |

### Orders

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/orders` | JWT | ADMIN: all orders. CUSTOMER: own orders only. Paginated. |
| GET | `/orders/:id` | JWT | Get order (customers can only see own) |
| POST | `/orders` | JWT | Create order directly (bypasses cart) |
| PATCH | `/orders/:id/cancel` | JWT | Customer cancels own PENDING order (inventory released) |
| PATCH | `/orders/:id/status` | ADMIN | Update order status with transition validation |

**Valid status transitions:**
```
PENDING → PAID → FULFILLED
PENDING → CANCELLED (releases inventory)
PAID    → CANCELLED (releases inventory)
```

### Inventory

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/inventory` | ADMIN | List all inventory items (paginated) |
| GET | `/inventory/items/:productId` | ADMIN | Get inventory for a product |
| POST | `/inventory/upsert` | ADMIN | Create or update inventory by SKU |
| POST | `/inventory/reserve` | ADMIN | Reserve stock by SKU |

### Shipping

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/shipping/methods` | — | List active shipping methods |
| POST | `/shipping/methods` | ADMIN | Create shipping method with rate rules |
| PATCH | `/shipping/methods/:id` | ADMIN | Update shipping method |
| DELETE | `/shipping/methods/:id` | ADMIN | Delete shipping method |
| POST | `/shipping/quote` | — | Get shipping cost for cart total + method |

### Subscriptions

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/subscriptions` | JWT | ADMIN: all. CUSTOMER: own only. |
| GET | `/subscriptions/:id` | JWT | Get subscription (own or admin) |
| POST | `/subscriptions` | JWT | Subscribe to a plan (sets expiresAt + renewsAt) |
| PATCH | `/subscriptions/:id/cancel` | JWT | Cancel subscription (clears renewsAt) |
| PATCH | `/subscriptions/:id/status` | ADMIN | Admin status override |

### Payments

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/payments/intent` | JWT | Create payment intent (with optional orderId) |
| POST | `/payments/webhook` | — | Receive Stripe webhook events |

---

## Database Architecture

```
Neon PostgreSQL (Commerce project)
└── neondb
    ├── tenant_abc123        ← Business A (auto-created)
    │   ├── commerce_users
    │   ├── products
    │   ├── product_variants
    │   ├── categories
    │   ├── inventory_items
    │   ├── customers
    │   ├── carts
    │   ├── cart_items
    │   ├── orders
    │   ├── order_items
    │   ├── shipping_methods
    │   └── subscriptions
    │
    ├── tenant_xyz789        ← Business B (auto-created)
    │   └── ...same tables...
    │
    └── tenant_...           ← One schema per business
```

> This is a **separate Neon project** from the main `Bizpark.API` / `Bizpark.Admin` / `Bizpark.Runner` databases.

---

## Key Design Decisions

**Pessimistic locking on inventory** — Checkout and order status updates use PostgreSQL `SELECT FOR UPDATE` via TypeORM `createQueryBuilder().setLock('pessimistic_write')` to prevent race conditions under concurrent load.

**Atomic checkout** — `POST /checkout/complete` runs inside a single `QueryRunner` transaction: reserve inventory → create order → clear cart. All-or-nothing.

**Soft delete on products** — Products are never hard-deleted. `DELETE /catalog/products/:id` sets `deletedAt` so order history preserves product snapshots.

**Price snapshots in cart** — `unitPrice` and `unitTitle` are captured at add-to-cart time, not at checkout time. Protects against price changes between browse and pay.

**Per-variant cart lines** — Adding the same product in two different variants creates two separate cart lines, each tracked by `(productId, variantId)`.

**Shipping address on orders** — Captured at checkout in 7 fields (`shippingName`, `shippingLine1`, `shippingLine2`, `shippingCity`, `shippingState`, `shippingPostalCode`, `shippingCountry`).

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

## E2E Tests

A full end-to-end test suite covers all 135 scenarios across 22 sections:

```bash
bash e2e-test.sh
```

Sections: Health → DTO Validation → Bootstrap → Auth → Categories → Catalog + Search → Variants → Inventory → Customers → RBAC → Cart (variants + qty update) → Checkout (address) → Orders (lifecycle + customer cancel) → Payments → Subscriptions (expiry + ownership) → Multi-tenant Isolation.

---

## Next Steps

1. Wire Stripe for real payment processing (replace scaffold).
2. Add tenant metadata lookup from `Bizpark.API` (domain → tenantId resolution).
3. Add idempotency keys on checkout and webhook handlers.
4. Connect `commerce-jobs` queue to background job processors.
5. Add password reset / forgot-password flow.
6. Add order filtering by status (`GET /orders?status=PENDING`).
