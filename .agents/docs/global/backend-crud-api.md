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

- Finance: `/api/transactions`, `/api/contacts`, `/api/debts`; mọi bản ghi được khóa theo dashboard access token. Trả nợ gọi `POST /api/debts/:id/payments`.
- Reminders: `/api/reminders`; client không được ghi `isTriggered` vì scheduler quản lý trạng thái này.
- Users và invites: `/api/users`, `/api/invites`; chỉ admin được sử dụng và không thể xóa admin qua API.
- Google: `/api/calendar/events`, `/api/tasks`; chỉ thao tác trên tài khoản Google đã liên kết của người gọi, không trả OAuth token.
