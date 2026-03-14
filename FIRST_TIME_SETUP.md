# First-Time Setup (Run Once)

Use this only when setting up a new/empty database for the first time.

## 1. Prepare env

- Create `Bizpark.Core/.env` (copy from `Bizpark.Core/.env.example`).
- Ensure `DATABASE_URL`, `REDIS_HOST`, and `REDIS_PORT` are set.

## 2. Start infrastructure

- Start PostgreSQL and Redis (Docker or local).

## 3. Run one command

From `Bizpark-AI-BE`:

```bash
./first-time-setup.sh
```

This runs `Bizpark.Core` DB bootstrap and creates required schemas/tables/enums.

## After first time

- You do not need to run this again on every start.
- Run it again only if you reset/drop the database and need to recreate schema.
