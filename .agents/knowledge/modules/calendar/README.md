# Calendar Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/calendar/README.md)

## Purpose

`apps/web/src/modules/calendar` provides a rich calendar interface supporting interactive 7-column Month Grid View and tabular List View for managing Google Calendar events of authenticated users in realtime.

## UI and state

- **Dual View Modes**: Switchable between Month Grid View (`calendar.view.grid`) and tabular Data Table View (`calendar.view.table`).
- **Month Grid (`CalendarGrid`)**: 7-day grid (Mon–Sun) with leading/trailing padding days, today highlight, selected date focus, event chips with start time/summary, "+N more" badge, and an interactive selected day event details/inline-editing panel.
- **Month Navigation**: Prev Month, Next Month, and Today navigation buttons with localized month/year formatting.
- **State Management**: TanStack Query via `useCalendarEventsQuery`, local month/selected date state, and search filtering.

## Integration seams

- Backend: `GoogleResourcesController` (`GET/POST/PATCH/DELETE /calendar/events`) interfaces with `GoogleCalendarService` and maps Google Calendar items into normalized `ICalendarEventItem` DTOs.
- Web Client: `getCalendarEvents`, `updateCalendarEvent`, and `deleteCalendarEvent` communicate with `API_ROUTES.calendarEvents`. `useUpdateCalendarEventMutation` and `useDeleteCalendarEventMutation` perform mutations and invalidate both `calendarEvents` and `dashboard` query caches.

