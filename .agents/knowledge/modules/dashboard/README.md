# Dashboard Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/dashboard/README.md)

## Purpose

`apps/web/src/modules/dashboard` renders the authenticated personal overview and statistics pages from one dashboard payload. It combines finance, active debts, tasks, reminders, calendar, audit activity, and optional admin metrics for fast scanning.

## UI and state

The module has loading skeleton, error with retry, empty tables, and populated states. Home surfaces attention items and quick links; statistics surfaces financial totals and dense operational tables. Financial values use semantic tones only for positive, warning, and negative meaning. Google connection state remains available to determine Calendar and Tasks empty messages, but it is not rendered as a persistent navigation or header status label. Navigation remains an icon-and-text desktop sidebar and a horizontally scrollable mobile row.

## Integration seams

`getDashboard` consumes `API_ROUTES.dashboard` through the shared HTTP client. API route constants include `/api`; `NEXT_PUBLIC_API_URL` is therefore the public origin without `/api` (for example `https://telebot.datintech.site`). In production Nginx routes `/api/*` to NestJS and serves the static dashboard for all other paths. The `/help` and `/start` dashboard control is a Telegram callback that issues a new one-time URL only after the user taps it. `useDashboardQuery` defines the cache key and supports manual invalidation. Logout calls the shared dashboard logout route, clears authentication state, clears query cache, and returns to the report entry page.
