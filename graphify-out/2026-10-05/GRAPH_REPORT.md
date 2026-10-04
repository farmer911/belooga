# Graph Report - Beloga  (2026-10-05)

## Corpus Check
- 219 files · ~933,276 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: (none) 11, .lock 2, .css 2)

## Summary
- 1611 nodes · 2981 edges · 128 communities (98 shown, 30 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 141 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a47bd71b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- build_all_pages.py
- BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)
- 2. BACKEND DESIGN PATTERNS (BE & DISTRIBUTED SYSTEMS)
- 🧠 ADVANCED SYSTEMS ENGINEERING & COMPUTER SCIENCE KNOWLEDGE BASE
- Ponytail
- Belooga Design System & Tokens Guide
- Ponytail Help
- 🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint
- 🧠 Markmap Architect Skill
- Legacy Ground-Truth Enforcement & Anti-Hallucination Protocol
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- ponytail-debt/SKILL.md
- anti-hallucination-harness.md
- rules/graphify.md
- headroom.md
- ponytail.md
- workflows/graphify.md
- AsyncSession
- Button
- frontend/package.json
- @playwright/test
- Belooga Frontend Engineering Guide
- compilerOptions
- Belooga Backend Engineering Guide
- 🐋 BELOOGA — Master Migration & Conversion Blueprint
- dependencies
- 3. Phase-by-Phase Implementation Checklist
- ⚡ Belooga Backend Sub-Agent Execution Plan
- 🤖 Parallel 3-Sub-Agent Orchestration Blueprint
- compilerOptions
- 3. Strict Quality Gates & Anti-Regression Assertions
- README.md
- AGENTS.md
- postcss.config.mjs
- 3. Phase-by-Phase Implementation Checklist
- endpoints/media.py
- 2. 8 Service Domains & Verified API Catalog (36 Active Endpoints)
- security.py
- 🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS
- Belooga Platform
- 🧐 Principal Backend Lead Reviewer: Code Review SOP & Rejection Checklist
- 🧐 Senior Frontend Lead Reviewer: Code Review SOP & Rejection Checklist
- create_access_token
- 🧠 Belooga Self-Learn & Engineering Retrospective
- Workflow: Definition of Done (DoD)
- Workflow: Database Schema Change
- 🚫 Danh mục Vi phạm đã ghi nhận (Violations Log)
- Belooga Engineering System (GEMINI.md)
- ai-code-reviewer.py
- Workflow: Visual Verification
- 🏁 ENTERPRISE DEFINITION OF DONE (DoD) QUALITY CONTRACT
- cn
- 3. Quickstart Setup (Step-by-Step)
- 🚦 BELOOGA ENTERPRISE AGENT ROUTER & EXECUTION PROTOCOL
- app.js
- Homepage & Candidate Showcase (`/`)
- fe-page-workspace/SKILL.md
- devDependencies
- 🏛️ BELOOGA ARCHITECTURE DECISION RECORDS (ADR LOG)
- frontend.md
- Identity & Authentication (`/(auth)/...`)
- Public Candidate Profile (`/public/[username]`)
- Talent Discovery & Search (`/search`)
- legacy.md
- qc.md
- adr/README.md
- archive/README.md
- 1. The Non-Negotiable 3-Phase Cycle
- conftest.py
- Belooga Codebase Ground Truth (CURRENT_STATE.md)
- 🛡️ Mandatory Core Engineering Integrity & Evidence Protocol
- test_reorder_education_experiences_success
- Identity & Authentication Vault (Domain 1)
- Candidate User Management & Settings (`/user/[username]/update`, `/settings`)
- Master Catalogs & Taxonomies (Domain 7)
- Public CMS & Moderation (Domain 8)
- Media Processing & Document Generation (Domain 4)
- Candidate Profile (Domain 2)
- Talent Discovery & Search (Domain 6)
- Career Timeline & Reordering (Domain 3)
- Public Content, CMS & Compliance (`/(public)/...`)
- legacy/README.md
- test_backend_foundation.py
- scripts
- eslint.config.mjs
- audit-truth.sh
- AsyncClient
- endpoints/cms.py
- TimelineService
- env.py
- CatalogsService
- typing
- layout.tsx
- experience-timeline.tsx
- schemas/timeline.py
- AuthenticatedUser
- AsyncClient
- 2. Backend Clean Architecture (FastAPI + SQLAlchemy + Alembic)
- use-candidate-profile.ts
- cms_repo.py
- ai-pm-manager.py
- IdentityRepository
- BaseModel
- schemas/__init__.py
- generate-current-state.py
- ProfileRepository
- CandidateProfile
- ProfileMedia
- pathlib
- agent-dispatch.py
- generate-api-matrix.py
- media_service.py
- use-webrtc-studio.ts
- auth_service.py
- TimelineRepository
- user/[username]/page.tsx
- main.py
- pdf_generator.py
- pydantic
- test_media_chunk_upload_path_traversal_rejection
- empty-state.tsx

