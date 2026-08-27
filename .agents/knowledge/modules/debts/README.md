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

It includes KPI summary metrics for active total receivable and payable balances, dual filter pill groups (Status: All / Active / Settled with real-time count badges, Direction: All / Receivable / Payable), quick search toolbar, and i18n currency & date formatting. All displayed monetary amounts (KPIs, original/remaining columns, footer totals) adhere to session money visibility masking via `useMoneyFormatter()`, displaying `'••••••'` when hidden while keeping editable input fields unmasked during inline edits. The table utilizes the unified `DebtsTable` component (`apps/web/src/modules/debts/presentation/components/debts-table.tsx`, re-exported via `view/debts-table.tsx`) used in `DebtsScreen` (`apps/web/src/modules/debts/presentation/components/debts-screen.tsx`, re-exported via `view/debts-screen.tsx`) with column persistence (`id="debts"`), defined column minimum widths (`minWidth: 140px` for actions with `flex-nowrap whitespace-nowrap` and `shrink-0` buttons to eliminate wrapping), and non-hideable core columns (`status`, `counterparty`, `remainingAmount`). It supports loading, empty, success, and retryable-error states.

## Integration seams

`getDebts` calls `API_ROUTES.debts`; `updateDebt` patches debt records (including `occurredAt`) via `API_ROUTES.debts`, and `createDebtPayment` posts new payments to `API_ROUTES.debtPayments`. Custom hooks `useDebtsQuery`, `useUpdateDebtMutation`, and `useCreateDebtPaymentMutation` manage server state and invalidate both `debts` and `dashboard` query keys on mutation success. `ReportsController` scopes records by access-token user ID and `FinanceService.listDebts` supplies active and settled debt entities mapped to `IDebtListItem`, ordered via chained `.orderBy('debt.occurred_at', 'DESC', 'NULLS LAST').addOrderBy('debt.created_at', 'DESC').addOrderBy('debt.id', 'DESC')`.

Each debt payment is atomic with its finance transaction: a `receivable` payment creates an `income` transaction in `Thu hồi nợ`, while a `payable` payment creates an `expense` transaction in `Trả nợ`. Both use the payment amount, currency, date, and linked contact, so dashboard balance stays consistent with debt settlement.

Additionally, existing finance transactions can be linked/allocated to one or more candidate debts via `debt_payment_allocations`. Each allocation records the allocated amount, links the transaction to the debt, and generates a corresponding `debt_payment` record referencing `finance_transaction_id`. Debt payments originating from an allocated transaction reference their parent transaction, allowing complete traceability between cashflow events and debt settlement.

### Debt Consolidation & Parent–Child Hierarchy

Multiple debts of the same direction (`receivable` or `payable`) can be merged into a parent debt hierarchy via `POST /api/debts/combine` (`API_ROUTES.debtsCombine`):

- **Parent Debt**: A new consolidated debt entity is created with `originalAmount = sum(children.originalAmount)` and `remainingAmount = sum(children.remainingAmount)`.
- **Child Debts**: The selected child debts link to the parent via `parentDebtId` (with `ON DELETE SET NULL`), preserving individual notes, dates, and historical payment records.
- **Validation & Crash Guards**:
  - *Direction Parity*: Mismatched directions throw validation errors; `CombineDebtsDialog` shows error banners and disables the submit button.
  - *Currency Parity*: Debts must share the same currency (e.g. all VND or all USD); differing currencies are strictly rejected.
  - *Hierarchy Flattening & Cycle Prevention*: If a debt being combined already has children, its existing sub-children are automatically re-parented to the new consolidated parent, enforcing a clean 1-tier tree and preventing infinite recursion or UI rendering crashes.
  - *Ownership & Cardinality*: Requires at least 2 distinct debt IDs owned by the authenticated caller.
- **Contact Combining**: When merging contacts (`POST /api/contacts/combine`), debts under source contacts can be automatically consolidated under the target contact grouped safely by direction and currency (`consolidateDebts: true`).
- **Web UI & Hierarchical Tree**: `DebtsTable` supports multi-select checkboxes for batch combining, an expandable nested tree view with smooth rotating Chevron dropdown buttons (`▶ / ▼` with `rotate-90`), indented child rows (`↳` with `pl-4`), subtle child row background differentiation (`bg-slate-50/70 dark:bg-slate-900/40`), parent badges (`[Gộp: N khoản con]`), and child badges (`[Khoản con]`). Total summary calculation preserves parent-only aggregation to eliminate double-counting.
