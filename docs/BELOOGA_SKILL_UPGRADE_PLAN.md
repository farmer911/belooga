# BELOOGA — Skill Review & Upgrade Plan (mục tiêu: mọi skill ≥ 8.5)

> **Phạm vi đã đọc:** toàn bộ `.agents/` trong `belooga-main.zip` (31 skill, 13 file `references/`, 8 rule, 4 workflow, `ROUTER.md`, `ADR.md`), `GEMINI.md`, `CLAUDE.md`, và đối chiếu với code thật trong `backend/`, `frontend/`, `qc/`, `legacy/`.
> **Kèm theo file này:** 3 script đã chạy thử trên repo thật: `scripts/lint-skills.py`, `scripts/render-skill-facts.py`, `scripts/ratchet.py`.

---

## 0. Cách dùng file này

**Cho người:** đọc mục 1–3 để nắm tình hình, mục 6 để biết thứ tự làm việc.

**Cho agent (Gemini / Claude) thực thi plan:**
1. Làm **đúng thứ tự phase** ở mục 6. Không nhảy phase.
2. Mỗi thẻ skill ở mục 8 có phần **Nghiệm thu**. Một skill chỉ được coi là xong khi mọi dòng nghiệm thu có **output lệnh thật** đi kèm.
3. Nếu một finding trong file này **sai so với repo** (code đã đổi sau ngày review), ghi `REJECT F-xx: <bằng chứng file:line>` và bỏ qua finding đó. Không sửa theo finding sai.
4. Sau mỗi phase, chạy:
   ```bash
   python3 scripts/lint-skills.py --quiet
   python3 scripts/render-skill-facts.py --check
   python3 scripts/ratchet.py
   ```
   rồi dán output vào báo cáo phase.

---

## 1. Tóm tắt

| Chỉ số | Hiện tại | Mục tiêu |
|---|---|---|
| Điểm trung bình 31 skill | **5.5 / 10** (tier C) | ≥ 8.5 cho **từng** skill |
| Skill ≥ 8.5 | 0 / 31 | 100% số skill còn lại sau Phase 1 |
| Lỗi `lint-skills.py` | **75 ERROR, 2 WARN** (chạy trên zip) | 0 ERROR |
| Gate 3 `audit-truth.sh` | Báo "zero-hallucination OK" | Thay bằng `lint-skills.py` |
| AUTO block (AS-IS sinh tự động) | 0 skill | 16 domain skill |

**Lỗi gốc:** code đã refactor xong (router → service → repository, Alembic, `src/hooks/`, `components/features/`, domain expert-review mới), còn skill vẫn mô tả kiến trúc cũ. Cổng kiểm tra không phát hiện được vì chỉ so data-testid, đường dẫn API và đường dẫn file.

> Điểm trong file này tính theo rubric chính thức ở mục 2, nên chênh nhẹ (±0.5) so với lần chấm nhanh trong chat. Rubric này là chuẩn duy nhất từ giờ trở đi.

---

## 2. Rubric chấm điểm

### 2.1 Năm tiêu chí

| Mã | Tiêu chí | Trọng số | 10 điểm nghĩa là |
|---|---|---|---|
| **T** | Truth: đúng với code | 30% | Mọi khẳng định về file, route, hàm, bảng, hành vi đều kiểm chứng được. Phần AS-IS nằm trong AUTO block sinh từ code. |
| **C** | Consistency: nhất quán | 20% | Không mâu thuẫn với skill, rule, ADR hay workflow nào khác. Mỗi chuẩn chỉ có một con số. |
| **R** | Routing: trigger đúng | 15% | Description có đủ "làm gì + Use when + Not for", từ khóa riêng biệt, ≤ 1024 ký tự, qua trigger eval ≥ 90%. |
| **A** | Actionability: dùng được | 20% | Rule cụ thể, Known Traps lấy từ sự cố thật, lệnh Self-Verification chạy được. |
| **E** | Economy: gọn | 15% | SKILL.md ≤ 200 dòng, reference ≤ 400 dòng, không trùng nội dung, không chép giáo trình. |

`Điểm = 0.30·T + 0.20·C + 0.15·R + 0.20·A + 0.15·E`

### 2.2 Trần điểm (áp dụng sau khi tính)

| Điều kiện | Trần |
|---|---|
| Chỉ dẫn gây hại: bảo agent tránh code đang tồn tại, hoặc khóa một giá trị sai | **4.0** |
| Có khẳng định sai về code (layer, chữ ký hàm, số liệu) | **6.0** |
| Còn ít nhất 1 `ERROR` từ `lint-skills.py` | **7.0** |
| Domain skill không có AUTO block | **7.0** |

### 2.3 Định nghĩa "đạt 8.5" (tier S)

Một skill đạt khi thỏa **cả bốn** điều kiện:
1. Điểm rubric ≥ 8.5.
2. `lint-skills.py` không báo ERROR nào cho file đó.
3. Trigger eval của skill đúng ≥ 90% (mục 10).
4. Có ít nhất 1 Known Trap gắn với file/dòng hoặc sự cố thật, và lệnh Self-Verification đã chạy ra exit 0 (hoặc fail đúng như mô tả nếu trap đó là lỗi đang mở).

---

## 3. Bảng điểm hiện tại

| Skill | T | C | R | A | E | Thô | **Cuối** | Lý do trần / vấn đề chính |
|---|---|---|---|---|---|---|---|---|
| belooga-self-learn | 7 | 6 | 9 | 8 | 8 | 7.5 | **7.5** | Ghi bài học vào `docs/archive` (vùng "không được trích dẫn") |
| ponytail-review | 8 | 5 | 8 | 8 | 8 | 7.4 | **7.4** | Chưa gắn chuẩn riêng của dự án |
| ponytail-audit | 8 | 5 | 8 | 8 | 8 | 7.4 | **7.4** | Như trên |
| ponytail-debt | 8 | 5 | 8 | 7 | 8 | 7.2 | **7.2** | Như trên |
| fe-page-auth | 7 | 7 | 9 | 7 | 8 | 7.5 | **7.0** | Chưa có AUTO block |
| fe-page-home | 6 | 5 | 9 | 7 | 8 | 6.8 | **6.8** | Ghi đúng legacy `#9b9b9b` nhưng code và test là `#5bbbae` |
| fe-page-cms-public | 6 | 6 | 8 | 6 | 8 | 6.6 | **6.6** | Thiếu route `(public)/expert-review` |
| fe-page-search | 6 | 6 | 8 | 6 | 8 | 6.6 | **6.6** | Chưa có AUTO block |
| fe-page-user-management | 6 | 6 | 8 | 6 | 8 | 6.6 | **6.6** | Chưa có AUTO block |
| engineering-integrity-and-evidence | 7 | 6 | 4 | 7 | 7 | 6.4 | **6.4** | Description không có trigger |
| tdd-workflow | 7 | 6 | 4 | 7 | 7 | 6.4 | **6.4** | Description không có trigger |
| ponytail | 8 | 3 | 4 | 8 | 6 | 6.1 | **6.1** | Bật always-on, xung đột với kiến trúc layer |
| be-service-auth | 4 | 6 | 8 | 7 | 8 | 6.2 | **6.0** | Ghi "không có service layer", sai |
| be-service-profile | 4 | 6 | 8 | 7 | 8 | 6.2 | **6.0** | Sai thứ tự tham số `verify_profile_owner` |
| be-service-timeline | 4 | 6 | 8 | 6 | 8 | 6.0 | **6.0** | Sai chữ ký hàm, bỏ sót lỗ rò `is_hidden` |
| fe-page-public-profile | 4 | 6 | 8 | 6 | 8 | 6.0 | **6.0** | Cảnh báo import đã lỗi thời |
| be-service-search | 3 | 6 | 8 | 6 | 8 | 5.7 | **5.7** | Logic search thực ra nằm ở `CatalogsService` |
| be-service-cms | 3 | 5 | 7 | 5 | 8 | 5.2 | **5.2** | Layer sai, không nhắc rủi ro spam |
| be-service-media | 3 | 5 | 7 | 6 | 7 | 5.2 | **5.2** | Không biết `media_service`, `media_transcoder`, `pdf_generator` tồn tại |
| legacy-ground-truth-enforcement | 6 | 5 | 3 | 6 | 5 | 5.2 | **5.2** | Cùng một luật CSS bị chép ở 6 nơi |
| be-service-catalogs | 3 | 4 | 7 | 5 | 8 | 5.0 | **5.0** | Bắt buộc fallback, trong khi reviewer coi fallback là lỗi loại ngay |
| markmap-architect | 4 | 5 | 4 | 5 | 6 | 4.7 | **4.7** | Hardcode "16 Routes / 36 APIs" |
| ponytail-help | 5 | 4 | 6 | 3 | 5 | 4.5 | **4.5** | Không có giá trị cho dự án |
| clean-architecture | 4 | 3 | 4 | 5 | 6 | 4.3 | **4.3** | 4 con số giới hạn dòng khác nhau |
| belooga-frontend-engineering | 2 | 4 | 6 | 5 | 7 | 4.3 | **4.0** | Cấm dùng `src/hooks/` đang tồn tại |
| belooga-backend-engineering | 2 | 4 | 5 | 5 | 7 | 4.2 | **4.0** | Số liệu sai, kiến trúc sai |
| fe-page-workspace | 1 | 3 | 7 | 4 | 5 | 3.5 | **3.5** | "page.tsx hơn 3.000 dòng, đừng import" (thực tế 173 dòng) |
| belooga-qc-engineering | 2 | 3 | 3 | 4 | 4 | 3.1 | **3.1** | Cây thư mục bịa, test khóa màu sai |
| definition-of-done | 3 | 2 | 4 | 3 | 3 | 3.0 | **3.0** | Không task nào đạt được |
| ponytail-gain | 1 | 3 | 6 | 2 | 5 | 3.0 | **3.0** | Trỏ `benchmarks/` không tồn tại |
| belooga-knowledge-vault | 2 | 2 | 4 | 3 | 2 | 2.5 | **2.5** | Sao chép CURRENT_STATE với số liệu sai |