## God Nodes (most connected - your core abstractions)
1. `Button` - 57 edges
2. `react` - 52 edges
3. `AuthenticatedUser` - 49 edges
4. `lucide-react` - 41 edges
5. `cn()` - 39 edges
6. `ProfileRepository` - 30 edges
7. `AuthService` - 26 edges
8. `TimelineService` - 25 edges
9. `MediaService` - 23 edges
10. `next` - 22 edges

## Surprising Connections (you probably didn't know these)
- `F-04 · Mâu thuẫn auth ở public profile / PDF` --references--> `get_current_user()`  [INFERRED]
  BELOOGA_SKILL_REVIEW.md → backend/app/core/security.py
- `5. Security & Concurrency Verification Summary` --references--> `verify_profile_owner()`  [INFERRED]
  CURRENT_STATE.md → backend/app/core/security.py
- `Phase 4: Domain 3 — Timeline Sections CRUD & Concurrency Reordering (15 APIs)` --references--> `AwardCertification`  [INFERRED]
  docs/archive/PLAN_BACKEND.md → backend/app/models/timeline.py
- `2. Backend API Inventory (`backend/app/api/v1/endpoints/`)` --references--> `check_email_exists()`  [INFERRED]
  CURRENT_STATE.md → backend/app/api/v1/endpoints/auth.py
- `2. Backend API Inventory (`backend/app/api/v1/endpoints/`)` --references--> `check_username_exists()`  [INFERRED]
  CURRENT_STATE.md → backend/app/api/v1/endpoints/auth.py

## Import Cycles
- None detected.

## Communities (128 total, 30 thin omitted)

### Community 0 - "build_all_pages.py"
Cohesion: 0.44
Nodes (15): build_account_setting_scene(), build_blog_scene(), build_careers_scene(), build_contact_us_scene(), build_help_scene(), build_legal_scenes(), build_not_found_scene(), build_public_profile_scene() (+7 more)

### Community 1 - "BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)"
Cohesion: 0.06
Nodes (30): 0. Phạm vi review, 1. Protocol phản biện (BẮT BUỘC), 2. Kết luận tổng, 3. Findings, 4. Skill context knowledge còn thiếu, 5. Kiến trúc tri thức mục tiêu, 6. Tiêu chí S-tier (kiểm chứng được), 7. Nâng cấp `scripts/audit-truth.sh` (bắt buộc chạy trong CI) (+22 more)

### Community 2 - "2. BACKEND DESIGN PATTERNS (BE & DISTRIBUTED SYSTEMS)"
Cohesion: 0.07
Nodes (27): 1. CORE ARCHITECTURAL PHILOSOPHY, 2.1. Clean 4-Layer Architecture (Ports & Adapters), 2.2. Repository & Unit of Work (UoW) Pattern, 2.3. Pessimistic Concurrency Locking Pattern (`SELECT FOR UPDATE`), 2.4. CQRS (Command Query Responsibility Segregation) with GIN/Trigram Indexing, 2.5. Transactional Outbox Pattern, 2.6. Non-Blocking Event-Loop Offloading Pattern, 2.7. Circuit Breaker & Exponential Backoff with Full Jitter (+19 more)

### Community 3 - "🧠 ADVANCED SYSTEMS ENGINEERING & COMPUTER SCIENCE KNOWLEDGE BASE"
Cohesion: 0.07
Nodes (26): 10. POSTGRESQL ADVISORY LOCKS FOR CONCURRENT ASYNC CHUNK WRITES, 11. CROSS-ORIGIN COOKIE TOPOLOGY & THE BFF (BACKEND-FOR-FRONTEND) PATTERN, 12. MASTER TECHNICAL KNOWLEDGE AUDIT CHECKLIST, 1. CORE ENGINEERING PHILOSOPHY, 2.1. PostgreSQL MVCC & Dead Tuple Bloat, 2.2. Transaction Anomalies & The Write Skew Trap, 2.3. Query Optimizer Join Algorithms, 2. DATABASE INTERNALS & CONCURRENCY ANOMALIES (+18 more)

### Community 4 - "Ponytail"
Cohesion: 0.22
Nodes (8): Boundaries, Intensity, Output, Persistence, Ponytail, Rules, The ladder, When NOT to be lazy

### Community 5 - "Belooga Design System & Tokens Guide"
Cohesion: 0.22
Nodes (8): 🎨 1. Brand & Primary Colors (Màu chủ đạo & Điểm nhấn), 🖋 2. Text & Typography Colors (Màu văn bản), 📐 3. Surfaces, Borders & Elevation (Nền, Viền & Đổ bóng), 🔤 4. Typography System (Hệ thống Kiểu chữ), 💻 5. CSS / SCSS Variable Snippet (Sẵn sàng tái sử dụng), Belooga Design System & Tokens Guide, Cỡ chữ & Dòng (Scale), Font Families

