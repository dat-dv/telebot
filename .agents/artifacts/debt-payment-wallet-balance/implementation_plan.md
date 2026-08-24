---
RequestFeedback: true
---

# Kế hoạch: đồng bộ thanh toán công nợ với số dư ví

## Mục tiêu

Khi ghi nhận một lần thanh toán công nợ, hệ thống phải tạo giao dịch thu/chi tương ứng để số dư ví (sổ thu–chi và dashboard) thay đổi đúng cùng lúc với số nợ còn lại.

## Quy tắc nghiệp vụ xác nhận

| Hướng khoản nợ | Ý nghĩa thanh toán | Giao dịch ví tạo ra | Tác động số dư |
| --- | --- | --- | --- |
| `receivable` | Người khác trả tiền họ nợ người dùng (thu hồi nợ) | `income`, danh mục `Thu hồi nợ` | Cộng |
| `payable` | Người dùng trả khoản đang nợ | `expense`, danh mục `Trả nợ` | Trừ |

Ngày của giao dịch ví dùng đúng `paymentDate`; số tiền, tiền tệ và liên hệ lấy từ khoản nợ. Nội dung giao dịch nêu rõ người liên quan và ghi chú thanh toán (nếu có).

## Phát hiện hiện trạng

- `FinanceService.recordDebtPayment` hiện chỉ tạo `DebtPaymentEntity` và giảm `DebtEntity.remainingAmount`; không có `FinanceTransactionEntity` nên `getSummary()` không thay đổi số dư.
- Dashboard tính số dư từ các `finance_transactions`, vì vậy việc thêm bản ghi thu/chi sẽ tự động phản ánh ở trang tổng quan và danh sách giao dịch khi cache được làm mới.
- Không có thực thể “ví” riêng; “số dư ví” hiện là tổng thu trừ tổng chi của sổ thu–chi.

## Thay đổi dự kiến

1. Cập nhật `apps/api/src/finance/finance.service.ts` để ghi nhận thanh toán công nợ, cập nhật khoản nợ và tạo giao dịch ví trong một transaction cơ sở dữ liệu.
2. Tạo giao dịch `income` cho khoản phải thu và `expense` cho khoản phải trả; gắn `contactId`, loại tiền, ngày thanh toán và danh mục nghiệp vụ phù hợp.
3. Bổ sung kiểm thử cho hai chiều công nợ, thanh toán một phần/toàn bộ, và tính nguyên tử khi không lưu được một phần dữ liệu.
4. Cập nhật tài liệu canonical `.agents/knowledge/modules/debts/README.md` và hướng dẫn tiếng Việt `.agents/docs/modules/debts/README.md` với quy tắc đồng bộ công nợ–ví.

## Phạm vi không thay đổi

- Không hồi tố tạo giao dịch ví cho các lần thanh toán đã tồn tại.
- Không thay đổi khoản nợ gốc khi người dùng tạo khoản vay/cho vay; thay đổi này chỉ áp dụng khi ghi nhận **thanh toán**.
- Không thêm mô hình ví/tài khoản riêng vì hệ thống hiện chưa có thực thể này.

## Kiểm chứng sau triển khai

- Chạy kiểm thử mới và các kiểm tra `npm run typecheck`, `npm run lint`.
- Xác minh: thu hồi nợ 200.000 tăng số dư 200.000; trả nợ 200.000 giảm số dư 200.000; khoản nợ giảm đúng và không có trạng thái ghi dở dang.
