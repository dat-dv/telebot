---
metadata:
  agent-artifact:
    id: docs-module-expenses
    type: documentation
    depends_on:
      - .agents/knowledge/modules/expenses/README.md
---

# Module chi tiêu

Tài liệu này ánh xạ trực tiếp với tri thức canonical [`README.md`](../../../knowledge/modules/expenses/README.md).

Module `apps/web/src/modules/expenses` hiển thị lịch sử các khoản chi tiêu của đúng người dùng đăng nhập.

- API: `getExpenses` gọi `API_ROUTES.expenses` qua HTTP client đã xác thực.
- UI: Bảng danh sách chi tiêu gồm danh mục, ghi chú, số tiền, ngày phát sinh; tích hợp KPI tổng chi tiêu tháng, thanh tìm kiếm nhanh theo danh mục & ghi chú, và định dạng tiền tệ/thời gian theo chuẩn i18n locale.
- Trên desktop, canvas báo cáo và bảng trải hết chiều ngang còn lại sau thanh điều hướng; trên màn hình hẹp bảng cuộn ngang bên trong panel.
- Hỗ trợ đầy đủ 4 trạng thái giao diện: Đang tải (skeleton), Rỗng (chưa có chi tiêu), Thành công và Lỗi có nút thử lại.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