### Community 6 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 7 - "🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint"
Cohesion: 0.09
Nodes (22): 1.1 Project Identity & Core Value Proposition, 1.2 The Conversion Mandate, 3.1 CSS Design Tokens, 3.2 Exact Video Play Button Specification, 4.1 Recommended Modern Stack, 4.2 Modern Directory Structure, 🛡️ Anti-Hallucination Engineering Harness (Lessons Learned & Violations Register), 🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint (+14 more)

### Community 8 - "🧠 Markmap Architect Skill"
Cohesion: 0.29
Nodes (6): 1. When to Activate This Skill, 2. Core Mindmap Engines Supported, 3. Structural Rules for High-Density Technical Mindmaps, Engine A: Native Mermaid Mindmap (In-chat Markdown), Engine B: Interactive Standalone Markmap HTML/SVG (Recommended for Deep Reading), 🧠 Markmap Architect Skill

### Community 9 - "Legacy Ground-Truth Enforcement & Anti-Hallucination Protocol"
Cohesion: 0.33
Nodes (5): 1. Core Principles, 2. Asset & Iconography Extraction Workflow, 3. Mandatory Interactive & Visual Verification Gate, 4. Quality Checklist Before Response, Legacy Ground-Truth Enforcement & Anti-Hallucination Protocol

### Community 10 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Hunt, Output, Tags

### Community 11 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 12 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Examples, Format, Scoring

### Community 13 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 19 - "AsyncSession"
Cohesion: 0.30
Nodes (7): check_email_exists(), check_username_exists(), get_current_session_user(), login(), logout(), refresh_tokens(), register_user()

### Community 20 - "Button"
Cohesion: 0.09
Nodes (29): Phase 2: Page Object Models (POMs) Development (`qc/pages/`), nextConfig, ForgotPasswordPage(), NotFound(), HomePage(), CareersPage(), ContactUsPage(), HelpPage() (+21 more)

### Community 21 - "frontend/package.json"
Cohesion: 0.09
Nodes (21): ignoreScripts, @types/node, typescript, name, packageManager, private, trustedDependencies, version (+13 more)

### Community 22 - "@playwright/test"
Cohesion: 0.07
Nodes (17): description, devDependencies, @playwright/test, @types/node, typescript, @types/node, typescript, name (+9 more)

### Community 23 - "Belooga Frontend Engineering Guide"
Cohesion: 0.29
Nodes (6): Architectural Invariants, Belooga Frontend Engineering Guide, Core Design Tokens (`src/app/globals.css`), Current Reality (AS-IS), Known Traps, Self-Verification

### Community 24 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 25 - "Belooga Backend Engineering Guide"
Cohesion: 0.33
Nodes (5): Belooga Backend Engineering Guide, Core Architectural Invariants, Current Reality (AS-IS), Infrastructure Configuration, Self-Verification

### Community 26 - "🐋 BELOOGA — Master Migration & Conversion Blueprint"
Cohesion: 0.12
Nodes (15): 1.1 Project Identity, 1.2 Conversion Mandate, 1. Executive Summary & Conversion Mission, 2. Complete Legacy Route Inventory & Parity Matrix (All 16 Routes), 3.1 Strict Icon & Play Button Geometry Standard, 3. Design System Tokens & Visual Foundations, 4. Component Architecture & Conversion Hierarchy, 5. Engineering Quality Harness (Operational Violations Log) (+7 more)

### Community 27 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, axios, clsx, @hookform/resolvers, lucide-react, next, react, react-dom (+5 more)

### Community 28 - "3. Phase-by-Phase Implementation Checklist"
Cohesion: 0.14
Nodes (13): 1. Sub-Agent Mission & Anti-Hallucination Boundaries, 2. Parallel Synchronization Milestones, 3. Phase-by-Phase Implementation Checklist, 4. Definition of Done (DoD), 🚀 Belooga Frontend Sub-Agent Execution Plan, Phase 1: Foundation, Asset Pipeline & Design Tokens, Phase 2: Common UI Primitives (`src/components/ui/`), Phase 3: Services & State Architecture (+5 more)

### Community 29 - "⚡ Belooga Backend Sub-Agent Execution Plan"
Cohesion: 0.40
Nodes (4): 1. Sub-Agent Mission & Concurrency Rules, 2. Parallel Synchronization Milestones, 4. Definition of Done (DoD), ⚡ Belooga Backend Sub-Agent Execution Plan

### Community 30 - "🤖 Parallel 3-Sub-Agent Orchestration Blueprint"
Cohesion: 0.17
Nodes (11): 1. Sub-Agent Roster & Operational Boundaries, 2. Sub-Agent Profiles & Execution Briefs, 3. Parallel Execution Matrix (Milestones M1 – M5), 4. Immediate Commands to Run, Backend:, Frontend:, 🤖 Parallel 3-Sub-Agent Orchestration Blueprint, QC / Playwright: (+3 more)

