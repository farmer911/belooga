🎯 Đang làm ticket: [BEL-201] (#127) — [mobile] Mobile Expert Reviewer Ranking & Leaderboard Screen Parity | Role: mobile | Cột: In Progress

# Active Mobile Agent State (`[BEL-201]` / `#127`)

## 1. Scope & Design Contract (`#124` / Figma `16:1600` -> `16:1604`)
- **API Endpoints (`/v1/expert-review/*`):**
  1. `GET /v1/expert-review/leaderboard` (`?category=&sort_by=`) -> Categories (`all`, `backend`, `frontend`, `ai`, `devops`, `management`) and sort modes (`rank`, `ats_lift`, `rating`, `speed`, `reviews_count`).
  2. `POST /v1/expert-review/orders` -> 1-Click Book Expert from leaderboard.
  3. `POST /v1/expert-review/orders/{order_id}/feedback` -> Submit candidate review feedback (`rating`, `ats_lift_achieved`, `comment`).
- **Required `accessibilityLabel` & `content-desc` (`#124` / `#127`):**
  - `mobile-expert-leaderboard-section`
  - `mobile-expert-category-<cat>` (`all`, `backend`, `frontend`, `ai`, `devops`, `management`)
  - `mobile-expert-sort-<mode>` (`rank`, `ats_lift`, `rating`, `speed`, `reviews_count`)
  - `mobile-expert-leaderboard-card-<id>`, `mobile-expert-book-btn-<id>`
