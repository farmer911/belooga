# Belooga Product & Human Thesis (Zero-Sum Memory Cap <= 120 Lines)

> **Eviction Policy:** This file is strictly capped at 120 lines by `scripts/lint-skills.py`. To add a new validated business/human insight after an experiment, you MUST compress or evict a lower-value line. Zero fluff, zero generic MBA clichés.

---

## 1. Core Value Proposition & Human Psychology
- **Candidate Pain:** Static PDF resumes fail to convey communication clarity, personality, and real project ownership. Candidates abandon profile builders when forced through >3 minutes of form-filling before seeing visual payoff.
- **Recruiter Pain:** Recruiters spend <30 seconds scanning a candidate. They want immediate signal: (1) 60-second video pitch, (2) verified skill/company tags, (3) clean chronological timeline, and (4) 1-click PDF export for internal ATS sharing.
- **Expert Reviewer Dynamics:** Candidates pay for Expert CV Review ($29-$99) only when trust signals are concrete (verified senior engineers, sample interactive report preview, guaranteed turnaround window).

---

## 2. Validated Product & UX Laws (From Empirical Observation)
1. **80/20 Feature Rule (YAGNI):** Reject speculative features that do not directly accelerate Candidate Profile Completion, Recruiter Discovery Speed, or Expert Review Conversion.
2. **Hover & Interactive Affordance Parity:** Legacy Stack Theme relies on subtle hover reveal (`.start-content-video:hover .modal-start`). Never pollute generic trigger classes (`.modal-trigger`) with layout dimensions.
3. **Zero Fake Feedback:** Never display optimistic success toasts without persisted DB mutations. Losing candidate timeline or video pitch data destroys platform trust permanently.
4. **Search Precision over Noise:** Recruiters prefer zero results over irrelevant keyword noise. Enforce PostgreSQL GIN `search_vector` with `ts_rank`; never fall back to unindexed `OR ILIKE`.
5. **Sub-Second Perceived Latency:** Video chunk uploads and PDF generation must never block the FastAPI async event loop (`asyncio.to_thread` mandatory) so concurrent recruiter searches stay under 100ms.
6. **Semantic Design System & 375px Mobile Parity:** All UI primitives and pages bind exclusively to `@theme` semantic tokens (`bg-surface-card`, `text-typography-*`, `bg-brand-*`, `fe_arbitrary_hex == 0`) and `lucide-react` icons (`fe_structural_emoji == 0`), guaranteeing instant Dark Mode parity and zero-overflow `375px` mobile navigation.

---

## 3. Active Hypotheses & Experiment Ledger
- **[HYP-001] Code Compression vs. Defect Rate:** Enforcing default Ponytail compression (reducing 200-line implementations to <=50 lines while preserving `router -> service -> repository` boundaries) reduces surface area for IDOR and state desync bugs.
- **[HYP-002] Adversarial Supervisor Gate:** Challenging underspecified or bloated feature requests before writing code eliminates >50% of downstream rework and dead documentation.
- **[HYP-003] Zero-Hex & Zero-Emoji Ratchet:** Locking `fe_arbitrary_hex: 0` and `fe_structural_emoji: 0` in `.agents/ratchet.json` prevents AI agents from regressing Dark Mode contrast or visual consistency across all App Router routes (see `CURRENT_STATE.md` §3).
