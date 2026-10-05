# Belooga Strategic Planning & Product Hub (`docs/planning/`)

Thư mục lưu trữ toàn bộ các kế hoạch định hướng chiến lược, mô hình kinh tế, bài toán tài chính vi mô, thiết kế giao diện và phân chia công việc chuẩn production của nền tảng Belooga.

---

## 📑 Danh Mục Tài Liệu Chiến Lược & Thực Thi

| Mã Tài Liệu | Tiêu Đề | Trọng Tâm | Định Dạng |
|---|---|---|---|
| **[PLAN-001](file:///Users/phucnguyen/Dev/Beloga/docs/planning/master-business-strategy.md)** | **Master Strategic Blueprint** | • Mindmap hệ sinh thái 4 trụ cột<br>• Mô hình 3 chặng tăng trưởng McKinsey<br>• Phân tích thác doanh thu (P&L) 500 users = $500<br>• Tâm lý định giá "Free to Paid" 29k-59k<br>• Chiến lược hạt giống dữ liệu (Data Flywheel) | Mermaid Flowcharts, Sequence Diagrams, P&L Modeling |
| **[PLAN-002](file:///Users/phucnguyen/Dev/Beloga/docs/planning/02-high-density-ui-layout-ecosystem.md)** | **High-Density UI Layout & Feature Gap** | • Bảng đối soát tính năng & bằng chứng thực tế<br>• Triết lý "Zero Dead-Space" (Linear / Bloomberg Terminal)<br>• Wireframe 5 Layout: ATS Scanner, Pro CV Studio, Job Kanban, Expert Studio, Admin Dashboard<br>• Schema ERD mở rộng cho Escrow & Annotations | ASCII Wireframes, Tailwind Layout Specs, ERD Diagram |
| **[PLAN-003](file:///Users/phucnguyen/Dev/Beloga/docs/planning/03-production-task-breakdown.md)** | **Production Backlog & Task Breakdown** | • Ma trận phân vai RACI (Design, FE, BE, QC, DevOps)<br>• 4 Sprints chi tiết với User Stories & Acceptance Criteria<br>• Tiêu chuẩn nghiệm thu sản phẩm (Definition of Done - DoD)<br>• Phòng chống lỗi thanh toán MoMo & an toàn tài chính | Jira/Linear Format, Mermaid Sprint Dependency, Test Contracts |
| **[PLAN-004](file:///Users/phucnguyen/Dev/Beloga/docs/planning/04-jira-linear-tickets-assignment.md)** | **Jira/Linear Master Ticket Board & Assignment** | • Bảng điều phối việc chi tiết 28 vé kỹ thuật (Tickets BEL-101 đến BEL-404)<br>• Gán nhân sự cụ thể (@be-senior, @fe-lead, @des-lead, @qc-lead, @ops-lead)<br>• Trạng thái realtime (DONE, IN PROGRESS, ASSIGNED)<br>• Minh chứng nghiệm thu thực nghiệm cho từng ticket | Kanban Table, Ticket IDs, Assignees, Story Points, DoD |
| **[PLAN-005](file:///Users/phucnguyen/Dev/Beloga/docs/planning/05-full-ecosystem-viral-marketing-analytics.md)** | **12+ Features, Viral Loops & Zero-VND Marketing** | • Danh mục toàn diện 12+ tính năng vòng lặp khép kín<br>• 4 tính năng nam châm hút khách (Roast CV, Salary Index, Mock Interview, Crawler)<br>• Chiến lược Marketing Du Kích 0đ (Campus, J2Team, TikTok, Chuyên gia)<br>• Hướng dẫn vận hành màn hình `/admin/analytics` | Mermaid Flywheel, Growth Loops, GTM Playbook, Unit Economics |

---

## 🎯 Các Chỉ Số Mục Tiêu Giai Đoạn 1 (Phase 1 OKRs)

- **Ngân sách hạ tầng (Infra Budget):** Tối đa $15/tháng (Hetzner VPS + Cloudflare R2 + Gemini Flash).
- **Mốc người dùng (User Milestone):** 500 Active Job Seekers (Dân IT/Tech).
- **Mục tiêu doanh thu (Revenue Target):** > $500/tháng (Điểm hòa vốn và bắt đầu có dòng tiền dương).
- **Phí sàn (Platform Fee):** 8% cho Expert Review + 100% doanh thu các gói Micro-Pass 29k-59k.
- **Cổng thanh toán chính:** MoMo QR Code (Tự động hóa qua Webhook Idempotency).
- **Quy chuẩn kỹ thuật:** Mật độ thông tin cao (High Density), TypeScript 0 warning, Test coverage tự động có bằng chứng thực nghiệm (`No Proof = Not Done`).
