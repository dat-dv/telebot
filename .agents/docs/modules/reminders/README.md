---
metadata:
  agent-artifact:
    id: docs-module-reminders
    type: documentation
    depends_on:
      - .agents/knowledge/modules/reminders/README.md
---

# Module lời nhắc

Tài liệu này ánh xạ trực tiếp với tri thức canonical [`README.md`](../../../knowledge/modules/reminders/README.md).

Module `apps/web/src/modules/reminders` quản lý các lời nhắc đặt lịch của người dùng đã xác thực.

- API/cache: `getReminders`, `updateReminder`, `deleteReminder` gọi `API_ROUTES.reminders`. Các mutation `useUpdateReminderMutation` và `useDeleteReminderMutation` xử lý cập nhật/xóa lời nhắc và tự động làm mới (`invalidateQueries`) danh sách lời nhắc cùng cache `dashboard`.
- UI: Hiển thị danh sách lời nhắc gồm nội dung, thời gian nhắc, trạng thái và chi tiết bổ sung.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
