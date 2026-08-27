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

- API: `getDebts` lấy danh sách qua `API_ROUTES.debts`; `updateDebt` cập nhật khoản nợ (bao gồm `occurredAt` — thời gian phát sinh độc lập với thời gian tạo), hướng vay, người liên quan, số tiền ban đầu/còn lại, ghi chú, hạn chót qua `API_ROUTES.debts` và `createDebtPayment` ghi nhận thanh toán qua `API_ROUTES.debtPayments`. Các mutation `useDebtsQuery`, `useUpdateDebtMutation`, `useCreateDebtPaymentMutation` tự động làm mới cache `debts` và `dashboard`. `ReportsController` sử dụng `FinanceService.listDebts` để nạp đầy đủ cả khoản nợ đang mở (`active`) và đã tất toán (`settled`), sắp xếp bằng chuỗi `.orderBy('debt.occurred_at', 'DESC', 'NULLS LAST').addOrderBy('debt.created_at', 'DESC').addOrderBy('debt.id', 'DESC')`.
- Khi ghi nhận thanh toán, hệ thống đồng thời tạo một giao dịch trong sổ thu–chi ở cùng database transaction: khoản **phải thu** được thu hồi tạo khoản **thu** thuộc danh mục _Thu hồi nợ_ (cộng số dư); khoản **phải trả** được thanh toán tạo khoản **chi** thuộc danh mục _Trả nợ_ (trừ số dư). Số tiền, loại tiền, ngày thanh toán và liên hệ được sao chép từ khoản công nợ để dashboard và công nợ luôn khớp.
- **Phân bổ từ Giao dịch Thu–Chi**: Một giao dịch thu hoặc chi có sẵn có thể được gắn/phân bổ vào một hoặc nhiều khoản công nợ qua bảng `debt_payment_allocations`. Mỗi khoản phân bổ tự động sinh bản ghi `debt_payments` tương ứng có liên kết `finance_transaction_id` trỏ về giao dịch nguồn, đảm bảo tính toàn vẹn và minh bạch của lịch sử trả nợ.
- **Gộp công nợ & Cây phân cấp Cha–Con (`parentDebtId`)**: Hệ thống hỗ trợ gộp $N \ge 2$ khoản nợ có cùng chiều (`receivable` hoặc `payable`) thành 1 khoản nợ cha tổng:
  - Khoản nợ cha đại diện cho tổng nợ gốc và tổng nợ còn lại (`originalAmount = sum(...)`, `remainingAmount = sum(...)`).
  - Các khoản nợ con liên kết với nợ cha qua `parentDebtId` (`ON DELETE SET NULL`), giữ nguyên lịch sử thanh toán, ghi chú và mốc thời gian riêng.
  - **Quy tắc Validation & Phòng vệ (Crash Guards)**:
    - *Đồng nhất chiều nợ*: Chặn tuyệt đối việc gộp lẫn lộn khoản cho vay với đi vay; giao diện tự động cảnh báo và vô hiệu hóa nút bấm.
    - *Đồng nhất loại tiền tệ*: Chỉ cho phép gộp các khoản nợ có cùng đơn vị tiền tệ (`currency`). Khi gộp liên hệ tự động (`consolidateDebts: true`), hệ thống tự gom nhóm riêng biệt theo cả chiều nợ và loại tiền tệ để không phát sinh lỗi.
    - *Làm phẳng cây phân cấp (Cycle Prevention)*: Khi gộp khoản nợ đã có các khoản con từ trước, toàn bộ các khoản con cũ sẽ được tự động liên kết thẳng lên nợ cha mới nhất, triệt tiêu nguy cơ cây nợ vô tận hoặc lỗi lặp đệ quy.
    - *Xác thực quyền sở hữu*: Bắt buộc người dùng chỉ được gộp các khoản nợ do chính mình sở hữu.
  - Khi gộp danh bạ (`POST /api/contacts/combine`), nếu chọn `consolidateDebts: true`, hệ thống tự động gom các khoản nợ cùng chiều sang khoản nợ cha duy nhất dưới liên hệ đích.
  - Trên Web UI: `DebtsTable` hỗ trợ chọn nhiều dòng qua checkbox, nút bấm thao tác gộp nợ, mở rộng/thu gọn cây nợ con với nút icon Chevron xoay tinh tế (`▶ / ▼` xoay `rotate-90`), thụt lề hàng con (`↳` với `pl-4`), nền phân biệt nhẹ (`bg-slate-50/70 dark:bg-slate-900/40`), kèm huy hiệu `[Gộp: N khoản con]` và `[Khoản con]`. Modal `CombineDebtsDialog` hiển thị cảnh báo đỏ và khóa nút xác nhận khi phát hiện chọn lệch chiều nợ hoặc lệch loại tiền. Tổng số tiền thống kê chỉ tính các khoản cha để tránh double-counting.
