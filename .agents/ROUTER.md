# 🚦 BELOOGA ENTERPRISE AGENT ROUTER & EXECUTION PROTOCOL

> **Version:** 2.4.0 — Enterprise Multi-Department Standard with Architecture Decision Records (ADR)  
> **Status:** MANDATORY & ENFORCED FOR ALL AGENTS & SUB-AGENTS  
> **Authority:** Principal Full-Stack Architect  

---

## 1. PURPOSE & ORGANIZATIONAL OPERATING MODEL

This document establishes the **Organizational Operating System** for the Belooga software engineering organization. The repository is structured like an elite technology enterprise where:
1. **Pages and Services are specialized Departments (Phòng Ban):** Each department maintains exclusive ownership of its domain, technical specifications, and standards.
2. **Skills are Institutional Knowledge Assets:** Agents are not generic laborers; they act as Senior Specialists equipped with deep, accumulated institutional memory.
3. **Zero Blind Trust (50% Agent Confidence Cap):** Coder Agents are trusted at at most 50%. The remaining 50% of verification is enforced by **Independent Reviewer Agents** (Senior Frontend Lead Reviewer and Principal Backend Lead Reviewer).
4. **Strict Definition of Done (DoD):** No work is complete without satisfying the binary 7-tier DoD quality contract (`definition-of-done` skill).
5. **Architectural Decisions are Invariant (ADRs):** All tech stack selections and architectural choices are bound by [`.agents/ADR.md`](.agents/ADR.md). Agents are forbidden from introducing unapproved libraries or deviating from recorded ADRs.
6. **Cross-Departmental Impacts are strictly mapped:** No department changes code without verifying upstream and downstream dependencies.
7. **Continuous Learning is Enforced:** After every feature or bug fix, departments **must self-update** their knowledge base. Historical mistakes are logged so they are **never repeated**.

---

## 2. THE MANDATORY 6-STEP EXECUTION PIPELINE