### Community 31 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 32 - "3. Strict Quality Gates & Anti-Regression Assertions"
Cohesion: 0.20
Nodes (9): 1. Technical Stack & Test Environment, 2. Test Architecture & Directory Layout, 3. Strict Quality Gates & Anti-Regression Assertions, 4. Playwright Configuration (`playwright.config.ts`), 🛡️ Belooga QC & Automation Testing Engineering Guide, Gate 1: TC-VIS-001 — 54px Play Button & Pure CSS Triangle, Gate 2: TC-VIS-002 — Literal Asset Resolution & Zero Synthetic SVGs, Gate 3: TC-AUTH-002 — Zero Token Leakage in Client Storage (+1 more)

### Community 33 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 37 - "3. Phase-by-Phase Implementation Checklist"
Cohesion: 0.18
Nodes (10): 1. Sub-Agent Mission & Quality Gates, 2. Parallel Synchronization Milestones, 3. Phase-by-Phase Implementation Checklist, 4. Definition of Done (DoD), 🛡️ Belooga QC & Automation Testing Sub-Agent Execution Plan, Phase 1: Test Harness & Environment Setup, Phase 3: Suite 1 — Anti-Hallucination & Visual Regression Gate, Phase 4: Suite 2 — Authentication & Security E2E (`tests/e2e/auth-flow.spec.ts`) (+2 more)

### Community 38 - "endpoints/media.py"
Cohesion: 0.25
Nodes (8): complete_chunked_video_upload(), delete_resume(), generate_candidate_pdf(), get_video_transcoding_status(), upload_avatar(), upload_resume(), upload_video_chunk(), MediaService

### Community 41 - "2. 8 Service Domains & Verified API Catalog (36 Active Endpoints)"
Cohesion: 0.13
Nodes (14): 1. 16-Route Frontend Page Inventory, 2. 8 Service Domains & Verified API Catalog (36 Active Endpoints), 3. Database Schema Mapping (24 Tables in `backend/initdb.sql`), 4. QC Automation & Testing Matrix, 🧠 Belooga Master Knowledge Vault & API / Page Catalog, Domain 1: Identity & Authentication Vault — 7 Endpoints, Domain 2: Candidate Profiles — 4 Endpoints, Domain 3: Career Timeline & Reordering — 8 Endpoints (+6 more)

### Community 42 - "security.py"
Cohesion: 0.20
Nodes (3): get_password_hash(), verify_identity_owner(), verify_password()

### Community 43 - "🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS"
Cohesion: 0.20
Nodes (9): 1. COMPONENT-SCOPED PAGE OBJECT MODEL (POM) ARCHITECTURE, 2. DETERMINISTIC LOCATOR HIERARCHY, 3. ZERO-SLEEP & ANTI-FLAKINESS INVARIANTS, 4. HERMETIC TEST FIXTURES & DATA ISOLATION, 5. VISUAL REGRESSION & CANVAS STABILIZATION, 6. REJECTION CHECKLIST FOR SENIOR QC CODE, Best Practice Blueprint:, 🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS (+1 more)

### Community 44 - "Belooga Platform"
Cohesion: 0.12
Nodes (16): 1. Verified Tech Stack (Ground Truth), 2. Infrastructure & Port Mapping, 3. The 5 Absolute Prohibitions (Ground Rules for ALL AI Agents), 4. Autonomous Agent Engineering Workflow, 5.1 First-Time Setup, 5.2 Running the Application, 5.3 Running Tests & Audits, 5. Developer Quickstart Cheat Sheet (+8 more)

### Community 45 - "🧐 Principal Backend Lead Reviewer: Code Review SOP & Rejection Checklist"
Cohesion: 0.25
Nodes (7): 1. Core Reviewer Philosophy & Governance, 2. Red-Line Instant Rejection Checklist (The "Kill-Switch" Criteria), 3. The 3-Step Backend Review SOP (Standard Operating Procedure), 4. Formal Reviewer Decision Templates, 🟢 Approval Template (Emit only when all 3 steps pass 100%):, 🧐 Principal Backend Lead Reviewer: Code Review SOP & Rejection Checklist, 🔴 Rejection Template (Emit when code fails any check):

### Community 46 - "🧐 Senior Frontend Lead Reviewer: Code Review SOP & Rejection Checklist"
Cohesion: 0.25
Nodes (7): 1. Core Reviewer Philosophy & Governance, 2. Red-Line Instant Rejection Checklist (The "Kill-Switch" Criteria), 3. The 3-Step Frontend Review SOP (Standard Operating Procedure), 4. Formal Reviewer Decision Templates, 🟢 Approval Template (Emit only when all 3 steps pass 100%):, 🔴 Rejection Template (Emit when code fails any check):, 🧐 Senior Frontend Lead Reviewer: Code Review SOP & Rejection Checklist

### Community 47 - "create_access_token"
Cohesion: 0.18
Nodes (8): create_access_token(), generate_refresh_token(), hash_token(), _build_user_dto(), _set_refresh_cookie(), test_refresh_token_grace_window_allows_concurrent_tabs(), test_refresh_token_replay_attack_revokes_entire_family(), test_refresh_token_rotation_success()

