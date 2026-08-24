# Dashboard Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/dashboard/README.md)

## Purpose

`apps/web/src/modules/dashboard` renders the authenticated personal overview and statistics pages from one dashboard payload. It combines finance, active debts, tasks, reminders, calendar, audit activity, and optional admin metrics for fast scanning.

## UI and state

The module has loading skeleton, error with retry, empty tables, and populated states. Home surfaces attention items, quick links, and responsive grid tables; statistics surfaces financial totals and dense operational tables. Financial values use tabular numbers (`tabular-nums`) and semantic tones for positive, warning, and negative meaning. Google connection state remains available to determine Calendar and Tasks empty messages, but it is not rendered as a persistent navigation or header status label. Navigation is an enterprise docked sidebar on desktop (sharp 2px-4px radius, compact 30px-34px row height, sticky table headers, search & filter toolbars on all data panels, and fluid 100% fullscreen layout) and smoothly transitions on mobile viewports (<= 960px) to a sticky Mobile Header with an accessible Hamburger toggle button that summons a slide-out Navigation Drawer with backdrop overlay. Its footer has an accessible light/dark toggle and multi-language selector (Vietnamese/English); the selected theme is stored locally in the browser and the first visit follows the system preference.


## Integration seams

`getDashboard` consumes `API_ROUTES.dashboard` through the shared HTTP client. API route constants include `/api`; `NEXT_PUBLIC_API_URL` is therefore the public origin without `/api` (for example `https://telebot.datintech.site`). In local development, Next rewrites `/api/*` on port 5173 to this origin (default `http://localhost:3000`); in production Nginx routes `/api/*` to NestJS and serves the static dashboard for all other paths. The access exchange endpoint redirects valid one-time links to root `/` with `#dashboard_token=...` and returns a readable HTTP 401 page for missing, expired, or consumed links. The `/help` and `/start` dashboard control is a Telegram callback that issues a new one-time URL only after the user taps it. `useDashboardQuery` defines the cache key and supports manual invalidation. Logout calls the shared dashboard logout route, clears authentication state, clears query cache, and returns to the home page.