```
[USER TASK / FEATURE REQUEST / BUG REPORT]
                │
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🧠 STEP 0: THE PRE-WALK (CHIEF ARCHITECT - PRO / HIGH-REASONING MODEL)      │
│ • Consult `CURRENT_STATE.md` (SSOT generated dynamically from SQL & AST).   │
│ • Survey Cross-Department Impact Matrix (Section 4).                        │
│ • Inspect blast radius, target files, and historical violation registers.    │
│ • Formulate the PRE-WALK SPEC: Target files, frozen DTOs, and test IDs.     │
│ • Enforce TDD Workflow (`tdd-workflow`): Require failing test proof first.   │
│ • Assign the exact Department Skill to the executing Worker.                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                  Handoff Spec ────────┼────────── Handoff Spec
                  & Department Skill   │           & Department Skill
                  │                    │           │
                  ▼                    ▼           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 👨‍💻 STEP 1: DISPATCH & SCOPED SKILL INGESTION (SPECIALIST WORKER)            │
│ • Worker consults Intent Matrix (Section 3) to load department skill.       │
│ • Concurrently load: `engineering-integrity-and-evidence` & `tdd-workflow`. │
│ • IF ANY SPEC IS UNCLEAR: Halt and ask immediately. Never assume!           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔨 STEP 2: SCOPED CODING & ARCHITECTURAL IMPLEMENTATION                     │
│ • Write failing test first (Red phase of TDD in backend/tests/ or qc/).     │
│ • Implement code strictly within assigned department boundaries.            │
│ • Frontend: Inlined App Router page logic + shared UI primitives in `ui/`.   │
│ • Backend: Modular Monolith Endpoints (FastAPI + AsyncSession + SQL Guards). │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🧪 STEP 3: MANDATORY AUTOMATED QC GATE (SSOT ENGINE & TEST SUITES)          │
│ • Run SSOT Integrity Auditor: `bash scripts/audit-truth.sh`                  │
│ • Run Backend Pytest suite: `backend/.venv/bin/pytest backend/tests/ -v`     │
│ • Run Frontend typecheck: `cd frontend && bun x tsc --noEmit`                │
│ • Run Playwright E2E suite: `cd qc && bun run test:e2e`                      │
│ • IF FAILS: Self-debug. NEVER delete tests or suppress compiler errors!     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         [Test Pass 100%?] ─── NO ───► Loop back to Step 2
                                       │ YES
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🧐 STEP 4: DUAL-KEY ADVERSARIAL CODE REVIEW (INDEPENDENT REVIEWER AGENTS)   │
│ • Frontend PR ➔ Reviewed by Senior Frontend Reviewer (`fe-reviewer-guide`) │
│ • Backend PR ➔ Reviewed by Principal Backend Reviewer (`be-reviewer-guide`)│
│ • Reviewers enforce 10+ year checklists (Re-render, AnyIO, IDOR, Tokens).   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                        [Both Reviewers APPROVE?] ─── NO ➔ Reject to Step 2
                                       │ YES
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📚 STEP 5: DEFINITION OF DONE (DoD) & EVIDENCE SIGN-OFF                     │
│ • Enforce 7-Tier DoD Contract (`definition-of-done` skill).                 │
│ • Refresh `CURRENT_STATE.md`: `python3 scripts/generate-current-state.py`    │
│ • Update Department Skill: Document any new contracts or props.             │
│ • If a bug occurred, log root cause in VIOLATIONS_REGISTER.md.              │
│ • Emit Empirical Proof Block (Exit Code: 0, test logs, browser check).      │
│ • CTO Final Sign-off & Run AST sync: `graphify update .`                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. INTENT-BASED SKILL ROUTING MATRIX

Every agent **MUST CONSULT THIS DIRECTORY** before commencing work:

| Department / Intent | Target File Scope | MANDATORY Department Skill | Concurrently Loaded |
| :--- | :--- | :--- | :--- |
| **Integrity & Evidence** | All tasks across repository | `engineering-integrity-and-evidence` | Assigned department skill |
| **Definition of Done (DoD)**| All task completions / sign-offs | `definition-of-done` | `engineering-integrity-and-evidence` |
| **Systems & CS Knowledge** | All architectural and engineering decisions | `systems-and-cs-knowledge` | `enterprise-design-patterns` |
| **Architect Standards** | All system architecture & designs | `architect-patterns-and-practices` | `systems-and-cs-knowledge` |
| **Senior FE Standards** | All frontend components & hooks | `fe-patterns-and-practices` | `fe-reviewer-guidelines` |
| **Senior BE Standards** | All backend models, repos, services | `be-patterns-and-practices` | `be-reviewer-guidelines` |
| **Senior QC Standards** | All test suites, fixtures & POMs | `qc-patterns-and-practices` | `belooga-qc-engineering` |
| **Frontend Code Review** | All frontend PRs / modifications | `fe-reviewer-guidelines` | `fe-patterns-and-practices` |
| **Backend Code Review** | All backend PRs / modifications | `be-reviewer-guidelines` | `be-patterns-and-practices` |
| **Homepage & Showcase** | `frontend/src/app/page.tsx` | `fe-page-home` | `engineering-integrity-and-evidence` |
| **Talent Search & Discovery** | `frontend/src/app/search/page.tsx` | `fe-page-search` | `engineering-integrity-and-evidence` |
| **Public Candidate Profile** | `frontend/src/app/public/[username]/page.tsx` | `fe-page-public-profile` | `fe-page-workspace` |
| **Candidate Workspace Hub** | `frontend/src/app/user/[username]/page.tsx` | `fe-page-workspace` | `engineering-integrity-and-evidence` |
| **Identity & Authentication**| `frontend/src/app/(auth)/login/`, `register/`, `callback/` | `fe-page-auth` | `engineering-integrity-and-evidence` |
| **User Settings & Update** | `frontend/src/app/user/[username]/settings/`, `update/` | `fe-page-user-management` | `engineering-integrity-and-evidence` |
| **Public Content & Legal** | `frontend/src/app/(public)/blog/`, `careers/`, `contact-us/`, `help/` | `fe-page-cms-public` | `engineering-integrity-and-evidence` |
| **Backend: Auth & Vault** | `backend/app/api/v1/endpoints/auth.py` | `be-service-auth` | `engineering-integrity-and-evidence` |
| **Backend: Candidate Profile**| `backend/app/api/v1/endpoints/profile.py` | `be-service-profile` | `engineering-integrity-and-evidence` |
| **Backend: Timeline CRUD** | `backend/app/api/v1/endpoints/timeline.py` | `be-service-timeline` | `engineering-integrity-and-evidence` |
| **Backend: Media & Video** | `backend/app/api/v1/endpoints/media.py` | `be-service-media` | `engineering-integrity-and-evidence` |
| **Backend: Trigram Search** | `backend/app/api/v1/endpoints/search.py` | `be-service-search` | `engineering-integrity-and-evidence` |
| **Backend: Master Catalogs**| `backend/app/api/v1/endpoints/catalogs.py` | `be-service-catalogs` | `engineering-integrity-and-evidence` |
| **Backend: CMS & Trust** | `backend/app/api/v1/endpoints/cms.py` | `be-service-cms` | `engineering-integrity-and-evidence` |
| **QC & Playwright Testing** | `qc/tests/` | `belooga-qc-engineering` | `engineering-integrity-and-evidence` |
| **Retrospective & Learning** | All postmortems & harness rules | `belooga-self-learn` | `engineering-integrity-and-evidence` |

---

## 4. CROSS-DEPARTMENTAL IMPACT MATRIX

When modifying a department, the agent must check and verify all downstream dependents:

```
┌───────────────────────────┐      Mutates Video Chunks / WebM Format
│     be-service-media      │────────────────────────────────────────────┐
└─────────────┬─────────────┘                                            │
              │ Ingests Resume PDF                                       │
              ▼                                                          ▼
