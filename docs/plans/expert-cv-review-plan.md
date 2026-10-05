# Plan Triển Khai: Dịch Vụ Expert CV Review & Monetization

Tài liệu thiết kế kiến trúc và kế hoạch triển khai chi tiết cho tính năng Đánh giá CV trả phí cùng Senior Experts trên nền tảng Belooga.

---

## 1. Tổng Quan & Trải Nghiệm Người Dùng (UX Flow)

1. **Khám phá dịch vụ (`/expert-review`):**
   - Ứng viên xem danh sách Senior Reviewers (Tech Leads, Staff Engineers, Engineering Managers từ Google, Stripe, Meta...).
   - Xem 3 gói dịch vụ rõ ràng (Essential $29, Pro Deep-Dive $59, Elite 1-on-1 $99) với cam kết giao bài trong 24-48h.
   - Trải nghiệm bản mẫu báo cáo đánh giá tương tác (Sample Interactive Report) gồm điểm ATS, Impact Verbs, Formatting.
2. **Đặt lịch & Nộp CV (Review Booking Modal):**
   - Chọn Chuyên gia mong muốn (hoặc Auto-match).
   - Chọn Gói dịch vụ ($29 / $59 / $99).
   - Đính kèm CV (Lấy từ profile hoặc upload file PDF mới).
   - Điền mục tiêu ứng tuyển (Target Role, Target Companies, câu hỏi cho chuyên gia).
   - Thanh toán an toàn (Stripe/Card checkout simulation).
3. **Theo dõi đơn hàng & Nhận phản hồi:**
   - Theo dõi trạng thái: `pending_payment` -> `paid` -> `in_review` -> `completed`.
   - Xem và tải báo cáo chi tiết: Điểm tổng thể, điểm ATS, nhận xét từng phần, file PDF có ghi chú sửa lỗi trực tiếp.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (PostgreSQL & Alembic)

Bổ sung 4 bảng mới vào PostgreSQL:
1. `expert_profiles`: Lưu thông tin chuyên gia (tên, chức danh, công ty, avatar, rating, số năm kinh nghiệm, lĩnh vực chuyên môn).
2. `cv_review_packages`: Các gói dịch vụ review (`essential`, `pro`, `elite`) với giá tiền và danh sách quyền lợi.
3. `cv_review_orders`: Đơn đặt hàng của ứng viên (liên kết với candidate identity, expert, package, resume_url, target_role, trạng thái đơn hàng).
4. `cv_review_feedbacks`: Kết quả đánh giá của chuyên gia (điểm số, nhận xét, điểm mạnh, điểm cần cải thiện, file annotated PDF).

---

## 3. Kiến Trúc Backend (FastAPI Clean Architecture)

- **SQLAlchemy 2.0 Async ORM Models (`backend/app/models/expert_review.py`):**
  - `ExpertProfile`, `CVReviewPackage`, `CVReviewOrder`, `CVReviewFeedback`.
- **Pydantic v2 Schemas (`backend/app/schemas/expert_review.py`):**
  - DTOs cho Expert, Package, OrderCreate, OrderCheckout, OrderResponse, FeedbackResponse.
- **Repository Layer (`backend/app/repositories/expert_review_repo.py`):**
  - Truy vấn danh sách chuyên gia, gói giá, đơn hàng theo candidate id, row-level locking khi checkout.
- **Service Layer (`backend/app/services/expert_review_service.py`):**
  - Quản lý logic nghiệp vụ, seed dữ liệu mẫu chuyên gia & gói dịch vụ, kiểm tra quyền sở hữu IDOR.
- **Thin Controller Router (`backend/app/api/v1/endpoints/expert_review.py`):**
  - `GET /v1/expert-review/experts/` (Public)
  - `GET /v1/expert-review/packages/` (Public)
  - `POST /v1/expert-review/orders/` (Auth)
  - `POST /v1/expert-review/orders/{order_id}/checkout/` (Auth)
  - `GET /v1/expert-review/orders/my-orders/` (Auth)
  - `GET /v1/expert-review/orders/{order_id}/feedback/` (Auth)

---

## 4. Kiến Trúc Frontend (Next.js 16 + Atomic Design)

- **Custom Hook (`frontend/src/hooks/use-expert-review.ts`):** Quản lý state tải chuyên gia, bộ lọc lĩnh vực, giỏ hàng/đặt đơn, danh sách đơn hàng đã đặt.
- **Feature Organisms (`frontend/src/components/features/expert-review/`):**
  - `expert-hero.tsx`: Giới thiệu, cam kết chất lượng, trust metrics.
  - `pricing-tiers.tsx`: 3 thẻ bảng giá Essential ($29), Pro ($59), Elite ($99).
  - `expert-directory.tsx` & `expert-card.tsx`: Lưới chuyên gia kèm bộ lọc theo lĩnh vực kỹ thuật.
  - `review-booking-dialog.tsx`: Hộp thoại đặt review nhiều bước.
  - `sample-feedback-report.tsx`: Bản demo báo cáo điểm số ATS & so sánh before/after.
  - `candidate-orders-list.tsx`: Bảng theo dõi tiến độ đơn hàng và nút xem kết quả feedback.
- **Page Container (`frontend/src/app/(public)/expert-review/page.tsx`):** Ráp nối các Organisms (< 150 dòng).

---

## 5. Quy Chuẩn & Kiểm Thử (DoD)

1. Mọi file mã nguồn tuân thủ nghiêm ngặt **< 300 dòng**.
2. Pytest Integration Tests: `backend/tests/test_expert_review.py` pass 100%.
3. Playwright E2E Tests: `qc/tests/e2e/expert-review.spec.ts` pass 100%.
4. Chạy `bash scripts/audit-truth.sh` đạt 0 lỗi drift.
