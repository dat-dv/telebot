# Expenses Module

## Purpose

`apps/web/src/modules/expenses` exposes an authenticated user's expense history independently from income transactions.

## UI and state

The table displays category, note, amount, and occurrence time. Its report canvas uses the full available desktop width after navigation, while narrow screens retain horizontal table scrolling. It provides loading, empty, success, and retryable-error states.

## Integration seams

`getExpenses` calls `API_ROUTES.expenses`; `ReportsController` scopes results by access-token user ID and `FinanceService.listExpenses` filters `finance_transactions` by `type = expense`.
