# Finance Module

## Purpose

`apps/api/src/finance` owns user-scoped income, expense, debt, contact, category, and place records. A finance place is a merchant, store, venue, or other transaction location; it is distinct from debt contacts.

## Business rules and APIs

- `finance_places` is unique per `(user_id, normalized_name)`. Names are normalized case- and accent-insensitively before reuse.
- `finance_transactions.place_id` is optional and references a place with `ON DELETE SET NULL`; deleting a place never deletes financial history.
- `POST/PATCH /api/transactions` accepts `placeId` or `placeName`. The service verifies `placeId` belongs to the caller; a supplied name resolves or creates a caller-owned place. `placeId: null` removes the link.
- `GET/POST/PATCH/DELETE /api/places` are caller-scoped CRUD endpoints. A different user cannot read, select, edit, or delete another user's place.
- `GET /api/finance/analytics` provides caller-scoped aggregated reporting across configurable date ranges (`startAt`, `endAt`) and time grains (`day`, `week`, `month`, `quarter`, `year`, `all`). It returns financial summary (totals, net balance, net savings rate), temporal trend buckets, category spending distribution with percentages, and active debt ratios with top counterparties.
- **Debt Transaction Allocation**:
  * `GET /api/transactions/:id/candidate-debts`: Retrieves open candidate debts matching transaction direction (`income` -> `receivable`, `expense` -> `payable`) and calculates current allocated amount.
  * `GET /api/transactions/:id/allocations`: Lists existing allocations linked to a transaction.
  * `POST /api/transactions/:id/allocations`: Atomically validates and assigns transaction funds across one or more candidate debts (`debt_payment_allocations`), generating corresponding `debt_payments` with `finance_transaction_id` and updating debt `remainingAmount` and `status` (`active` vs `settled`). Enforces non-negative amounts, directional parity, and prevents over-allocation beyond transaction amount or debt remaining balance.
  * `DELETE /api/transactions/:id/allocations/:allocationId`: Removes an allocation and restores debt remaining balance and status atomically.
- Debt contacts remain exclusively for people/counterparties and debt payment links.

## Integration seams

The dashboard payload exposes `placeId`, `placeName`, and `allocations` on transactions. Gemini assistant leverages `resolve_finance_place` to query existing user places prior to transaction mutations to avoid duplicate creation. When a place does not exist, `createNewPlace: true` along with `placeName` triggers explicit multi-action confirmation and displays structured JSON payloads for both place creation and transaction update/record. Independent place management uses `create_finance_place`. For debt allocations, Gemini calls `list_candidate_debts` to inspect matching debts and `allocate_transaction_to_debts` (with mandatory Telegram confirmation card) to commit allocations. Shared contracts define `IFinancePlace`, `IDebtAllocationItem`, `ICandidateDebtItem`, `IAllocateTransactionRequest`, `IAllocateTransactionResponse`, `API_ROUTES.places`, `API_ROUTES.financeAnalytics`, `API_ROUTES.transactionAllocations`, `API_ROUTES.transactionCandidateDebts`, and transaction request/response fields.

## UX requirements

The Transactions table shows Place and compact Action columns (with Edit and Delete buttons, width 130px). For transactions with existing debt allocations, a compact clickable allocation badge (`🔗 <N> allocations`) is displayed in the Note cell to quickly view or modify allocations. When in inline edit mode, an allocation shortcut button (`🔗`) is accessible. When clicked, `DebtAllocationModal` opens displaying the source transaction details, real-time unallocated balance calculation, candidate debts list with individual amount inputs, and quick "Phân bổ tối đa" helpers. Backend and frontend enforce strict validation against reducing transaction amounts below total allocated sums or changing transaction types while active allocations exist. Inline editing uses a searchable, keyboard-accessible combobox populated from the caller's saved places while allowing a new name. Clearing the field sends `placeId: null`. Search includes place names; the table remains horizontally scrollable on narrow screens. The Analytics screen leverages `GET /api/finance/analytics` with `PeriodFilterToolbar` to render responsive Native SVG charts (Cashflow trend line/bar, Category Donut, and Debt Structure) in both light and dark themes. Telegram confirmation dialogs transparently display multi-action JSON blocks whenever a new place or allocation is created alongside a transaction.

