# Tổng kết triển khai: Autocomplete Người liên quan & Inline Edit Số tiền Ban đầu / Còn lại trên `/debts`

Đã hoàn thành việc nâng cấp trang **Vay & Cho vay (`/debts`)** với đầy đủ các tính năng:

---

## 1. Các tính năng đã hoàn thiện

### 1.1. Autocomplete cho cột "Người liên quan" (`counterparty`)
- **Tích hợp Danh bạ**: Sử dụng `useContactsQuery()` để cung cấp gợi ý tự động khi người dùng gõ vào ô Người liên quan.
- **Hiển thị thông minh**: Danh sách gợi ý hiển thị tên đầy đủ (`displayName`) kèm biệt danh (`alias`) nếu có.
- **Tự động liên kết**: Khi chọn hoặc nhập tên trùng khớp trong danh bạ, hệ thống tự động gán `contactId` và `counterpartyAlias`.
- **Linh hoạt**: Vẫn cho phép nhập tên tùy ý nếu người đó chưa được lưu trong danh bạ.

### 1.2. Inline Edit số tiền "Ban đầu" (`originalAmount`) & "Còn lại" (`remainingAmount`)
- **Ban đầu (`originalAmount`)**:
  - Nhấp đúp chuột hoặc bấm Sửa để chỉnh sửa số tiền ban đầu.
  - Định dạng kiểu số, căn phải, bước nhảy 1,000 VND.
- **Còn lại (`remainingAmount`)**:
  - Nhấp đúp chuột hoặc bấm Sửa để cập nhật số dư còn nợ.
  - Tự động chuyển đổi trạng thái khoản nợ sang *Đã tất toán* (`settled`) và lưu thời gian tất toán khi số dư còn lại về `0`.

### 1.3. Đồng bộ Backend API & Trải nghiệm người dùng
- Cập nhật backend `FinanceService.updateDebt` và `FinanceController` để nhận và lưu trữ các trường: `counterparty`, `contactId`, `counterpartyAlias`, `originalAmount`, `remainingAmount`.
- Hỗ trợ phím tắt: `Enter` để lưu, `Escape` để hủy bỏ.
- Toast notification phản hồi kết quả sau khi lưu.

---

## 2. Kết quả kiểm tra chất lượng (Verification)

| Lệnh kiểm thử | Kết quả | Ghi chú |
| :--- | :--- | :--- |
| `npm run typecheck` | ✅ **Passed (0 errors)** | Đảm bảo Strict Type Safety & Zero-Any |
| `npm run lint` | ✅ **Passed (0 errors)** | Không có cảnh báo hay lỗi cú pháp |
| `npm run build` | ✅ **Passed (0 errors)** | Next.js Static Export & NestJS backend build sạch sẽ |
| `npm run agent-system:validate` | ✅ **Passed** | 85 artifacts, 149 dependencies, 54 pairs, 0 cyclic groups |