**Hạ tầng xung quanh skill (không chấm theo rubric skill, nhưng phải sửa):**

| File | Điểm | Vấn đề |
|---|---|---|
| `.agents/ROUTER.md` | 2 | 17 tên skill không tồn tại; bước reviewer trỏ vào skill ảo |
| `.agents/workflows/schema-change.md` | 1 | Làm theo thì DB không đổi (xem F-05) |
| `GEMINI.md` | 5 | Định tuyến backend sang `belooga-backend-services` (không có); đường dẫn `/Users/...` |
| `.agents/ADR.md` | 4 | Ghi "19 bảng", "Next.js 14+"; nằm sai chỗ (đúng ra là `docs/adr/`) |
| `.agents/rules/backend.md` | 4 | "direct AsyncSession execution", đã lỗi thời |

---

## 4. Phát hiện hệ thống (có bằng chứng)

### F-01 — Skill mô tả code đã không còn tồn tại
- **Backend thật:** `backend/app/services/` (9 file), `backend/app/repositories/` (7 file), `backend/alembic/versions/0001_initial_schema.py` và `0002_expert_cv_review.py`. Endpoint chứa **0** lời gọi `text(`.
- **Skill nói ngược lại:** "No separate service/repository layer; queries execute directly via `AsyncSession` and raw SQL `text(...)`" xuất hiện trong 7 skill `be-service-*`, `belooga-backend-engineering` và `rules/backend.md:12`.
- **Frontend thật:** `frontend/src/hooks/` có 7 hook. `frontend/src/app/user/[username]/page.tsx` dài **173 dòng** và import 11 module từ `@/hooks` và `@/components/features`.
- **Skill nói ngược lại:**
  - `belooga-frontend-engineering`: "There is no `src/hooks/` directory… Do not hallucinate imports from `@/hooks/...`"
  - `fe-page-workspace`: "inlined within `page.tsx` (over 3,000 lines). Do not import…"
- **Hệ quả:** agent tuân thủ skill sẽ viết lại logic đã có sẵn trong hook, hoặc nhét code ngược vào page.

### F-02 — Gate 3 cho qua mọi thứ
Đã chạy riêng phần Python của Gate 3: kết quả `OK: All 31 skill files passed zero-hallucination verification.` Cũng trên repo đó, `lint-skills.py` báo **75 ERROR**, trong đó có:
- 17 tên skill không tồn tại, ví dụ `fe-reviewer-guidelines`, `be-patterns-and-practices`, `systems-and-cs-knowledge`, `fe-section-workspace-studio`, `belooga-backend-services`;
- con số cứng sai ("24 tables", "36 endpoints", "16 page families"), trong khi thực tế là **28 bảng, 44 endpoint**;
- khẳng định "`src/hooks/` không tồn tại" trong khi thư mục có thật;
- sai thứ tự tham số `verify_profile_owner` ở 3 chỗ.

Lý do Gate 3 bỏ sót: nó không kiểm tra tên skill, con số, câu phủ định hay chữ ký hàm. Ngoài ra lệnh cấm TO-BE chỉ quét `SKILL.md`, nên 5 file `references/` dùng chữ "TARGET REFACTORING PATTERN" lọt qua.

### F-03 — Test khóa cứng một giá trị sai
| Nguồn | Màu tam giác play |
|---|---|
| `legacy/index.css:546` (ground truth) | `#9b9b9b` |
| `fe-page-home`, VIOLATION-003 | `#9b9b9b` |
| `frontend/src/app/globals.css:109` | `#5bbbae` |
| `qc/tests/visual/play-button.spec.ts:37` | khẳng định `#5bbbae` |
| `belooga-knowledge-vault` | `#5bbbae` |

Ngoài màu còn lệch `margin-left`: legacy là `-4px`, code là `3px`. CI xanh trên đúng regression mà VIOLATION-003 được lập ra để ngăn.

### F-04 — Các tiêu chuẩn không thể đạt cùng lúc
| Chuẩn | Nguồn A | Nguồn B | Thực tế (`ratchet.py`) |
|---|---|---|---|
| Số dòng tối đa | DoD 100 · FE reviewer 120/350 · clean-arch 150/300 | | trang lớn nhất 371 dòng |
| Hex tùy ý trong class | FE reviewer: 0 hoặc REJECT | | **812** |
| `any` | FE reviewer: 0 | | **26** |
| Server state | FE reviewer: bắt buộc TanStack Query | frontend-engineering: "useState + apiClient" | không file nào dùng `useQuery` |
| Fallback in-memory | BE reviewer: REJECT ngay | be-service-catalogs: bắt buộc | đang dùng |
| Abstraction | rule `ponytail` always-on: "không abstraction chưa được yêu cầu" | clean-architecture/DoD: bắt buộc Repo, UoW, Adapter, CVA | |
| Công cụ | DoD đòi `ruff`, `vitest`, RFC 7807, BFF, X-Request-ID | | chưa cài / chưa làm |

Hệ quả: áp đúng luật thì PR nào cũng trượt, nên reviewer agent sẽ hoặc đóng dấu cho qua, hoặc bịa proof block.

### F-05 — Workflow `schema-change` hỏng
Workflow bảo sửa `backend/initdb.sql` rồi chạy `docker compose restart postgres`. Postgres chỉ chạy `docker-entrypoint-initdb.d` khi **volume rỗng**, nên restart không áp schema mới. Repo đã có Alembic, và DoD cũng cấm sửa schema bằng SQL tay.

