# Agent Router, Architecture Mindmap & Execution Protocol

> **Purpose:** Routes every engineering task through the Adversarial Production Supervisor (`belooga-supervisor`), domain skills, empirical benchmarking, automated truth synchronization, and the Anti-Deception Trust Benchmark.

---

## 1. Master Agent Execution & Continuous Evolution Diagram

```mermaid
flowchart TD
    Req["User Request / New Tech Idea / Bug Report"] --> Step1["1. Supervisor Challenge & Research Gate (belooga-supervisor)\n• Query graphify -> CURRENT_STATE.md -> PRODUCT_THESIS.md -> Domain SKILL.md\n• Evaluate ROI, blast radius & 10x-100x scalability before coding"]
    Step1 --> Step2["2. Agile Branching & Stateful Memory (belooga-senior-agile-workflow)\n• Checkout feature/BEL-<id>-<slug>\n• Write hypothesis, risks & checklist in .agents/STATE.md (<= 50 lines)"]
    Step2 --> Step3["3. Empirical Benchmark & TDD Implementation (tdd-workflow + ponytail)\n• Compare candidate solutions via scripts/benchmark-*.py\n• Follow strict FE/BE layered pipeline & <= 300 lines/file cap"]
    Step3 --> Step4["4. Automated SSOT Sync & Verification Gates (definition-of-done)\n• generate-current-state.py + render-skill-facts.py --write\n• lint-skills.py + trust-benchmark.py + audit-truth.sh"]
    Step4 --> Step5["5. Adversarial Review, 5-Step Self-Learn & PR Merge (belooga-self-learn)\n• Run be-code-review / fe-code-review\n• Codify new patterns & traps into SKILL.md -> Open & Merge GitHub PR"]
```

---

## 2. Full-Stack Platform Architecture & Scalability Mindmap

```mermaid
flowchart LR
    subgraph FE["Frontend (Next.js 16 + React 19 + Bun)"]
        SEO["SSR SEO & Metadata\n(robots.ts, sitemap.ts, OG)"]
        RQ["State & Validation\n(TanStack Query + RHF + Zod)"]
        SW["Service Worker & PWA (sw.js)\n• Cache-First Static Shell\n• SWR Public Catalog Cache\n• Offline Mutation Outbox\n• Native Web Push & Deep-Link"]
    end

    subgraph GW_RPC["Edge & Transport Layer"]
        GW["Pure-ASGI API Gateway (gateway.py)\n• Bounded LRU GCRA Rate Limit\n• Route-Tiered RPM Policies\n• ETag 304 & Idempotency-Key"]
        RPC["ConnectRPC Batch Engine (rpc.py)\n• POST /v1/rpc/batch\n• Protobuf-Varint Binary Framing\n• Shared Profile Bundle Hydration"]
    end

    subgraph CORE["Domain Service, Cache & Event Stream Layer"]
        SVC["Domain Services (modules/*/service.py)\n• Atomic Unit-of-Work Commit\n• IDOR Ownership Verification"]
        CACHE["Two-Tier SWR Cache (cache.py)\n• L1 In-Memory LRU + L2 Redis\n• Per-Key Singleflight Lock\n• Mutation Cache Invalidation"]
        EVT["Kafka-Semantics Event Stream (events.py)\n• 4 CRC32 Partitions + Offsets\n• Micro-Batch Async Worker + DLQ"]
    end

    subgraph DATA_OPS["PostgreSQL 16 & Kubernetes Runtime"]
        PG["Single-Roundtrip SQL (PostgreSQL 16)\n• json_agg / ARRAY Dossier Hydration\n• Atomic Writeable CTE & Bulk CASE\n• GIN TSVECTOR + Composite B-Tree Indexes"]
        K8S["Kubernetes HPA & Probes (k8s/)\n• /health/live & /health/ready\n• Lifespan Drain + 2..10 Replicas"]
    end

    FE --> GW --> RPC --> SVC
    SVC --> CACHE
    SVC --> EVT
    SVC --> PG
    K8S -.-> GW
```

