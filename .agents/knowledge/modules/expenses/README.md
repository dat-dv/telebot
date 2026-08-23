# Expenses Module

## Purpose

`apps/web/src/modules/expenses` exposes an authenticated user's expense history independently from income transactions.

## UI and state

The table displays category, note, amount, and occurrence time. It provides loading, empty, success, and retryable-error states and keeps the data table scrollable on narrow screens.

## Integration seams

`getExpenses` calls `API_ROUTES.expenses`; `ReportsController` scopes results by access-token user ID and `FinanceService.listExpenses` filters `finance_transactions` by `type = expense`.
