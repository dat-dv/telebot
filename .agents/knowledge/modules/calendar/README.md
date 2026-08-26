# Calendar Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/calendar/README.md)

## Purpose

`apps/web/src/modules/calendar` provides a rich calendar interface supporting interactive 7-column Month Grid View and tabular List View for managing Google Calendar events of authenticated users in realtime.

## UI and state

- **UI Styling**: Fully styled with 100% Tailwind CSS utility classes supporting dark mode (`dark:`) and compact responsive layouts across desktop and mobile screens.
- **Dual View Modes**: Switchable between Month Grid View (`calendar.view.grid`) and tabular Data Table View (`calendar.view.table`). In List View, the Description column defaults to a compact multi-line width and each column can be resized from its header; widths persist locally per table.
- **Month Grid (`CalendarGrid`)**: Located under `apps/web/src/modules/calendar/presentation/components/calendar-grid.tsx` (re-exported via `view/calendar-grid.tsx`). Features 7-day grid (Mon–Sun) with leading/trailing padding days, today highlight, selected date focus, event chips with start time/summary, "+N more" badge, and an interactive selected day event details/inline-editing panel.
- **Month Navigation**: Prev Month, Next Month, and Today navigation buttons with localized month/year formatting.
- **State Management**: TanStack Query caches events by the visible grid `timeMin`/`timeMax`; local month navigation changes that range and fetches the matching Google Calendar interval. A successful empty Calendar response remains empty and never falls back to Dashboard's upcoming-events summary.
- **Multi-day Events**: Events are indexed into every covered local date. Google all-day end dates and timed events ending exactly at midnight are treated as exclusive boundaries.

## Integration seams

- Backend: `GoogleResourcesController` (`GET/POST/PATCH/DELETE /calendar/events`) interfaces with `GoogleCalendarService` and maps Google Calendar items into normalized `ICalendarEventItem` DTOs.
- Web Client: `getCalendarEvents` sends a bounded `ICalendarEventsQuery` (`timeMin`, `timeMax`) to `API_ROUTES.calendarEvents`; updates/deletes invalidate all Calendar range caches and the Dashboard summary cache.
