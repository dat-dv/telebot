---
metadata:
  agent-artifact:
    id: docs-module-calendar
    type: documentation
    depends_on:
      - .agents/knowledge/modules/calendar/README.md
---

# Module lịch biểu
 
Tài liệu này ánh xạ trực tiếp với tri thức canonical [`README.md`](../../../knowledge/modules/calendar/README.md).
 
Module `apps/web/src/modules/calendar` cung cấp giao diện quản lý lịch trình sự kiện kết hợp giữa **Lưới tháng trực quan (Month Grid View)** và **Bảng danh sách (Table View)** từ Google Calendar theo thời gian thực.
 
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Hỗ trợ chuyển đổi linh hoạt giữa chế độ **Lưới tháng** (`CalendarGrid`) và **Bảng danh sách** (`DataTable`).
  - Lưới tháng 7 cột (Thứ 2 đến Chủ Nhật) với đánh dấu ngày hôm nay, ngày được chọn, badge số lượng sự kiện, pill sự kiện kèm giờ và xem chi tiết sự kiện theo ngày đã chọn.
  - Thanh công cụ điều hướng tháng (Tháng trước, Tháng sau, Hôm nay, Tên tháng/năm tự động theo locale).
  - Cho phép chỉnh sửa inline (tiêu đề, địa điểm, mô tả, giờ bắt đầu/kết thúc) và xóa sự kiện trực tiếp.
- **Tích hợp API & Dữ liệu**:
  - Backend: `GoogleResourcesController` (`/calendar/events`) giao tiếp với `GoogleCalendarService` và ánh xạ dữ liệu sang DTO chuẩn `ICalendarEventItem[]`.
  - Frontend: `getCalendarEvents`, `updateCalendarEvent`, `deleteCalendarEvent` qua `API_ROUTES.calendarEvents`.
  - Cập nhật tự động làm mới (`invalidateQueries`) cache `calendarEvents` và `dashboard`.
 
Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