### Community 48 - "🧠 Belooga Self-Learn & Engineering Retrospective"
Cohesion: 0.33
Nodes (5): 1. When to Trigger Self-Learn, 2. The 3-Step Lesson Formula, 3. Destination Routing Matrix, 4. Execution Protocol, 🧠 Belooga Self-Learn & Engineering Retrospective

### Community 49 - "Workflow: Definition of Done (DoD)"
Cohesion: 0.25
Nodes (7): Step 1: Regenerate Single Source of Truth, Step 2: Run SSOT Ground Truth Auditor, Step 3: Run Backend Tests, Step 4: Run Frontend Typecheck, Step 5: Visual Verification (If UI was modified), Step 6: Git Status Review, Workflow: Definition of Done (DoD)

### Community 50 - "Workflow: Database Schema Change"
Cohesion: 0.25
Nodes (7): 1. Edit Schema Definition, 2. Update Seed Data, 3. Reset Local & Test Database, 4. Run Pytest Suite, 5. Regenerate SSOT, 6. Run SSOT Audit, Workflow: Database Schema Change

### Community 51 - "🚫 Danh mục Vi phạm đã ghi nhận (Violations Log)"
Cohesion: 0.25
Nodes (7): Belooga Engineering Harness & Anti-Hallucination Violations Register, 🚫 Danh mục Vi phạm đã ghi nhận (Violations Log), 🛡 Quy luật Harness Nâng Cao (Agent Strict Operational Rules), [VIOLATION-001] Tự ý vẽ SVG / Icon xấp xỉ thay vì dùng asset gốc, [VIOLATION-002] Hiển thị icon Play đè lên ảnh walkthrough sai lệch quy chuẩn SCSS gốc, [VIOLATION-003] Dùng icon font / background teal cho nút play walkthrough thay vì Stack Theme pure CSS, [VIOLATION-004] Hallucinate style cho `.modal-trigger` gây xung đột biến nút play thành hình Elip đen khổng lồ & Báo cáo hoàn thành khi chưa test hover

### Community 52 - "Belooga Engineering System (GEMINI.md)"
Cohesion: 0.25
Nodes (6): CLAUDE.md (Redirect to GEMINI.md), 1. Verified Tech Stack (Ground Truth), 2. Precedence of Truth, 3. Top 5 Absolute Prohibitions, 4. Task Routing, Belooga Engineering System (GEMINI.md)

### Community 53 - "ai-code-reviewer.py"
Cohesion: 0.19
Nodes (7): call_gemini_api(), discover_gemini_models(), get_git_diff(), main(), post_github_comment(), read_project_rules(), write_step_summary()

### Community 54 - "Workflow: Visual Verification"
Cohesion: 0.33
Nodes (5): 1. Locate Legacy Source, 2. Check CSS Scoping, 3. Live Browser Inspection, 4. Run Playwright Visual Tests, Workflow: Visual Verification

### Community 55 - "🏁 ENTERPRISE DEFINITION OF DONE (DoD) QUALITY CONTRACT"
Cohesion: 0.20
Nodes (9): 1. THE DEFINITION OF DONE MANDATE, 2. LAYER 1: ARCHITECTURAL PURITY & DESIGN PATTERNS, 3. LAYER 2: COMPUTATIONAL COMPLEXITY & PERFORMANCE BUDGETS, 4. LAYER 3: CLIENT RESILIENCE, SECURITY & ERROR BOUNDARIES, 5. LAYER 4: DATABASE MIGRATION & ZERO-DOWNTIME EVOLUTION, 6. LAYER 5: TESTING PYRAMID & ZERO-FLAKINESS INVARIANTS, 7. LAYER 6: OBSERVABILITY, AUDIT & HEALTH PROBES, 8. LAYER 7: DUAL-KEY REVIEWER APPROVAL & PROOF BLOCK (+1 more)

### Community 56 - "cn"
Cohesion: 0.11
Nodes (24): AudioVisualizerMeterProps, FormField(), FormFieldProps, SkillBadge(), SkillBadgeProps, Avatar, AvatarProps, getInitials() (+16 more)

### Community 57 - "3. Quickstart Setup (Step-by-Step)"
Cohesion: 0.09
Nodes (22): 1. System Architecture & Tech Stack, 2. Infrastructure Port Allocation Matrix, 3. Quickstart Setup (Step-by-Step), 4. Pre-seeded Test Accounts & Personas, 5. Architectural Ground Truth & Known Gap Registry, 6.1: Run Full Truth Audit, 6.2: Run Backend Integration Test Suite, 6.3: Run Frontend TypeScript Typecheck (+14 more)

