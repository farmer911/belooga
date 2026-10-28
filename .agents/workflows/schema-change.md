---
name: schema-change
description: Safe, version-controlled procedure for modifying PostgreSQL schemas via Alembic in Belooga.
---

# Workflow: Database Schema Change

Follow this procedure whenever a database table, column, index, or constraint is added or modified.

> [!WARNING]
> `docker compose restart postgres` does NOT apply schema changes. Postgres only executes scripts in `initdb.d/` when the storage volume is completely empty. Direct SQL edits to `initdb.sql` without migrations cause schema drift.

> Paths below are POSIX (`backend/.venv/bin/python`). On Windows use `backend/.venv/Scripts/python.exe`. Running tools as `python -m alembic` / `python -m pytest` keeps the commands identical apart from the interpreter path.

## Step 1: Update ORM Models
- Modify or add models in `backend/app/models/`.
- Ensure appropriate column types, nullability, foreign keys, and indexes.

## Step 2: Generate Alembic Revision
```bash
cd backend
.venv/bin/python -m alembic revision --autogenerate -m "describe_change"
```
Review the generated revision script in `backend/alembic/versions/`. Hand-correct any custom GIN indexes, trigram indexes, or generated columns that autogenerate misses. Give it the next unused sequential `revision` id: `python3 scripts/ratchet.py` fails on duplicate revision ids or more than one head, and CI requires exactly one `alembic heads` line.

## Step 3: Test Two-Way Migration
```bash
# still inside backend/: upgrade, test downgrade, then re-upgrade
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m alembic downgrade -1
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m alembic heads   # must print exactly one head
cd ..
```

## Step 4: Seed & Run Integration Tests
```bash
backend/.venv/bin/python scripts/seed-data.py
backend/.venv/bin/python -m pytest backend/tests/ -v
```

## Step 5: Update SSOT & Facts
```bash
python3 scripts/generate-current-state.py --allow-dirty
python3 scripts/render-skill-facts.py
bash scripts/audit-truth.sh
```
All verification gates must report green. In production, migrations run as a Kubernetes Job (`k8s/migrate-job.yaml`) before each rollout.
