# Finance Module

## Purpose

`apps/api/src/finance` owns user-scoped income, expense, debt, contact, category, and place records. A finance place is a merchant, store, venue, or other transaction location; it is distinct from debt contacts.

## Business rules and APIs

- `finance_places` is unique per `(user_id, normalized_name)`. Names are normalized case- and accent-insensitively before reuse.
- `finance_transactions.place_id` is optional and references a place with `ON DELETE SET NULL`; deleting a place never deletes financial history.
- `POST/PATCH /api/transactions` accepts `placeId` or `placeName`. The service verifies `placeId` belongs to the caller; a supplied name resolves or creates a caller-owned place. `placeId: null` removes the link.
- `GET/POST/PATCH/DELETE /api/places` are caller-scoped CRUD endpoints. A different user cannot read, select, edit, or delete another user's place.
- `GET /api/finance/analytics` provides caller-scoped aggregated reporting across configurable date ranges (`startAt`, `endAt`) and time grains (`day`, `week`, `month`, `quarter`, `year`, `all`). It returns financial summary (totals, net balance, net savings rate), temporal trend buckets, category spending distribution with percentages, and active debt ratios with top counterparties.
- Debt contacts remain exclusively for people/counterparties and debt payment links.

## Integration seams

The dashboard payload exposes `placeId` and `placeName` on transactions. Gemini finance tools pass `placeName` to the same service flow. Shared contracts define `IFinancePlace`, `API_ROUTES.places`, `API_ROUTES.financeAnalytics`, `IFinanceAnalyticsResponse`, `IAnalyticsTrendBucket`, `IAnalyticsCategoryBreakdown`, `IAnalyticsDebtBreakdown`, and transaction request/response fields.

## UX requirements

The Transactions table shows a Place column. Inline editing uses a searchable, keyboard-accessible combobox populated from the caller's saved places while allowing a new name. Clearing the field sends `placeId: null`. Search includes place names; the table remains horizontally scrollable on narrow screens. The Analytics screen leverages `GET /api/finance/analytics` with `PeriodFilterToolbar` to render responsive Native SVG charts (Cashflow trend line/bar, Category Donut, and Debt Structure) in both light and dark themes.

