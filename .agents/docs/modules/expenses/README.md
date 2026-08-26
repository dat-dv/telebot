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

- API: `getExpenses` gọi `API_ROUTES.expenses`; `updateExpense` và `deleteExpense` thao tác qua `API_ROUTES.transactions`. Các mutation `useExpensesQuery`, `useUpdateExpenseMutation`, `useDeleteExpenseMutation` tự động làm mới cache `expenses`, `transactions`, `categories` và `dashboard`.
- UI: Xây dựng 100% bằng Tailwind CSS utility classes (hỗ trợ đầy đủ dark mode `dark:`). Bảng danh sách chi tiêu gồm danh mục, ghi chú, số tiền, ngày phát sinh; tích hợp menu gợi ý danh mục tự động (`<datalist id="expense-categories-autocomplete">` kết hợp danh mục cấu hình người dùng từ `useCategoriesQuery('expense')`, danh mục chi tiêu chuẩn và lịch sử), bộ lọc chu kỳ thời gian (`PeriodFilterToolbar`), dải xu hướng thu-chi (`TrendSummaryStrip`), biểu đồ thanh tỷ lệ phần trăm số tiền trực quan trong ô `amount`, cơ chế ẩn/hiện số tiền nhạy cảm trong phiên (`useMoneyFormatter()`) tự động che `'••••••'` khi ẩn, và lưu trạng thái ẩn/hiện cột qua `DataTable` (`id="expenses"`). Hỗ trợ tìm kiếm nhanh theo danh mục & ghi chú, độ rộng cột tối thiểu `minWidth` và định dạng tiền tệ/thời gian theo chuẩn i18n locale. Khi sửa dòng (inline edit), ô input vẫn giữ số thực để phục vụ nhập liệu.
- Trên desktop, canvas báo cáo và bảng trải hết chiều ngang còn lại sau thanh điều hướng; trên màn hình hẹp bảng cuộn ngang bên trong panel.
- Hỗ trợ đầy đủ 4 trạng thái giao diện: Đang tải (skeleton), Rỗng (chưa có chi tiêu), Thành công và Lỗi có nút thử lại.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
