# Production follow-ups (nhánh `feature/production-hardening`)

Những việc còn lại sau đợt hardening. Đánh `[x]` khi xong, xoá file khi hết mục.

## 1. Cấu hình GitHub (cần quyền admin repo)
- [ ] Branch protection cho `main`: bắt buộc PR, bắt buộc các check `ci.yml` (backend, frontend, mobile, e2e, security, docker) xanh.
- [ ] Tạo environment `production` có required reviewers (pipeline `deploy.yml` dừng ở đây chờ duyệt).
- [ ] Secrets GitHub: `KUBE_CONFIG` (deploy.yml), `GEMINI_API_KEY` (ai-code-review, ai-pm-planner, skill-evals).
- [ ] Variables GitHub: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (thiếu thì nút Google bị ẩn), `KUBE_NAMESPACE`.
- [ ] GHCR: cho cluster pull được image (public package hoặc `imagePullSecrets`).
- [ ] Xem CI chạy lần đầu trên remote và sửa nếu đỏ (CI mới chỉ chạy local).

## 2. Cluster / hạ tầng
- [ ] Cài ingress-nginx và cert-manager (k8s manifest dùng TLS qua cert-manager).
- [ ] StorageClass ReadWriteMany cho volume upload.
- [ ] Tạo secret `belooga-secrets` theo `k8s/deployment-and-hpa.yaml`: bắt buộc `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `MOMO_SECRET_KEY`; tuỳ chọn `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_*` (thiếu Google/MoMo thì endpoint trả 503).
- [ ] Kiểm tra `TRUSTED_PROXY_IPS` (`10.0.0.0/8` trong k8s) khớp dải IP ingress thật, nếu không rate-limit sẽ tính theo IP proxy.
- [ ] Chạy thử `deploy.yml` lần đầu, xác nhận `alembic upgrade head` và `/health/ready` OK.

## 3. Cần quyết định
- [x] Hai endpoint không ai gọi (trust-benchmark báo 2 vi phạm): `/v1/growth/rewards`, `/v1/growth/expert-mock-slots`.
  Chọn một: nối vào `WalletRewardsCashbackCard` / `ExpertLiveMockBookingCard`, hoặc xoá route + service + test.

## 4. Dữ liệu chưa thật (cần làm trước khi dùng số liệu để ra quyết định)
- [ ] Analytics: phễu chuyển đổi và LTV/CAC đang là hệ số cố định trong `backend/app/modules/analytics/service.py`; cần tính từ dữ liệu event/order thật.
- [ ] Micro-Pass (29K/59K): sau khi trả tiền chỉ mở khoá phía trình duyệt; server phải lưu entitlement từ `payment_orders` (status `PAID`) và kiểm tra ở các endpoint trả phí.
- [ ] Module growth (rewards, reverse bid, mock interview): phần lớn là demo, `claim-reward` không cộng gì vào ví. Hoặc làm thật (đi qua ledger `wallet_transactions`), hoặc ẩn khỏi UI.

## 5. Chưa kiểm chứng được trên máy dev
- [ ] Đăng nhập Google thật (cần OAuth client, redirect URI `/callback`).
- [ ] Thanh toán MoMo sandbox end-to-end: tạo đơn → trả tiền → IPN về `/v1/payments/momo/ipn` → ví/đơn cập nhật. IPN cần URL public (ngrok hoặc staging).
- [ ] Build APK (`bash mobile/scripts/build-apk.sh`) và Maestro (`bash mobile/scripts/e2e-mobile-adb.sh`) — cần Android SDK/emulator.

## 6. Dọn dẹp nhỏ
- [ ] 30 cảnh báo lint frontend (0 lỗi): `cd frontend && bun run lint`.
