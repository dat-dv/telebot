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

- API: `getDebts` lấy danh sách qua `API_ROUTES.debts`; `updateDebt` cập nhật khoản nợ (hướng vay, người liên quan, số tiền ban đầu/còn lại, ghi chú, hạn chót) qua `API_ROUTES.debts` và `createDebtPayment` ghi nhận thanh toán qua `API_ROUTES.debtPayments`. Các mutation `useDebtsQuery`, `useUpdateDebtMutation`, `useCreateDebtPaymentMutation` tự động làm mới cache `debts` và `dashboard`. `ReportsController` sử dụng `FinanceService.listDebts` để nạp đầy đủ cả khoản nợ đang mở (`active`) và đã tất toán (`settled`).
- Khi ghi nhận thanh toán, hệ thống đồng thời tạo một giao dịch trong sổ thu–chi ở cùng database transaction: khoản **phải thu** được thu hồi tạo khoản **thu** thuộc danh mục *Thu hồi nợ* (cộng số dư); khoản **phải trả** được thanh toán tạo khoản **chi** thuộc danh mục *Trả nợ* (trừ số dư). Số tiền, loại tiền, ngày thanh toán và liên hệ được sao chép từ khoản công nợ để dashboard và công nợ luôn khớp.
- Bảng gồm trạng thái (`status`: *Đang mở* hoặc *Đã tất toán*), hướng công nợ, người liên quan (hỗ trợ autocomplete danh bạ liên hệ), số tiền ban đầu và còn lại (hỗ trợ inline edit trực tiếp), hạn trả, ngày tất toán và ghi chú. Sử dụng `DataTable` có cấu hình ghi nhớ ẩn/hiện cột (`id="debts"`), độ rộng tối thiểu cột `minWidth`, khóa không cho ẩn các cột quan trọng (`status`, `counterparty`, `remainingAmount`).
- Hỗ trợ đầy đủ phím tắt `Enter` để lưu và `Escape` để hủy bỏ khi chỉnh sửa inline.
- Giao diện tích hợp thẻ KPI tổng tiền cho vay & đi vay đang mở, bộ lọc kép (Trạng thái: Tất cả / Đang mở / Đã tất toán kèm số lượng real-time, và Hướng công nợ: Tất cả / Cho vay / Đi vay), thanh tìm kiếm nhanh và định dạng tiền tệ/ngày giờ theo chuẩn i18n locale.
- Trên desktop, canvas báo cáo và bảng trải hết chiều ngang còn lại sau thanh điều hướng; trên màn hình hẹp bảng cuộn ngang bên trong panel.
- Khi API lỗi, dùng nút **Thử lại**; trước hết kiểm tra phiên dashboard đã hết hạn hay chưa.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
