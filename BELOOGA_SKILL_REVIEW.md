# BELOOGA — Agent Knowledge Layer Review (Target: S-tier Production)

> **Gửi Gemini / Antigravity agent:** Đây là bản review độc lập về toàn bộ lớp tri thức agent của repo `farmer911/belooga`
> (rules, skills, tài liệu root, generator, audit). Nhiệm vụ của bạn **không phải đồng ý**. Nhiệm vụ của bạn là
> **kiểm chứng từng finding bằng bằng chứng từ repo**, phản bác nếu reviewer sai, chấp nhận và sửa nếu reviewer đúng.
> Đọc kỹ mục 1 (Protocol phản biện) trước khi trả lời bất cứ điều gì.

---

## 0. Phạm vi review

| Đã đọc | Chưa đọc được |
|---|---|
| `CLAUDE.md`, `ONBOARDING.md`, `SUBAGENTS_PARALLEL_ORCHESTRATION.md`, `CURRENT_STATE.md`, `VIOLATIONS_REGISTER.md`, cây thư mục root | 50 file `.agents/skills/*/SKILL.md`, `.agents/rules/`, `.agents/workflows/`, `PLAN_*.md`, `BELOOGA_*.md`, `DESIGN_SYSTEM.md`, source code |

Hệ quả: các finding về nội dung từng skill (F-03, F-09) dựa trên mô tả trong `ONBOARDING.md`, cần bạn xác minh trực tiếp.

**Sự thật về Antigravity (làm căn cứ):**
- Skills workspace: `.agents/skills/<name>/SKILL.md` (legacy `.agent/skills/` vẫn đọc). → Vị trí hiện tại **đúng**.
- Rules always-on: `GEMINI.md` (root, ưu tiên cao hơn) hoặc `AGENTS.md` (root), và `.agents/rules/*.md` (always-on / glob / model-decision / @-mention), giới hạn ~12.000 ký tự.
- Workflows: `.agents/workflows/`.
- `CLAUDE.md` **không** được Gemini đọc.

---

## 1. Protocol phản biện (BẮT BUỘC)

1. Trả lời **từng finding theo ID** (F-01 … F-12, M-01 … M-13). Không gộp, không bỏ qua.
2. Mỗi finding chọn đúng một verdict: `ACCEPT` | `REJECT` | `PARTIAL`.
3. **Mọi verdict phải kèm bằng chứng**: đường dẫn file + số dòng, hoặc lệnh đã chạy + output thật (rút gọn được, không bịa).
   - `REJECT` không có bằng chứng = coi như `ACCEPT`.
   - Câu kiểu "đã được xử lý", "theo best practice", "đã tuân thủ" mà không có file:line → không được tính.
4. Với `ACCEPT`/`PARTIAL`: nêu **thay đổi cụ thể** (file nào, diff tóm tắt) và **lệnh kiểm chứng** + output sau khi sửa.
5. **Cấm báo "đã sửa" khi chưa chạy kiểm chứng** (chính là lỗi gốc của VIOLATION-004).
6. Không được sửa con số trong tài liệu cho "khớp" bằng tay. Con số chỉ được sinh từ generator.
7. Nếu reviewer sai → nói thẳng reviewer sai ở đâu, bằng chứng gì. Phản biện được hoan nghênh, xu nịnh thì không.
8. Định dạng trả lời: bảng ở **mục 9**.

---

## 2. Kết luận tổng

**Hạng hiện tại: B−. Chưa đạt S-tier. Chưa đủ chuẩn production.**

Ý tưởng nền tốt (CURRENT_STATE sinh tự động, tách AS-IS/TO-BE, stub registry, audit script, violations register),
nhưng lớp tri thức **tự mâu thuẫn**, **không được nạp thường trực cho Gemini**, và **không có cơ chế tự động chặn lệch**.
Tuyên bố "Zero-Hallucination" hiện chỉ là khẩu hiệu: chính tài liệu đang là nguồn gây hallucination.

---

## 3. Findings

### P0 — Chặn production

