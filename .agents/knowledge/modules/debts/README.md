# Debts Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/debts/README.md)

## Purpose

`apps/web/src/modules/debts` displays the authenticated user's active receivables and payables so each outstanding balance can be scanned and updated quickly.

## UI and state

The table shows direction, counterparty, original and remaining amounts, due date, settled date, and note. It supports full inline editing:
- **Direction**: Toggle between receivable and payable.
- **Counterparty**: Autocomplete input integrated with the contacts directory (`useContactsQuery`) linking `contactId` and `counterpartyAlias`.
- **Original & Remaining Amount**: Inline editable currency inputs with automatic status resolution (`settled` vs `active` when balance hits 0).
- **Due Date & Note**: Inline editable date picker and note text.
- **Actions**: Save / Cancel with `Enter` / `Escape` keyboard shortcuts, Quick Repay (`+`) and Edit (`✎`).

It includes KPI summary metrics for total receivable and payable balances, direction filter pills (All / Receivable / Payable), quick search toolbar, and i18n currency & date formatting. The table utilizes `DataTable` with column persistence (`id="debts"`), defined column minimum widths (`minWidth`), and non-hideable core columns (`counterparty`, `remainingAmount`). It supports loading, empty, success, and retryable-error states.

## Integration seams

`getDebts` calls `API_ROUTES.debts`; `updateDebt` patches debt records (direction, counterparty, contactId, counterpartyAlias, originalAmount, remainingAmount, note, dueAt) via `API_ROUTES.debts`, and `createDebtPayment` posts new payments to `API_ROUTES.debtPayments`. Custom hooks `useDebtsQuery`, `useUpdateDebtMutation`, and `useCreateDebtPaymentMutation` manage server state and invalidate both `debts` and `dashboard` query keys on mutation success. `ReportsController` scopes records by access-token user ID and `FinanceService.getActiveDebts` supplies active debt entities.
