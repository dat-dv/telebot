# Báo cáo kiểm tra độ tương phản trạng thái active

## Quan sát và tái hiện

- URL được kiểm tra: `/transactions?period=quarter&ref=2026-08-26` trên môi trường triển khai.
- Môi trường trình duyệt đang ở chế độ tối (`data-theme="dark"`).
- Nút `Quý` active hiển thị nền `slate-900` và chữ `rgb(226, 232, 240)` (màu sáng), không phải chữ đen.
- Các trạng thái active đã rà: bộ lọc kỳ ở Giao dịch và Công việc; `filter-pill.is-active` ở Giao dịch, Công nợ và Cài đặt. Chúng đều có cặp nền/chữ tương phản cao (nền tối/chữ sáng hoặc nền sáng/chữ tối).

## Phạm vi mã nguồn

- Thành phần dùng chung: `apps/web/src/shared/ui/period-filter-toolbar.tsx`.
- Các màn hình dùng lại: Giao dịch, Phân tích, Chi tiêu, Công việc.
- Quy tắc active của bộ lọc thông thường: `apps/web/src/styles.css` (dark theme `.filter-pill.is-active`).

## Kết luận

Không tái hiện được lỗi trên bản triển khai hiện có. Nút `Quý` hiện có chữ sáng trên nền tối. Vì vậy chưa đủ bằng chứng để sửa CSS an toàn. Khả năng còn lại là bản trình duyệt của người dùng đang giữ tài nguyên CSS cũ, hoặc lỗi chỉ xuất hiện trong một trạng thái/thiết bị chưa được cung cấp.

## Bước tiếp theo đề xuất

1. Người dùng tải cứng trang (Ctrl/Cmd+Shift+R) và thử lại đúng URL.
2. Nếu lỗi còn, gửi ảnh chụp kèm thông tin giao diện sáng/tối và trình duyệt/thiết bị; dùng đó để tạo tái hiện chính xác trước khi chỉnh sửa.
3. Khi có tái hiện, phương án sửa nhỏ nhất là buộc màu chữ của nút active trong `PeriodFilterToolbar` theo theme và bổ sung kiểm thử giao diện cho cả light/dark.