#### F-01 · Gemini không có rule thường trực về project
- **Bằng chứng:** Root không có `GEMINI.md` hay `AGENTS.md`. File thường trực duy nhất là `CLAUDE.md` — Gemini không đọc, và nội dung 100% là hướng dẫn công cụ RTK (cargo, go, rake, rspec, kubectl… không thuộc stack). Không một dòng nào về Belooga.
- **Tác động:** Mỗi phiên, agent khởi động mù context; mọi hiểu biết phụ thuộc vào việc description skill có khớp hay không. Giải thích trực tiếp chuỗi VIOLATION-001→004.
- **Yêu cầu:** Tạo `GEMINI.md` ≤ 80 dòng (stack thật, bảng định tuyến task → skill/workflow, thứ tự ưu tiên nguồn sự thật, ≤ 5 luật cấm tuyệt đối). Tạo `.agents/rules/{backend,frontend,qc}.md` kích hoạt theo glob. Xóa `CLAUDE.md` hoặc chuyển phần RTK còn dùng (git/pytest/bun/playwright/docker) vào rules.
- **Nghiệm thu:** `ls GEMINI.md .agents/rules/` tồn tại; mở phiên mới hỏi "stack backend là gì, nguồn sự thật nào ưu tiên?" → trả lời đúng mà không cần đọc file khác.
- **Câu hỏi bắt buộc:** `.agents/rules/` hiện có tồn tại không? Liệt kê nội dung và chế độ kích hoạt của từng file.

#### F-02 · Tài liệu mâu thuẫn nhau ở ≥ 6 điểm
| Chủ đề | `SUBAGENTS_PARALLEL_ORCHESTRATION.md` | `ONBOARDING.md` / `CURRENT_STATE.md` |
|---|---|---|
| Framework | Next.js 14, shadcn/ui | Next 16.3.8; không có shadcn trong `package.json` |
| Quy mô | 19 bảng, 72 endpoint, 16 page | 24 bảng, 38 endpoint, 18 page |
| Khởi tạo DB | Alembic async migrations | `initdb.sql` + `seed-data.py`, không migration |
| Media | Upload S3 | Ghi chunk ra đĩa local (`os.path.realpath`) |
| Refresh token | Revoke cả token family khi replay | `FOR UPDATE` + grace window 15s |
| Chạy QC | `cd qc && bun test` (**sai**: chạy Bun test runner, không phải Playwright) | `bunx playwright test tests/e2e` |
| Chạy backend | `docker compose up -d` → API ở :8000 | Compose chỉ chạy postgres + redis; uvicorn chạy tay |
- **Tác động:** Agent đọc hai nguồn khác nhau → buộc phải đoán.
- **Yêu cầu:** Chuyển `PLAN_*`, `SUBAGENTS_PARALLEL_ORCHESTRATION.md`, `BELOOGA_MIGRATION_BLUEPRINT.md` (nếu lỗi thời) vào `docs/archive/` với dòng đầu `> LỊCH SỬ — KHÔNG DÙNG LÀM NGUỒN SỰ THẬT`, hoặc xóa. Mọi con số chỉ nằm trong file generated.
- **Nghiệm thu:** `grep -rnE "[0-9]+ (tables|endpoints|bảng|page)" --include=*.md . | grep -v docs/generated | grep -v docs/archive` → rỗng.

#### F-03 · Skill chứa kiến trúc TO-BE (chưa tồn tại)
- **Bằng chứng:** `ONBOARDING.md §5` nói `.agents/skills/be-service-*/SKILL.md` chứa banner `TARGET ARCHITECTURE` mô tả tầng Domain Service / Repository chưa có.
- **Tác động:** Model bắt chước ví dụ code, không đọc banner → sinh code gọi lớp không tồn tại. Đây là nguồn hallucination có hệ thống.
- **Yêu cầu:** Skill chỉ mô tả AS-IS. TO-BE chuyển sang `docs/adr/`. Trong skill để 1 dòng: "Chưa có service layer; endpoint gọi AsyncSession trực tiếp."
- **Nghiệm thu:** `grep -rn "TARGET ARCHITECTURE\|TO-BE" .agents/skills` → rỗng.
- **Câu hỏi bắt buộc:** Liệt kê mọi skill chứa nội dung TO-BE, số dòng bị ảnh hưởng.

