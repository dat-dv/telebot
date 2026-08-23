# Contacts Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/contacts/README.md)

## Purpose

`apps/web/src/modules/contacts` presents the current user's debt-contact directory so they can identify saved counterparties without exposing another user's data.

## UI and state

The contacts screen provides refresh and logout actions. It renders loading, empty, successful, and recoverable error states; its table uses the full available desktop width after navigation and remains horizontally scrollable on narrow screens.

## Integration seams

`getContacts` requests `API_ROUTES.contacts` through the shared authenticated HTTP client. `useContactsQuery` owns the TanStack Query key and request cancellation; views invalidate that key after a manual refresh.
