# Kế hoạch: Select autocomplete cho Danh mục Transactions

RequestFeedback: true

## Mục tiêu

Thay ô nhập `input + datalist` trong lúc sửa giao dịch bằng một select autocomplete/combobox thực thụ. Người dùng có thể mở danh sách bằng click, gõ để lọc, dùng mũi tên/Enter để chọn và Escape để đóng hoặc hủy thao tác như hiện tại.

## Phạm vi đã chốt

- Chỉ áp dụng cho cột **Danh mục** của `TransactionsScreen`.
- Giữ nguyên nguồn gợi ý hiện có: danh mục mặc định theo loại Thu/Chi, danh mục cấu hình người dùng và danh mục lịch sử giao dịch.
- Không thay đổi API, schema dữ liệu, cách lưu giao dịch, hoặc các màn hình Expenses/Debts/Analytics trong lần này.

## Thay đổi thực hiện

1. Tạo component UI dùng chung `CategoryAutocomplete` dưới `apps/web/src/shared/ui/`.
   - Nhận `value`, `onChange`, `options`, `placeholder`, nhãn truy cập và trạng thái focus từ màn hình gọi.
   - Duy trì state cục bộ cho trạng thái mở dropdown, chuỗi lọc và option đang được điều hướng.
   - Render ngữ nghĩa `role="combobox"`, `role="listbox"` và `role="option"`; hỗ trợ click ngoài để đóng, `ArrowUp`/`ArrowDown`, `Enter` và `Escape`.
   - Không chặn việc nhập danh mục mới ngoài danh sách gợi ý.

2. Cập nhật `apps/web/src/modules/dashboard/view/transactions-screen.tsx`.
   - Thay input category và `<datalist>` bằng `CategoryAutocomplete`.
   - Truyền `categorySuggestions` hiện có vào component; khi đổi Loại giao dịch, danh sách vẫn tự chuyển theo `editDraft.type`.
   - Giữ nguyên Enter để lưu giao dịch và Escape để hủy chỉnh sửa khi dropdown không còn đang mở.

3. Bổ sung style cần thiết trong `apps/web/src/styles.css`.
   - Dropdown căn theo ô inline của bảng, không vỡ layout, có trạng thái hover/focus, cuộn khi nhiều option và bản dark mode tương ứng.
   - Ưu tiên lớp CSS mới, không ảnh hưởng input inline của các bảng khác.

4. Đồng bộ tài liệu UI.
   - Cập nhật `.agents/knowledge/modules/dashboard/README.md` bằng tiếng Anh, mô tả combobox Danh mục và các tương tác bàn phím.
   - Cập nhật `.agents/docs/modules/dashboard/README.md` bằng tiếng Việt, bổ sung hướng dẫn thao tác/chẩn đoán trường Danh mục.
   - Cập nhật `.agents/docs/README.md` chỉ khi chỉ mục cần bổ sung nội dung mới.

## Xác thực

1. Kiểm tra mã nguồn/rerender để xác nhận trường Danh mục không còn dùng `<datalist>` và có combobox/listbox truy cập được.
2. Chạy `npm run lint` và `npm run typecheck`.
3. Chạy `npm run build:web` vì đây là thay đổi UI Next.js.
4. Kiểm tra thủ công tại `/transactions`: mở sửa một giao dịch, click mở danh sách, gõ để lọc, chọn bằng chuột/mũi tên + Enter, đổi Loại để kiểm tra danh mục đổi theo, và Escape để đóng/hủy.

## Rủi ro và cách giảm thiểu

- Escape có hai nghĩa (đóng dropdown hoặc hủy sửa): component sẽ ưu tiên đóng dropdown; lần Escape tiếp theo do màn Transactions xử lý để hủy sửa.
- Dropdown trong bảng có thể bị cắt bởi vùng cuộn: style đặt vị trí và z-index cục bộ, sau đó xác nhận bằng kiểm tra thủ công.
- Không tạo test file mới ở lượt này vì quy tắc dự án yêu cầu phê duyệt riêng trước khi khởi tạo test; các kiểm tra build/typecheck và thao tác UI ở trên là cổng xác thực hiện có.