#### F-04 · Mâu thuẫn auth ở public profile / PDF
- **Bằng chứng:** `CURRENT_STATE.md §2`: `GET /v1/profile/{username}` và `GET /v1/profile/{username}/pdf/` gắn guard `get_current_user`. `ONBOARDING.md §4`: hidden profile trả **404** cho khách chưa đăng nhập ⇒ khách chưa đăng nhập phải truy cập được profile public.
- **Chỉ có 2 khả năng:** (a) `/public/[username]` không hoạt động với khách ẩn danh — bug production; hoặc (b) generator gắn nhãn sai, không phân biệt auth bắt buộc vs optional — bug của "nguồn sự thật".
- **Yêu cầu:** Xác định (a) hay (b). Sửa code hoặc generator. Generator phải xuất 3 trạng thái: `Public` / `Optional auth` / `Required auth`.
- **Nghiệm thu:** `curl -i http://localhost:8000/v1/profile/alexnguyen` không token → 200 với email/phone = null; với `hidden_jane` → 404. Có test pytest cho cả hai.
- **Câu hỏi bắt buộc:** Dán chữ ký hàm `get_candidate_public_profile` và dependency auth thật của nó (file:line).

#### F-05 · "Nguồn sự thật" sinh từ code chưa commit
- **Bằng chứng:** Header `CURRENT_STATE.md`: commit `3a0250b` **(56 uncommitted modifications)**.
- **Tác động:** File trên GitHub mô tả code không có trên GitHub. Agent ở máy khác / CI thấy lệch ngay.
- **Yêu cầu:** Generator từ chối chạy (exit ≠ 0) khi working tree dirty, trừ cờ `--allow-dirty` cho local. CI sinh lại và fail nếu diff khác.
- **Nghiệm thu:** CI job `state-drift` đỏ khi `CURRENT_STATE.md` lệch code.

### P1 — Phải sửa trước khi gọi là S-tier

#### F-06 · Nhãn "✅ ENFORCED / AST verified" là overclaim
- **Bằng chứng:** 7 dòng ENFORCED trong `CURRENT_STATE.md §5`, toàn bộ dựa trên AST. Chỉ 19 integration test cho 38 endpoint. Persona admin tồn tại nhưng không có endpoint admin, không có kiểm tra role nào.
- **Tác động:** AST chứng minh code *tồn tại*, không chứng minh *hành vi*. Cảm giác an toàn giả.
- **Yêu cầu:** Thay bằng 3 cột: `Code present (AST)` / `Test covered (tên test)` / `Enforced` (chỉ ✅ khi có test runtime pass). Bổ sung test cho mọi dòng hiện ghi ENFORCED.
- **Nghiệm thu:** Mỗi dòng ✅ trỏ được tới ≥ 1 test cụ thể đang pass.

#### F-07 · Code legacy nằm lẫn ở root
- **Bằng chứng:** `index.html`, `login.html`, `app.js`, `index.css`, `build_all_pages.py`, … nằm cạnh `frontend/`. VIOLATION-004 phát sinh từ việc agent sửa `index.css`.
- **Tác động:** Lỗi cấu trúc, không phải lỗi agent. Sẽ tái diễn.
- **Yêu cầu:** Chuyển toàn bộ vào `legacy/` + `legacy/README.md` ghi READ-ONLY. Rule glob `legacy/**`: cấm ghi. Gỡ `graphify-out/` khỏi git (thêm vào `.gitignore`) nếu là output sinh lại được.

#### F-08 · VIOLATIONS_REGISTER không được nối vào nơi agent đọc
- **Bằng chứng:** Là file riêng ở root; 4/4 vi phạm xoay quanh 1 nút play; trộn Việt/Anh; tham chiếu repo `farmer911/beloga` nhưng không nói agent truy cập bằng cách nào.
- **Yêu cầu:** Mỗi "Harness rule" → 1 dòng trong `.agents/rules/frontend.md` hoặc 1 bước trong `.agents/workflows/visual-verify.md`. Register giữ làm lịch sử. Ghi rõ đường dẫn local của legacy source.

#### F-09 · 50 skill — khả năng cao chồng lấn (GIẢ THUYẾT, cần xác minh)
- **Lý do nghi ngờ:** 38 endpoint + 18 page không cần 50 skill. Nhiều skill gần nhau → Gemini chọn sai hoặc nạp nhiều skill nói hơi khác nhau.
- **Yêu cầu:** Xuất inventory (mục 9.2). Mục tiêu 12–18 skill theo domain, chi tiết đẩy xuống `references/`.
- **Câu hỏi bắt buộc:** Những cặp skill nào có description giao nhau? Skill nào > 300 dòng?

