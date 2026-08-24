# Debts Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/debts/README.md)

## Purpose

`apps/web/src/modules/debts` displays the authenticated user's active receivables and payables so each outstanding balance can be scanned quickly.

## UI and state

The table shows direction, counterparty, original and remaining amounts, due date, and note. It includes KPI summary metrics for total receivable and payable balances, direction filter pills (All / Receivable / Payable), quick search toolbar, and i18n currency & date formatting. The table utilizes `DataTable` with column persistence (`id="debts"`), defined column minimum widths (`minWidth`), and non-hideable core columns (`counterparty`, `remainingAmount`). Its report canvas uses the full available desktop width after navigation, while small screens retain horizontal table scrolling. It supports loading, empty, success, and retryable-error states.

## Integration seams

`getDebts` calls `API_ROUTES.debts`; `ReportsController` scopes records by access-token user ID and `FinanceService.getActiveDebts` supplies active debt entities.