### Community 58 - "🚦 BELOOGA ENTERPRISE AGENT ROUTER & EXECUTION PROTOCOL"
Cohesion: 0.22
Nodes (8): 1. PURPOSE & ORGANIZATIONAL OPERATING MODEL, 2. THE MANDATORY 6-STEP EXECUTION PIPELINE, 3. INTENT-BASED SKILL ROUTING MATRIX, 4. CROSS-DEPARTMENTAL IMPACT MATRIX, 5. THE DUAL-KEY INDEPENDENT REVIEWER GATE, 6. POST-FEATURE LEARNING & ANTI-REGRESSION PROTOCOL, 7. MANDATORY PROOF BLOCK SPECIFICATION, 🚦 BELOOGA ENTERPRISE AGENT ROUTER & EXECUTION PROTOCOL

### Community 60 - "Homepage & Candidate Showcase (`/`)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Homepage & Candidate Showcase (`/`), Known Traps, Project-Specific Rules, Self-Verification

### Community 61 - "fe-page-workspace/SKILL.md"
Cohesion: 0.05
Nodes (35): 1. Scope Boundary, 2.1. Avatar Upload, 2.2. Metadata Updates, 2.3. PDF Resume Download, 2. API Contracts & Network Mutations, 3. QC Anti-Regression Selectors (Mandatory Preservation), 👤 Section Skill: Profile Header & Identity Management, 1. Scope Boundary (+27 more)

### Community 62 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 63 - "🏛️ BELOOGA ARCHITECTURE DECISION RECORDS (ADR LOG)"
Cohesion: 0.25
Nodes (7): ADR-001: Selection of Bun over Node.js for Frontend & QC Tooling, ADR-002: Next.js 14+ App Router & Server/Client Segregation, ADR-003: FastAPI & Python 3.12+ Async for Modular Monolith Backend, ADR-004: SQLAlchemy 2.0 Async Mapped Models & Unit of Work, ADR-005: PostgreSQL 16 TSVECTOR with GIN Index over External Search Engine, ADR-006: ReportLab Python Canvas over Headless Browser for PDF Resumes, 🏛️ BELOOGA ARCHITECTURE DECISION RECORDS (ADR LOG)

### Community 65 - "Identity & Authentication (`/(auth)/...`)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Identity & Authentication (`/(auth)/...`), Known Traps, Project-Specific Rules, Self-Verification

### Community 66 - "Public Candidate Profile (`/public/[username]`)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Known Traps, Project-Specific Rules, Public Candidate Profile (`/public/[username]`), Self-Verification

### Community 67 - "Talent Discovery & Search (`/search`)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Known Traps, Project-Specific Rules, Self-Verification, Talent Discovery & Search (`/search`)

### Community 72 - "1. The Non-Negotiable 3-Phase Cycle"
Cohesion: 0.25
Nodes (7): 1. The Non-Negotiable 3-Phase Cycle, 2. Prohibited Anti-Patterns, 3. Standard Verification Commands, 🔴🟢 Mandatory TDD Workflow Standard Operating Procedure (SOP), Phase 1: RED (Test First & Prove the Defect), Phase 2: GREEN (Minimal Sane Fix), Phase 3: REFACTOR & Regression Verification

### Community 73 - "conftest.py"
Cohesion: 0.20
Nodes (5): client(), db_session(), ensure_test_database_seeded(), test_candidate_a(), test_candidate_b()

### Community 74 - "Belooga Codebase Ground Truth (CURRENT_STATE.md)"
Cohesion: 0.22
Nodes (8): 1. Database Schema Truth (`backend/initdb.sql`), 3. Frontend Routes Inventory (`frontend/src/app`), 4.1 Backend (`backend/requirements.txt`), 4.2 Frontend (`frontend/package.json`), 4. Package & Dependency Ground Truth, 5. Security & Concurrency Verification Summary, 6. Known Architecture Gaps & Stub Registry (AS-IS vs TO-BE), Belooga Codebase Ground Truth (CURRENT_STATE.md)

### Community 75 - "🛡️ Mandatory Core Engineering Integrity & Evidence Protocol"
Cohesion: 0.29
Nodes (6): 1. Pillar 1: The "No Proof = Not Done" Iron Rule, 2. Pillar 2: Mandatory Inquiry Protocol (Uncertainty = Mandatory Question), 3. Pillar 3: Zero Full-Stack Hallucination, 4. Pillar 4: Blacklist of Deceptive Behaviors, 5. Pillar 5: Radical Transparency & Honest Reporting, 🛡️ Mandatory Core Engineering Integrity & Evidence Protocol

### Community 77 - "Identity & Authentication Vault (Domain 1)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Identity & Authentication Vault (Domain 1), Known Traps, Project-Specific Rules, Self-Verification

### Community 78 - "Candidate User Management & Settings (`/user/[username]/update`, `/settings`)"
Cohesion: 0.29
Nodes (6): Candidate User Management & Settings (`/user/[username]/update`, `/settings`), Canonical Example, Current Reality (AS-IS), Known Traps, Project-Specific Rules, Self-Verification