### F-06 — Domain mới không có skill nào
Expert-review gồm 6 endpoint, service, repo, migration `0002`, trang `(public)/expert-review/page.tsx`, 7 component và hook `use-expert-review.ts`. Không skill nào nhắc tới domain này.

### F-07 — Sổ vi phạm nằm trong vùng "không được trích dẫn"
`GEMINI.md` quy định `docs/archive/` là "Historical only; never cite as active truth". Nhưng `belooga-self-learn` và `rules/anti-hallucination-harness.md` lại ghi vi phạm mới vào `docs/archive/VIOLATIONS_REGISTER.md`.

### F-08 — Đường dẫn máy cá nhân
`/Users/phucnguyen/Dev/Beloga-CV` xuất hiện trong `GEMINI.md`, `rules/legacy.md`, `rules/anti-hallucination-harness.md`, `workflows/definition-of-done.md`, `workflows/visual-verify.md`. Trên CI hay máy người khác, các bước này không chạy được.

### F-09 — Một luật bị chép ở 6 nơi
Luật "Zero Global CSS Pollution" có mặt ở: `rules/anti-hallucination-harness.md`, `rules/frontend.md`, `belooga-frontend-engineering`, `legacy-ground-truth-enforcement`, `engineering-integrity-and-evidence`, `fe-page-home` (chưa kể FE reviewer). Sửa một chỗ thì 5 chỗ còn lại lệch.

---

## 5. Lỗi code phát hiện kèm (phải ghi vào Known Traps cho tới khi sửa)