┌───────────────────────────┐                              ┌───────────────────────────┐
│ fe-section-workspace-header│                             │fe-section-workspace-studio │
└───────────────────────────┘                              └─────────────┬─────────────┘
                                                                         │ Emits new pitch URL
                                                                         ▼
                                                           ┌───────────────────────────┐
                                                           │fe-section-pitch-player    │
                                                           │fe-page-public-profile     │
                                                           └───────────────────────────┘
```

* **Modifying `be-service-media`:** You MUST test `fe-section-workspace-studio` (chunk upload) and `fe-section-workspace-pitch-player` (playback).
* **Modifying `be-service-timeline`:** You MUST test `fe-section-workspace-timeline` (DnD reorder) and `be-service-media` (PDF resume generation).
* **Modifying `be-service-profile`:** You MUST test `fe-page-search` (TSVECTOR search vector update) and `fe-page-workspace` (profile data sync).

---

## 5. THE DUAL-KEY INDEPENDENT REVIEWER GATE

To ensure the CTO is not bogged down with manual code verification, every task undergoes an adversarial peer review:

1. **Frontend Isolation:**
   - Any PR affecting `frontend/src/` must be reviewed by an agent running the `fe-reviewer-guidelines` skill.
   - Reviewer audits Atomic Design sizing (< 350 lines), zero arbitrary hex tokens, leaf-node canvas isolation for 60fps VU meters, and strict zero-any TypeScript.
2. **Backend Isolation:**
   - Any PR affecting `backend/app/` must be reviewed by an agent running the `be-reviewer-guidelines` skill.
   - Reviewer audits Clean 4-Layer purity, AnyIO non-blocking event-loop safety, IDOR ownership guards, and pessimistic locking.
3. **Two-Key Approval Rule:**
   - A full-stack feature touching both FE and BE requires **both Reviewers to emit formal APPROVAL** before the Chief Architect gives final sign-off.

---

## 6. POST-FEATURE LEARNING & ANTI-REGRESSION PROTOCOL

1. **Self-Updating Knowledge Rule:**
   - After successfully implementing a new feature, the agent MUST inspect the relevant department skill in `.agents/skills/` and update any newly introduced contracts, parameters, or behaviors.
2. **Mistake Freezing (Zero Repeated Errors):**
   - If a bug is caught during the QC Gate or reported by the user:
     - The root cause MUST be permanently logged in `VIOLATIONS_REGISTER.md`.
     - The corresponding department skill MUST be updated with an explicit **"Known Pitfall / Anti-Regression Rule"**.
     - No agent may repeat a violation that has already been documented in the register.

---

## 7. MANDATORY PROOF BLOCK SPECIFICATION

Before closing any ticket, the agent must emit verified proof:

```markdown
### 🧾 Empirical Proof of Work
1. **Command:** `cd qc && bun run test <spec-file>`
2. **Exit Code:** `0`
3. **Log Proof:** `[Verified unedited output displaying test suite pass]`
4. **Compiler Proof:** `cd frontend && bun x tsc --noEmit` ➔ `Exit Code: 0`
5. **Reviewer Approvals:**
   - Frontend Review: APPROVED by Senior Frontend Lead Reviewer
   - Backend Review: APPROVED by Principal Backend Lead Reviewer
6. **Department Skill Updated:** `[Updated file path with brief summary of new knowledge]`
```
