# Belooga Design System & Tokens Guide

Tài liệu lưu trữ định nghĩa hệ thống màu sắc, kiểu chữ (typography), bề mặt (surfaces), viền (borders) và bóng đổ (elevation) được trích xuất từ dự án Beloga.

---

## 🎨 1. Brand & Primary Colors (Màu chủ đạo & Điểm nhấn)

| Token Name | Hex Code | RGB | Vai trò & Ứng dụng |
| :--- | :---: | :---: | :--- |
| `--color-brand-primary` / `$main-color` | `#5BBBAE` | `rgb(91, 187, 174)` | **Màu thương hiệu chính (Teal)**: Nút chính (CTA), logo, đường viền active, highlight quan trọng |
| `--color-brand-hover` / `$main-color-hover` | `#497D76` | `rgb(73, 125, 118)` | **Màu Hover**: Trạng thái hover/active của các nút và liên kết chính |
| `--color-brand-accent-teal` | `#3FC6B7` | `rgb(63, 198, 183)` | **Teal sáng**: Nền thẻ avatar/header profile, banner điểm nhấn |
| `--color-brand-dark-teal` | `#21655E` | `rgb(33, 101, 94)` | **Teal đậm**: Nhãn trạng thái (ví dụ "Seeking opportunities"), text điểm nhấn trên nền sáng |
| `--color-action-blue` | `#39A0E8` | `rgb(57, 160, 232)` | **Action Blue**: Nút upload video resume, action phụ, badge tương tác |

---

## 🖋 2. Text & Typography Colors (Màu văn bản)

| Token Name | Hex Code | RGB | Vai trò & Ứng dụng |
| :--- | :---: | :---: | :--- |
| `--color-text-primary` / `$text-color` | `#252525` | `rgb(37, 37, 37)` | **Văn bản chính**: Tiêu đề lớn (h1 - h6), text có độ tương phản cao |
| `--color-text-heading` | `#515151` | `rgb(81, 81, 81)` | **Tiêu đề phân mục**: Tiêu đề section (Experience, Education, Skills...), khối tiêu đề phụ |
| `--color-text-secondary` | `#666666` | `rgb(102, 102, 102)` | **Nội dung đoạn văn**: Mô tả chi tiết, nội dung bullet points |
| `--color-text-muted` | `#737475` | `rgb(115, 116, 117)` | **Văn bản phụ / Menu**: Navbar links, icon button labels, text ngày tháng/địa điểm |
| `--color-text-inverse` | `#FFFFFF` | `rgb(255, 255, 255)` | **Văn bản tương phản**: Chữ trên nền màu Teal hoặc header tối màu |

---

## 📐 3. Surfaces, Borders & Elevation (Nền, Viền & Đổ bóng)

| Token Name | Giá trị | Vai trò & Ứng dụng |
| :--- | :---: | :--- |
| `--color-bg-page` / `.main-page` | `#F8F9FA` | Nền canvas ứng dụng tổng thể (App background) |
| `--color-bg-surface` | `#FFFFFF` | Nền các thẻ Card nội dung, Sidebar, Modal popup |
| `--color-border-primary` | `#D1D6DA` | Đường kẻ phân cách (divider) giữa các block section |
| `--color-border-subtle` | `#F8F9FA` | Đường viền thanh navbar và phân vùng nhẹ |
| `--color-border-light` | `#FAFAFA` | Đường phân cách nội bộ (horizontal rule) |
| `--shadow-card` | `0 2px 16px 0 rgba(187, 187, 187, 0.12)` | Đổ bóng cho khung Profile Card, Thẻ kinh nghiệm và Sidebar |

---

## 🔤 4. Typography System (Hệ thống Kiểu chữ)

### Font Families
* **Font giao diện chính (Primary):** `Avenir`
  * `AvenirLTStd-Book` (Regular 400) - Văn bản thông thường
  * `Avenir-Medium` (Medium 500) - Nhãn nút, thông tin phụ, vị trí
  * `Avenir-Roman` (Roman 500) - Nhãn trạng thái, ghi chú
  * `Avenir-Heavy` (Bold / Heavy 900) - Tiêu đề chính, tên người dùng, thanh menu
* **Font thay thế dự phòng (Fallback):** `'Open Sans', 'Helvetica', 'Arial', sans-serif`

### Cỡ chữ & Dòng (Scale)
* **Body Default:** `14px` (`font-size: 14px`, `line-height: 1.85em`)
* **H1:** `3.14em (~44px)` (Desktop) / `2.35em (~33px)` (Mobile)
* **H2:** `2.35em (~33px)` (Desktop) / `1.78em (~25px)` (Mobile)
* **H3:** `1.78em (~25px)` (Desktop) / `1.35em (~19px)` (Mobile)
* **H4:** `1.35em (~19px)`
* **H5 / Section Title:** `14px - 15px` (`font-weight: 900`)
* **Small / Fine Print (`$font-size-xs`):** `12px - 13px`

---

## 💻 5. CSS / SCSS Variable Snippet (Sẵn sàng tái sử dụng)

```scss
// Brand Colors
$main-color: #5bbbae;
$main-color-hover: #497d76;
$accent-teal: #3fc6b7;
$dark-teal: #21655e;
$action-blue: #39a0e8;

// Text Colors
$text-color: #252525;
$text-heading: #515151;
$text-body: #666666;
$text-muted: #737475;
$text-inverse: #ffffff;

// Surfaces & Borders
$bg-page: #f8f9fa;
$bg-surface: #ffffff;
$border-color: #d1d6da;
$border-subtle: #f8f9fa;
$shadow-card: 0 2px 16px 0 rgba(187, 187, 187, 0.12);

// Responsive Breakpoints
$sm: 576px;
$md: 768px;
$lg: 992px;
$xl: 1200px;
```
