# Belooga Engineering Harness & Anti-Hallucination Violations Register

Tài liệu kiểm soát chất lượng, ghi nhận toàn bộ các vi phạm (violations) trong quá trình tái hiện giao diện Legacy và áp dụng quy tắc đóng băng (Harness Enforcement) để ngăn chặn 100% tái diễn.

---

## 🚫 Danh mục Vi phạm đã ghi nhận (Violations Log)

### [VIOLATION-001] Tự ý vẽ SVG / Icon xấp xỉ thay vì dùng asset gốc
* **Mô tả lỗi:** Thay vì tải và gắn tệp `public/images/logo-big.png` nguyên bản từ repo legacy, Agent đã tự sinh mã SVG xấp xỉ.
* **Nguyên nhân:** Vi phạm nguyên tắc Zero Hallucination, dựa vào phỏng đoán thay vì kiểm kê mã nguồn.
* **Biện pháp khắc phục:** 
  1. Tải toàn bộ thư viện asset nhị phân từ `farmer911/beloga/public/images/` về local.
  2. Bắt buộc dùng thẻ `<img src="/images/logo-big.png">` theo đúng file `src/commons/components/header/header.tsx`.
* **Trạng thái:** ✅ Đã đóng và khóa trong Harness.

---

### [VIOLATION-002] Hiển thị icon Play đè lên ảnh walkthrough sai lệch quy chuẩn SCSS gốc
* **Mô tả lỗi:** Vẽ nút play cố định kích thước lớn đè lên giữa ảnh `Ana.png` và `Inspire.png`, trong khi SCSS gốc quy định `.modal-start` mặc định `display: none` và chỉ kích hoạt khi hover (`.start-content-video:hover .modal-start`).
* **Nguyên nhân:** Không đối chiếu kỹ file `src/styles/custom-theme.scss` (phần `.stated-video`).
* **Biện pháp khắc phục:**
  1. Cấu hình đúng `border: 1px solid #ececec; box-shadow: 0 0 50px #b8b5b5;` cho ảnh.
  2. Ẩn nút play ở trạng thái tĩnh (`display: none;`) và chỉ hiện khi di chuột (`:hover`).
* **Trạng thái:** ✅ Đã đóng.

---

### [VIOLATION-003] Dùng icon font / background teal cho nút play walkthrough thay vì Stack Theme pure CSS
* **Mô tả lỗi:** Nút play khi hover bị render thành hình tròn màu xanh với icon FontAwesome to bất thường, lệch so with thiết kế Stack Theme nguyên bản của legacy (`.video-play-icon` với hình tròn trắng `#ffffff` và mũi tên tam giác xám `#9b9b9b` tạo bằng pure CSS `:before`).
* **Nguyên nhân:** Không đối chiếu cấu trúc `.video-play-icon:before` trong `src/styles/custom-theme.scss` và `src/styles/theme.scss`.
* **Biện pháp khắc phục:** 
  1. Xóa bỏ thẻ `<i>` FontAwesome bên trong `.video-play-icon`.
  2. Áp dụng chính xác CSS gốc của `.video-play-icon`.
* **Trạng thái:** ✅ Đã cập nhật lại.

---

### [VIOLATION-004] Hallucinate style cho `.modal-trigger` gây xung đột biến nút play thành hình Elip đen khổng lồ & Báo cáo hoàn thành khi chưa test hover
* **Mô tả lỗi:** Khi người dùng di chuột vào card walkthrough (Ava và Inspire), nút play bị biến dạng thành một hình Elip / Surfboard dọc khổng lồ `54px × 240px` màu đen thui che kín card. Lỗi này lặp lại tới lần thứ 3 do Agent báo "đã sửa" nhưng thực tế không hề kiểm tra tương tác (hover) trên trình duyệt thực tế.
* **Nguyên nhân cốt lõi:**
  1. **CSS Pollution (Ô nhiễm CSS toàn cục):** Agent tự ý hallucinate định nghĩa selector `.modal-trigger { height: 240px; background: #1e293b; overflow: hidden; }` trong `index.css`. Trong khi ở legacy codebase `farmer911/beloga`, `.modal-trigger` chỉ là trigger class định danh sự kiện click mở modal của theme, không mang style kích thước hay màu nền.
  2. Element nút play mang đồng thời 2 class `<div class="video-play-icon modal-trigger">`. Style của `.modal-trigger` đã ép chiều cao thành 240px và màu nền đen, kết hợp với `.video-play-icon { width: 54px; border-radius: 50%; }` tạo thành hình elip đen dị hợm.
  3. **Verification Failure:** Agent không tuân thủ cổng nghiệm thu thực tế, không dùng Browser subagent để hover và chụp ảnh trước khi trả lời.
