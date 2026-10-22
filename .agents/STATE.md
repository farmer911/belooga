🎯 Đang làm ticket: [BEL-155] (#73) — Post-Delivery Audit: Figma Parity, Dynamic FE-BE Sync, Performance & Skill Benchmark | Role: Architect | Cột: In Progress

## Active Task: [BEL-155] (#73) — Epic #69 Figma Parity & Dynamic FE-BE Sync Audit
- **Linked Upstream Tickets:**
  - `#70` (`[BEL-152]` Design — Figma Master Design System `wRnZwhWhwyQtafVdgMLeL0`)
  - `#71` (`[BEL-153]` BE — PR `#75` `feature/BEL-153-be-dynamic-persistence`)
  - `#72` (`[BEL-154]` FE — PR `#91` `feature/BEL-154-figma-dynamic-fe`)
- **Checklist:**
  1. Cross-audit Figma Design (`[BEL-152]`) vs BE (`[BEL-153]` PR `#75`) and FE (`[BEL-154]` PR `#91`) for 100% dynamic FE-BE persistence & Ponytail compression.
  2. Audit FE/BE performance (`p95 < 30ms`, `0` N+1 queries, ConnectRPC batch multiplexer `/v1/rpc/batch`, React Query cache invalidation).
  3. Update domain skills (`be-domain-monetization`, `fe-domain-career-tools`, `belooga-backend-engineering`), run full benchmark (`generate-current-state.py`, `render-skill-facts.py --write`, `lint-skills.py --quiet`, `trust-benchmark.py`).
  4. Open PR `feature/BEL-155-arch-figma-dynamic-audit`, verify CI green, and transition `#63` & `#73` -> `Done`.
