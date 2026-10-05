---
name: schema-change
description: Safe, version-controlled procedure for modifying PostgreSQL schemas via Alembic in Belooga.
---

# Workflow: Database Schema Change

Follow this procedure whenever a database table, column, index, or constraint is added or modified.

> [!WARNING]
> `docker compose restart postgres` does NOT apply schema changes. Postgres only executes scripts in `initdb.d/` when the storage volume is completely empty. Direct SQL edits to `initdb.sql` without migrations cause schema drift.

## Step 1: Update ORM Models
- Modify or add models in `backend/app/models/`.
- Ensure appropriate column types, nullability, foreign keys, and indexes.

## Step 2: Generate Alembic Revision
```bash
cd backend && ../backend/.venv/bin/alembic revision --autogenerate -m "describe_change"
```
Review the generated revision script in `backend/alembic/versions/`. Hand-correct any custom GIN indexes, trigram indexes, or generated columns that autogenerate misses.

## Step 3: Test Two-Way Migration
```bash
# Upgrade, test downgrade, then re-upgrade
../backend/.venv/bin/alembic upgrade head
../backend/.venv/bin/alembic downgrade -1
../backend/.venv/bin/alembic upgrade head
cd ..
```

## Step 4: Seed & Run Integration Tests
```bash
backend/.venv/bin/python scripts/seed-data.py
backend/.venv/bin/pytest backend/tests/ -v
```

## Step 5: Update SSOT & Facts
```bash
python3 scripts/generate-current-state.py --allow-dirty
python3 scripts/render-skill-facts.py
bash scripts/audit-truth.sh
```
All verification gates must report green.
