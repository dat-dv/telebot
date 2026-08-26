# Walkthrough: Chuẩn hóa Tên Cột & Bổ sung Cột Số Dư Sau Giao Dịch

Em đã hoàn thành việc chuẩn hóa tên gọi các cột trong bảng phân rã dòng tiền và bổ sung cột **Số dư sau giao dịch (Running Balance)** vào bảng Thu – Chi!

---

## 1. Các thay đổi chính đã triển khai

### Chuẩn hóa Tên Cột Bảng Phân Rã Dòng Tiền (`/analytics`)
* **`analytics.cashflow.column.period`**: `Kỳ / Mốc thời gian` (en: `Time Period / Interval`)
* **`analytics.cashflow.column.income`**: `Tổng thu (+)` (en: `Total Income (+)`)
* **`analytics.cashflow.column.expense`**: `Tổng chi (-)` (en: `Total Expense (-)`)
* **`analytics.cashflow.column.netCashflow`**: `Chênh lệch Thu–Chi` (en: `Net Surplus / Deficit`)
* **`analytics.cashflow.column.balance`**: `Số dư ví cuối kỳ` (en: `Ending Balance`)

### Bổ sung Cột "Số dư sau GD" vào Bảng Thu – Chi
* **Tính toán Running Balance**:
  * Dữ liệu giao dịch được sắp xếp theo trình tự thời gian tăng dần để cộng dồn/trừ dần theo từng biến động thu chi.
  * Từng giao dịch được gán giá trị `runningBalance` chính xác.
* **Component `TransactionsTable` (`apps/web/src/modules/dashboard/view/transactions-table.tsx`)**:
  * Thêm cột **`Số dư sau GD`** (`dashboard.columns.runningBalance`), căn phải với font `tabular-nums font-semibold`.
  * Màu sắc trực quan (màu tím violet khi dương, màu đỏ khi âm).
  * Tích hợp tự động với tính năng ẩn/hiện số tiền nhạy cảm (`••••••`).
* **Đồng bộ màn hình**: Cả màn hình Tổng quan Dashboard (`dashboard-home-screen.tsx`) và Màn hình Thu chi chuyên biệt (`transactions-screen.tsx`) đều được trang bị tính năng này.

---

## 2. Kết quả kiểm thử & Xác thực

* **Typecheck**: `npm run typecheck` $\rightarrow$ **PASS** 100% không lỗi trên cả 3 workspaces (`contracts`, `api`, `web`).
* **Linter**: `npm run lint` $\rightarrow$ **PASS** 0 errors, 0 warnings.
* **Backend Unit Tests**: `npm test` trong `@telebot/api` $\rightarrow$ **PASS** 63/63 tests.
* **Next.js Production Build**: `next build` $\rightarrow$ **Compiled successfully** (19/19 static pages).
* **Agent System Validation**: `npm run agent-system:validate` $\rightarrow$ **PASS** 90 artifacts.
