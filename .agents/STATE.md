# Active Working Memory (`STATE.md`)

- **Task:** Option B — Consolidated Bounded-Context Skill Architecture (41 -> 23 skills) + Empirical A/B Subagent Benchmark
- **Hypothesis:** Consolidating 24 fragmented `be-service-*`/`fe-page-*` skills into 6 domain skills reduces system `<skills>` index tokens/turn and `.agents/` file reads on multi-endpoint tasks while preserving 100% AST/TestID/Route coverage.
- **Checklist:**
  - [x] Consolidate 12 `be-service-*` skills into `be-domain-core`, `be-domain-discovery`, `be-domain-monetization`
  - [x] Consolidate 12 `fe-page-*` skills into `fe-domain-workspace`, `fe-domain-public`, `fe-domain-career-tools`
  - [x] Prune unused desktop/mobile stack CSVs & test fixtures from `ui-ux-pro-max`
  - [x] Run live parallel A/B subagent benchmark on isolated worktrees (`/tmp/belooga-bench-a` vs `/tmp/belooga-bench-b`)
  - [x] Verify `python3 scripts/lint-skills.py` & `python3 scripts/trust-benchmark.py` pass (`ERROR: 0 | WARN: 0`)
