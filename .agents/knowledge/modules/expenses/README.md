# Expenses Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/expenses/README.md)

## Purpose

`apps/web/src/modules/expenses` exposes an authenticated user's expense history independently from income transactions.

## UI and state

The table displays category, note, amount, and occurrence time. It supports inline editing with expense category autocomplete suggestions (`<datalist id="expense-categories-autocomplete">` combining user-configured categories from `useCategoriesQuery('expense')`, `DEFAULT_EXPENSE_CATEGORIES`, and past expense categories), incorporates dynamic period filtering (`PeriodFilterToolbar` with month/week/quarter/year/all ranges), visual trend distribution strips (`TrendSummaryStrip`), inline proportional bar tracks inside amount cells representing spending intensity relative to the period maximum, session money visibility masking via `useMoneyFormatter()` (displaying `'••••••'` when hidden while keeping editable inputs unmasked during inline edits), and column visibility persistence via `DataTable` (`id="expenses"`). It includes quick search filtering across category and notes, responsive minimum column widths (`minWidth`), non-hideable category and amount columns, and i18n currency & date formatting. Its report canvas uses the full available desktop width after navigation, while narrow screens retain horizontal table scrolling. It provides loading, empty, success, and retryable-error states.

## Integration seams

`getExpenses` calls `API_ROUTES.expenses`; `updateExpense` patches expense transactions, and `deleteExpense` removes transactions via `API_ROUTES.transactions`. Custom hooks `useExpensesQuery`, `useUpdateExpenseMutation`, and `useDeleteExpenseMutation` manage queries and invalidate `expenses`, `transactions`, `categories`, and `dashboard` query keys on success or refresh. `ReportsController` scopes results by access-token user ID and `FinanceService.listExpenses` filters `finance_transactions` by `type = expense`.
