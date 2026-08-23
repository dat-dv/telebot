# Dashboard Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/dashboard/README.md)

## Purpose

`apps/web/src/modules/dashboard` renders the authenticated personal overview and statistics pages from one dashboard payload. It combines finance, active debts, tasks, reminders, calendar, audit activity, and optional admin metrics for fast scanning.

## UI and state

The module has loading skeleton, error with retry, and populated states. Home surfaces attention items and quick links; statistics surfaces financial totals and dense operational tables. Navigation keeps Home, Statistics, and Contacts accessible on desktop and narrow layouts.

## Integration seams

`getDashboard` consumes `API_ROUTES.dashboard` through the shared HTTP client. `useDashboardQuery` defines the cache key and supports manual invalidation. Logout calls the shared dashboard logout route, clears authentication state, clears query cache, and returns to the report entry page.
