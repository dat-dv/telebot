# Expenses Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/expenses/README.md)

## Purpose

`apps/web/src/modules/expenses` exposes an authenticated user's expense history independently from income transactions.

## UI and state

The table displays category, note, amount, and occurrence time. It includes total spending KPI summary, quick search filtering across category and notes, and i18n currency & date formatting. Its report canvas uses the full available desktop width after navigation, while narrow screens retain horizontal table scrolling. It provides loading, empty, success, and retryable-error states.

## Integration seams

`getExpenses` calls `API_ROUTES.expenses`; `ReportsController` scopes results by access-token user ID and `FinanceService.listExpenses` filters `finance_transactions` by `type = expense`.
