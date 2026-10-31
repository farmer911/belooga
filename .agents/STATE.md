# Active Working Memory (.agents/STATE.md)

🎯 Đang làm ticket: [BEL-241..245] (#249, #250, #251, #252, #253) — Xử Lý Triệt Để Hard Strings/Variables & Khóa Cổng AST Chống Tái Phạm | Role: Architect / Full-Stack | Cột: In Progress

## Hypothesis & Architectural Audit Scope
1. **[BEL-241] (#249) & [BEL-242] (#250) & [BEL-244] (#252) Backend:** Purge hardcoded multipliers, synthetic offsets, static seed lists (`CURATED_MARKET_JOBS`, `DEFAULT_RANKED_EXPERTS`, `SAMPLE_INTERVIEW_QUESTIONS`, `curated`), fake persona defaults in `backend/app/schemas/*.py`, and enforce paid entitlement on `POST /v1/match/tailor-cv`.
2. **[BEL-243] (#251) Mobile:** Rename `use-mobile-parity-part2.ts` -> `use-mobile-wallet-and-community.ts`, centralize endpoints, remove hardcoded `belooga.vn` default, and prune/wire 14 unused mobile hooks (`mobile_unused_hooks: 0`).
3. **[BEL-245] (#253) Frontend:** Remove synthetic `catch` fallback in `use-ats-Scan.ts:87-98`, route MoMo endpoints via `API_ENDPOINTS`, centralize `API_BASE_URL` / origin, remove hardcoded form initial strings (`"NGUYỄN VĂN AN"`, `"VNG Corporation"`, `"55.000.000 VNĐ"`, `"/uploads/resumes/candidate_cv.pdf"`), and fix all 8 ESLint warnings (`fe_eslint_warnings: 0`).
4. **Anti-Recurrence AST Gates (`scripts/trust-benchmark.py` & `scripts/ratchet.py`):** Block `*-part\d+` filenames, hardcoded persona/company schema defaults, raw `/v1/` API strings in FE/Mobile, and lock `mobile_unused_hooks: 0` & `fe_eslint_warnings: 0`.

## Execution Checklist
- [x] RED: Write failing tests in `backend/tests/test_bel241_245_zero_hardcodes_and_ast_gates.py` for AST anti-recurrence gates and DB-driven metrics/search
- [x] GREEN (Mobile #251): Rename `use-mobile-parity-part2.ts` -> `use-mobile-wallet-and-community.ts`, centralize endpoints, prune unused hooks (`mobile_unused_hooks: 0`)
- [x] GREEN (Frontend #253): Fix ESLint warnings (`--max-warnings=0`), remove `use-ats-Scan.ts` catch fallback, centralize `API_ENDPOINTS` & `API_BASE_URL`, clean hardcoded form initial states
- [x] GREEN (Backend #249, #250, #252): Clean `schemas/*.py` defaults, remove `curated`/synthetic offsets in `search`, `analytics`, `ats_matching`, `bookmarks`, `job_tracker`, `expert_review`, `catalogs`, `cms`, and move seeds to `scripts/seed-data.py`
- [x] GREEN (CI Gates): Lock AST rules in `scripts/trust-benchmark.py` and `mobile_unused_hooks: 0` in `scripts/ratchet.py` & `.agents/ratchet.json`
- [x] Verify all DoD gates (`pytest`, `tsc`, `eslint --max-warnings=0`, `jest`, `audit-truth.sh`, `trust-benchmark.py`, `ratchet.py`) & merge PR
