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

Module `apps/web/src/modules/calendar` xử lý truy vấn, cập nhật và xóa sự kiện lịch của người dùng đã xác thực.

- API/cache: `getCalendarEvents`, `updateCalendarEvent`, `deleteCalendarEvent` gọi `API_ROUTES.calendarEvents`. Các mutation `useUpdateCalendarEventMutation` và `useDeleteCalendarEventMutation` cập nhật dữ liệu và tự động làm mới (`invalidateQueries`) danh sách sự kiện lịch cùng cache `dashboard`.
- UI: Hiển thị danh sách sự kiện lịch gồm tiêu đề, thời gian bắt đầu/kết thúc, địa điểm và mô tả với hỗ trợ đầy đủ các trạng thái tải, rỗng và lỗi.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
