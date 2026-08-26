# Debts Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/debts/README.md)

## Purpose

`apps/web/src/modules/debts` displays the authenticated user's active receivables and payables so each outstanding balance can be scanned and updated quickly.

## UI and state

The table is ordered by debt occurrence time descending. A debt stores `occurredAt` separately from `createdAt`; older records without it fall back to `createdAt`. All UI components, KPI metric cards, status badges, and inline actions are styled with 100% Tailwind CSS utility classes supporting dark mode (`dark:`). The page header (title, subtitle, Refresh, Logout) is rendered by the common private layout `WorkspaceHeader` — `DebtsScreen` does not render its own header. The table shows status, direction, counterparty, original and remaining amounts, due date, settled date, and note. It supports full inline editing:
- **Status**: Status badge indicating whether the debt is open (`active`) or paid in full (`settled`).
- **Direction**: Toggle between receivable and payable.
- **Counterparty**: Autocomplete input integrated with the contacts directory (`useContactsQuery`) linking `contactId` and `counterpartyAlias`.
- **Original & Remaining Amount**: Inline editable currency inputs with automatic status resolution (`settled` vs `active` when balance hits 0).
- **Due Date & Note**: Inline editable date picker and note text.
- **Actions**: Save / Cancel with `Enter` / `Escape` keyboard shortcuts, Quick Repay (`+`) and Edit (`✎`).

It includes KPI summary metrics for active total receivable and payable balances, dual filter pill groups (Status: All / Active / Settled with real-time count badges, Direction: All / Receivable / Payable), quick search toolbar, and i18n currency & date formatting. All displayed monetary amounts (KPIs, original/remaining columns, footer totals) adhere to session money visibility masking via `useMoneyFormatter()`, displaying `'••••••'` when hidden while keeping editable input fields unmasked during inline edits. The table utilizes the unified `DebtsTable` component with column persistence (`id="debts"`), defined column minimum widths (`minWidth: 140px` for actions with `flex-nowrap whitespace-nowrap` and `shrink-0` buttons to eliminate wrapping), and non-hideable core columns (`status`, `counterparty`, `remainingAmount`). It supports loading, empty, success, and retryable-error states.

## Integration seams

`getDebts` calls `API_ROUTES.debts`; `updateDebt` patches debt records (including `occurredAt`) via `API_ROUTES.debts`, and `createDebtPayment` posts new payments to `API_ROUTES.debtPayments`. Custom hooks `useDebtsQuery`, `useUpdateDebtMutation`, and `useCreateDebtPaymentMutation` manage server state and invalidate both `debts` and `dashboard` query keys on mutation success. `ReportsController` scopes records by access-token user ID and `FinanceService.listDebts` supplies active and settled debt entities mapped to `IDebtListItem`, ordered via chained `.orderBy('debt.occurred_at', 'DESC', 'NULLS LAST').addOrderBy('debt.created_at', 'DESC').addOrderBy('debt.id', 'DESC')`.

Each debt payment is atomic with its finance transaction: a `receivable` payment creates an `income` transaction in `Thu hồi nợ`, while a `payable` payment creates an `expense` transaction in `Trả nợ`. Both use the payment amount, currency, date, and linked contact, so dashboard balance stays consistent with debt settlement.