#### F-10 · Lệnh sai trong tài liệu
- `cd qc && bun test` → sai công cụ. `docker compose up -d` → không khởi động backend như mô tả. Xem F-02.
- **Yêu cầu:** Mọi lệnh trong rules/skills/workflows phải chạy được nguyên văn; audit chạy thử các lệnh đánh dấu `# verify`.

### P2 — Đánh bóng

#### F-11 · Văn phong tốn token
"authoritative", "uncompromising", "enterprise", emoji, ASCII box. Model làm theo dữ kiện, không theo tính từ. Cắt.

#### F-12 · Tham chiếu treo
ADR-005, ADR-006 được nhắc trong `CURRENT_STATE.md` nhưng không rõ nằm đâu. Cần `docs/adr/README.md` làm index.

---

## 4. Skill context knowledge còn thiếu

Nếu đã có trong 50 skill → `REJECT` kèm đường dẫn. Nếu chưa → tạo.

| ID | Skill | Nội dung tối thiểu | Ưu tiên |
|---|---|---|---|
| M-01 | Router / source-of-truth precedence | Nằm trong `GEMINI.md`: task → skill/workflow; thứ tự: code > generated state > skill > ADR > archive | P0 |
| M-02 | API contract FE↔BE | Error envelope, pagination, status code, trailing-slash, sinh TS types từ OpenAPI | P0 |
| M-03 | Authorization & PII matrix | Ai (guest/owner/admin/hidden) thấy field nào, endpoint nào | P0 |
| M-04 | Auth/session end-to-end | Access token in-memory, refresh cookie HttpOnly, 401 interceptor + retry, CORS credentials, SameSite, CSRF cho refresh | P0 |
| M-05 | Business rules & glossary | Video pitch 0:30, visibility, ranking search, report/moderation flow, trạng thái video | P1 |
| M-06 | Schema change procedure | Chốt `initdb.sql` vs Alembic; thêm cột → sửa file nào, seed, regenerate state, reset test DB | P1 |
| M-07 | Testing conventions | pytest fixtures + auth helper, Playwright POM, `data-testid`, test data | P1 |
| M-08 | Legacy → new mapping | Route, Redux→Zustand, SCSS class→token, API cũ→endpoint mới | P1 |
| M-09 | Media pipeline | Chunk protocol, giới hạn size/type, nơi lưu thật, trạng thái transcoding | P1 |
| M-10 | Definition of Done (workflow) | regenerate state → audit → pytest → tsc → playwright → visual verify → commit | P0 |
| M-11 | ADR index | Danh sách ADR, trạng thái, liên kết | P2 |
| M-12 | Env & feature flags | Ý nghĩa từng biến `.env.example`, `NEXT_PUBLIC_E2E`, khi nào bật | P2 |
| M-13 | Stub handling | Khi được giao làm tiếp stub: cấm giả lập success, phải có endpoint + test thật | P1 |

---

## 5. Kiến trúc tri thức mục tiêu

```
GEMINI.md                     # ≤ 80 dòng, always-on
.agents/
  rules/
    backend.md                # glob: backend/**
    frontend.md               # glob: frontend/**
    qc.md                     # glob: qc/**
    legacy.md                 # glob: legacy/** → READ-ONLY
  workflows/
    definition-of-done.md
    visual-verify.md
    schema-change.md
  skills/                     # AS-IS only, 12–18 skill, mỗi SKILL.md ≤ 300 dòng + references/
docs/
  generated/CURRENT_STATE.md  # chỉ generator/CI được ghi
  adr/                        # TO-BE ở đây
  archive/                    # tài liệu lỗi thời
legacy/                       # HTML/CSS/JS cũ, READ-ONLY
```

Phân vai: **Rules** = luật luôn đúng trong một vùng code. **Workflows** = quy trình có bước cố định. **Skills** = kiến thức domain sâu, nạp khi cần.

---

## 6. Tiêu chí S-tier (kiểm chứng được)

1. **Single source per fact** — con số/version chỉ ở file generated; skill trỏ tới, không chép.
2. **Skill = AS-IS only.**
3. **Mọi path/symbol/endpoint trong skill được script xác minh tồn tại.**
4. **Có kiến thức model không tự suy ra** (luật nghiệp vụ, bẫy đã gặp, quy ước riêng). Không có câu chung chung kiểu "viết code sạch".
5. **Có bước tự kiểm chứng** (lệnh + kết quả mong đợi).
6. **Description kích hoạt đúng, không giao nhau**, có "Not for … (dùng skill X)".
7. **CI chặn merge khi tài liệu lệch code.**

