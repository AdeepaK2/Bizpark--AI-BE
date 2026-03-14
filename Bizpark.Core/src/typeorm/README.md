# TypeORM Scaffold

This folder provides a domain-split TypeORM layout.

## Structure

- `entities/shared`: shared base classes and enums
- `entities/api`: API-owned entities
- `entities/admin`: Admin-owned entities
- `entities/runner`: Runner-owned entities
- `datasources`: one datasource per context (`application`, `admin`, `runner`)
- `migrations`: per-context migration folders

## Commands (from `Bizpark.Core`)

- `npm run migration:run:app`
- `npm run migration:run:admin`
- `npm run migration:run:runner`
- `npm run migration:revert:app`
- `npm run migration:revert:admin`
- `npm run migration:revert:runner`

## Environment

Set one URL per context:

- `APPLICATION_DATABASE_URL`
- `ADMIN_DATABASE_URL`
- `RUNNER_DATABASE_URL`
- `APPLICATION_DB_SCHEMA` (default: `api`)
- `ADMIN_DB_SCHEMA` (default: `admin`)
- `RUNNER_DB_SCHEMA` (default: `runner`)

Each datasource falls back to `DATABASE_URL` if the context URL is unset.
Use the schema vars for true PostgreSQL schema separation in a single shared database.