| ID | Lỗi | Bằng chứng | Mức độ |
|---|---|---|---|
| C-01 | **Hồ sơ ẩn bị lộ timeline.** `GET /v1/profile/{username}/job-experiences/` và `/education/` là public và không lọc `is_hidden`, trong khi `GET /v1/profile/{username}` trả 404 | `repositories/timeline_repo.py:25-33, 104-112`; `services/timeline_service.py:33-34` | **Cao (privacy)** |
| C-02 | `GET /video-status/` public và không kiểm tra `is_hidden` | `services/media_service.py:205` | Trung bình |
| C-03 | Search **bịa dữ liệu** khi trường null: mọi ứng viên thiếu location đều thành "San Francisco, CA"; avatar và poster hardcode giống nhau cho tất cả | `services/catalogs_service.py:84-92` | Cao (sai dữ liệu hiển thị cho nhà tuyển dụng) |
| C-04 | Checkout expert-review **giả lập thanh toán**: sinh `txn_…` ngẫu nhiên rồi set `paid`, không cổng thanh toán, không kiểm tra trạng thái trước, gọi lại được nhiều lần | `services/expert_review_service.py:68-86` | Cao (vi phạm Prohibition #2 trong GEMINI.md) |
| C-05 | Màu play button sai legacy, và test khóa luôn giá trị sai | F-03 | Thấp (UI) nhưng là lỗi harness |
| C-06 | `CmsService(None)  # type: ignore[arg-type]`, đúng kiểu "Typecheck Cheating" mà integrity skill cấm | `api/v1/endpoints/cms.py:25` | Thấp |
| C-07 | 30/44 route không khai báo `response_model` | `ratchet.py` → `be_routes_without_response_model: 30` | Trung bình |

---

## 6. Cấu trúc skill đích

**Nguyên tắc:** skill nào không thể đạt 8.5 vì bản chất (sai phạm vi, trùng nội dung, không có giá trị cho dự án) thì **xóa hoặc gộp**, không cố vá. Sau Phase 1 còn **29 skill**, tất cả phải ≥ 8.5.

| Hành động | Skill | Ghi chú |
|---|---|---|
| **Viết lại** (domain, có AUTO block) | 7 `be-service-*` hiện có, 7 `fe-page-*` hiện có | Theo template mục 7 |
| **Tạo mới** | `be-service-expert-review`, `fe-page-expert-review` | F-06 |
| **Tạo mới** (từ reviewer checklist cũ) | `be-code-review`, `fe-code-review` | Để bước reviewer trong ROUTER trỏ vào skill có thật |
| **Viết lại** (xuyên suốt) | `belooga-backend-engineering`, `belooga-frontend-engineering`, `belooga-qc-engineering`, `engineering-integrity-and-evidence`, `tdd-workflow`, `definition-of-done`, `belooga-self-learn` | |
| **Giữ, chỉnh nhẹ** | `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt` | Đổi sang opt-in, gắn chuẩn dự án |
| **Gộp rồi xóa** | `legacy-ground-truth-enforcement` → `engineering-integrity-and-evidence` §Legacy · `clean-architecture` → `definition-of-done` + `belooga-*-engineering` | |
| **Xóa** | `belooga-knowledge-vault` (CURRENT_STATE.md đã thay thế), `ponytail-gain`, `ponytail-help`, `markmap-architect` (chuyển sang skill cá nhân `~/.gemini/skills/` nếu vẫn muốn dùng) | |
| **Xóa reference giáo trình** | `belooga-backend-engineering/references/systems-and-cs.md` (389 dòng), `belooga-frontend-engineering/references/design-patterns.md` (482 dòng) | Giữ lại tối đa 1 file `project-invariants.md` ≤ 150 dòng chỉ chứa nội dung riêng của dự án |

Tổng cộng: 16 domain + 2 review + 7 xuyên suốt + 4 ponytail = **29 skill**.

---

## 7. Plan thực hiện theo phase

### Phase 0 — Hạ tầng đo lường (làm trước mọi thứ, ~½ ngày)

1. Copy 3 script kèm theo vào `scripts/`.
2. Ghi baseline ratchet:
   ```bash
   python3 scripts/ratchet.py --update        # tạo .agents/ratchet.json
   ```
3. Thay Gate 3 trong `scripts/audit-truth.sh` bằng:
   ```bash
   python3 scripts/lint-skills.py --quiet || ERRORS=$((ERRORS + 1))
   python3 scripts/render-skill-facts.py --check || ERRORS=$((ERRORS + 1))
   python3 scripts/ratchet.py || ERRORS=$((ERRORS + 1))
   ```
4. Thêm vào `.github/workflows/ci.yml`, ngay sau bước "Run Master SSOT Truth Auditor":
   ```yaml
   - name: Skill lint, AUTO facts, ratchet
     run: |
       python3 scripts/lint-skills.py --quiet
       python3 scripts/render-skill-facts.py --check
       python3 scripts/ratchet.py
   ```
5. Tạo `.agents/evals/triggers.yaml` (mục 10).

**Nghiệm thu P0:** `lint-skills.py` chạy và báo khoảng 75 ERROR (đây là con số khởi điểm, chưa cần về 0). `ratchet.py` chạy lần hai báo `no change`.

### Phase 1 — Dọn dẹp và sửa hạ tầng (~½ ngày)
1. Xóa và gộp skill theo mục 6.
2. `git mv docs/archive/VIOLATIONS_REGISTER.md docs/VIOLATIONS_REGISTER.md`, rồi cập nhật mọi tham chiếu.
3. Thay `/Users/phucnguyen/Dev/Beloga-CV` bằng `$LEGACY_DIR` và khai báo trong `.env.example`: `LEGACY_DIR=../Beloga-CV`.
4. Viết lại `ROUTER.md`, `GEMINI.md`, `workflows/schema-change.md`, `rules/backend.md` theo mục 9.
5. Chuyển `.agents/ADR.md` sang `docs/adr/ADR-001…006.md`; sửa ADR-002 (Next.js 16) và ADR-004 (bỏ con số bảng).
6. Đổi rule `ponytail.md` từ `trigger: always_on` sang `trigger: model_decision`, với điều kiện "khi user gọi ponytail hoặc yêu cầu giảm độ phức tạp".

**Nghiệm thu P1:** không còn ERROR loại "references skill … that does not exist" và "/Users/". Lệnh `grep -rn "docs/archive/VIOLATIONS" .agents GEMINI.md` không trả về gì.

### Phase 2 — Viết lại 16 domain skill (~1.5 ngày)
1. Mỗi skill viết theo template mục 7.1. Thêm cặp marker `<!-- AUTO:BEGIN --> <!-- AUTO:END -->` dưới `## Current Reality`.
2. Chạy `python3 scripts/render-skill-facts.py` để điền AUTO block.
3. Viết phần ngoài AUTO block theo thẻ ở mục 8.

**Nghiệm thu P2:** `render-skill-facts.py --check` exit 0; `lint-skills.py --quiet` không còn ERROR cho `be-service-*` và `fe-page-*`.

### Phase 3 — Viết lại 7 skill xuyên suốt và 2 skill review (~1 ngày)
Theo thẻ ở mục 8.

### Phase 4 — Sửa lỗi code đang làm skill phải ghi trap (song song, theo TDD)
Thứ tự ưu tiên: C-01 → C-04 → C-03 → C-02 → C-05 → C-06 → C-07. Mỗi lỗi sửa xong thì xóa trap tương ứng khỏi skill và thêm entry vào sổ vi phạm qua `belooga-self-learn`.

### Phase 5 — Chấm lại và ký nghiệm thu
1. `lint-skills.py` → 0 ERROR.
2. Trigger eval ≥ 90% cho từng skill.
3. Chấm lại theo rubric và điền cột "Sau" vào bảng mục 11. Skill nào < 8.5 quay lại phase tương ứng.

---

## 7.1 Template domain skill (bắt buộc)

```markdown
---
name: <dir-name>
description: <Làm gì, 1 câu, có danh từ riêng của domain>. Use when <hành động cụ thể + tên file/class/hook>. Not for <skill A> (<lý do>), <skill B>.
---

# <Tên domain> (<route hoặc Domain N>)

## Current Reality
<!-- AUTO:BEGIN -->
<!-- AUTO:END -->

<1–2 câu mô tả luồng: router -> Service -> Repository, hoặc page -> hooks -> components.>

## Rules
1. **<Luật>.** <Cách làm cụ thể, tên hàm thật với chữ ký đúng.>

## Known Traps
- **<Sự cố thật>.** <Bằng chứng file:line hoặc VIOLATION-xxx>. <Làm gì để tránh.>

## Self-Verification
```bash
<lệnh test cụ thể của domain>
python3 scripts/lint-skills.py --quiet
```
```

**Luật viết:**
- Không ghi con số tổng (bảng, endpoint, route) ngoài AUTO block.
- Không viết câu "X không tồn tại". Nếu cần cấm, ghi "dùng Y" (Y có thật).
- Không có nội dung TO-BE. Kế hoạch tương lai để ở `docs/adr/`.
- Mỗi luật chỉ đặt **một chỗ**. Chỗ khác thì link tới, không chép lại.

## 7.2 Hai mẫu đã kiểm (đạt lint, AUTO block đã render)

Hai skill dưới đây đã được viết lại, render AUTO block và chạy `lint-skills.py` trên bản copy của repo: **0 ERROR**. Dùng làm chuẩn cho các skill còn lại.

<details>
<summary><b>Mẫu 1 — be-service-timeline (ước tính 9.0)</b></summary>

```markdown
---
name: be-service-timeline
description: Work history and education CRUD plus drag-and-drop reorder for candidate timelines (job_experiences, education_experiences, display_order). Use when adding or changing timeline endpoints, TimelineService, TimelineRepository, reorder locking, or timeline visibility rules. Not for profile fields (be-service-profile), PDF output (be-service-media) or the drag UI (fe-page-workspace).
---

# Career Timeline (Domain 3)

## Current Reality
<!-- AUTO:BEGIN -->
<!-- Generated by scripts/render-skill-facts.py. Do not edit by hand. -->
| Method | Path | Handler | Auth |
|---|---|---|---|
| `GET` | `/v1/profile/{username}/job-experiences/` | `list_job_experiences` | public |
| `POST` | `/v1/profile/{username}/job-experiences/` | `create_job_experience` | required |
| `DELETE` | `/v1/profile/{username}/job-experiences/{item_id}/` | `delete_job_experience` | required |
| `POST` | `/v1/profile/{username}/job-experiences/order/` | `reorder_job_experiences` | required |
| `GET` | `/v1/profile/{username}/education/` | `list_education_experiences` | public |
| `POST` | `/v1/profile/{username}/education/` | `create_education` | required |
| `DELETE` | `/v1/profile/{username}/education/{item_id}/` | `delete_education` | required |
| `POST` | `/v1/profile/{username}/education/order/` | `reorder_education_experiences` | required |

- Router: `backend/app/api/v1/endpoints/timeline.py`
- Service: `backend/app/services/timeline_service.py`
- Repository: `backend/app/repositories/profile_repo.py`, `backend/app/repositories/timeline_repo.py`
- Tests: `backend/tests/test_timeline_reorder.py`
<!-- AUTO:END -->

Flow: router (parse HTTP, inject user) -> `TimelineService` (ownership, workflow, commit) -> `TimelineRepository` (SQL, locks). Routers never touch SQL.

## Rules
1. **Ownership first.** Every mutation calls `verify_profile_owner(current_user, username)` inside the service before any write. Admin bypass is inside the guard; do not re-implement it.
2. **Reorder = one transaction, rows locked.** Load rows through the repository method that uses `.with_for_update()`, apply all `display_order` changes, then a single `await db.commit()`. Never call `db.begin()` on the request session (it is already autobegun).
3. **Payload validation in schemas.** Order payloads go through `app/schemas/timeline.py`; reject ids that do not belong to the profile with 400, not silently skip them.

## Known Traps
- **Hidden profiles leak through list endpoints.** `list_jobs_by_username` / `list_education_by_username` do not filter `is_hidden`. Until fixed, any change here must add the same `is_hidden` + owner check used in `ProfileService.get_candidate_public_profile`, with a test for an anonymous caller (expect 404).
- **No update endpoint exists.** Editing an item today means delete + create. Do not build UI that assumes `PATCH .../{item_id}/` until the route appears in the AUTO block above.
- `verify_profile_owner` takes `(current_user, target_username)`. Swapping the arguments raises `AttributeError`, not 403.

## Self-Verification
```bash
backend/.venv/bin/pytest backend/tests/test_timeline_reorder.py backend/tests/test_idor_guards.py -v
python3 scripts/lint-skills.py --quiet
```
```
</details>

<details>
<summary><b>Mẫu 2 — fe-page-workspace (ước tính 8.8)</b></summary>

```markdown
---
name: fe-page-workspace
description: Candidate workspace page /user/[username] — profile header, video pitch, WebRTC studio, timeline drag-and-drop, skills. Use when changing this page, its feature components under components/features/{profile,media,studio,timeline}, or hooks such as use-candidate-profile, use-webrtc-studio, use-timeline-dnd. Not for the public profile (fe-page-public-profile) or settings/update forms (fe-page-user-management).
---

# Candidate Workspace (`/user/[username]`)

## Current Reality
<!-- AUTO:BEGIN -->
<!-- (render-skill-facts.py điền: page 173 dòng, client component, 10 component,
     4 hook use-candidate-profile / use-timeline-dnd / use-video-player / use-webrtc-studio,
     26 data-testid) -->
<!-- AUTO:END -->

The page is a thin orchestrator: data and side effects live in hooks, UI in feature components. Section details: `references/` (one file per section, AS-IS only).

## Rules
1. **New behaviour goes in a hook or a feature component, not in page.tsx.** If page.tsx grows past the ratchet baseline, the lint fails.
2. **High-frequency state stays in the leaf.** Audio level, playback time and teleprompter index live in `use-audio-meter` / `use-video-player` / `use-teleprompter`; never lift them into page state.
3. **Refresh after mutation through the hook.** Child mutations call the refresh function exposed by `use-candidate-profile`; do not duplicate fetch logic in components.
4. **Release devices.** Closing the studio must stop every `MediaStreamTrack` and close the `AudioContext`.

## Known Traps
- E2E runs inject a fake media stream only when `NEXT_PUBLIC_E2E` is set; without it Playwright hangs on the permission prompt.
- Keep every `data-testid` listed in the AUTO block; QC specs depend on them.

## Self-Verification
```bash
cd frontend && bun x tsc --noEmit
cd qc && bun run test:e2e -- tests/e2e/workspace.spec.ts
python3 scripts/lint-skills.py --quiet
```
```
</details>

---

## 8. Thẻ update từng skill

> Ký hiệu: **Hiện tại → Mục tiêu**. "AUTO" nghĩa là thêm marker rồi chạy `render-skill-facts.py`. Mọi skill domain đều phải theo template 7.1; thẻ chỉ ghi phần **riêng** của từng skill.

### 8.1 Backend domain

#### be-service-auth — 6.0 → 9.0
**Lỗi:** ghi "No separate service/repository layer… raw SQL" (sai: có `services/auth_service.py`, `repositories/identity_repo.py`). Cookie ghi `secure=False`, trong khi code dùng `secure=IS_PRODUCTION`.
**Việc cần làm:**
- AUTO.
- Rules:
  - Hash mật khẩu bằng `PasswordHash.recommended()` (`core/security.py:18`).
  - Refresh khóa row trong `IdentityRepository` (`identity_repo.py:~99`, `FOR UPDATE`).
  - Cookie `belooga_refresh_token` dùng `httponly=True, samesite="lax", secure=IS_PRODUCTION`.
- Known Traps:
  - **Grace window `15` đang hardcode** tại `auth_service.py:170`. Muốn đổi phải tách thành hằng số và sửa test.
  - **`/v1/users/exists/email/` là public**, dùng được để dò email đã đăng ký. Không mở rộng response của endpoint này.
  - **Access token chỉ nằm trong memory** (Zustand). Nếu đổi chỗ lưu, phải cập nhật test `TC-AUTH-002`.
- Self-Verification: `pytest backend/tests/test_auth_family_rotation.py -v`.

**Nghiệm thu:** lint 0 ERROR; description có "Not for be-service-profile, fe-page-auth"; 3 trap có file:line.

#### be-service-profile — 6.0 → 9.0
**Lỗi:** sai thứ tự `verify_profile_owner(username, current_user)`; layer sai.
**Việc cần làm:**
- AUTO.
- Rules:
  - Logic hiển thị nằm trong `ProfileService.get_candidate_public_profile` (`services/profile_service.py:26-64`): owner hoặc admin thấy PII, hồ sơ ẩn trả 404 cho người ngoài.
  - Mutation gọi `verify_profile_owner(current_user, username)`.
- Known Traps:
  - **C-01:** timeline vẫn lộ dữ liệu của hồ sơ ẩn. Sửa privacy ở profile thì phải kiểm tra cả `be-service-timeline` và `be-service-media` (`video-status`).
  - **Không suy ra danh tính từ email** (giữ trap hiện có).
- Self-Verification: `pytest backend/tests/test_profile_privacy_and_pii.py backend/tests/test_idor_guards.py -v`.

#### be-service-timeline — 6.0 → 9.0
Dùng **Mẫu 1** ở mục 7.2 nguyên văn. Sau khi C-01 được sửa, xóa trap đầu tiên và thêm test anonymous → 404.

#### be-service-search — 5.7 → 8.8
**Lỗi:** nói search thực thi trong `search.py`, thực tế router gọi `CatalogsService.search_candidates` (`services/catalogs_service.py:73`). Không nhắc C-03.
**Việc cần làm:**
- AUTO, và thêm `"be-service-search": ["search.py"]` (đã có trong script).
- Ghi rõ: "Search logic lives in `CatalogsService` (catalogs_service.py), repository `catalogs_repo.py`". Kèm gợi ý tách `SearchService` nếu domain search lớn thêm. Ghi chú này đặt ở `docs/adr/`, không đặt trong skill.
- Rules:
  - Giữ ADR-005: `search_vector @@ plainto_tsquery`, không `OR ILIKE`.
  - Riêng suggest được phép dùng `ILIKE` vì đó là autocomplete theo tên. Ghi rõ để agent không nhầm hai trường hợp.
  - Luôn lọc `is_hidden = FALSE`.
- Known Traps:
  - **C-03:** null bị thay bằng "San Francisco, CA" và avatar/poster hardcode. Không thêm fallback giả mới. Trường null phải trả về `null` để frontend tự hiển thị trạng thái trống.
- Self-Verification: `pytest backend/tests/test_profile_privacy_and_pii.py -k search -v`.

#### be-service-catalogs — 5.0 → 8.8
**Lỗi:** layer sai; luật "Resilient Fallback" mâu thuẫn với BE reviewer.
**Việc cần làm:**
- AUTO.
- Hai skill phải thống nhất một quyết định duy nhất: **fallback in-memory được phép cho company, school, location** (đã ghi trong `CURRENT_STATE` §6) cho tới khi có ADR thay thế. `be-code-review` (mục 8.4) phải liệt kê đây là ngoại lệ có chủ đích.
- Known Traps: bảng `catalog_*` có tồn tại nhưng không được đọc. Dữ liệu thật nằm ở `COMPANIES_CATALOG`, `SCHOOLS_CATALOG`, `LOCATIONS_CATALOG` trong `catalogs_service.py`.
- Self-Verification: thêm test `backend/tests/test_catalogs.py` (hiện chưa có), gồm 1 test prefix match và 1 test khi bảng skills rỗng.

#### be-service-cms — 5.2 → 8.7
**Lỗi:** layer sai; không cảnh báo rằng 2 endpoint POST public chưa có rate limit.
**Việc cần làm:**
- AUTO.
- Known Traps:
  - **Spam:** `POST /v1/contact/` và `POST /v1/profile/{user_id}/report/` không có rate limit hay captcha.
  - **Path không nhất quán:** report dùng `{user_id}`, mọi route khác dùng `{username}`.
  - **C-06:** `CmsService(None)  # type: ignore` tại `cms.py:25`. Không nhân bản pattern này.
  - FAQ và jobs là `STATIC_FAQS` in-memory, dù bảng `career_postings` có tồn tại.
- Self-Verification: thêm `backend/tests/test_cms.py` (POST contact 201, report 201, faqs 200).

#### be-service-media — 5.2 → 8.8
**Lỗi:** không biết `media_service.py`, `media_transcoder.py` (ffmpeg), `pdf_generator.py` tồn tại; ghi "No separate service layer".
**Việc cần làm:**
- AUTO.
- Rules:
  - Helper đồng bộ trong `media_transcoder.py` (`open(...)` ở dòng 57, 66, 72) **chỉ được gọi qua `asyncio.to_thread`**. Gọi trực tiếp từ `async def` là chặn event loop.
  - ffmpeg chạy bằng subprocess ở `media_transcoder.py:96, 124`. Container phải có ffmpeg.
  - Giữ luật path traversal hiện có (regex `upload_id`, `os.path.realpath`).
- Known Traps:
  - **C-02:** `video-status` public, không kiểm tra `is_hidden`.
  - Upload không giới hạn kích thước hay MIME ở tầng service (cần xác minh và ghi giới hạn thật nếu có).
- Self-Verification: `pytest backend/tests/test_media_traversal.py -v`.

#### be-service-expert-review (MỚI) — 0 → 8.7
**Nội dung:**
- AUTO (đã có mapping `expert_review.py` trong script).
- Description: "CV expert review marketplace: experts, packages, orders, checkout, feedback. Use when changing ExpertReviewService, expert_review_repo, migration 0002 or /v1/experts|/v1/packages|/v1/orders routes. Not for candidate profile (be-service-profile) or the expert-review page (fe-page-expert-review)."
- Rules:
  - IDOR so sánh `order.candidate_identity_id` với `current_user.id`.
  - Đổi trạng thái order phải dùng `with_for_update()` (`expert_review_repo.py:83`).
- Known Traps:
  - **C-04:** checkout giả lập thanh toán và gọi lại được nhiều lần. Không xây UI "thanh toán thành công" dựa trên endpoint này.
  - Route `/v1/orders/` không có prefix domain, nên dễ trùng tên khi thêm order loại khác.
- Self-Verification: `pytest backend/tests/test_expert_review.py -v`.

### 8.2 Frontend domain

#### fe-page-workspace — 3.5 → 8.8
Dùng **Mẫu 2** ở mục 7.2. Thêm việc:
- Viết lại 5 file `references/`: bỏ banner "TARGET REFACTORING PATTERN" và "planned target"; đổi `organisms/workspace/...` thành đường dẫn thật trong `components/features/...`.
- Mỗi file ≤ 120 dòng, chỉ mô tả AS-IS và các trap.
- `timeline-dnd.md` bỏ khẳng định "Complete CRUD (Update)" vì backend không có PATCH.

#### fe-page-public-profile — 6.0 → 8.8
**Lỗi:** "Do not import non-existent section components from `src/components/organisms/public/`". Thực tế page import `PublicHeaderCard`, `PublicContactModal`, `ReportProfileModal`, `VideoPitchCard`, `VideoPitchModal`, `TimelineItemCard` từ `components/features/`.
**Việc cần làm:**
- AUTO.
- Xóa cảnh báo import.
- Known Traps:
  - **C-01:** page gọi profile (404 khi ẩn) nhưng timeline vẫn trả dữ liệu. Nếu page gọi riêng endpoint timeline thì lộ dữ liệu.
  - Report dùng `{user_id}`, không dùng `{username}`.

#### fe-page-search — 6.6 → 8.8
- AUTO.
- Giữ luật sync URL `?key=&page=` (đã xác minh tại `search/page.tsx:13-14`).
- Known Traps: **C-03**. Card hiển thị "San Francisco, CA" không có nghĩa là dữ liệu thật. Không viết E2E khẳng định giá trị này.
- Xóa cảnh báo "inlined, do not import from organisms/search". Ghi thay bằng: "page imports only `ui/button` and `apiClient`; new sections go to `components/features/search/`".

#### fe-page-home — 6.8 → 9.0
- AUTO.
- Rule màu sửa thành nguồn duy nhất: "Triangle `#9b9b9b`, `margin-left: -4px` per `legacy/index.css:540-546`".
- Thêm trap **C-05**: code và test đang sai; xem VIOLATION-005.
- Xóa đoạn CSS-pollution chép lại, thay bằng link tới `engineering-integrity-and-evidence` §Legacy.

#### fe-page-auth — 7.0 → 9.0
- AUTO.
- Đổi `callback/` từ "Static redirect shell" sang mô tả theo code hiện tại (xác minh lại khi viết).
- Known Traps: `register` debounce gọi `/v1/users/exists/*` (nhắc trap enumeration ở `be-service-auth`, chỉ link, không chép).

#### fe-page-user-management — 6.6 → 8.7
- AUTO.
- Known Traps: nút xóa tài khoản và đổi mật khẩu không có backend. Kiểm tra chắc chắn UI **không** hiện toast thành công giả (grep `settings/page.tsx` khi viết skill). Nếu đang có thì ghi thành violation.

#### fe-page-cms-public — 6.6 → 8.7
- AUTO.
- Mô tả đúng phạm vi: các route `(public)/*` **trừ** `expert-review`, kèm "Not for fe-page-expert-review".
- Known Traps: application modal ở careers không có backend.

#### fe-page-expert-review (MỚI) — 0 → 8.7
- AUTO (mapping `(public)/expert-review/page.tsx` đã có trong script).
- Description: nhắc `components/features/expert-review/*`, `use-expert-review.ts`.
- Known Traps:
  - **C-04:** checkout là giả lập.
  - Trang nằm dưới `(public)` nhưng đặt order cần đăng nhập, nên phải xử lý trạng thái chưa đăng nhập.

### 8.3 Skill xuyên suốt

#### belooga-backend-engineering — 4.0 → 8.8
**Viết lại thành bản đồ ≤ 80 dòng:**
- Kiến trúc thật: `endpoints/` → `services/` → `repositories/` → `models/` + `schemas/`; migration ở `backend/alembic/versions/`.
- Bảng "domain → skill" (16 skill domain).
- 4 bất biến: event loop, ADR-005, ownership, locking. Mỗi cái 1 dòng kèm link tới skill domain chi tiết.
- Bỏ mọi con số tổng.
- Sửa chữ ký `verify_profile_owner(current_user, target_username)`.
- Xóa `references/systems-and-cs.md`. Nếu muốn giữ thì tạo `references/project-invariants.md` ≤ 150 dòng, chỉ gồm write-skew lock trên `candidate_profiles`, Safari MP4 và expand/contract migration, mỗi mục gắn với code thật.
- Chuyển `references/reviewer-checklist.md` thành skill `be-code-review`.

#### belooga-frontend-engineering — 4.0 → 8.8
- Xóa "There is no `src/hooks/`…" và "inlines its sections".
- Mô tả cấu trúc thật: `components/{ui,common,layout,features/*}`, `hooks/`, `services/`, `store/`, `lib/`.
- **Quyết định state:** ghi một câu duy nhất. Ví dụ "Server state: hooks in `src/hooks/` using `apiClient`. TanStack Query is installed but unused; adopting it requires an ADR." Câu này phải khớp với `fe-code-review`.
- Design token: liệt kê token có thật trong `globals.css` (`--color-brand-primary`…). Luật hex đổi thành "không thêm hex mới; ratchet `fe_arbitrary_hex` không được tăng".
- Xóa `references/design-patterns.md` (482 dòng giáo trình).

#### belooga-qc-engineering — 3.1 → 8.8
**Viết lại ≤ 150 dòng:**
- Description: "Playwright E2E and visual tests in qc/. Use when writing or fixing specs under qc/tests, page objects in qc/pages, or playwright.config.ts. Not for backend pytest (be-service-*)".
- Cây thư mục **thật** (render bằng lệnh `find qc -name '*.ts' -not -path '*/node_modules/*'`; hoặc thêm `belooga-qc-engineering` vào generator).
- Project Playwright thật: Desktop Chromium, Desktop WebKit, Tablet iPad, Mobile Phone.
- Tài khoản test thật: `alex@belooga.com` (lấy từ `scripts/seed-data.py`). Bỏ `test@belooga.com` và `/user/testuser`.
- Code mẫu **phải dùng `data-testid`**, đúng luật của chính skill này.
- Sửa test `play-button.spec.ts:37` thành `expect(triangleColor).toBe('rgb(155, 155, 155)')` cùng lúc với sửa CSS (C-05).
- Lệnh: `bun run test:e2e`, `bun run test:visual` (đã có trong `qc/package.json`).

#### engineering-integrity-and-evidence — 6.4 → 9.0
- Description thêm: "Use on every task before claiming completion, when unsure about a contract, or when touching legacy parity".
- Gộp `legacy-ground-truth-enforcement` vào thành mục `## Legacy parity`. Đây là **nơi duy nhất** chứa luật CSS-pollution; mọi nơi khác chỉ link tới.
- Proof block bắt buộc ghi **lệnh và exit code thật**. Thêm luật: "proof block phải dán nguyên văn 5 dòng cuối của output; không tóm tắt".
- Đổi `ask_question` thành "hỏi user trực tiếp" (không phụ thuộc tên tool).

#### tdd-workflow — 6.4 → 8.8
- Description: "Use when fixing a bug or adding behaviour in backend/ or qc/".
- Thêm ngoại lệ có kiểm soát: thay đổi chỉ về CSS hoặc nội dung tĩnh dùng `bun run test:visual` làm bằng chứng thay cho Red-first.
- Bỏ phần lặp lại lệnh của DoD; link tới DoD.

#### definition-of-done — 3.0 → 8.8
**Viết lại thành DoD đạt được hôm nay, đo bằng lệnh có thật:**

| Gate | Lệnh | Bắt buộc |
|---|---|---|
| Backend tests | `backend/.venv/bin/pytest backend/tests/ -v` | ✅ |
| Typecheck | `cd frontend && bun x tsc --noEmit` | ✅ |
| E2E liên quan | `cd qc && bun run test:e2e -- <spec>` | ✅ nếu sửa UI |
| Skill và ratchet | `lint-skills.py`, `render-skill-facts.py --check`, `ratchet.py` | ✅ |
| Schema | `alembic upgrade head` rồi `alembic downgrade -1` rồi `alembic upgrade head` | ✅ nếu đổi schema |
| Ratchet tightening | chỉ số nào giảm thì chạy `ratchet.py --update` | khuyến khích |

- Xóa: RFC 7807, BFF, X-Request-ID, cyclomatic ≤ 10, `vitest`, `ruff`, "page < 100 LOC". Chuyển chúng vào `docs/adr/` dưới dạng đề xuất; khi được chấp nhận và có công cụ thì mới đưa lại vào DoD.
- Gộp phần còn dùng được của `clean-architecture` (layering BE, cấu trúc `components/features`) vào đây dưới dạng 5 dòng; rồi xóa `clean-architecture`.
- Xóa trùng lặp với `workflows/definition-of-done.md`: workflow chỉ còn danh sách lệnh và link tới skill.

#### belooga-self-learn — 7.5 → 9.0
- Đổi đích ghi sổ thành `docs/VIOLATIONS_REGISTER.md`.
- Thêm vào Destination Matrix: "Skill fact sai → sửa generator hoặc lint (`render-skill-facts.py` / `lint-skills.py`), không sửa tay AUTO block".
- Thêm bước bắt buộc: sau khi ghi bài học, chạy `lint-skills.py --quiet` và dán output.

### 8.4 Skill review (mới, thay reviewer-checklist cũ)

#### be-code-review — mới → 8.7
- Description: "Adversarial review of backend diffs before merge. Use when asked to review a backend PR/diff or at ROUTER step 4. Not for writing code."
- Checklist **blocking** (chỉ những gì đo được hôm nay):
  - SQL nằm trong router (`be_sql_in_routers` phải = 0, baseline hiện tại = 0);
  - mutation thiếu `get_current_user` hoặc thiếu ownership;
  - I/O đồng bộ trong `async def`;
  - `OR ILIKE` kết hợp với `search_vector`;
  - fallback **mới** sinh dữ liệu giả (C-03 là ví dụ).
- Checklist **ratchet** (không được tăng): `be_routes_without_response_model`, `be_type_ignore`.
- Ngoại lệ có chủ đích: catalog in-memory (link tới `be-service-catalogs`).
- Template REJECT/APPROVE giữ nguyên, nhưng APPROVE phải có output `ratchet.py`.

#### fe-code-review — mới → 8.7
- Blocking:
  - token trong localStorage/sessionStorage;
  - xóa hoặc đổi `data-testid` có trong AUTO block;
  - state tần số cao đưa lên page;
  - toast thành công cho tính năng không có backend.
- Ratchet: `fe_arbitrary_hex`, `fe_any`, `fe_max_page_lines`, `fe_files_over_300_lines`.
- Bỏ mọi yêu cầu không khớp với code (TanStack, `@/types/`, "page < 120 dòng").

### 8.5 Ponytail (giữ, chỉnh nhẹ)

| Skill | Hiện tại → Mục tiêu | Việc cần làm |
|---|---|---|
| ponytail | 6.1 → 8.6 | Description bỏ "Use on ANY coding task"; đổi thành "Use when the user invokes ponytail or asks to simplify". Thêm đoạn "Project overrides": layering router/service/repository và ratchet của dự án **không** bị coi là over-engineering. |
| ponytail-review | 7.4 → 8.7 | Thêm "Not for correctness/security review (be-code-review, fe-code-review)". Thêm 1 ví dụ trên diff Belooga thật. |
| ponytail-audit | 7.4 → 8.7 | Thêm danh sách loại trừ: `legacy/`, `graphify-out/`, AUTO block. |
| ponytail-debt | 7.2 → 8.6 | Thêm lệnh grep đã loại `legacy/` và `graphify-out/`; output ghi vào `docs/ponytail-debt.md`. |

---

## 9. Sửa hạ tầng: ROUTER, GEMINI, rules, workflows

### 9.1 `GEMINI.md` (≤ 60 dòng)
- §4 Task Routing: đổi `belooga-backend-services` thành `belooga-backend-engineering`, rồi trỏ tiếp sang skill domain.
- Thay đường dẫn legacy bằng `$LEGACY_DIR`.
- Bỏ "24 tables". Ghi "See CURRENT_STATE.md §1".
- Thêm 1 dòng: "Before claiming done: `python3 scripts/lint-skills.py --quiet`".

### 9.2 `ROUTER.md` (viết lại, ≤ 120 dòng)
- Bảng routing **chỉ chứa skill có thật**. Bỏ toàn bộ 13 dòng `*-patterns-and-practices`, `*-reviewer-guidelines`, `systems-*`, `architect-*`.
- Bước 4 trỏ vào `be-code-review` và `fe-code-review`.
- Impact matrix: đổi `fe-section-*` thành `fe-page-workspace` (với section là file trong `references/`).
- Bỏ "50% Agent Confidence Cap" và các câu nhập vai ("CTO Final Sign-off"). Thay bằng điều kiện đo được: "merge khi CI xanh và có APPROVE với output ratchet".

### 9.3 `workflows/schema-change.md` (viết lại toàn bộ)
```bash
# 1. Sửa model trong backend/app/models/
# 2. Tạo revision
cd backend && ../backend/.venv/bin/alembic revision --autogenerate -m "<mô tả>"
# 3. Đọc lại file revision vừa sinh; sửa tay phần autogenerate bỏ sót (GIN, generated column)
# 4. Áp và kiểm tra hai chiều
../backend/.venv/bin/alembic upgrade head
../backend/.venv/bin/alembic downgrade -1
../backend/.venv/bin/alembic upgrade head
# 5. Seed và test
cd .. && backend/.venv/bin/python3 scripts/seed-data.py
backend/.venv/bin/pytest backend/tests/ -v
# 6. Cập nhật SSOT
python3 scripts/generate-current-state.py --allow-dirty
python3 scripts/render-skill-facts.py
```
Thêm cảnh báo: "`docker compose restart postgres` KHÔNG áp schema. Chỉ `docker compose down -v` mới chạy lại `initdb.sql`, và lệnh đó xóa toàn bộ dữ liệu local."
Cần xác minh trước: `backend/initdb.sql` còn là nguồn cho CI không. Nếu còn, CI phải chuyển sang `alembic upgrade head`.

### 9.4 Rules
- `rules/backend.md` dòng 5: đổi thành "Routers call services; SQL lives in `app/repositories/`".
- `rules/frontend.md` và `rules/anti-hallucination-harness.md`: xóa luật CSS chép lại, thay bằng link tới `engineering-integrity-and-evidence` §Legacy.
- `rules/headroom.md`, `rules/graphify.md`: đổi `always_on` thành điều kiện "nếu tool có sẵn" để không lỗi khi MCP không chạy.

---

## 10. Trigger eval

Tạo `.agents/evals/triggers.yaml`. Mỗi skill có 3 prompt: 2 prompt phải chọn skill đó, 1 prompt dễ nhầm phải chọn skill khác.

```yaml
- skill: be-service-timeline
  should_trigger:
    - "Thêm API sửa một mục kinh nghiệm làm việc"
    - "Reorder education đang bị lost update khi kéo thả nhanh"
  should_not_trigger:
    - prompt: "Kéo thả timeline trên UI bị giật"
      expected: fe-page-workspace
- skill: be-service-search
  should_trigger:
    - "Kết quả tìm ứng viên xếp hạng sai"
    - "Autocomplete gợi ý cả ứng viên đã ẩn"
  should_not_trigger:
    - prompt: "Thêm danh sách trường đại học vào gợi ý"
      expected: be-service-catalogs
- skill: fe-page-workspace
  should_trigger:
    - "Nút ghi hình pitch không tắt camera khi đóng modal"
    - "Thêm card ngôn ngữ vào trang workspace"
  should_not_trigger:
    - prompt: "Trang hồ sơ public không hiện video"
      expected: fe-page-public-profile
```

**Cách chạy:** đưa cho model **chỉ** danh sách `name` và `description` của các skill cùng một prompt, yêu cầu chọn đúng 1 skill. Tỷ lệ đúng phải ≥ 90% cho từng skill. Skill nào trượt thì sửa description (thêm từ khóa của prompt bị chọn nhầm), không sửa prompt.

---

## 11. Bảng nghiệm thu cuối (điền khi xong Phase 5)

| Skill | Trước | Mục tiêu | Sau | Lint 0 ERROR | Trigger ≥ 90% | Ghi chú |
|---|---|---|---|---|---|---|
| be-service-auth | 6.0 | 9.0 | | ☐ | ☐ | |
| be-service-profile | 6.0 | 9.0 | | ☐ | ☐ | |
| be-service-timeline | 6.0 | 9.0 | | ☐ | ☐ | |
| be-service-search | 5.7 | 8.8 | | ☐ | ☐ | |
| be-service-catalogs | 5.0 | 8.8 | | ☐ | ☐ | |
| be-service-cms | 5.2 | 8.7 | | ☐ | ☐ | |
| be-service-media | 5.2 | 8.8 | | ☐ | ☐ | |
| be-service-expert-review | — | 8.7 | | ☐ | ☐ | mới |
| fe-page-home | 6.8 | 9.0 | | ☐ | ☐ | |
| fe-page-search | 6.6 | 8.8 | | ☐ | ☐ | |
| fe-page-public-profile | 6.0 | 8.8 | | ☐ | ☐ | |
| fe-page-workspace | 3.5 | 8.8 | | ☐ | ☐ | |
| fe-page-user-management | 6.6 | 8.7 | | ☐ | ☐ | |
| fe-page-auth | 7.0 | 9.0 | | ☐ | ☐ | |
| fe-page-cms-public | 6.6 | 8.7 | | ☐ | ☐ | |
| fe-page-expert-review | — | 8.7 | | ☐ | ☐ | mới |
| belooga-backend-engineering | 4.0 | 8.8 | | ☐ | ☐ | |
| belooga-frontend-engineering | 4.0 | 8.8 | | ☐ | ☐ | |
| belooga-qc-engineering | 3.1 | 8.8 | | ☐ | ☐ | |
| engineering-integrity-and-evidence | 6.4 | 9.0 | | ☐ | ☐ | gộp legacy-ground-truth |
| tdd-workflow | 6.4 | 8.8 | | ☐ | ☐ | |
| definition-of-done | 3.0 | 8.8 | | ☐ | ☐ | gộp clean-architecture |
| belooga-self-learn | 7.5 | 9.0 | | ☐ | ☐ | |
| be-code-review | — | 8.7 | | ☐ | ☐ | mới |
| fe-code-review | — | 8.7 | | ☐ | ☐ | mới |
| ponytail | 6.1 | 8.6 | | ☐ | ☐ | |
| ponytail-review | 7.4 | 8.7 | | ☐ | ☐ | |
| ponytail-audit | 7.4 | 8.7 | | ☐ | ☐ | |
| ponytail-debt | 7.2 | 8.6 | | ☐ | ☐ | |
| ~~belooga-knowledge-vault~~ | 2.5 | xóa | | | | CURRENT_STATE.md thay thế |
| ~~clean-architecture~~ | 4.3 | gộp | | | | → definition-of-done |
| ~~legacy-ground-truth-enforcement~~ | 5.2 | gộp | | | | → engineering-integrity |
| ~~markmap-architect~~ | 4.7 | xóa | | | | chuyển sang skill cá nhân |
| ~~ponytail-gain~~ | 3.0 | xóa | | | | |
| ~~ponytail-help~~ | 4.5 | xóa | | | | |

**Điều kiện ký nghiệm thu toàn bộ:**
```bash
python3 scripts/lint-skills.py            # → "ERROR: 0"
python3 scripts/render-skill-facts.py --check   # → "All AUTO blocks up to date."
python3 scripts/ratchet.py                # → không có dòng WORSE
bash scripts/audit-truth.sh               # → tất cả gate xanh
```
cộng với bảng trên không còn ô "Sau" nào < 8.5.

---

## Phụ lục A — Kết quả chạy thử script trên zip

```
$ python3 scripts/lint-skills.py
...
Skills: 31 | clean: 6 | ERROR: 75 | WARN: 2

$ python3 scripts/ratchet.py --update
{
  "fe_arbitrary_hex": 812,
  "fe_any": 26,
  "fe_ts_ignore": 0,
  "fe_max_page_lines": 371,
  "fe_files_over_300_lines": 2,
  "be_type_ignore": 1,
  "be_sql_in_routers": 0,
  "be_routes_without_response_model": 30
}

# Sau khi thay be-service-timeline và fe-page-workspace bằng Mẫu 1 và Mẫu 2:
$ python3 scripts/render-skill-facts.py && python3 scripts/lint-skills.py
Skills: 31 | clean: 8 | ERROR: 72 | WARN: 2      # 2 skill mẫu: 0 ERROR
```

## Phụ lục B — Linter kiểm tra những gì

| Kiểm tra | Bắt được lỗi nào trong repo hiện tại |
|---|---|
| Tên skill được nhắc phải tồn tại | 17 tên ảo trong ROUTER, GEMINI, `be-service-*` |
| Cấm con số tổng ngoài AUTO block | "24 tables", "36 endpoints", "16 page families"… |
| Câu "X không tồn tại" phải đúng | `src/hooks/` |
| Thứ tự tham số khớp hàm Python thật | `verify_profile_owner` × 3 |
| Không đường dẫn `/Users/...` | 5 file |
| `bun run <script>` phải có trong package.json | (hiện đúng, giữ để chặn về sau) |
| File được trích dẫn phải tồn tại | (giữ để chặn về sau) |
| Description có "Use when", domain skill có "Not for" | 8 skill |
| Domain skill có đủ section và AUTO block | 14 skill |
| Reference không chứa TO-BE / planned target | 5 file |
| SKILL.md ≤ 200 dòng, reference ≤ 400 dòng | `design-patterns.md` (482 dòng) |
