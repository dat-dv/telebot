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

- Finance: `/api/transactions`, `/api/contacts`, `/api/debts`, `/api/debts/:id/payments`; mọi bản ghi được khóa theo dashboard access token.
- Ghi nhận trả nợ gọi `POST /api/debts/:id/payments` (lưu vào bảng `debt_payments` và tự động cập nhật số tiền còn lại, chuyển trạng thái `settled` và ghi nhận `settledAt` khi hoàn tất). Lấy lịch sử qua `GET /api/debts/:id/payments`.
- Danh bạ (`contacts`): Bổ sung `phoneNumber`, `bankAccountNumber`, `bankCode`, `bankName`, `avatarUrl`.
- Giao dịch thu chi (`transactions`): Bổ sung `paymentMethod`, `currency`, `receiptUrl`, `contactId`.
- Reminders: `/api/reminders`; theo dõi `status` (`pending`, `completed`, `snoozed`, `cancelled`), `snoozeCount`, `snoozedUntil`, `completedAt`. Client không được ghi trực tiếp `isTriggered` vì scheduler quản lý trạng thái này.
- Users và invites: `/api/users`, `/api/invites`; chỉ admin được sử dụng và không thể xóa admin qua API. Bảng `users` quản lý `timezone`, `phoneNumber`, `avatarUrl`, `status`.
- Google: `/api/calendar/events`, `/api/tasks`; chỉ thao tác trên tài khoản Google đã liên kết của người gọi, không trả OAuth token.
