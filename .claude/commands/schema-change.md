---
description: Change the PostgreSQL schema safely via an Alembic migration (single head, two-way tested).
argument-hint: "[describe the schema change]"
---

Apply this schema change: $ARGUMENTS

Follow the canonical workflow below exactly. Never edit `backend/initdb.sql` without a matching Alembic revision.

@.agents/workflows/schema-change.md