* **Biện pháp khắc phục & Rào cản Harness bắt buộc:**
  1. Xóa bỏ hoàn toàn định nghĩa `.modal-trigger` độc hại khỏi `index.css`.
  2. Xóa bỏ thẻ `<i>` thừa bên trong `<div class="video-play-icon modal-trigger"></div>`.
  3. Thiết lập **Interactive State Verification Gate**: Bắt buộc Agent phải kích hoạt hover/click và kiểm chứng trực tiếp bằng công cụ Browser trước khi báo cáo hoàn thành.
* **Trạng thái:** 🔒 ĐANG KHÓA TRONG HARNESS & KIỂM CHỨNG BẰNG BROWSER.

---

### [VIOLATION-005] Lỗi `ModuleNotFoundError: No module named 'yaml'` trên GitHub Actions CI khi chạy `scripts/lint-skills.py`
* **Where (Sai ở đâu):** `scripts/lint-skills.py:24` (`import yaml`) và `.github/workflows/ci.yml:81`.
* **How & Why (Sai như thế nào):** Trên máy local `python3` đã cài sẵn `PyYAML`, nhưng trên GitHub Actions (`ubuntu-latest` / `actions/setup-python@v5`), môi trường `python3` hệ thống hoàn toàn sạch. Khi CI chạy `python3 scripts/lint-skills.py --quiet` sau bước `audit-truth.sh`, script bị crash với `ModuleNotFoundError: No module named 'yaml'`. Ngoài ra, Agent không kiểm tra `gh run list` sau khi push.
* **Minimal Fix (Sửa làm sao):**
  1. Bổ sung stdlib parser fallback trong `scripts/lint-skills.py` (`try: import yaml except ModuleNotFoundError: yaml = None`) hỗ trợ cả multiline YAML frontmatter (`>-`, `|`) và `triggers.yaml`.
  2. Bổ sung `pyyaml` vào bước cài đặt dependency trong `.github/workflows/ci.yml`.
* **Anti-Recurrence Guard (Chặn tái phạm):** Nâng cấp `scripts/trust-benchmark.py` để chạy `lint-skills.py` và `ratchet.py` với cờ cô lập `python3 -I -S` (vô hiệu hóa toàn bộ `site-packages` bên thứ ba), đảm bảo mọi gate script chạy 100% bằng Python Standard Library.
* **Trạng thái:** ✅ Đã khóa tự động trong `scripts/trust-benchmark.py`.

---

## 🛡 Quy luật Harness Nâng Cao (Agent Strict Operational Rules)

1. **Pre-flight Legacy Asset Check:**
   Trước khi viết bất kỳ component UI nào, bắt buộc phải kiểm tra file SCSS và TSX gốc. Không được tự bịa CSS selector hoặc style inline.
2. **Literal Asset Provenance:**
   Mọi hình ảnh, icon, logo đều phải trích xuất từ `/images/` hoặc đúng CSS class của bộ icon font gốc.
3. **Zero Global CSS Pollution (Chống ô nhiễm CSS):**
   Tuyệt đối không gán style kích thước (`height`, `width`), nền (`background`), padding vào các generic utility/behavior classes của theme (như `.modal-trigger`, `.modal-instance`, `.container`). Mọi style đặc thù phải được scope chặt chẽ theo component cha.
4. **Interactive & Visual Parity Verification Gate (Cổng nghiệm thu tương tác thực tế):**
   Mọi thay đổi liên quan đến hover, click, modal, dropdown, animation BẮT BUỘC phải được kiểm tra thực tế bằng Browser Subagent (hover kiểm tra computed styles và chụp ảnh xác thực). Nghiêm cấm trả lời "đã sửa" khi chưa chạy kiểm chứng visual.
5. **Author Truth Alignment:**
   Nếu không tìm thấy asset hoặc logic cụ thể, bắt buộc phải báo cáo và xin xác nhận từ tác giả hệ thống (User), tuyệt đối không suy đoán.
