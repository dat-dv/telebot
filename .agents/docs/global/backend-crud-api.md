---
metadata:
  agent-artifact:
    id: docs-global-backend-crud-api
    type: documentation
    depends_on:
      - .agents/knowledge/global/backend-crud-api.md
---

# REST CRUD Backend

Tài liệu canonical tương ứng: [`backend-crud-api.md`](../../knowledge/global/backend-crud-api.md).

- Finance: `/api/transactions`, `/api/places`, `/api/contacts`, `/api/debts`, `/api/debts/:id/payments`, `/api/debts/combine`, `/api/debts/allocations`; mọi bản ghi được khóa theo dashboard access token.
- Hỗ trợ ghi giao dịch đơn lẻ (`create_finance_transaction`) và ghi hàng loạt nhiều khoản cùng lúc (`create_finance_transactions`). Khi câu nói có tên quán ăn/cửa hàng/địa điểm (`placeName`), hệ thống tự động tìm/tạo nơi chốn riêng trong `finance_places` và liên kết `placeId` vào giao dịch; không tạo Contact công nợ.
- Ghi nhận trả nợ gọi `POST /api/debts/:id/payments` (lưu vào bảng `debt_payments` và tự động cập nhật số tiền còn lại, chuyển trạng thái `settled` và ghi nhận `settledAt` khi hoàn tất). Lấy lịch sử qua `GET /api/debts/:id/payments`. Gộp khoản nợ cùng chiều thành khoản cha qua `POST /api/debts/combine` (`parent_debt_id`), phân bổ giao dịch vào nợ qua `POST /api/debts/allocations` (`debt_payment_allocations`).
- Danh bạ (`contacts`): Bổ sung `phoneNumber`, `bankAccountNumber`, `bankCode`, `bankName`, `avatarUrl`. Hỗ trợ gộp danh bạ qua `POST /api/contacts/combine` (kèm cờ `consolidateDebts: true` tự động gom nợ con sang nợ cha).
- Giao dịch thu chi (`transactions`): Bổ sung `paymentMethod`, `currency`, `receiptUrl`, `contactId`, `placeId`, `placeName`. Gửi `placeId: null` khi cần bỏ liên kết nơi chốn.
- Reminders: `/api/reminders`; theo dõi `status` (`pending`, `completed`, `snoozed`, `cancelled`), `snoozeCount`, `snoozedUntil`, `completedAt`. Client không được ghi trực tiếp `isTriggered` vì scheduler quản lý trạng thái này.
- Users và invites: `/api/users`, `/api/invites`; chỉ admin được sử dụng và không thể xóa admin qua API. Bảng `users` quản lý `timezone`, `phoneNumber`, `avatarUrl`, `status`.
- Google: `/api/calendar/events`, `/api/tasks`; chỉ thao tác trên tài khoản Google đã liên kết của người gọi, không trả OAuth token.
