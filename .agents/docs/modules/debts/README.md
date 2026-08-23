---
metadata:
  agent-artifact:
    id: docs-module-debts
    type: documentation
    depends_on:
      - .agents/knowledge/modules/debts/README.md
---

# Module công nợ

Tài liệu này ánh xạ trực tiếp với tri thức canonical [`README.md`](../../../knowledge/modules/debts/README.md).

Module `apps/web/src/modules/debts` hiển thị các khoản công nợ đang mở của đúng người dùng đăng nhập.

- API `GET /api/debts` chỉ trả các khoản cần thu hoặc cần trả chưa tất toán.
- Bảng gồm hướng công nợ, người liên quan, số tiền ban đầu/còn lại, hạn trả và ghi chú.
- Giao diện tích hợp thẻ KPI tổng tiền cho vay & đi vay, bộ lọc hướng công nợ (Tất cả / Cho vay / Đi vay), thanh tìm kiếm nhanh và định dạng tiền tệ/ngày giờ theo chuẩn i18n locale.
- Trên desktop, canvas báo cáo và bảng trải hết chiều ngang còn lại sau thanh điều hướng; trên màn hình hẹp bảng cuộn ngang bên trong panel.
- Khi API lỗi, dùng nút **Thử lại**; trước hết kiểm tra phiên dashboard đã hết hạn hay chưa.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