---

## 3. Intent-Based Skill Routing Matrix

| Scope / Department | Target Path | Skill |
| :--- | :--- | :--- |
| **Forensic Investigate & Plan (`/investigate`)** | Read-only trace & `.agents/STATE.md` | `investigate` |
| **Production Supervisor & Pushback** | All tasks, ideas & plans | `belooga-supervisor` |
| **All Tasks (Integrity & Evidence)** | All files | `engineering-integrity-and-evidence` |
| **DoD Quality Contract** | All completions & PRs | `definition-of-done` |
| **TDD & Bug Fixes** | Backend / tests / QC | `tdd-workflow` |
| **5-Step Self-Learn & Evolution**| `docs/VIOLATIONS_REGISTER.md`, `.agents/` | `belooga-self-learn` |
| **Senior Agile / Kanban Delivery** | Feature branches, PRs, Kanban tickets | `belooga-senior-agile-workflow` |
| **Default Code Compression** | All code implementations | `ponytail` |
| **UI/UX Design Intelligence** | Design tokens, palettes, UX checklists | `ui-ux-pro-max` |
| **Backend System Standards** | `backend/app/` | `belooga-backend-engineering` |
| **Frontend UI Standards** | `frontend/src/` | `belooga-frontend-engineering` |
| **QC & Playwright Testing** | `qc/` | `belooga-qc-engineering` |
| **Backend Code Review** | Backend PRs / diffs | `be-code-review` |
| **Frontend Code Review** | Frontend PRs / diffs | `fe-code-review` |
| **Backend: Core (Auth, Profile, Timeline, Media)** | `auth.py`, `profile.py`, `timeline.py`, `media.py` | `be-domain-core` |
| **Backend: Discovery (Search, Catalogs, CMS)** | `search.py`, `catalogs.py`, `cms.py` | `be-domain-discovery` |
| **Backend: Monetization (Review, ATS, Jobs, Analytics, MoMo)** | `expert_review.py`, `ats_matching.py`, `job_tracker.py`, `analytics.py`, `payments.py` | `be-domain-monetization` |
| **Frontend: Workspace, Studio & Auth** | `app/user/[username]/*`, `app/(auth)/*` | `fe-domain-workspace` |
| **Frontend: Public, Search & CMS** | `app/page.tsx`, `app/search/`, `app/public/[username]/`, `app/(public)/*` | `fe-domain-public` |
| **Frontend: Career Tools, ATS, Jobs & Analytics** | `app/(public)/expert-review/`, `app/ats-diagnostics/`, `app/cv-studio/`, `app/salary-benchmark/`, `app/workspace/jobs/`, `app/admin/analytics/` | `fe-domain-career-tools` |
| **Code Review for Bloat** | PR review for over-engineering | `ponytail-review` |
| **Repository Bloat Audit** | Whole-repo over-engineering scan | `ponytail-audit` |
| **Technical Debt Ledger** | Track ponytail shortcuts | `ponytail-debt` |

---

## 4. Cross-Domain Impact Matrix & Merge Conditions

When modifying a backend bounded context, verify its downstream frontend dependents:
- **`be-domain-core`:** Verify `fe-domain-workspace` (WebRTC studio, timeline DnD, auth, settings) and `fe-domain-public` (`/public/[username]` video & PDF).
- **`be-domain-discovery`:** Verify `fe-domain-public` (`/search`, `/contact-us`, `/careers`) and `fe-domain-career-tools` (`/salary-benchmark`).
- **`be-domain-monetization`:** Verify `fe-domain-career-tools` (`/expert-review`, `/ats-diagnostics`, `/workspace/jobs`, `/admin/analytics`, MoMo QR checkout).

Merge only when:
1. `python3 scripts/trust-benchmark.py` achieves **100% Trust Score (0 violations)**.
2. CI passes all verification gates: `bash scripts/audit-truth.sh`.
3. `python3 scripts/lint-skills.py --quiet` reports 0 ERROR.