Thiếu (4), (5) hoặc (3) → tối đa B.

### Khuôn SKILL.md chuẩn

```markdown
---
name: be-timeline
description: Work-history and education CRUD + drag-reorder in
  backend/app/api/v1/endpoints/timeline.py. Use when adding/changing
  job-experiences or education endpoints, display_order, or reorder locking.
  Not for profile fields (be-profile) or frontend drag UI (fe-workspace).
---
## Current reality (AS-IS)
- No service/repository layer. Endpoints use AsyncSession directly.
- Contract: see docs/generated/CURRENT_STATE.md §2 (do not copy here).

## Project-specific rules
- Reorder: SELECT ... FOR UPDATE on all items of the profile, one transaction, single commit.
- Ownership: always verify_profile_owner(); never derive username from email.

## Known traps
- Nested db.begin() on an autobegun session fails. Use pattern at <file:line>.

## Canonical example
- <path to the best existing endpoint>

## Self-verification (required before reporting done)
- backend/.venv/bin/pytest backend/tests/test_timeline.py -v
- bash scripts/audit-truth.sh
```

---

## 7. Nâng cấp `scripts/audit-truth.sh` (bắt buộc chạy trong CI)

1. Lint frontmatter skill: có `name` + `description`, name khớp tên thư mục, description ≤ 1024 ký tự, không trùng.
2. Trích mọi path trong `GEMINI.md`, `.agents/**` → kiểm tra tồn tại.
3. Trích mọi endpoint trong skill → kiểm tra có trong `CURRENT_STATE.md`.
4. Cấm con số quy mô trong markdown ngoài `docs/generated/` và `docs/archive/`.
5. Cấm `TARGET ARCHITECTURE` / `TO-BE` trong `.agents/skills/`.
6. Fail khi `CURRENT_STATE.md` sinh từ working tree dirty, hoặc khác với bản sinh lại trong CI.
7. Cảnh báo SKILL.md > 300 dòng; lỗi khi rules vượt 12.000 ký tự.

---

## 8. Lộ trình

| Bước | Việc | Finding |
|---|---|---|
| 1 | `GEMINI.md` + 4 rule glob; xóa/chuyển `CLAUDE.md` | F-01, M-01 |
| 2 | Archive tài liệu lỗi thời; chuyển legacy vào `legacy/` | F-02, F-07, F-10 |
| 3 | Xác minh và sửa F-04; sửa generator + chặn dirty tree | F-04, F-05 |
| 4 | Gỡ TO-BE khỏi skill; gộp còn 12–18 skill theo khuôn mục 6 | F-03, F-09 |
| 5 | Viết M-02, M-03, M-04, M-10 | M-* P0 |
| 6 | Nâng cấp audit + CI; đổi nhãn ENFORCED | F-06, mục 7 |
| 7 | Phần còn lại | P1/P2 |

---

## 9. Định dạng trả lời bắt buộc

### 9.1 Bảng verdict
| ID | Verdict | Bằng chứng (file:line hoặc lệnh + output) | Thay đổi đã làm | Lệnh kiểm chứng + output sau sửa |
|---|---|---|---|---|
| F-01 | | | | |
| … | | | | |
| M-13 | | | | |

### 9.2 Inventory skill (xuất trước khi sửa)
| Skill | Số dòng | Description (nguyên văn) | Chứa TO-BE? | Có "Known traps"? | Có "Self-verification"? | Giao nhau với skill |
|---|---|---|---|---|---|---|

### 9.3 Câu hỏi bắt buộc trả lời
1. `.agents/rules/` và `.agents/workflows/` hiện có những file gì, chế độ kích hoạt từng file?
2. Dependency auth thật của `get_candidate_public_profile` và `generate_candidate_pdf` (file:line)? F-04 là (a) hay (b)?
3. Những skill nào chứa TO-BE?
4. ADR-005, ADR-006 nằm ở đâu?
5. Repo legacy `farmer911/beloga` được agent truy cập bằng đường dẫn nào?
6. `audit-truth.sh` hiện kiểm tra đúng 8 gate nào? Gate nào kiểm tra skill?

> **Nhắc lại:** Không bằng chứng = không được tính. Không chạy kiểm chứng = chưa xong.
