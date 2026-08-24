---
metadata:
  agent-artifact:
    id: docs-module-tasks
    type: documentation
    depends_on:
      - .agents/knowledge/modules/tasks/README.md
---

# Module công việc Google Tasks (Web)

`apps/web/src/modules/tasks` quản lý tương tác API, trạng thái server-state và bảng dữ liệu hỗ trợ chỉnh sửa trực tiếp (inline edit) cho Google Tasks trên giao diện Web Dashboard.

## Tổng quan tính năng & Cấu trúc cột bảng

Bảng dữ liệu công việc (`TasksScreen`) cung cấp đầy đủ các cột dữ liệu và tính năng tương tác chuẩn Enterprise UI:

1. **Cột Trạng thái (`status`)**:
   - Checkbox đánh dấu hoàn thành/chưa hoàn thành nhanh chóng.
   - Badge trạng thái trực quan (*Cần làm* `needsAction` hoặc *Đã xong* `completed`).
2. **Cột Tiêu đề (`title`)**:
   - Hiển thị tên công việc (gạch ngang khi đã hoàn thành).
   - Nhấn đúp chuột hoặc bấm nút Sửa để mở input chỉnh sửa trực tiếp.
3. **Cột Ghi chú (`notes`)**:
   - Hiển thị ghi chú chi tiết của công việc.
   - Hỗ trợ chỉnh sửa inline bằng input text.
4. **Cột Hạn chót (`dueAt`)**:
   - Hiển thị ngày giờ hết hạn đã format theo ngôn ngữ (`vi-VN` hoặc `en-US`).
   - Hỗ trợ chọn ngày hạn chót trực tiếp trong chế độ edit.
5. **Cột Cập nhật (`updatedAt`)**:
   - Hiển thị thời điểm cập nhật công việc gần nhất.
6. **Cột Thao tác (`actions`)**:
   - Chế độ xem: Nút Sửa (✎) và Xóa (🗑).
   - Chế độ chỉnh sửa: Nút Lưu (✓) và Hủy (✕).

## Tương tác & Phím tắt (Inline Editing)

- **Kích hoạt chỉnh sửa**: Nhấp đúp chuột (double-click) vào bất kỳ ô nào trên hàng hoặc bấm nút Sửa.
- **Phím tắt**:
  - `Enter`: Lưu thay đổi tức thì.
  - `Escape`: Hủy bỏ chỉnh sửa và khôi phục dữ liệu ban đầu.
- **Bộ lọc & Tìm kiếm**:
  - Dải nút lọc trạng thái: Tất cả, Cần làm, Đã xong.
  - Ô tìm kiếm tức thì theo tiêu đề và nội dung ghi chú.
- **Thông báo phản hồi**: Toast notification xuất hiện khi lưu hoặc xóa công việc thành công.

## Cấu trúc mã nguồn

- `tasks-api.ts`: Triển khai `getTasks`, `updateTask`, `deleteTask` trỏ đến endpoint `API_ROUTES.tasks` (`/api/tasks`).
- `tasks-query.ts`: Cung cấp Query Key Factory `tasksQueryKeys` cùng các hooks `useTasksQuery`, `useUpdateTaskMutation`, `useDeleteTaskMutation` tự động đồng bộ cache.
- `tasks-screen.tsx`: Giao diện hiển thị bảng DataTable tích hợp chỉnh sửa trực tiếp.

## Quy trình kiểm thử

1. Chạy `npm run typecheck` và `npm run lint` để kiểm tra an toàn kiểu và chuẩn mã nguồn.
2. Chạy `npm run build` để kiểm tra build Next.js tĩnh.
3. Kiểm tra các thao tác sửa inline, checkbox đổi trạng thái và xóa task trên trình duyệt.
