🎯 Đang làm ticket: [BEL-225] (#195) — [BE] Khắc Phục Triệt Để 6 Hành Vi Gian Lận Ở Backend (#5, #6, #7, #8, #9, #14 Từ Audit #179) | Role: BE | Cột: In Progress

## Active Plan (BEL-225)
1. TDD Red -> Green in `backend/tests/test_bel225_backend_integrity.py`.
2. Remediate items #5 (all `/v1/*` routes live), #6 (PostgreSQL-backed catalogs/CMS), #7 (PostgreSQL aggregation + TF-IDF scoring), #8 (remove anonymous `"alexnguyen"` mutation fallbacks / enforce auth + RBAC where required), #9 (guard `valid_sim_sig` & `/simulate-delivery` behind test/dev env or HMAC), and #14 (Alembic migration `0006_full_platform_schema_sync.py` covering `notification_preferences` & new tables).
3. Verify `pytest`, `render-skill-facts.py`, `trust-benchmark.py = 100%`, open PR, and move `#195` to `Testing`.
