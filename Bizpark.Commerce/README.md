# Bizpark.Commerce

Generic multi-tenant ecommerce backend service for Bizpark.

## Purpose

This service is the reusable ecommerce backend for all small-business storefronts.
It is tenant-aware and designed to support:

- Authentication and customer login
- Catalog management
- Cart and checkout flow
- Order management
- Subscription billing primitives
- Payment intent and webhook entry points

## Current Structure

- `tenant`: tenant resolution middleware and request context
- `auth`: JWT-based auth scaffold
- `catalog`: product scaffold
- `inventory`: stock and reservation scaffold
- `customers`: customer scaffold
- `cart`: cart scaffold
- `checkout`: checkout scaffold
- `orders`: order scaffold
- `shipping`: method and quote scaffold
- `subscriptions`: subscription scaffold
- `payments`: payment scaffold

## Runtime

- Default port: `3003`
- Uses Redis via BullMQ (`commerce-jobs` queue)
- Reads `REDIS_HOST` and `REDIS_PORT`

## Next Build Steps

1. Replace in-memory stores with database-backed repositories.
2. Add tenant metadata lookup from platform data (domain -> tenant).
3. Add Stripe integration for subscriptions and payment lifecycle.
4. Add idempotency keys for checkout and webhook handlers.
5. Add tests for tenant isolation on every module.
