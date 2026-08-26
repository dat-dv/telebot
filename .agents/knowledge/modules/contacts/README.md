# Contacts Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/contacts/README.md)

## Purpose

`apps/web/src/modules/contacts` presents the current user's debt-contact directory and business partner/place directory so they can identify saved counterparties, edit details inline, and combine duplicate entries without exposing another user's data.

## UI and state

The contacts screen (`apps/web/src/modules/contacts/presentation/components/contacts-screen.tsx`, re-exported via `view/contacts-screen.tsx`) provides:

- **UI Styling & Links**: 100% Tailwind CSS utility classes with complete light and dark theme styling across all tables, badges, action buttons, dialog overlays, and toast notifications. External phone and address links open in new tabs with secure attributes (`target="_blank" rel="noopener noreferrer"`). The page header (title, subtitle, Refresh, Logout) is rendered by the common private layout `WorkspaceHeader` — `ContactsScreen` does not render its own header.
- **Inline Editing**: Double-clicking or clicking the Edit action activates inline Excel-like inputs for `displayName`, `alias`, and `descriptor` (place address / identifier). Supports `Enter` (Save), `Escape` (Cancel), and action buttons. Action columns configure `minWidth: 130px` with `flex-nowrap whitespace-nowrap` and `shrink-0` buttons to eliminate wrapping during inline edit and view modes.
- **Horizontal Scrolling**: Preserves fixed column min-widths (`select`, `displayName`, `alias`, `descriptor`, `createdAt`, `actions`), allowing smooth horizontal scrolling inside the panel on smaller viewports without text squishing.
- **Combine Contacts**: Multi-select checkboxes trigger a "Combine" action toolbar when 2+ contacts are checked. Opens a modal dialog (`apps/web/src/modules/contacts/presentation/components/combine-contacts-dialog.tsx`, re-exported via `view/combine-contacts-dialog.tsx`) allowing the user to select the primary target contact, preview/edit merged names, aliases, and addresses, and optionally auto-consolidate debts into single parent debts via `consolidateDebts: true` (automatically grouped by direction and currency to prevent merge errors), migrating all linked debts in a single backend transaction.
- **States & i18n**: Renders loading skeletons, empty states, error alerts with retry, and temporary toast notifications on successful save/combine. All labels, placeholders, and messages use the shared i18n catalog.

## Integration seams

- `getContacts` requests `API_ROUTES.contacts` via authenticated HTTP client.
- `updateContact` requests `PATCH /api/contacts/:id` to persist inline edits (`displayName`, `alias`, `descriptor`).
- `combineContacts` requests `POST /api/contacts/combine` (`API_ROUTES.contactsCombine`) with `{ targetContactId, sourceContactIds, displayName, alias, descriptor, consolidateDebts }` to merge source contacts into a target contact and reassign/consolidate associated debts safely.
- `useContactsQuery`, `useUpdateContactMutation`, and `useCombineContactsMutation` manage TanStack Query caching and invalidate `contacts`, `debts`, and `dashboard` query keys.
