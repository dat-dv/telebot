---
metadata:
  agent-artifact:
    id: docs-ui-design-direction
    type: documentation
    depends_on:
      - .agents/knowledge/modules/ui/design-direction.md
      - .agents/plugins/enterprise-ui/rules/02-project-design-direction.md
---

# Hướng Dẫn Định Hướng Thiết Kế UI/UX: Flat Enterprise & Data-Dense B2B SaaS

Tài liệu này hướng dẫn chi tiết quy chuẩn thiết kế và xây dựng giao diện ứng dụng theo triết lý **Flat Enterprise + Data-Dense B2B SaaS + Excel-lite interaction** được quản trị bởi plugin `enterprise-ui`, ánh xạ trực tiếp với tài liệu tri thức [`design-direction.md`](../../../knowledge/modules/ui/design-direction.md).

---

## 1. Triết Lý Cốt Lõi: Product UI, Không Phải Landing Page

Giao diện ứng dụng trong hệ thống là phần mềm tác vụ chuyên nghiệp (Operational Software), phục vụ người dùng xử lý khối lượng lớn dữ liệu một cách nhanh chóng, chính xác và giảm thiểu mỏi mắt.

```text
enterprise-ui (Orchestrator)
│
├── Project Design Profile (CONSTRAINT BẮT BUỘC)
│   └── Flat Enterprise / Data-Dense / Excel-lite
│
├── Tier 1: frontend-design-principles (Xác định màu sắc & token chuẩn domain)
├── Tier 2: ui-design (Hiện thực hóa giao diện React/Tailwind chuẩn Single Canvas)
├── Tier 3: ui-audit (Kiểm toán 4 trạng thái UI: Loading/Error/Empty/Success)
└── Tier 4: web-design-guidelines (Kiểm chuẩn a11y WCAG AA/AAA)
```

---

## 2. 15 Nguyên Tắc Thiết Kế Thực Tiễn

1. **Product UI, không phải marketing**: Loại bỏ hero sections, bento grids, marketing cards, gradient rực rỡ, khoảng trắng khổng lồ.
2. **Single Canvas / Flat Surface**: Cấu trúc phẳng liền mạch (`Page -> Header -> Toolbar -> Main Data -> Footer`), không lồng thẻ `Card -> Card -> Card`.
3. **Border thay cho Shadow**: Dùng viền 1px tinh tế (`border-border`) thay cho drop shadow nặng. `shadow-sm` chỉ dùng cho dropdown/dialog.
4. **Bo góc nhỏ và có kiểm soát**: Dùng `rounded-md` hoặc `rounded-sm` (4px). Không dùng `rounded-2xl` / `rounded-3xl` biến UI thành bubble cards.
5. **Mật độ dữ liệu cao (Data Density)**:
   - Header table: 36–40px.
   - Row table mặc định: 40–48px.
   - Two-line row: Tối đa 52–56px.
6. **Phân cấp Typography**:
   - Tiêu đề & dữ liệu chính: `text-sm font-medium`.
   - Nội dung thông thường: `text-sm`.
   - Metadata / mô tả phụ: `text-xs text-muted-foreground`.
   - Mã ID / Hash / Tọa độ: `font-mono`.
7. **Màu sắc mang ý nghĩa thật (Semantic Colors)**:
   - Nền neutral: `slate`, `zinc`, `neutral`, `white`.
   - Màu chức năng: Xanh lá (Hoạt động/Thành công), Vàng cam (Cảnh báo), Đỏ (Lỗi/Nguy hiểm), Xanh dương (Đang chọn/Tương tác chính).
8. **Không badge hóa mọi thứ**: Không biến mọi metadata thành pill badge. Dùng phân cấp text sạch + status dot (`● Hoạt động`).
9. **Toolbar phẳng gắn với workspace**: Thanh công cụ tìm kiếm, bộ lọc và thao tác hàng loạt nằm trực tiếp trên bề mặt dữ liệu, controls cao đồng bộ 32px.
10. **Giảm thiểu visual noise cho actions**: Gom các thao tác phụ vào menu `...` (More Actions), tránh hiển thị 4-5 nút trên mỗi dòng.
11. **Table chuẩn Excel-lite**: Bảng dữ liệu phẳng, căn lề thẳng hàng, phân cách mỏng, hỗ trợ phím.
12. **Editable Cell không nhìn như một form**:
   - Trạng thái `idle`: Trong suốt (transparent background & border) nhìn như text thường.
   - Trạng thái `hover`: Hiện viền nhẹ.
   - Trạng thái `focus`: Hiện focus ring rõ ràng để chỉnh sửa.
13. **Không dùng emoji trong table header**: Header cột sử dụng text thuần túy, rõ nghĩa.
14. **Responsive theo application workflow**: Màn hình nhỏ ưu tiên ẩn cột phụ và cuộn ngang mượt mà, không ép table thành danh sách card gây tốn diện tích.
15. **Học hỏi tinh thần công cụ chuyên nghiệp**: Tham khảo thiết kế của Linear, GitHub, Vercel, Datadog, Notion Database.

## 4. Table dùng chung của Dashboard Telebot

`apps/web/src/components/data-table.tsx` là nơi dùng chung cho các bảng dashboard. Khi thêm một danh sách mới, khai báo `columns` với tiêu đề cột rõ nghĩa và `cell` để render dữ liệu; không tạo lại các dòng `div`/CSS grid riêng cho từng panel.

- `DataPanel` tạo một data surface phẳng gồm header và phần bảng.
- `DataTable` dùng HTML semantic (`table`, `thead`, `tbody`, `th`, `td`), header cao 38px và dòng dữ liệu cao 44px.
- Số tiền và thời gian cần căn phải khi giúp quét dữ liệu nhanh hơn. Nội dung chính dùng `cell-primary`, metadata dùng `cell-muted`.
- Trên điện thoại bảng vẫn giữ cột và cuộn ngang; không chuyển thành các card riêng lẻ.
- Luôn truyền `ariaLabel`, `emptyMessage`; dùng `loading` để có skeleton đồng đều. Lỗi cấp dashboard tiếp tục dùng `role="alert"` và nút thử lại.

## 5. Khung page Dashboard Telebot

Dashboard có ba page: Trang chủ, Thống kê và Liên lạc. Desktop dùng thanh điều hướng trái gọn; mobile đưa điều hướng lên đầu và cho phép cuộn ngang. Không tạo card menu lớn hoặc thay bảng bằng card list.

Cả ba page dùng chung query phiên dashboard. Chỉ page Liên lạc gọi thêm API danh bạ; phải giữ các trạng thái loading, empty và error ngay trong bề mặt dữ liệu.

---

## 3. Checklist Tự Kiểm Tra (Design Acceptance Test)

Trước khi hoàn thành bất kỳ task UI nào, nhà phát triển và Agent phải tự trả lời 10 câu hỏi:
1. Người dùng có nhìn thấy **data/content trước decoration** không?
2. Có card nào tồn tại chỉ để bọc một section khác không?
3. Có whitespace/padding nào lớn hơn nhu cầu thao tác không?
4. Có badge nào có thể thay bằng text hierarchy hoặc status dot không?
5. Có action nào nên đưa vào `...` menu không?
6. Table có đủ dense để scan nhiều records không?
7. Editable cell có đang nhìn giống form controls thô cứng khi idle không?
8. Border/shadow/radius có đang quá nổi hơn content không?
9. Semantic color có thực sự mang ý nghĩa không?
10. UI có mang cảm giác operational software hay đang giống template dashboard?
