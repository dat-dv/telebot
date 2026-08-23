---
metadata:
  agent-artifact:
    id: docs-global-financial-report-contracts
    type: documentation
    depends_on:
      - .agents/knowledge/domain/financial-report-contracts.md
---

# Hợp đồng báo cáo tài chính

Tài liệu này ánh xạ trực tiếp với tri thức canonical [`financial-report-contracts.md`](../../knowledge/domain/financial-report-contracts.md).

Hai endpoint báo cáo mới dùng contracts tập trung trong `packages/contracts/src/index.ts`:

- `GET /api/debts`: trả `IDebtListItem[]` cho các khoản công nợ đang mở.
- `GET /api/expenses`: trả `IExpenseListItem[]` cho tối đa 200 khoản chi mới nhất.

Cả hai endpoint xác thực bằng access token dashboard và luôn lọc theo người dùng trong token. Không dùng các endpoint này để thay đổi công nợ hoặc giao dịch.