### Community 79 - "Master Catalogs & Taxonomies (Domain 7)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Known Traps, Master Catalogs & Taxonomies (Domain 7), Project-Specific Rules, Self-Verification

### Community 80 - "Public CMS & Moderation (Domain 8)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Known Traps, Project-Specific Rules, Public CMS & Moderation (Domain 8), Self-Verification

### Community 81 - "Media Processing & Document Generation (Domain 4)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Known Traps, Media Processing & Document Generation (Domain 4), Project-Specific Rules, Self-Verification

### Community 82 - "Candidate Profile (Domain 2)"
Cohesion: 0.29
Nodes (6): Candidate Profile (Domain 2), Canonical Example, Current Reality (AS-IS), Known Traps, Project-Specific Rules, Self-Verification

### Community 83 - "Talent Discovery & Search (Domain 6)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Known Traps, Project-Specific Rules, Self-Verification, Talent Discovery & Search (Domain 6)

### Community 84 - "Career Timeline & Reordering (Domain 3)"
Cohesion: 0.29
Nodes (6): Canonical Example, Career Timeline & Reordering (Domain 3), Current Reality (AS-IS), Known Traps, Project-Specific Rules, Self-Verification

### Community 85 - "Public Content, CMS & Compliance (`/(public)/...`)"
Cohesion: 0.29
Nodes (6): Canonical Example, Current Reality (AS-IS), Known Traps, Project-Specific Rules, Public Content, CMS & Compliance (`/(public)/...`), Self-Verification

### Community 87 - "test_backend_foundation.py"
Cohesion: 0.08
Nodes (21): CatalogCompany, CatalogLocation, CatalogSchool, Interest, Language, Skill, CareerApplication, CareerPosting (+13 more)

### Community 88 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 89 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 91 - "AsyncClient"
Cohesion: 0.27
Nodes (4): test_idor_cross_user_media_upload_forbidden(), test_idor_cross_user_profile_mutation_forbidden(), test_idor_cross_user_timeline_mutation_forbidden(), test_unauthenticated_mutations_rejected()

### Community 92 - "endpoints/cms.py"
Cohesion: 0.16
Nodes (7): get_faqs(), list_career_jobs(), report_candidate_profile(), submit_contact_inquiry(), ContactInquiryRequest, ReportProfileRequest, CmsService

### Community 93 - "TimelineService"
Cohesion: 0.20
Nodes (9): create_education(), create_job_experience(), delete_education(), delete_job_experience(), list_education_experiences(), list_job_experiences(), reorder_education_experiences(), reorder_job_experiences() (+1 more)

### Community 94 - "env.py"
Cohesion: 0.12
Nodes (6): do_run_migrations(), get_database_url(), run_async_migrations(), run_migrations_offline(), run_migrations_online(), seed()

### Community 95 - "CatalogsService"
Cohesion: 0.09
Nodes (8): list_skills(), suggest_companies(), suggest_locations(), suggest_schools(), search_candidates(), search_suggestions(), CatalogsRepository, CatalogsService

### Community 96 - "typing"
Cohesion: 0.10
Nodes (6): add_candidate_skill(), get_db(), ProfileLanguageItem, ProfileUpdate, SkillAdd, SkillResponse

### Community 97 - "layout.tsx"
Cohesion: 0.21
Nodes (9): LoginPage(), RegisterPage(), metadata, RootLayout(), Footer(), Header(), AuthState, useAuthStore (+1 more)

### Community 98 - "experience-timeline.tsx"
Cohesion: 0.16
Nodes (31): ConfirmDialog(), ConfirmDialogProps, SkillsCard(), SkillsCardProps, SUGGESTIONS, EducationTimeline(), EducationTimelineProps, ExperienceTimeline() (+23 more)

### Community 99 - "schemas/timeline.py"
Cohesion: 0.14
Nodes (9): AwardCertificationCreate, AwardCertificationResponse, EducationCreate, EducationResponse, JobExperienceCreate, JobExperienceResponse, JobExperienceUpdate, ReorderItem (+1 more)

### Community 100 - "AuthenticatedUser"
Cohesion: 0.12
Nodes (7): Backend Rules (FastAPI + SQLAlchemy 2.0 Async), get_candidate_public_profile(), remove_candidate_skill(), update_candidate_profile(), AuthenticatedUser, verify_profile_owner(), ProfileService

### Community 101 - "AsyncClient"
Cohesion: 0.16
Nodes (8): test_anonymous_profile_view_does_not_leak_pii(), test_cross_user_upload_completion_rejection(), test_happy_path_chunked_upload_and_complete(), test_hidden_profile_blocks_anonymous_and_other_users(), test_hidden_profile_pdf_blocks_unauthorized_access(), test_owner_profile_view_includes_pii(), test_profile_has_zero_hardcoded_mock_fallbacks(), test_search_suggest_filters_hidden_profiles()

