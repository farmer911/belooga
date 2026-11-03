# Active Stateful Working Memory (.agents/STATE.md)

## Active Task: Load System Design knowledge into agents (BE: donnemartin/system-design-primer, FE: frontend system design)
- **Hypothesis:** One reference file per side (`belooga-backend-engineering/references/system-design-primer.md`, `belooga-frontend-engineering/references/frontend-system-design.md`) mapping each topic to real Belooga code + known gaps, linked from investigate / supervisor / review skills, gives agents the design method without duplicating text across skills.
- **Findings (code is truth):**
  1. `be-domain-discovery` named nonexistent `companies.py`, `posts.py`, `recruiter.py`, `growth.py`; `lint-skills.py` only checked dir-prefixed paths.
  2. `invalidate_prefix` publishes `<ns>:inval` but no production subscriber calls `apply_remote_invalidation`; skills claimed cross-pod purge works.
  3. `event_stream.publish` is sync, per-pod in-memory, `deque(maxlen=4096)` drops oldest silently; skill said `await event_stream.publish(topic, key, payload)`.
  4. `/auth/me/` reads `get_read_db` (replica lag breaks read-your-writes once `DATABASE_READ_URL` is set).
- **Risks:** keyword asserts in `backend/tests/test_bel246_primer_system_and_design_tokens.py` must stay green; refs <= 400 lines, no TO-BE wording.

## Execution Checklist
- [x] 1. RED: `lint-skills.py` flags backticked bare `*.py`/`*.ts(x)` names missing from `git ls-files`.
- [x] 2. GREEN: fix discovery rule, correct cache/event claims in skills.
- [x] 3. Write BE + FE references; link from investigate, belooga-supervisor, be/fe-code-review, BE/FE engineering skills.
- [x] 4. Sync stubs, render facts, lint, trust-benchmark 100%, DB-free gate tests PASS (DB pytest + audit-truth need Postgres: run in CI).
- [x] Follow-up (code, BEL-251): lifespan Redis Pub/Sub listener `run_invalidation_listener` -> `apply_remote_invalidation` (skips own `pod_id`); `/auth/me/` on `get_db`.
