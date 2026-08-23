---
metadata:
  agent-artifact:
    id: docs-module-expenses
    type: documentation
    depends_on:
      - .agents/knowledge/modules/expenses/README.md
---

# Module khoản chi

Tài liệu này ánh xạ trực tiếp với tri thức canonical [`README.md`](../../../knowledge/modules/expenses/README.md).

Module `apps/web/src/modules/expenses` hiển thị lịch sử tối đa 200 giao dịch chi mới nhất của người dùng đăng nhập.

- API `GET /api/expenses` chỉ lấy `finance_transactions` có `type = expense`.
- Bảng gồm danh mục, nội dung chi, số tiền và thời điểm phát sinh.
- Trên desktop, canvas báo cáo và bảng trải hết chiều ngang còn lại sau thanh điều hướng; trên màn hình hẹp bảng cuộn ngang bên trong panel.
- Khi không có dữ liệu, giao diện hiển thị trạng thái rỗng; khi lỗi, dùng nút **Thử lại**.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