### Community 102 - "2. Backend Clean Architecture (FastAPI + SQLAlchemy + Alembic)"
Cohesion: 0.12
Nodes (16): 1. Architectural Mandates, 2. Backend Clean Architecture (FastAPI + SQLAlchemy + Alembic), 3. Frontend Architecture (Next.js 16 + React 19 + Atomic Design), 4. Verification & Quality Gates, A. Atoms - components/ui/, A. Router Layer (Thin Controllers) - app/api/v1/endpoints/, B. Molecules - components/common/, B. Service Layer (Business Domain) - app/services/ (+8 more)

### Community 103 - "use-candidate-profile.ts"
Cohesion: 0.29
Nodes (8): PublicCandidatePage(), ProfileHeaderCardProps, CandidateProfile, useCandidateProfile(), ChunkUploadProgress, downloadCandidatePdf(), uploadAvatar(), uploadResume()

### Community 104 - "cms_repo.py"
Cohesion: 0.18
Nodes (3): ContactInquiry, ProfileReport, CmsRepository

### Community 106 - "ai-pm-manager.py"
Cohesion: 0.18
Nodes (6): call_gemini_api(), create_github_task_issue(), discover_gemini_models(), get_issue_details(), main(), post_issue_comment()

### Community 108 - "BaseModel"
Cohesion: 0.22
Nodes (4): CareerPostingResponse, ContactInquiryResponse, JobApplicantRequest, ReportProfileResponse

### Community 109 - "schemas/__init__.py"
Cohesion: 0.20
Nodes (6): ChunkUploadRequest, ChunkUploadResponse, CompleteUploadRequest, MediaResponse, ProfileResponse, test_pydantic_v2_schemas_contracts()

### Community 110 - "generate-current-state.py"
Cohesion: 0.36
Nodes (6): extract_backend_routes(), extract_database_tables(), extract_dependencies(), extract_frontend_routes(), get_git_info(), main()

### Community 112 - "CandidateProfile"
Cohesion: 0.23
Nodes (6): TimestampMixin, CandidateProfile, AwardCertification, EducationExperience, JobExperience, test_orm_identity_and_profile_crud_cycle()

### Community 113 - "ProfileMedia"
Cohesion: 0.22
Nodes (7): ProfileMedia, VideoArchive, 3. Phase-by-Phase Implementation Checklist, Phase 1: Environment & Database Infrastructure, Phase 3: Domain 2 & 4 — Candidate Profile & Media Storage (20 APIs), Phase 4: Domain 3 — Timeline Sections CRUD & Concurrency Reordering (15 APIs), Phase 5: Domain 5 & 6 — WebRTC Studio & Talent Search (8 APIs)

### Community 117 - "media_service.py"
Cohesion: 0.12
Nodes (10): assemble_chunks_async(), _assemble_chunks_sync(), extract_poster_thumbnail(), get_validated_upload_dir(), probe_video_duration(), run_cmd_async(), _run_cmd_sync(), transcode_to_streaming_mp4() (+2 more)

### Community 118 - "use-webrtc-studio.ts"
Cohesion: 0.20
Nodes (18): AudioVisualizerMeter(), StudioToolbar(), StudioToolbarProps, StudioViewfinder(), StudioViewfinderProps, WebRTCStudioModal(), useAudioMeter(), useTeleprompter() (+10 more)

### Community 119 - "auth_service.py"
Cohesion: 0.24
Nodes (6): CheckAvailabilityResponse, LoginRequest, RegisterRequest, TokenResponse, UserProfileDTO, AuthService

### Community 121 - "user/[username]/page.tsx"
Cohesion: 0.17
Nodes (14): WebRTCStudioModal, WorkspacePage(), ResumeAttachmentCard(), ResumeAttachmentCardProps, VideoPitchCard(), VideoPitchCardProps, VideoPitchModal(), VideoPitchModalProps (+6 more)

### Community 122 - "main.py"
Cohesion: 0.21
Nodes (6): get_current_user(), get_current_user_optional(), api_root(), health_check(), lifespan(), 2. Backend API Inventory (`backend/app/api/v1/endpoints/`)

### Community 126 - "empty-state.tsx"
Cohesion: 0.50
Nodes (4): EmptyState(), EmptyStateAction, EmptyStateProps, ButtonProps

## Knowledge Gaps
- **534 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+529 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 834 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `typing`, `endpoints/media.py`, `security.py`, `AsyncSession`, `media_service.py`, `auth_service.py`, `main.py`, `pdf_generator.py`, `TimelineService`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `get_current_user()` connect `main.py` to `typing`, `BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)`, `AuthenticatedUser`, `endpoints/media.py`, `security.py`, `auth_service.py`, `TimelineService`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `F-04 · Mâu thuẫn auth ở public profile / PDF` connect `BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)` to `main.py`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `AuthenticatedUser` (e.g. with `get_current_session_user()` and `complete_chunked_video_upload()`) actually correct?**
  _`AuthenticatedUser` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _534 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `2. BACKEND DESIGN PATTERNS (BE & DISTRIBUTED SYSTEMS)` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._