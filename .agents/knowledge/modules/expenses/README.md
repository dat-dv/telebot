# Expenses Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/expenses/README.md)

## Purpose

`apps/web/src/modules/expenses` exposes an authenticated user's expense history independently from income transactions.

## UI and state

The table displays category, note, amount, and occurrence time. It incorporates dynamic period filtering (`PeriodFilterToolbar` with month/week/quarter/year/all ranges), visual trend distribution strips (`TrendSummaryStrip`), inline proportional bar tracks inside amount cells representing spending intensity relative to the period maximum, and column visibility persistence via `DataTable` (`id="expenses"`). It includes quick search filtering across category and notes, responsive minimum column widths (`minWidth`), non-hideable category and amount columns, and i18n currency & date formatting. Its report canvas uses the full available desktop width after navigation, while narrow screens retain horizontal table scrolling. It provides loading, empty, success, and retryable-error states.

## Integration seams

`getExpenses` calls `API_ROUTES.expenses`; `ReportsController` scopes results by access-token user ID and `FinanceService.listExpenses` filters `finance_transactions` by `type = expense`.
