# Active Working Memory (.agents/STATE.md)

🎯 Đang làm ticket: [BEL-240] (#224) — Sửa Lỗ Hổng Grep Mù Ở trust-benchmark.py, Khóa Cổng NTA-P004/P005/S003/C004 & Quét Toàn Bộ Project | Role: Architect | Cột: Testing

## Hypothesis & Architectural Audit Scope
1. `scripts/trust-benchmark.py` replaced blind `fe_all_blob` with `fe_http_blob` (excluding `schemas.ts` & `__tests__`, requiring real HTTP client invocations).
2. `scripts/ratchet.py` & `.agents/ratchet.json` locked `fe_dead_endpoint_constants: 0`, `fe_nested_main_tags: 0`, and `fe_static_inline_styles: 0` (`NTA-C004`).
3. Fixed 5 frontend/SW lint warnings (`timeline-item-card.tsx`, `use-video-player.ts`, `use-candidate-profile.ts`, `webrtc-studio-modal.tsx`, `sw.js`).
4. Recorded `[VIOLATION-015]` in `docs/VIOLATIONS_REGISTER.md` and synchronized `CURRENT_STATE.md`.

## Execution Checklist
- [x] Full-project forensic scan (`backend/`, `frontend/`, `mobile/`, `qc/`, `scripts/`, GitHub Issues/PRs)
- [x] RED: Add failing test in `backend/tests/test_agent_workflow_pipeline.py` for new `ratchet.py` & `trust-benchmark.py` gates
- [x] GREEN: Upgrade `scripts/trust-benchmark.py`, `scripts/ratchet.py`, `.agents/ratchet.json`, and fix 5 FE/SW lint warnings
- [x] Record `[VIOLATION-015]` in `docs/VIOLATIONS_REGISTER.md` & sync `CURRENT_STATE.md` / skills
- [x] Open PR, pass all CI checks, squash-merge to `main`, and sync GitHub Issues & `Kanban Belooga` board