- Bảng gồm trạng thái (`status`: _Đang mở_ hoặc _Đã tất toán_), hướng công nợ, người liên quan (hỗ trợ autocomplete danh bạ liên hệ), số tiền ban đầu và còn lại (hỗ trợ inline edit trực tiếp), hạn trả, ngày tất toán và ghi chú. Giao diện được xây dựng 100% bằng Tailwind CSS utility classes, tương thích hoàn toàn chế độ dark mode (`dark:`). Tiêu đề trang (tên trang, mô tả, nút Làm mới, nút Đăng xuất) do `WorkspaceHeader` trong common private layout cung cấp — `DebtsScreen` (`apps/web/src/modules/debts/presentation/components/debts-screen.tsx`, re-exported qua `view/debts-screen.tsx`) **không tự render header riêng**. Sử dụng component dùng chung `DebtsTable` (`apps/web/src/modules/debts/presentation/components/debts-table.tsx`, re-exported qua `view/debts-table.tsx`) có cấu hình ghi nhớ ẩn/hiện cột (`id="debts"`), độ rộng tối thiểu cột `minWidth: 140px` cho cột thao tác với `flex-nowrap whitespace-nowrap` và `shrink-0` chống rớt dòng các nút bấm (`✎ Sửa`, `+ Trả nợ`), khóa không cho ẩn các cột quan trọng (`status`, `counterparty`, `remainingAmount`).
- Hỗ trợ đầy đủ phím tắt `Enter` để lưu và `Escape` để hủy bỏ khi chỉnh sửa inline.
- Giao diện tích hợp thẻ KPI tổng tiền cho vay & đi vay đang mở, bộ lọc kép (Trạng thái: Tất cả / Đang mở / Đã tất toán kèm số lượng real-time, và Hướng công nợ: Tất cả / Cho vay / Đi vay), thanh tìm kiếm nhanh và định dạng tiền tệ/ngày giờ theo chuẩn i18n locale. Toàn bộ số tiền hiển thị (thẻ KPI, cột số tiền ban đầu/còn lại, footer tổng nợ) tuân thủ cơ chế ẩn/hiện số tiền trong phiên (`useMoneyFormatter()`), tự động che bằng `'••••••'` khi ở chế độ riêng tư và giữ nguyên số thực trong ô input khi đang inline edit.
- Các bảng dữ liệu dùng chung tự sắp theo mốc thời gian nghiệp vụ: lịch sử thu–chi/nợ dùng mới nhất trước; lịch, nhắc việc và công việc dùng mốc sắp diễn ra trước. Bản ghi nợ cũ thiếu `occurredAt` tạm dùng `createdAt` để giữ thứ tự ổn định.
- Trên desktop, canvas báo cáo và bảng trải hết chiều ngang còn lại sau thanh điều hướng; trên màn hình hẹp bảng cuộn ngang bên trong panel.
- Khi API lỗi, dùng nút **Thử lại**; trước hết kiểm tra phiên dashboard đã hết hạn hay chưa.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
