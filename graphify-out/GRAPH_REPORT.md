# Graph Report - Beloga  (2026-10-05)

## Corpus Check
- 245 files · ~945,336 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 8, .lock 2, .css 2)

## Summary
- 1753 nodes · 3537 edges · 151 communities (117 shown, 34 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 239 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ffb4c145`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- build_all_pages.py
- BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)
- candidate-orders-list.tsx
- sys
- Ponytail
- Belooga Design System & Tokens Guide
- ai-pm-manager.py
- 🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint
- BELOOGA — Skill Review & Upgrade Plan (mục tiêu: mọi skill ≥ 8.5)
- BELOOGA — Skill Review & Upgrade Plan (mục tiêu: mọi skill ≥ 8.5)
- Ponytail Repository Audit
- CatalogsRepository
- Ponytail Code Review
- Ponytail Technical Debt Ledger
- anti-hallucination-harness.md
- rules/graphify.md
- headroom.md
- Ponytail, lazy senior dev mode
- workflows/graphify.md
- webrtc-studio-modal.tsx
- Button
- frontend/package.json
- @playwright/test
- Belooga Frontend Engineering Architecture
- compilerOptions
- Belooga Backend Engineering Architecture
- 🐋 BELOOGA — Master Migration & Conversion Blueprint
- dependencies
- 3. Phase-by-Phase Implementation Checklist
- ⚡ Belooga Backend Sub-Agent Execution Plan
- 🤖 Parallel 3-Sub-Agent Orchestration Blueprint
- compilerOptions
- Belooga QC & Automated Testing Engineering Guide
- README.md
- AGENTS.md
- postcss.config.mjs
- 3. Phase-by-Phase Implementation Checklist
- MediaService
- CatalogsService
- profile_repo.py
- 🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS
- Belooga Platform
- 🧐 Principal Backend Lead Reviewer: Code Review SOP & Rejection Checklist
- 🧐 Senior Frontend Lead Reviewer: Code Review SOP & Rejection Checklist
- auth_service.py
- Belooga Continuous Learning Protocol
- Workflow: Definition of Done (DoD)
- Workflow: Database Schema Change
- 4. Phát hiện hệ thống (có bằng chứng)
- Belooga Engineering System (GEMINI.md)
- ai-code-reviewer.py
- Workflow: Visual Verification
- Enterprise Definition of Done (DoD) Quality Contract
- AsyncClient
- 3. Quickstart Setup (Step-by-Step)
- Agent Router & Execution Protocol
- app.js
- Homepage & Candidate Showcase (`/`)
- Candidate Workspace (`/user/[username]`)
- devDependencies
- 4. Phát hiện hệ thống (có bằng chứng)
- frontend.md
- Authentication & Onboarding (`/(auth)/*`)
- Public Candidate Profile (`/public/[username]`)
- Talent Search & Discovery (`/search`)
- legacy.md
- qc.md
- adr/README.md
- archive/README.md
- 1. The Red -> Green -> Refactor Cycle
- conftest.py
- ExpertReviewService
- Mandatory Core Engineering Integrity & Evidence Protocol
- test_reorder_education_experiences_success
- Identity & Authentication (Domain 1)
- Candidate Account Management & Settings (`/user/[username]/settings`, `/update`)
- Master Catalogs (Domain 6)
- endpoints/catalogs.py
- .get_candidate_public_profile
- Candidate Search (Domain 5)
- Career Timeline (Domain 3)
- Public Content & CMS Pages (`/(public)/*`)
- legacy/README.md
- test_backend_foundation.py
- scripts
- eslint.config.mjs
- audit-truth.sh
- AsyncClient
- CmsService
- endpoints/timeline.py
- public/[username]/page.tsx
- env.py
- 8.2 Frontend domain
- create_access_token
- cn
- schemas/timeline.py
- AuthenticatedUser
- ExpertReviewRepository
- 8.3 Skill xuyên suốt
- 8.2 Frontend domain
- CmsRepository
- typing
- 8.3 Skill xuyên suốt
- IdentityRepository
- 🚫 Danh mục Vi phạm đã ghi nhận (Violations Log)
- schemas/__init__.py
- security.py
- ProfileRepository
- generate-current-state.py
- ProfileMedia
- test_list_experts_and_packages
- test_media_chunk_upload_path_traversal_rejection
- Plan Triển Khai: Dịch Vụ Expert CV Review & Monetization
- media_service.py
- use-webrtc-studio.ts
- lint-skills.py
- TimelineRepository
- user/[username]/page.tsx
- main.py
- services/__init__.py
- 7. Plan thực hiện theo phase
- 8.1 Backend domain
- 7. Plan thực hiện theo phase
- 8.1 Backend domain
- Expert CV Review Page (`/(public)/expert-review`)
- pathlib
- Backend Code Review Protocol
- Frontend Code Review Protocol
- Section Reference: Profile Header & Identity Management
- Section Reference: Video Pitch Card & Player Modal
- Section Reference: Skills & Profile Badges
- Section Reference: Career Timeline & Drag-and-Drop Reordering
- Section Reference: WebRTC Recording Studio & Teleprompter
- search_candidates
- 8. Thẻ update từng skill
- 9. Sửa hạ tầng: ROUTER, GEMINI, rules, workflows
- 8. Thẻ update từng skill
- 9. Sửa hạ tầng: ROUTER, GEMINI, rules, workflows
- json
- agent-dispatch.py
- 2. Rubric chấm điểm
- 2. Rubric chấm điểm
- backend.md
- ADR-003-fastapi-modular-monolith.md
- ADR-004-sqlalchemy-async-layered-architecture.md
- ADR-006-reportlab-pdf-generation.md
- ponytail-debt.md

## God Nodes (most connected - your core abstractions)
1. `Button` - 67 edges
2. `react` - 56 edges
3. `AuthenticatedUser` - 54 edges
4. `lucide-react` - 48 edges
5. `cn()` - 39 edges
6. `ProfileRepository` - 32 edges
7. `AuthService` - 28 edges
8. `ExpertReviewService` - 28 edges
9. `verify_profile_owner()` - 27 edges
10. `TimelineService` - 27 edges

## Surprising Connections (you probably didn't know these)
- `1. Clean 4-Layer Backend Architecture` --references--> `get_current_user()`  [INFERRED]
  .agents/skills/belooga-backend-engineering/SKILL.md → backend/app/core/security.py
- `F-04 · Mâu thuẫn auth ở public profile / PDF` --references--> `get_current_user()`  [INFERRED]
  BELOOGA_SKILL_REVIEW.md → backend/app/core/security.py
- `be-code-review — mới → 8.7` --references--> `get_current_user()`  [INFERRED]
  BELOOGA_SKILL_UPGRADE_PLAN.md → backend/app/core/security.py
- `be-code-review — mới → 8.7` --references--> `get_current_user()`  [INFERRED]
  docs/BELOOGA_SKILL_UPGRADE_PLAN.md → backend/app/core/security.py
- `F-02 — Gate 3 cho qua mọi thứ` --references--> `verify_profile_owner()`  [INFERRED]
  BELOOGA_SKILL_UPGRADE_PLAN.md → backend/app/core/security.py

## Import Cycles
- None detected.

## Communities (151 total, 34 thin omitted)

### Community 0 - "build_all_pages.py"
Cohesion: 0.44
Nodes (15): build_account_setting_scene(), build_blog_scene(), build_careers_scene(), build_contact_us_scene(), build_help_scene(), build_legal_scenes(), build_not_found_scene(), build_public_profile_scene() (+7 more)

### Community 1 - "BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)"
Cohesion: 0.06
Nodes (30): 0. Phạm vi review, 1. Protocol phản biện (BẮT BUỘC), 2. Kết luận tổng, 3. Findings, 4. Skill context knowledge còn thiếu, 5. Kiến trúc tri thức mục tiêu, 6. Tiêu chí S-tier (kiểm chứng được), 7. Nâng cấp `scripts/audit-truth.sh` (bắt buộc chạy trong CI) (+22 more)

### Community 2 - "candidate-orders-list.tsx"
Cohesion: 0.12
Nodes (32): ExpertReviewPage(), EmptyState(), SkillBadge(), SkillBadgeProps, CandidateOrdersListProps, ExpertCard(), ExpertCardProps, CATEGORIES (+24 more)

### Community 4 - "Ponytail"
Cohesion: 0.40
Nodes (4): Ponytail, Project Overrides, Rules, The Ladder

### Community 5 - "Belooga Design System & Tokens Guide"
Cohesion: 0.22
Nodes (8): 🎨 1. Brand & Primary Colors (Màu chủ đạo & Điểm nhấn), 🖋 2. Text & Typography Colors (Màu văn bản), 📐 3. Surfaces, Borders & Elevation (Nền, Viền & Đổ bóng), 🔤 4. Typography System (Hệ thống Kiểu chữ), 💻 5. CSS / SCSS Variable Snippet (Sẵn sàng tái sử dụng), Belooga Design System & Tokens Guide, Cỡ chữ & Dòng (Scale), Font Families

### Community 6 - "ai-pm-manager.py"
Cohesion: 0.20
Nodes (6): call_gemini_api(), create_github_task_issue(), discover_gemini_models(), get_issue_details(), main(), post_issue_comment()

### Community 7 - "🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint"
Cohesion: 0.07
Nodes (25): 1.1 Project Identity & Core Value Proposition, 1.2 The Conversion Mandate, 3.1 CSS Design Tokens, 3.2 Exact Video Play Button Specification, 4.1 Recommended Modern Stack, 4.2 Modern Directory Structure, 🛡️ Anti-Hallucination Engineering Harness (Lessons Learned & Violations Register), 🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint (+17 more)

### Community 8 - "BELOOGA — Skill Review & Upgrade Plan (mục tiêu: mọi skill ≥ 8.5)"
Cohesion: 0.15
Nodes (12): 0. Cách dùng file này, 10. Trigger eval, 11. Bảng nghiệm thu cuối (điền khi xong Phase 5), 1. Tóm tắt, 3. Bảng điểm hiện tại, 5. Lỗi code phát hiện kèm (phải ghi vào Known Traps cho tới khi sửa), 6. Cấu trúc skill đích, 7.1 Template domain skill (bắt buộc) (+4 more)

### Community 9 - "BELOOGA — Skill Review & Upgrade Plan (mục tiêu: mọi skill ≥ 8.5)"
Cohesion: 0.15
Nodes (12): 0. Cách dùng file này, 10. Trigger eval, 11. Bảng nghiệm thu cuối (điền khi xong Phase 5), 1. Tóm tắt, 3. Bảng điểm hiện tại, 5. Lỗi code phát hiện kèm (phải ghi vào Known Traps cho tới khi sửa), 6. Cấu trúc skill đích, 7.1 Template domain skill (bắt buộc) (+4 more)

### Community 10 - "Ponytail Repository Audit"
Cohesion: 0.40
Nodes (4): Exclusions, Hunt Tags, Output, Ponytail Repository Audit

### Community 12 - "Ponytail Code Review"
Cohesion: 0.33
Nodes (5): Belooga Examples, Boundaries, Format, Ponytail Code Review, Scoring

### Community 13 - "Ponytail Technical Debt Ledger"
Cohesion: 0.50
Nodes (3): Output Destination, Ponytail Technical Debt Ledger, Scan Command

### Community 17 - "Ponytail, lazy senior dev mode"
Cohesion: 0.40
Nodes (4): Ponytail, lazy senior dev mode, Project Overrides, Rules:, The Ponytail Ladder

### Community 19 - "webrtc-studio-modal.tsx"
Cohesion: 0.31
Nodes (7): StudioToolbar(), TeleprompterEditorDialog(), TeleprompterEditorDialogProps, TeleprompterOverlay(), TeleprompterOverlayProps, WebRTCStudioModal(), WebRTCStudioModalProps

### Community 20 - "Button"
Cohesion: 0.10
Nodes (29): Phase 2: Page Object Models (POMs) Development (`qc/pages/`), nextConfig, ForgotPasswordPage(), LoginPage(), RegisterPage(), NotFound(), HomePage(), CareersPage() (+21 more)

### Community 21 - "frontend/package.json"
Cohesion: 0.09
Nodes (21): ignoreScripts, @types/node, typescript, name, packageManager, private, trustedDependencies, version (+13 more)

### Community 22 - "@playwright/test"
Cohesion: 0.07
Nodes (17): description, devDependencies, @playwright/test, @types/node, typescript, @types/node, typescript, name (+9 more)

### Community 23 - "Belooga Frontend Engineering Architecture"
Cohesion: 0.33
Nodes (5): 1. Directory Structure & Atomic Modularity, 2. State & Data Fetching Conventions, 3. Styling & Design Tokens (`src/app/globals.css`), 4. Self-Verification, Belooga Frontend Engineering Architecture

### Community 24 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 25 - "Belooga Backend Engineering Architecture"
Cohesion: 0.40
Nodes (4): 1. Clean 4-Layer Backend Architecture, 3. System-Wide Invariants, 4. Self-Verification, Belooga Backend Engineering Architecture

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

### Community 32 - "Belooga QC & Automated Testing Engineering Guide"
Cohesion: 0.29
Nodes (6): 1. Test Architecture & Directory Layout, 2. Browser & Viewport Matrix, 3. Seeded Test Credentials, 4. Test Authoring Rules, 5. Execution Commands, Belooga QC & Automated Testing Engineering Guide

### Community 33 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 37 - "3. Phase-by-Phase Implementation Checklist"
Cohesion: 0.18
Nodes (10): 1. Sub-Agent Mission & Quality Gates, 2. Parallel Synchronization Milestones, 3. Phase-by-Phase Implementation Checklist, 4. Definition of Done (DoD), 🛡️ Belooga QC & Automation Testing Sub-Agent Execution Plan, Phase 1: Test Harness & Environment Setup, Phase 3: Suite 1 — Anti-Hallucination & Visual Regression Gate, Phase 4: Suite 2 — Authentication & Security E2E (`tests/e2e/auth-flow.spec.ts`) (+2 more)

### Community 38 - "MediaService"
Cohesion: 0.25
Nodes (8): complete_chunked_video_upload(), delete_resume(), generate_candidate_pdf(), get_video_transcoding_status(), upload_avatar(), upload_resume(), upload_video_chunk(), MediaService

### Community 41 - "CatalogsService"
Cohesion: 0.22
Nodes (3): CatalogsService, be-service-search — 5.7 → 8.8, be-service-search — 5.7 → 8.8

### Community 42 - "profile_repo.py"
Cohesion: 0.17
Nodes (4): CandidateProfile, ProfileInterest, ProfileLanguage, ProfileSkill

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

### Community 47 - "auth_service.py"
Cohesion: 0.16
Nodes (15): Current Reality, check_email_exists(), check_username_exists(), get_current_session_user(), login(), logout(), refresh_tokens(), register_user() (+7 more)

### Community 48 - "Belooga Continuous Learning Protocol"
Cohesion: 0.33
Nodes (5): 1. Trigger Conditions, 2. Standard Postmortem Structure, 3. Destination Routing Matrix, 4. Execution Protocol, Belooga Continuous Learning Protocol

### Community 49 - "Workflow: Definition of Done (DoD)"
Cohesion: 0.25
Nodes (7): Step 1: Regenerate Single Source of Truth, Step 2: Run SSOT Ground Truth Auditor, Step 3: Run Backend Tests, Step 4: Run Frontend Typecheck, Step 5: Visual Verification (If UI was modified), Step 6: Git Status Review, Workflow: Definition of Done (DoD)

### Community 50 - "Workflow: Database Schema Change"
Cohesion: 0.29
Nodes (6): Step 1: Update ORM Models, Step 2: Generate Alembic Revision, Step 3: Test Two-Way Migration, Step 4: Seed & Run Integration Tests, Step 5: Update SSOT & Facts, Workflow: Database Schema Change

### Community 51 - "4. Phát hiện hệ thống (có bằng chứng)"
Cohesion: 0.20
Nodes (10): 4. Phát hiện hệ thống (có bằng chứng), F-01 — Skill mô tả code đã không còn tồn tại, F-02 — Gate 3 cho qua mọi thứ, F-03 — Test khóa cứng một giá trị sai, F-04 — Các tiêu chuẩn không thể đạt cùng lúc, F-05 — Workflow `schema-change` hỏng, F-06 — Domain mới không có skill nào, F-07 — Sổ vi phạm nằm trong vùng "không được trích dẫn" (+2 more)

### Community 52 - "Belooga Engineering System (GEMINI.md)"
Cohesion: 0.25
Nodes (6): CLAUDE.md (Redirect to GEMINI.md), 1. Verified Tech Stack (Ground Truth), 2. Precedence of Truth, 3. Top 5 Absolute Prohibitions, 4. Task Routing, Belooga Engineering System (GEMINI.md)

### Community 53 - "ai-code-reviewer.py"
Cohesion: 0.17
Nodes (7): call_gemini_api(), discover_gemini_models(), get_git_diff(), main(), post_github_comment(), read_project_rules(), write_step_summary()

### Community 54 - "Workflow: Visual Verification"
Cohesion: 0.33
Nodes (5): 1. Locate Legacy Source, 2. Check CSS Scoping, 3. Live Browser Inspection, 4. Run Playwright Visual Tests, Workflow: Visual Verification

### Community 55 - "Enterprise Definition of Done (DoD) Quality Contract"
Cohesion: 0.33
Nodes (5): 1. Architectural & Modularity Invariants, 2. The Verification Gates, 3. Ratchet Tightening Rule, 4. Empirical Proof of Work, Enterprise Definition of Done (DoD) Quality Contract

### Community 56 - "AsyncClient"
Cohesion: 0.16
Nodes (8): test_anonymous_profile_view_does_not_leak_pii(), test_cross_user_upload_completion_rejection(), test_happy_path_chunked_upload_and_complete(), test_hidden_profile_blocks_anonymous_and_other_users(), test_hidden_profile_pdf_blocks_unauthorized_access(), test_owner_profile_view_includes_pii(), test_profile_has_zero_hardcoded_mock_fallbacks(), test_search_suggest_filters_hidden_profiles()

### Community 57 - "3. Quickstart Setup (Step-by-Step)"
Cohesion: 0.09
Nodes (22): 1. System Architecture & Tech Stack, 2. Infrastructure Port Allocation Matrix, 3. Quickstart Setup (Step-by-Step), 4. Pre-seeded Test Accounts & Personas, 5. Architectural Ground Truth & Known Gap Registry, 6.1: Run Full Truth Audit, 6.2: Run Backend Integration Test Suite, 6.3: Run Frontend TypeScript Typecheck (+14 more)

### Community 58 - "Agent Router & Execution Protocol"
Cohesion: 0.33
Nodes (5): 1. Execution Pipeline, 2. Intent-Based Skill Routing Matrix, 3. Cross-Domain Impact Matrix, 4. Merge Conditions, Agent Router & Execution Protocol

### Community 60 - "Homepage & Candidate Showcase (`/`)"
Cohesion: 0.33
Nodes (5): Current Reality, Homepage & Candidate Showcase (`/`), Known Traps, Rules, Self-Verification

### Community 61 - "Candidate Workspace (`/user/[username]`)"
Cohesion: 0.33
Nodes (5): Candidate Workspace (`/user/[username]`), Current Reality, Known Traps, Rules, Self-Verification

### Community 62 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 63 - "4. Phát hiện hệ thống (có bằng chứng)"
Cohesion: 0.20
Nodes (10): 4. Phát hiện hệ thống (có bằng chứng), F-01 — Skill mô tả code đã không còn tồn tại, F-02 — Gate 3 cho qua mọi thứ, F-03 — Test khóa cứng một giá trị sai, F-04 — Các tiêu chuẩn không thể đạt cùng lúc, F-05 — Workflow `schema-change` hỏng, F-06 — Domain mới không có skill nào, F-07 — Sổ vi phạm nằm trong vùng "không được trích dẫn" (+2 more)

### Community 65 - "Authentication & Onboarding (`/(auth)/*`)"
Cohesion: 0.33
Nodes (5): Authentication & Onboarding (`/(auth)/*`), Current Reality, Known Traps, Rules, Self-Verification

### Community 66 - "Public Candidate Profile (`/public/[username]`)"
Cohesion: 0.33
Nodes (5): Current Reality, Known Traps, Public Candidate Profile (`/public/[username]`), Rules, Self-Verification

### Community 67 - "Talent Search & Discovery (`/search`)"
Cohesion: 0.33
Nodes (5): Current Reality, Known Traps, Rules, Self-Verification, Talent Search & Discovery (`/search`)

### Community 70 - "adr/README.md"
Cohesion: 0.25
Nodes (4): ADR-001: Selection of Bun over Node.js for Frontend & QC Tooling, ADR-002: Next.js 16 App Router & Server/Client Segregation, ADR-005: PostgreSQL 16 TSVECTOR with GIN Index over External Search Engine, Architecture Decision Records (ADR Index)

### Community 72 - "1. The Red -> Green -> Refactor Cycle"
Cohesion: 0.25
Nodes (7): 1. The Red -> Green -> Refactor Cycle, 2. Visual / Static Styling Exception, 3. DoD Compliance, Phase 1: RED (Test First & Prove Defect), Phase 2: GREEN (Minimal Sane Fix), Phase 3: REFACTOR, Test-Driven Development (TDD) Standard Operating Procedure

### Community 73 - "conftest.py"
Cohesion: 0.20
Nodes (5): client(), db_session(), ensure_test_database_seeded(), test_candidate_a(), test_candidate_b()

### Community 74 - "ExpertReviewService"
Cohesion: 0.09
Nodes (27): Current Reality, Expert CV Review Service (Domain 9), Known Traps, Rules, Self-Verification, checkout_review_order(), create_review_order(), get_order_feedback() (+19 more)

### Community 75 - "Mandatory Core Engineering Integrity & Evidence Protocol"
Cohesion: 0.29
Nodes (6): 1. Pillar 1: The "No Proof = Not Done" Iron Rule, 2. Pillar 2: Mandatory Inquiry Protocol (Uncertainty = Mandatory Question), 3. Pillar 3: Zero Full-Stack Hallucination & Blacklist, 4. Legacy Parity & Anti-Pollution (Sole Authoritative Source), 5. Radical Transparency & Incident Reporting, Mandatory Core Engineering Integrity & Evidence Protocol

### Community 77 - "Identity & Authentication (Domain 1)"
Cohesion: 0.33
Nodes (4): Identity & Authentication (Domain 1), Known Traps, Rules, Self-Verification

### Community 78 - "Candidate Account Management & Settings (`/user/[username]/settings`, `/update`)"
Cohesion: 0.33
Nodes (5): Candidate Account Management & Settings (`/user/[username]/settings`, `/update`), Current Reality, Known Traps, Rules, Self-Verification

### Community 79 - "Master Catalogs (Domain 6)"
Cohesion: 0.33
Nodes (5): Current Reality, Known Traps, Master Catalogs (Domain 6), Rules, Self-Verification

### Community 81 - "endpoints/catalogs.py"
Cohesion: 0.46
Nodes (4): list_skills(), suggest_companies(), suggest_locations(), suggest_schools()

### Community 82 - ".get_candidate_public_profile"
Cohesion: 0.20
Nodes (7): Candidate Profile (Domain 2), Current Reality, Known Traps, Rules, Self-Verification, be-service-profile — 6.0 → 9.0, be-service-profile — 6.0 → 9.0

### Community 83 - "Candidate Search (Domain 5)"
Cohesion: 0.33
Nodes (5): Candidate Search (Domain 5), Current Reality, Known Traps, Rules, Self-Verification

### Community 84 - "Career Timeline (Domain 3)"
Cohesion: 0.25
Nodes (5): Career Timeline (Domain 3), Current Reality, Known Traps, Rules, Self-Verification

### Community 85 - "Public Content & CMS Pages (`/(public)/*`)"
Cohesion: 0.33
Nodes (5): Current Reality, Known Traps, Public Content & CMS Pages (`/(public)/*`), Rules, Self-Verification

### Community 87 - "test_backend_foundation.py"
Cohesion: 0.13
Nodes (13): CatalogCompany, CatalogLocation, CatalogSchool, Interest, Language, Skill, CareerApplication, test_alembic_revision_file_validity() (+5 more)

### Community 88 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 89 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 91 - "AsyncClient"
Cohesion: 0.27
Nodes (4): test_idor_cross_user_media_upload_forbidden(), test_idor_cross_user_profile_mutation_forbidden(), test_idor_cross_user_timeline_mutation_forbidden(), test_unauthenticated_mutations_rejected()

### Community 92 - "CmsService"
Cohesion: 0.08
Nodes (16): CMS & Public Inquiries (Domain 7), Current Reality, Known Traps, Rules, Self-Verification, get_faqs(), list_career_jobs(), report_candidate_profile() (+8 more)

### Community 93 - "endpoints/timeline.py"
Cohesion: 0.23
Nodes (8): create_education(), create_job_experience(), delete_education(), delete_job_experience(), list_education_experiences(), list_job_experiences(), reorder_education_experiences(), reorder_job_experiences()

### Community 94 - "public/[username]/page.tsx"
Cohesion: 0.18
Nodes (15): fe-page-public-profile — 6.0 → 8.8, fe-page-public-profile — 6.0 → 8.8, PublicCandidatePage(), VideoPitchCard(), VideoPitchCardProps, VideoPitchModal(), VideoPitchModalProps, PublicContactModal() (+7 more)

### Community 95 - "env.py"
Cohesion: 0.19
Nodes (5): do_run_migrations(), get_database_url(), run_async_migrations(), run_migrations_offline(), run_migrations_online()

### Community 96 - "8.2 Frontend domain"
Cohesion: 0.25
Nodes (8): 8.2 Frontend domain, fe-page-auth — 7.0 → 9.0, fe-page-cms-public — 6.6 → 8.7, fe-page-expert-review (MỚI) — 0 → 8.7, fe-page-home — 6.8 → 9.0, fe-page-search — 6.6 → 8.8, fe-page-user-management — 6.6 → 8.7, fe-page-workspace — 3.5 → 8.8

### Community 97 - "create_access_token"
Cohesion: 0.16
Nodes (10): create_access_token(), generate_refresh_token(), get_password_hash(), hash_token(), verify_password(), _set_refresh_cookie(), test_refresh_token_grace_window_allows_concurrent_tabs(), test_refresh_token_replay_attack_revokes_entire_family() (+2 more)

### Community 98 - "cn"
Cohesion: 0.14
Nodes (37): ConfirmDialog(), ConfirmDialogProps, FormField(), FormFieldProps, CandidateOrdersList(), ReviewBookingDialog(), SkillsCard(), SkillsCardProps (+29 more)

### Community 99 - "schemas/timeline.py"
Cohesion: 0.17
Nodes (7): AwardCertificationCreate, AwardCertificationResponse, EducationCreate, EducationResponse, JobExperienceResponse, JobExperienceUpdate, ReorderItem

### Community 100 - "AuthenticatedUser"
Cohesion: 0.11
Nodes (10): 2. Domain Services Map, add_candidate_skill(), get_candidate_public_profile(), remove_candidate_skill(), update_candidate_profile(), AuthenticatedUser, verify_profile_owner(), JobExperienceCreate (+2 more)

### Community 101 - "ExpertReviewRepository"
Cohesion: 0.21
Nodes (6): CVReviewFeedback, CVReviewOrder, CVReviewPackage, ExpertProfile, ExpertReviewRepository, 3. Kiến Trúc Backend (FastAPI Clean Architecture)

### Community 102 - "8.3 Skill xuyên suốt"
Cohesion: 0.25
Nodes (8): 8.3 Skill xuyên suốt, belooga-backend-engineering — 4.0 → 8.8, belooga-frontend-engineering — 4.0 → 8.8, belooga-qc-engineering — 3.1 → 8.8, belooga-self-learn — 7.5 → 9.0, definition-of-done — 3.0 → 8.8, engineering-integrity-and-evidence — 6.4 → 9.0, tdd-workflow — 6.4 → 8.8

### Community 103 - "8.2 Frontend domain"
Cohesion: 0.25
Nodes (8): 8.2 Frontend domain, fe-page-auth — 7.0 → 9.0, fe-page-cms-public — 6.6 → 8.7, fe-page-expert-review (MỚI) — 0 → 8.7, fe-page-home — 6.8 → 9.0, fe-page-search — 6.6 → 8.8, fe-page-user-management — 6.6 → 8.7, fe-page-workspace — 3.5 → 8.8

### Community 104 - "CmsRepository"
Cohesion: 0.16
Nodes (4): CareerPosting, ContactInquiry, ProfileReport, CmsRepository

### Community 106 - "8.3 Skill xuyên suốt"
Cohesion: 0.25
Nodes (8): 8.3 Skill xuyên suốt, belooga-backend-engineering — 4.0 → 8.8, belooga-frontend-engineering — 4.0 → 8.8, belooga-qc-engineering — 3.1 → 8.8, belooga-self-learn — 7.5 → 9.0, definition-of-done — 3.0 → 8.8, engineering-integrity-and-evidence — 6.4 → 9.0, tdd-workflow — 6.4 → 8.8

### Community 107 - "IdentityRepository"
Cohesion: 0.12
Nodes (7): EmailVerificationToken, Identity, PasswordResetToken, RefreshSession, SocialAccount, IdentityRepository, Phase 2: Domain 1 — Identity & Authentication Service (10 APIs)

### Community 108 - "🚫 Danh mục Vi phạm đã ghi nhận (Violations Log)"
Cohesion: 0.25
Nodes (7): Belooga Engineering Harness & Anti-Hallucination Violations Register, 🚫 Danh mục Vi phạm đã ghi nhận (Violations Log), 🛡 Quy luật Harness Nâng Cao (Agent Strict Operational Rules), [VIOLATION-001] Tự ý vẽ SVG / Icon xấp xỉ thay vì dùng asset gốc, [VIOLATION-002] Hiển thị icon Play đè lên ảnh walkthrough sai lệch quy chuẩn SCSS gốc, [VIOLATION-003] Dùng icon font / background teal cho nút play walkthrough thay vì Stack Theme pure CSS, [VIOLATION-004] Hallucinate style cho `.modal-trigger` gây xung đột biến nút play thành hình Elip đen khổng lồ & Báo cáo hoàn thành khi chưa test hover

### Community 109 - "schemas/__init__.py"
Cohesion: 0.10
Nodes (12): CatalogItemResponse, SuggestionResponse, ChunkUploadRequest, ChunkUploadResponse, CompleteUploadRequest, MediaResponse, ProfileLanguageItem, ProfileResponse (+4 more)

### Community 110 - "security.py"
Cohesion: 0.12
Nodes (6): get_db(), get_current_user(), get_current_user_optional(), verify_identity_owner(), lifespan(), ProfileUpdate

### Community 111 - "ProfileRepository"
Cohesion: 0.06
Nodes (7): Current Reality, Known Traps, Media Storage & Transcoding (Domain 4), Rules, Self-Verification, MediaRepository, ProfileRepository

### Community 112 - "generate-current-state.py"
Cohesion: 0.43
Nodes (6): extract_backend_routes(), extract_database_tables(), extract_dependencies(), extract_frontend_routes(), get_git_info(), main()

### Community 113 - "ProfileMedia"
Cohesion: 0.22
Nodes (7): ProfileMedia, VideoArchive, 3. Phase-by-Phase Implementation Checklist, Phase 1: Environment & Database Infrastructure, Phase 3: Domain 2 & 4 — Candidate Profile & Media Storage (20 APIs), Phase 4: Domain 3 — Timeline Sections CRUD & Concurrency Reordering (15 APIs), Phase 5: Domain 5 & 6 — WebRTC Studio & Talent Search (8 APIs)

### Community 116 - "Plan Triển Khai: Dịch Vụ Expert CV Review & Monetization"
Cohesion: 0.33
Nodes (5): 1. Tổng Quan & Trải Nghiệm Người Dùng (UX Flow), 2. Thiết Kế Cơ Sở Dữ Liệu (PostgreSQL & Alembic), 4. Kiến Trúc Frontend (Next.js 16 + Atomic Design), 5. Quy Chuẩn & Kiểm Thử (DoD), Plan Triển Khai: Dịch Vụ Expert CV Review & Monetization

### Community 117 - "media_service.py"
Cohesion: 0.11
Nodes (10): assemble_chunks_async(), _assemble_chunks_sync(), extract_poster_thumbnail(), get_validated_upload_dir(), probe_video_duration(), run_cmd_async(), _run_cmd_sync(), transcode_to_streaming_mp4() (+2 more)

### Community 118 - "use-webrtc-studio.ts"
Cohesion: 0.19
Nodes (17): AudioVisualizerMeter(), AudioVisualizerMeterProps, StudioToolbarProps, StudioViewfinder(), StudioViewfinderProps, useAudioMeter(), useTeleprompter(), useWebRTCStudio() (+9 more)

### Community 119 - "lint-skills.py"
Cohesion: 0.39
Nodes (5): add(), check_common(), check_reference(), check_skill(), resolve_path()

### Community 120 - "TimelineRepository"
Cohesion: 0.14
Nodes (4): AwardCertification, EducationExperience, JobExperience, TimelineRepository

### Community 121 - "user/[username]/page.tsx"
Cohesion: 0.14
Nodes (19): WebRTCStudioModal, WorkspacePage(), ResumeAttachmentCard(), ResumeAttachmentCardProps, LanguagesInterestsCard(), LanguagesInterestsCardProps, ProfileHeaderCard(), ProfileHeaderCardProps (+11 more)

### Community 124 - "7. Plan thực hiện theo phase"
Cohesion: 0.29
Nodes (7): 7. Plan thực hiện theo phase, Phase 0 — Hạ tầng đo lường (làm trước mọi thứ, ~½ ngày), Phase 1 — Dọn dẹp và sửa hạ tầng (~½ ngày), Phase 2 — Viết lại 16 domain skill (~1.5 ngày), Phase 3 — Viết lại 7 skill xuyên suốt và 2 skill review (~1 ngày), Phase 4 — Sửa lỗi code đang làm skill phải ghi trap (song song, theo TDD), Phase 5 — Chấm lại và ký nghiệm thu

### Community 125 - "8.1 Backend domain"
Cohesion: 0.29
Nodes (7): 8.1 Backend domain, be-service-auth — 6.0 → 9.0, be-service-catalogs — 5.0 → 8.8, be-service-cms — 5.2 → 8.7, be-service-expert-review (MỚI) — 0 → 8.7, be-service-media — 5.2 → 8.8, be-service-timeline — 6.0 → 9.0

### Community 126 - "7. Plan thực hiện theo phase"
Cohesion: 0.29
Nodes (7): 7. Plan thực hiện theo phase, Phase 0 — Hạ tầng đo lường (làm trước mọi thứ, ~½ ngày), Phase 1 — Dọn dẹp và sửa hạ tầng (~½ ngày), Phase 2 — Viết lại 16 domain skill (~1.5 ngày), Phase 3 — Viết lại 7 skill xuyên suốt và 2 skill review (~1 ngày), Phase 4 — Sửa lỗi code đang làm skill phải ghi trap (song song, theo TDD), Phase 5 — Chấm lại và ký nghiệm thu

### Community 127 - "8.1 Backend domain"
Cohesion: 0.29
Nodes (7): 8.1 Backend domain, be-service-auth — 6.0 → 9.0, be-service-catalogs — 5.0 → 8.8, be-service-cms — 5.2 → 8.7, be-service-expert-review (MỚI) — 0 → 8.7, be-service-media — 5.2 → 8.8, be-service-timeline — 6.0 → 9.0

### Community 128 - "Expert CV Review Page (`/(public)/expert-review`)"
Cohesion: 0.33
Nodes (5): Current Reality, Expert CV Review Page (`/(public)/expert-review`), Known Traps, Rules, Self-Verification

### Community 130 - "Backend Code Review Protocol"
Cohesion: 0.40
Nodes (4): Backend Code Review Protocol, Blocking Gates (Must REJECT if violated), Ratchet Gates (Metrics must not worsen), Review Sign-off Template

### Community 131 - "Frontend Code Review Protocol"
Cohesion: 0.40
Nodes (4): Blocking Gates (Must REJECT if violated), Frontend Code Review Protocol, Ratchet Gates (Metrics must not worsen), Review Sign-off Template

### Community 132 - "Section Reference: Profile Header & Identity Management"
Cohesion: 0.40
Nodes (4): 1. Scope Boundary, 2. API Contracts & Network Mutations, 3. QC Anti-Regression Selectors, Section Reference: Profile Header & Identity Management

### Community 133 - "Section Reference: Video Pitch Card & Player Modal"
Cohesion: 0.40
Nodes (4): 1. Scope Boundary, 2. API Contracts & Media Streams, 3. QC Anti-Regression Selectors, Section Reference: Video Pitch Card & Player Modal

### Community 134 - "Section Reference: Skills & Profile Badges"
Cohesion: 0.40
Nodes (4): 1. Scope Boundary, 2. API Contracts & Mutations, 3. QC Anti-Regression Selectors, Section Reference: Skills & Profile Badges

### Community 135 - "Section Reference: Career Timeline & Drag-and-Drop Reordering"
Cohesion: 0.40
Nodes (4): 1. Scope Boundary, 2. API Contracts & Mutations, 3. QC Anti-Regression Selectors, Section Reference: Career Timeline & Drag-and-Drop Reordering

### Community 136 - "Section Reference: WebRTC Recording Studio & Teleprompter"
Cohesion: 0.40
Nodes (4): 1. Scope Boundary, 2. API Contracts & Chunked Uploads, 3. QC Anti-Regression Selectors, Section Reference: WebRTC Recording Studio & Teleprompter

### Community 138 - "8. Thẻ update từng skill"
Cohesion: 0.40
Nodes (5): 8.4 Skill review (mới, thay reviewer-checklist cũ), 8.5 Ponytail (giữ, chỉnh nhẹ), 8. Thẻ update từng skill, be-code-review — mới → 8.7, fe-code-review — mới → 8.7

### Community 139 - "9. Sửa hạ tầng: ROUTER, GEMINI, rules, workflows"
Cohesion: 0.40
Nodes (5): 9.1 `GEMINI.md` (≤ 60 dòng), 9.2 `ROUTER.md` (viết lại, ≤ 120 dòng), 9.3 `workflows/schema-change.md` (viết lại toàn bộ), 9.4 Rules, 9. Sửa hạ tầng: ROUTER, GEMINI, rules, workflows

### Community 140 - "8. Thẻ update từng skill"
Cohesion: 0.40
Nodes (5): 8.4 Skill review (mới, thay reviewer-checklist cũ), 8.5 Ponytail (giữ, chỉnh nhẹ), 8. Thẻ update từng skill, be-code-review — mới → 8.7, fe-code-review — mới → 8.7

### Community 141 - "9. Sửa hạ tầng: ROUTER, GEMINI, rules, workflows"
Cohesion: 0.40
Nodes (5): 9.1 `GEMINI.md` (≤ 60 dòng), 9.2 `ROUTER.md` (viết lại, ≤ 120 dòng), 9.3 `workflows/schema-change.md` (viết lại toàn bộ), 9.4 Rules, 9. Sửa hạ tầng: ROUTER, GEMINI, rules, workflows

### Community 144 - "2. Rubric chấm điểm"
Cohesion: 0.50
Nodes (4): 2.1 Năm tiêu chí, 2.2 Trần điểm (áp dụng sau khi tính), 2.3 Định nghĩa "đạt 8.5" (tier S), 2. Rubric chấm điểm

### Community 145 - "2. Rubric chấm điểm"
Cohesion: 0.50
Nodes (4): 2.1 Năm tiêu chí, 2.2 Trần điểm (áp dụng sau khi tính), 2.3 Định nghĩa "đạt 8.5" (tier S), 2. Rubric chấm điểm

## Knowledge Gaps
- **529 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+524 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 857 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button` connect `Button` to `cn`, `candidate-orders-list.tsx`, `webrtc-studio-modal.tsx`, `user/[username]/page.tsx`, `public/[username]/page.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `8. Thẻ update từng skill` connect `8. Thẻ update từng skill` to `BELOOGA — Skill Review & Upgrade Plan (mục tiêu: mọi skill ≥ 8.5)`, `8.3 Skill xuyên suốt`, `8.2 Frontend domain`, `8.1 Backend domain`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `8. Thẻ update từng skill` connect `8. Thẻ update từng skill` to `8.2 Frontend domain`, `BELOOGA — Skill Review & Upgrade Plan (mục tiêu: mọi skill ≥ 8.5)`, `8.1 Backend domain`, `8.3 Skill xuyên suốt`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `AuthenticatedUser` (e.g. with `get_current_session_user()` and `checkout_review_order()`) actually correct?**
  _`AuthenticatedUser` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _529 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `candidate-orders-list.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12222222222222222 - nodes in this community are weakly interconnected._