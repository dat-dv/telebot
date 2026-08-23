# Debts Module

## Purpose

`apps/web/src/modules/debts` displays the authenticated user's active receivables and payables so each outstanding balance can be scanned quickly.

## UI and state

The table shows direction, counterparty, original and remaining amounts, due date, and note. Its report canvas uses the full available desktop width after navigation, while small screens retain horizontal table scrolling. It supports loading, empty, success, and retryable-error states.

## Integration seams

`getDebts` calls `API_ROUTES.debts`; `ReportsController` scopes records by access-token user ID and `FinanceService.getActiveDebts` supplies active debt entities.
