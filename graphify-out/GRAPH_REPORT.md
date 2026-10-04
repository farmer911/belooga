# Graph Report - Beloga  (2026-10-04)

## Corpus Check
- 128 files · ~915,672 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 7, .lock 2, .css 2)

## Summary
- 1029 nodes · 1474 edges · 91 communities (76 shown, 15 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1fff218c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- build_all_pages.py
- app.js
- 🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint
- 🐋 BELOOGA — Master Migration & Conversion Blueprint
- Ponytail
- Belooga Design System & Tokens Guide
- Ponytail Help
- 🚫 Danh mục Vi phạm đã ghi nhận (Violations Log)
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
- 2. Backend API Inventory (`backend/app/api/v1/endpoints/`)
- Button
- frontend/package.json
- @playwright/test
- 3. Common UI Components Specification (`src/components/ui/`)
- compilerOptions
- 2. Complete Database Schema (24 Core Tables in `initdb.sql`)
- 3. Phase-by-Phase Implementation Checklist
- dependencies
- 3. Phase-by-Phase Implementation Checklist
- 🤖 Parallel 3-Sub-Agent Orchestration Blueprint
- 3. Phase-by-Phase Implementation Checklist
- compilerOptions
- 3. Strict Quality Gates & Anti-Regression Assertions
- README.md
- AGENTS.md
- postcss.config.mjs
- timeline.py
- AuthenticatedUser
- 2. 8 Service Domains & Verified API Catalog (36 Active Endpoints)
- conftest.py
- 2. BACKEND DESIGN PATTERNS (BE & DISTRIBUTED SYSTEMS)
- profile.py
- 🧠 ADVANCED SYSTEMS ENGINEERING & COMPUTER SCIENCE KNOWLEDGE BASE
- 4. Thiếu sót mang tính cấu trúc
- media.py
- test_idor_guards.py
- ⚙️ SENIOR BACKEND ENGINEER — PRODUCTION PATTERNS & STANDARDS
- 🎨 SENIOR FRONTEND ENGINEER — PRODUCTION PATTERNS & STANDARDS
- get_current_user
- RTK Commands by Workflow
- generate-current-state.py
- 🏛️ PRINCIPAL SYSTEMS ARCHITECT — PRODUCTION PATTERNS & STANDARDS
- 🏁 ENTERPRISE DEFINITION OF DONE (DoD) QUALITY CONTRACT
- 🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS
- security.py
- 🚦 BELOOGA ENTERPRISE AGENT ROUTER & EXECUTION PROTOCOL
- ⚡ Belooga Backend Architecture & 8 Service Domains Skill
- 🏠 Department Skill: Homepage & Candidate Showcase (`/`)
- 🌐 Master Page Orchestrator Skill: Candidate Workspace (`/user/[username]`)
- devDependencies
- 🏛️ BELOOGA ARCHITECTURE DECISION RECORDS (ADR LOG)
- 🧐 Principal Backend Lead Reviewer: Code Review SOP & Rejection Checklist
- 🔐 Department Skill: Identity & Authentication (`/(auth)/...`)
- 👤 Department Skill: Public Candidate Profile (`/public/[username]`)
- 🔍 Department Skill: Talent Discovery & Candidate Search (`/search`)
- 🧐 Senior Frontend Lead Reviewer: Code Review SOP & Rejection Checklist
- 2. API Contracts & Network Mutations
- 2. API Contracts & Autocomplete Flow
- 🎙️ Section Skill: WebRTC Video Studio & Recording Engine
- 1. The Non-Negotiable 3-Phase Cycle
- test_candidate_a
- Belooga Codebase Ground Truth (CURRENT_STATE.md)
- 🛡️ Mandatory Core Engineering Integrity & Evidence Protocol
- test_reorder_education_experiences_success
- 🛡️ Backend Department Skill: Identity & Authentication Vault (Domain 1)
- ⚙️ Department Skill: Candidate User Management & Settings
- 📚 Backend Department Skill: Master Catalogs & Taxonomies (Domain 7)
- 📢 Backend Department Skill: Public CMS & Moderation (Domain 8)
- 📹 Backend Department Skill: Media Processing & Storage (Domain 4)
- 👤 Backend Department Skill: Candidate Profiles (Domain 2)
- 🔎 Backend Department Skill: Talent Discovery & Search Engine (Domain 6)
- ⏳ Backend Department Skill: Career Timeline & Reordering (Domain 3)
- 📰 Department Skill: Public Content, CMS & Compliance
- 🎬 Section Skill: 30-Second Pitch Video Player
- ⏳ Section Skill: Career Timeline & Credentials Management
- scripts
- eslint.config.mjs
- audit-truth.sh

## God Nodes (most connected - your core abstractions)
1. `2. Backend API Inventory (`backend/app/api/v1/endpoints/`)` - 40 edges
2. `Button` - 31 edges
3. `AuthenticatedUser` - 25 edges
4. `verify_profile_owner()` - 22 edges
5. `next` - 20 edges
6. `get_current_user()` - 18 edges
7. `lucide-react` - 17 edges
8. `compilerOptions` - 16 edges
9. `react` - 15 edges
10. `⚙️ SENIOR BACKEND ENGINEER — PRODUCTION PATTERNS & STANDARDS` - 14 edges

## Surprising Connections (you probably didn't know these)
- `5.2 Zustand Client Stores (`src/store/`)` --references--> `logout()`  [INFERRED]
  .agents/skills/belooga-frontend-engineering/SKILL.md → backend/app/api/v1/endpoints/auth.py
- `5. Đề xuất sửa (theo ưu tiên)` --references--> `get_current_user()`  [INFERRED]
  SKILLS_AUDIT.md → backend/app/core/security.py
- `5. Security & Concurrency Verification Summary` --references--> `verify_profile_owner()`  [INFERRED]
  CURRENT_STATE.md → backend/app/core/security.py
- `5. Thiếu sót vẫn còn từ Round 1` --references--> `verify_profile_owner()`  [INFERRED]
  SKILLS_AUDIT_ROUND2.md → backend/app/core/security.py
- `8. Câu hỏi buộc Gemini trả lời thẳng` --references--> `suggest_companies()`  [INFERRED]
  SKILLS_AUDIT_ROUND2.md → backend/app/api/v1/endpoints/catalogs.py

## Import Cycles
- None detected.

## Communities (91 total, 15 thin omitted)

### Community 0 - "build_all_pages.py"
Cohesion: 0.44
Nodes (15): build_account_setting_scene(), build_blog_scene(), build_careers_scene(), build_contact_us_scene(), build_help_scene(), build_legal_scenes(), build_not_found_scene(), build_public_profile_scene() (+7 more)

### Community 2 - "🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint"
Cohesion: 0.09
Nodes (21): 1.1 Project Identity & Core Value Proposition, 1.2 The Conversion Mandate, 3.1 CSS Design Tokens, 3.2 Exact Video Play Button Specification, 4.1 Recommended Modern Stack, 4.2 Modern Directory Structure, 🛡️ Anti-Hallucination Engineering Harness (Lessons Learned & Violations Register), 🐋 BELOOGA — Project Conversion Master Template & Migration Blueprint (+13 more)

### Community 3 - "🐋 BELOOGA — Master Migration & Conversion Blueprint"
Cohesion: 0.12
Nodes (15): 1.1 Project Identity, 1.2 Conversion Mandate, 1. Executive Summary & Conversion Mission, 2. Complete Legacy Route Inventory & Parity Matrix (All 16 Routes), 3.1 Strict Icon & Play Button Geometry Standard, 3. Design System Tokens & Visual Foundations, 4. Component Architecture & Conversion Hierarchy, 5. Engineering Quality Harness (Operational Violations Log) (+7 more)

### Community 4 - "Ponytail"
Cohesion: 0.22
Nodes (8): Boundaries, Intensity, Output, Persistence, Ponytail, Rules, The ladder, When NOT to be lazy

### Community 5 - "Belooga Design System & Tokens Guide"
Cohesion: 0.22
Nodes (8): 🎨 1. Brand & Primary Colors (Màu chủ đạo & Điểm nhấn), 🖋 2. Text & Typography Colors (Màu văn bản), 📐 3. Surfaces, Borders & Elevation (Nền, Viền & Đổ bóng), 🔤 4. Typography System (Hệ thống Kiểu chữ), 💻 5. CSS / SCSS Variable Snippet (Sẵn sàng tái sử dụng), Belooga Design System & Tokens Guide, Cỡ chữ & Dòng (Scale), Font Families

### Community 6 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 7 - "🚫 Danh mục Vi phạm đã ghi nhận (Violations Log)"
Cohesion: 0.25
Nodes (7): Belooga Engineering Harness & Anti-Hallucination Violations Register, 🚫 Danh mục Vi phạm đã ghi nhận (Violations Log), 🛡 Quy luật Harness Nâng Cao (Agent Strict Operational Rules), [VIOLATION-001] Tự ý vẽ SVG / Icon xấp xỉ thay vì dùng asset gốc, [VIOLATION-002] Hiển thị icon Play đè lên ảnh walkthrough sai lệch quy chuẩn SCSS gốc, [VIOLATION-003] Dùng icon font / background teal cho nút play walkthrough thay vì Stack Theme pure CSS, [VIOLATION-004] Hallucinate style cho `.modal-trigger` gây xung đột biến nút play thành hình Elip đen khổng lồ & Báo cáo hoàn thành khi chưa test hover

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

### Community 19 - "2. Backend API Inventory (`backend/app/api/v1/endpoints/`)"
Cohesion: 0.07
Nodes (35): check_email_exists(), check_username_exists(), get_current_session_user(), login(), logout(), refresh_tokens(), register_user(), list_skills() (+27 more)

### Community 20 - "Button"
Cohesion: 0.08
Nodes (36): Phase 2: Application Shell (Header & Footer), nextConfig, ForgotPasswordPage(), LoginPage(), RegisterPage(), metadata, RootLayout(), NotFound() (+28 more)

### Community 21 - "frontend/package.json"
Cohesion: 0.09
Nodes (21): ignoreScripts, @types/node, typescript, name, packageManager, private, trustedDependencies, version (+13 more)

### Community 22 - "@playwright/test"
Cohesion: 0.07
Nodes (17): description, devDependencies, @playwright/test, @types/node, typescript, @types/node, typescript, name (+9 more)

### Community 23 - "3. Common UI Components Specification (`src/components/ui/`)"
Cohesion: 0.10
Nodes (20): 1. Technical Stack & Environment, 2. Design System Tokens (`src/app/globals.css`), 3.1 Button (`src/components/ui/button.tsx`), 3.2 Input (`src/components/ui/input.tsx`), 3.3 Modal / Dialog (`src/components/ui/dialog.tsx`), 3.4 Card (`src/components/ui/card.tsx`), 3.5 Badge (`src/components/ui/badge.tsx`), 3.6 Avatar (`src/components/ui/avatar.tsx`) (+12 more)

### Community 24 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 25 - "2. Complete Database Schema (24 Core Tables in `initdb.sql`)"
Cohesion: 0.13
Nodes (14): 1. Technical Stack & Architecture, 2. Complete Database Schema (24 Core Tables in `initdb.sql`), 3.1 AuthService (`app/services/auth_service.py`), 3.2 TimelineService (`app/services/timeline_service.py`), 3.3 SearchService (`app/services/search_service.py`), 3. Service Layer Design & Business Logic, 4. Docker Environment Specification (`docker-compose.yml`), ⚡ Belooga Backend Engineering Skill & Architecture Guide (+6 more)

### Community 26 - "3. Phase-by-Phase Implementation Checklist"
Cohesion: 0.14
Nodes (13): 1. Sub-Agent Mission & Anti-Hallucination Boundaries, 2. Parallel Synchronization Milestones, 3. Phase-by-Phase Implementation Checklist, 4. Definition of Done (DoD), 🚀 Belooga Frontend Sub-Agent Execution Plan, Phase 1: Foundation, Asset Pipeline & Design Tokens, Phase 2: Common UI Primitives (`src/components/ui/`), Phase 3: Services & State Architecture (+5 more)

### Community 27 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, axios, clsx, @hookform/resolvers, lucide-react, next, react, react-dom (+5 more)

### Community 28 - "3. Phase-by-Phase Implementation Checklist"
Cohesion: 0.17
Nodes (11): 1. Sub-Agent Mission & Concurrency Rules, 2. Parallel Synchronization Milestones, 3. Phase-by-Phase Implementation Checklist, 4. Definition of Done (DoD), ⚡ Belooga Backend Sub-Agent Execution Plan, Phase 1: Environment & Database Infrastructure, Phase 2: Domain 1 — Identity & Authentication Service (10 APIs), Phase 3: Domain 2 & 4 — Candidate Profile & Media Storage (20 APIs) (+3 more)

### Community 29 - "🤖 Parallel 3-Sub-Agent Orchestration Blueprint"
Cohesion: 0.17
Nodes (11): 1. Sub-Agent Roster & Operational Boundaries, 2. Sub-Agent Profiles & Execution Briefs, 3. Parallel Execution Matrix (Milestones M1 – M5), 4. Immediate Commands to Run, Backend:, Frontend:, 🤖 Parallel 3-Sub-Agent Orchestration Blueprint, QC / Playwright: (+3 more)

### Community 30 - "3. Phase-by-Phase Implementation Checklist"
Cohesion: 0.18
Nodes (10): 1. Sub-Agent Mission & Quality Gates, 2. Parallel Synchronization Milestones, 3. Phase-by-Phase Implementation Checklist, 4. Definition of Done (DoD), 🛡️ Belooga QC & Automation Testing Sub-Agent Execution Plan, Phase 1: Test Harness & Environment Setup, Phase 3: Suite 1 — Anti-Hallucination & Visual Regression Gate, Phase 4: Suite 2 — Authentication & Security E2E (`tests/e2e/auth-flow.spec.ts`) (+2 more)

### Community 31 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 32 - "3. Strict Quality Gates & Anti-Regression Assertions"
Cohesion: 0.20
Nodes (9): 1. Technical Stack & Test Environment, 2. Test Architecture & Directory Layout, 3. Strict Quality Gates & Anti-Regression Assertions, 4. Playwright Configuration (`playwright.config.ts`), 🛡️ Belooga QC & Automation Testing Engineering Guide, Gate 1: TC-VIS-001 — 54px Play Button & Pure CSS Triangle, Gate 2: TC-VIS-002 — Literal Asset Resolution & Zero Synthetic SVGs, Gate 3: TC-AUTH-002 — Zero Token Leakage in Client Storage (+1 more)

### Community 33 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 37 - "timeline.py"
Cohesion: 0.27
Nodes (11): AwardCertificationCreate, create_education(), create_job_experience(), EducationExperienceCreate, JobExperienceCreate, list_education_experiences(), list_job_experiences(), reorder_education_experiences() (+3 more)

### Community 38 - "AuthenticatedUser"
Cohesion: 0.21
Nodes (11): complete_chunked_video_upload(), delete_resume(), upload_avatar(), upload_resume(), upload_video_chunk(), write_bytes_async(), remove_candidate_skill(), delete_education() (+3 more)

### Community 41 - "2. 8 Service Domains & Verified API Catalog (36 Active Endpoints)"
Cohesion: 0.13
Nodes (14): 1. 16-Route Frontend Page Inventory, 2. 8 Service Domains & Verified API Catalog (36 Active Endpoints), 3. Database Schema Mapping (24 Tables in `backend/initdb.sql`), 4. QC Automation & Testing Matrix, 🧠 Belooga Master Knowledge Vault & API / Page Catalog, Domain 1: Identity & Authentication Vault (`/v1/users`, `/v1/auth`) — 7 Endpoints, Domain 2: Candidate Profiles (`/v1/profile/{username}`) — 4 Endpoints, Domain 3: Career Timeline & Reordering (`/v1/profile/{username}/...`) — 8 Endpoints (+6 more)

### Community 43 - "2. BACKEND DESIGN PATTERNS (BE & DISTRIBUTED SYSTEMS)"
Cohesion: 0.07
Nodes (27): 1. CORE ARCHITECTURAL PHILOSOPHY, 2.1. Clean 4-Layer Architecture (Ports & Adapters), 2.2. Repository & Unit of Work (UoW) Pattern, 2.3. Pessimistic Concurrency Locking Pattern (`SELECT FOR UPDATE`), 2.4. CQRS (Command Query Responsibility Segregation) with GIN/Trigram Indexing, 2.5. Transactional Outbox Pattern, 2.6. Non-Blocking Event-Loop Offloading Pattern, 2.7. Circuit Breaker & Exponential Backoff with Full Jitter (+19 more)

### Community 44 - "profile.py"
Cohesion: 0.27
Nodes (5): add_candidate_skill(), get_candidate_public_profile(), ProfileUpdate, SkillAdd, update_candidate_profile()

### Community 45 - "🧠 ADVANCED SYSTEMS ENGINEERING & COMPUTER SCIENCE KNOWLEDGE BASE"
Cohesion: 0.07
Nodes (26): 10. POSTGRESQL ADVISORY LOCKS FOR CONCURRENT ASYNC CHUNK WRITES, 11. CROSS-ORIGIN COOKIE TOPOLOGY & THE BFF (BACKEND-FOR-FRONTEND) PATTERN, 12. MASTER TECHNICAL KNOWLEDGE AUDIT CHECKLIST, 1. CORE ENGINEERING PHILOSOPHY, 2.1. PostgreSQL MVCC & Dead Tuple Bloat, 2.2. Transaction Anomalies & The Write Skew Trap, 2.3. Query Optimizer Join Algorithms, 2. DATABASE INTERNALS & CONCURRENCY ANOMALIES (+18 more)

### Community 46 - "4. Thiếu sót mang tính cấu trúc"
Cohesion: 0.08
Nodes (23): 1. Kết luận, 2. Ghi nhận điểm mạnh (để công bằng), 3. Bằng chứng: Skill nói vs Code thật, 4.1. Không tách "Hiện trạng" khỏi "Mục tiêu", 4.2. Không có quy tắc giải quyết mâu thuẫn, 4.3. Toàn bộ "enforcement" chỉ là văn xuôi và nhập vai, 4.4. Quá tải token và chồng chéo, 4.5. Các rule mâu thuẫn triết lý (+15 more)

### Community 47 - "media.py"
Cohesion: 0.11
Nodes (9): assemble_chunks_async(), _assemble_chunks_sync(), CompleteUploadRequest, generate_candidate_pdf(), get_validated_upload_dir(), get_video_transcoding_status(), run_cmd_async(), _run_cmd_sync() (+1 more)

### Community 48 - "test_idor_guards.py"
Cohesion: 0.14
Nodes (6): test_idor_cross_user_media_upload_forbidden(), test_idor_cross_user_profile_mutation_forbidden(), test_idor_cross_user_timeline_mutation_forbidden(), test_unauthenticated_mutations_rejected(), test_media_chunk_upload_path_traversal_rejection(), test_media_complete_upload_path_traversal_rejection()

### Community 49 - "⚙️ SENIOR BACKEND ENGINEER — PRODUCTION PATTERNS & STANDARDS"
Cohesion: 0.10
Nodes (19): 10. CREATIONAL PATTERNS: ABSTRACT FACTORY & BUILDER, 11. IDENTITY & TOKEN VAULT SECURITY PATTERNS, 12.1. Big-O Database Query Complexity ($O(\log N)$ Mandatory), 12.2. Anti-N+1 Query Invariant (The $O(1)$ Eager Loading Rule), 12.3. Lock Contention & Duration Budget ($< 50\text{ms}$), 12.4. Cyclomatic Complexity Limit ($\le 10$) & Guard Clauses, 12.5. The Rule of Three (Anti-Overengineering & YAGNI), 12. COMPLEXITY CONTROL & ALGORITHMIC INVARIANTS (+11 more)

### Community 50 - "🎨 SENIOR FRONTEND ENGINEER — PRODUCTION PATTERNS & STANDARDS"
Cohesion: 0.11
Nodes (18): 10. ACCESSIBILITY (WCAG 2.1 AA) INVARIANTS, 11.1. Algorithmic Complexity in JSX (The $O(1)$ Lookup Rule), 11.2. Frame Budget (16.6ms) & Long Task Budget (< 50ms), 11.3. Cyclomatic Complexity Limit ($\le 10$) & Component Flattening, 11.4. Memory Leak & Resource Cleanup Invariants, 11.5. The Rule of Three (Anti-Overengineering & YAGNI), 11. COMPLEXITY CONTROL & PERFORMANCE BUDGETS, 12. REJECTION CHECKLIST FOR SENIOR FRONTEND CODE (+10 more)

### Community 51 - "get_current_user"
Cohesion: 0.15
Nodes (16): get_current_user(), get_current_user_optional(), 0. Kết luận một dòng, 2.1 🚨 CRITICAL: Path traversal dẫn tới xoá thư mục tuỳ ý (lỗ hổng mới), 2.2 🚨 Upload video pitch, avatar, resume: 100% trả 401 cho mọi user, 2.3 🚨 Reorder timeline: 100% trả 500 (đã có repro), 2.4 Các vấn đề bảo mật khác của bản vá, 2. "Sửa bảo mật" nhưng làm hỏng tính năng và mở lỗ hổng mới (+8 more)

### Community 52 - "RTK Commands by Workflow"
Cohesion: 0.13
Nodes (14): Analysis & Debug (70-90% savings), Build & Compile (80-90% savings), Files & Search (60-75% savings), Git (59-80% savings), GitHub (26-87% savings), Golden Rule, Infrastructure (85% savings), JavaScript/TypeScript Tooling (70-90% savings) (+6 more)

### Community 53 - "generate-current-state.py"
Cohesion: 0.20
Nodes (6): extract_backend_routes(), extract_database_tables(), extract_dependencies(), extract_frontend_routes(), get_git_info(), main()

### Community 54 - "🏛️ PRINCIPAL SYSTEMS ARCHITECT — PRODUCTION PATTERNS & STANDARDS"
Cohesion: 0.20
Nodes (9): 1. DISTRIBUTED DATA CONSISTENCY & THE TRANSACTIONAL OUTBOX PATTERN, 2.1. Circuit Breaker Pattern, 2.2. Exponential Backoff with Full Jitter, 2. SYSTEM RESILIENCE & CASCADING FAILURE PREVENTION, 3. CROSS-SERVICE TRANSACTIONS: THE SAGA PATTERN, 4. INWARD DEPENDENCY RULE & ARCHITECTURAL PURITY, 5. DUAL-KEY CODE REVIEW GOVERNANCE, 6. REJECTION CHECKLIST FOR PRINCIPAL ARCHITECT AUDITS (+1 more)

### Community 55 - "🏁 ENTERPRISE DEFINITION OF DONE (DoD) QUALITY CONTRACT"
Cohesion: 0.20
Nodes (9): 1. THE DEFINITION OF DONE MANDATE, 2. LAYER 1: ARCHITECTURAL PURITY & DESIGN PATTERNS, 3. LAYER 2: COMPUTATIONAL COMPLEXITY & PERFORMANCE BUDGETS, 4. LAYER 3: CLIENT RESILIENCE, SECURITY & ERROR BOUNDARIES, 5. LAYER 4: DATABASE MIGRATION & ZERO-DOWNTIME EVOLUTION, 6. LAYER 5: TESTING PYRAMID & ZERO-FLAKINESS INVARIANTS, 7. LAYER 6: OBSERVABILITY, AUDIT & HEALTH PROBES, 8. LAYER 7: DUAL-KEY REVIEWER APPROVAL & PROOF BLOCK (+1 more)

### Community 56 - "🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS"
Cohesion: 0.20
Nodes (9): 1. COMPONENT-SCOPED PAGE OBJECT MODEL (POM) ARCHITECTURE, 2. DETERMINISTIC LOCATOR HIERARCHY, 3. ZERO-SLEEP & ANTI-FLAKINESS INVARIANTS, 4. HERMETIC TEST FIXTURES & DATA ISOLATION, 5. VISUAL REGRESSION & CANVAS STABILIZATION, 6. REJECTION CHECKLIST FOR SENIOR QC CODE, Best Practice Blueprint:, 🧪 SENIOR QC & TEST AUTOMATION ENGINEER — PRODUCTION PATTERNS & STANDARDS (+1 more)

### Community 58 - "🚦 BELOOGA ENTERPRISE AGENT ROUTER & EXECUTION PROTOCOL"
Cohesion: 0.22
Nodes (8): 1. PURPOSE & ORGANIZATIONAL OPERATING MODEL, 2. THE MANDATORY 6-STEP EXECUTION PIPELINE, 3. INTENT-BASED SKILL ROUTING MATRIX, 4. CROSS-DEPARTMENTAL IMPACT MATRIX, 5. THE DUAL-KEY INDEPENDENT REVIEWER GATE, 6. POST-FEATURE LEARNING & ANTI-REGRESSION PROTOCOL, 7. MANDATORY PROOF BLOCK SPECIFICATION, 🚦 BELOOGA ENTERPRISE AGENT ROUTER & EXECUTION PROTOCOL

### Community 59 - "⚡ Belooga Backend Architecture & 8 Service Domains Skill"
Cohesion: 0.22
Nodes (8): 1. Clean 4-Layer Architecture (Strict Separation of Concerns), 2. 8 Service Domains & 24 Database Tables Inventory, 3.1. Standard SQLAlchemy 2.0 Mapped Model:, 3.2. Standard Pydantic v2 DTO Schema:, 3.3. Standard Thin API Router:, 3. Production Code Implementation Standards, 4. QC Guardrails & API Consistency, ⚡ Belooga Backend Architecture & 8 Service Domains Skill

### Community 60 - "🏠 Department Skill: Homepage & Candidate Showcase (`/`)"
Cohesion: 0.22
Nodes (8): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Strict Visual Standards & Historical Pitfalls, 4. QC Selectors & Automated Test Assertions, 5. Post-Feature Self-Updating Protocol, 🔒 Anti-Regression Rules (Learned from Past Incidents):, 🏠 Department Skill: Homepage & Candidate Showcase (`/`), Target Component Hierarchy & Section Decomposition:

### Community 61 - "🌐 Master Page Orchestrator Skill: Candidate Workspace (`/user/[username]`)"
Cohesion: 0.22
Nodes (8): 1. Page Role & Component Hierarchy, 2.1. Server State: TanStack React Query as Single Source of Truth, 2.2. Cross-Section Communication via Invalidation, 2. State Management Architecture & Cross-Section Coordination, 3. Section Skills Routing Map, 4. QC Guardrails & Essential Shell Selectors, 🌐 Master Page Orchestrator Skill: Candidate Workspace (`/user/[username]`), 📐 Target Component Decomposition Architecture (Target Refactor):

### Community 62 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 63 - "🏛️ BELOOGA ARCHITECTURE DECISION RECORDS (ADR LOG)"
Cohesion: 0.25
Nodes (7): ADR-001: Selection of Bun over Node.js for Frontend & QC Tooling, ADR-002: Next.js 14+ App Router & Server/Client Segregation, ADR-003: FastAPI & Python 3.12+ Async for Modular Monolith Backend, ADR-004: SQLAlchemy 2.0 Async Mapped Models & Unit of Work, ADR-005: PostgreSQL 16 TSVECTOR with GIN Index over External Search Engine, ADR-006: ReportLab Python Canvas over Headless Browser for PDF Resumes, 🏛️ BELOOGA ARCHITECTURE DECISION RECORDS (ADR LOG)

### Community 64 - "🧐 Principal Backend Lead Reviewer: Code Review SOP & Rejection Checklist"
Cohesion: 0.25
Nodes (7): 1. Core Reviewer Philosophy & Governance, 2. Red-Line Instant Rejection Checklist (The "Kill-Switch" Criteria), 3. The 3-Step Backend Review SOP (Standard Operating Procedure), 4. Formal Reviewer Decision Templates, 🟢 Approval Template (Emit only when all 3 steps pass 100%):, 🧐 Principal Backend Lead Reviewer: Code Review SOP & Rejection Checklist, 🔴 Rejection Template (Emit when code fails any check):

### Community 65 - "🔐 Department Skill: Identity & Authentication (`/(auth)/...`)"
Cohesion: 0.25
Nodes (7): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Strict Security & Token Storage Standards, 4. QC Selectors & Automated Test Assertions, 5. Post-Feature Self-Updating Protocol, 🔐 Department Skill: Identity & Authentication (`/(auth)/...`), Sub-Route Hierarchy:

### Community 66 - "👤 Department Skill: Public Candidate Profile (`/public/[username]`)"
Cohesion: 0.25
Nodes (7): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Security & Read-Only Invariant Rules, 4. QC Selectors & Automated Test Assertions, 5. Post-Feature Self-Updating Protocol, 👤 Department Skill: Public Candidate Profile (`/public/[username]`), Target Component Hierarchy & Section Decomposition:

### Community 67 - "🔍 Department Skill: Talent Discovery & Candidate Search (`/search`)"
Cohesion: 0.25
Nodes (7): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Debounced Autocomplete & Query Synchronization Protocol, 4. QC Selectors & Automated Test Assertions, 5. Post-Feature Self-Updating Protocol, 🔍 Department Skill: Talent Discovery & Candidate Search (`/search`), Target Component Hierarchy & Section Decomposition:

### Community 68 - "🧐 Senior Frontend Lead Reviewer: Code Review SOP & Rejection Checklist"
Cohesion: 0.25
Nodes (7): 1. Core Reviewer Philosophy & Governance, 2. Red-Line Instant Rejection Checklist (The "Kill-Switch" Criteria), 3. The 3-Step Frontend Review SOP (Standard Operating Procedure), 4. Formal Reviewer Decision Templates, 🟢 Approval Template (Emit only when all 3 steps pass 100%):, 🔴 Rejection Template (Emit when code fails any check):, 🧐 Senior Frontend Lead Reviewer: Code Review SOP & Rejection Checklist

### Community 69 - "2. API Contracts & Network Mutations"
Cohesion: 0.25
Nodes (7): 1. Scope Boundary, 2.1. Avatar Upload, 2.2. Metadata Updates, 2.3. PDF Resume Download, 2. API Contracts & Network Mutations, 3. QC Anti-Regression Selectors (Mandatory Preservation), 👤 Section Skill: Profile Header & Identity Management

### Community 70 - "2. API Contracts & Autocomplete Flow"
Cohesion: 0.25
Nodes (7): 1. Scope Boundary, 2.1. Master Catalog Autocomplete, 2.2. Add Candidate Skill, 2.3. Delete Candidate Skill, 2. API Contracts & Autocomplete Flow, 3. QC Anti-Regression Selectors (Mandatory Preservation), 🏷️ Section Skill: Candidate Skills & Catalog Management

### Community 71 - "🎙️ Section Skill: WebRTC Video Studio & Recording Engine"
Cohesion: 0.25
Nodes (7): 1. Scope Boundary, 2. 60fps Re-render Isolation Technique (Leaf-Node Architecture), 3. Chunked Upload Sequence, 4. QC Anti-Regression Selectors (Mandatory Preservation), 🔴 Legacy Architectural Defect:, 🟢 Production Isolation Standard:, 🎙️ Section Skill: WebRTC Video Studio & Recording Engine

### Community 72 - "1. The Non-Negotiable 3-Phase Cycle"
Cohesion: 0.25
Nodes (7): 1. The Non-Negotiable 3-Phase Cycle, 2. Prohibited Anti-Patterns, 3. Standard Verification Commands, 🔴🟢 Mandatory TDD Workflow Standard Operating Procedure (SOP), Phase 1: RED (Test First & Prove the Defect), Phase 2: GREEN (Minimal Sane Fix), Phase 3: REFACTOR & Regression Verification

### Community 73 - "test_candidate_a"
Cohesion: 0.29
Nodes (4): client(), db_session(), test_candidate_a(), test_candidate_b()

### Community 74 - "Belooga Codebase Ground Truth (CURRENT_STATE.md)"
Cohesion: 0.25
Nodes (7): 1. Database Schema Truth (`backend/initdb.sql`), 3. Frontend Routes Inventory (`frontend/src/app`), 4.1 Backend (`backend/requirements.txt`), 4.2 Frontend (`frontend/package.json`), 4. Package & Dependency Ground Truth, 5. Security & Concurrency Verification Summary, Belooga Codebase Ground Truth (CURRENT_STATE.md)

### Community 75 - "🛡️ Mandatory Core Engineering Integrity & Evidence Protocol"
Cohesion: 0.29
Nodes (6): 1. Pillar 1: The "No Proof = Not Done" Iron Rule, 2. Pillar 2: Mandatory Inquiry Protocol (Uncertainty = Mandatory Question), 3. Pillar 3: Zero Full-Stack Hallucination, 4. Pillar 4: Blacklist of Deceptive Behaviors, 5. Pillar 5: Radical Transparency & Honest Reporting, 🛡️ Mandatory Core Engineering Integrity & Evidence Protocol

### Community 77 - "🛡️ Backend Department Skill: Identity & Authentication Vault (Domain 1)"
Cohesion: 0.33
Nodes (5): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Database Models Specification (SQLAlchemy 2.0 Async), 4. Token Family Rotation & Replay Protection Protocol, 🛡️ Backend Department Skill: Identity & Authentication Vault (Domain 1)

### Community 78 - "⚙️ Department Skill: Candidate User Management & Settings"
Cohesion: 0.33
Nodes (5): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Form Validation & Mutation Standards, 4. QC Selectors & Automated Test Assertions, ⚙️ Department Skill: Candidate User Management & Settings

### Community 79 - "📚 Backend Department Skill: Master Catalogs & Taxonomies (Domain 7)"
Cohesion: 0.40
Nodes (4): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Resilient Catalog Fallback Standard, 📚 Backend Department Skill: Master Catalogs & Taxonomies (Domain 7)

### Community 80 - "📢 Backend Department Skill: Public CMS & Moderation (Domain 8)"
Cohesion: 0.40
Nodes (4): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Moderation Ticket Protocol, 📢 Backend Department Skill: Public CMS & Moderation (Domain 8)

### Community 81 - "📹 Backend Department Skill: Media Processing & Storage (Domain 4)"
Cohesion: 0.40
Nodes (4): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Non-Blocking Async File I/O Protocol, 📹 Backend Department Skill: Media Processing & Storage (Domain 4)

### Community 82 - "👤 Backend Department Skill: Candidate Profiles (Domain 2)"
Cohesion: 0.40
Nodes (4): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Database Model & Search Vector Architecture, 👤 Backend Department Skill: Candidate Profiles (Domain 2)

### Community 83 - "🔎 Backend Department Skill: Talent Discovery & Search Engine (Domain 6)"
Cohesion: 0.40
Nodes (4): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Weighted TSVECTOR Full-Text Search Specification, 🔎 Backend Department Skill: Talent Discovery & Search Engine (Domain 6)

### Community 84 - "⏳ Backend Department Skill: Career Timeline & Reordering (Domain 3)"
Cohesion: 0.40
Nodes (4): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. Concurrency & Pessimistic Locking Protocol, ⏳ Backend Department Skill: Career Timeline & Reordering (Domain 3)

### Community 85 - "📰 Department Skill: Public Content, CMS & Compliance"
Cohesion: 0.40
Nodes (4): 1. Department Role & Mission, 2. Cross-Departmental Impact Matrix (Dependencies), 3. QC Selectors & Automated Test Assertions, 📰 Department Skill: Public Content, CMS & Compliance

### Community 86 - "🎬 Section Skill: 30-Second Pitch Video Player"
Cohesion: 0.40
Nodes (4): 1. Scope Boundary, 2. Browser Autoplay Fallback Protocol, 3. QC Anti-Regression Selectors (Mandatory Preservation), 🎬 Section Skill: 30-Second Pitch Video Player

### Community 87 - "⏳ Section Skill: Career Timeline & Credentials Management"
Cohesion: 0.40
Nodes (4): 1. Scope Boundary, 2. Drag-and-Drop Reordering & Optimistic Updates, 3. QC Anti-Regression Selectors (Mandatory Preservation), ⏳ Section Skill: Career Timeline & Credentials Management

### Community 88 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 89 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **495 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+490 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 634 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `2. Backend API Inventory (`backend/app/api/v1/endpoints/`)` connect `2. Backend API Inventory (`backend/app/api/v1/endpoints/`)` to `timeline.py`, `AuthenticatedUser`, `Belooga Codebase Ground Truth (CURRENT_STATE.md)`, `profile.py`, `media.py`, `get_current_user`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Phase 2: Page Object Models (POMs) Development (`qc/pages/`)` connect `Button` to `3. Phase-by-Phase Implementation Checklist`, `@playwright/test`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `BasePage` connect `@playwright/test` to `Button`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 39 inferred relationships involving `2. Backend API Inventory (`backend/app/api/v1/endpoints/`)` (e.g. with `check_email_exists()` and `check_username_exists()`) actually correct?**
  _`2. Backend API Inventory (`backend/app/api/v1/endpoints/`)` has 39 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `AuthenticatedUser` (e.g. with `get_current_session_user()` and `complete_chunked_video_upload()`) actually correct?**
  _`AuthenticatedUser` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `verify_profile_owner()` (e.g. with `5. Security & Concurrency Verification Summary` and `5. Thiếu sót vẫn còn từ Round 1`) actually correct?**
  _`verify_profile_owner()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _495 weakly-connected nodes found - possible documentation gaps or missing edges._