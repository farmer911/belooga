---
name: schema-change
description: Safe, disciplined procedure for modifying PostgreSQL schemas in Belooga.
---

# Workflow: Database Schema Change

Follow these steps whenever a database table, column, index, or constraint needs to change.

## 1. Edit Schema Definition
- Modify `backend/initdb.sql` directly.
- Add appropriate constraints (e.g. `NOT NULL`, `DEFAULT`, `REFERENCES`).
- If adding search fields to `candidate_profiles`, ensure `search_vector` generated column definition is updated.

## 2. Update Seed Data
- Modify `scripts/seed-data.py` to ensure all seeded entities populate the new column/table.

## 3. Reset Local & Test Database
```bash
# Restart postgres container to reload initdb.sql
docker compose restart postgres

# Re-seed database
python3 scripts/seed-data.py
```

## 4. Run Pytest Suite
```bash
backend/.venv/bin/pytest backend/tests/ -v
```

## 5. Regenerate SSOT
```bash
python3 scripts/generate-current-state.py --allow-dirty
```

## 6. Run SSOT Audit
```bash
bash scripts/audit-truth.sh
```
Gate 1 verifies that all tables in `initdb.sql` match `CURRENT_STATE.md` exactly.
