# Calendar Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/calendar/README.md)

## Purpose

`apps/web/src/modules/calendar` handles calendar event queries, updates, and deletions for the authenticated user.

## UI and state

The module provides calendar event listing and management with support for updating and deleting events. It surfaces event summaries, start/end times, locations, and descriptions. Data fetching uses TanStack Query via `useCalendarEventsQuery`.

## Integration seams

`getCalendarEvents`, `updateCalendarEvent`, and `deleteCalendarEvent` call `API_ROUTES.calendarEvents` (`/api/calendar-events`). `useUpdateCalendarEventMutation` and `useDeleteCalendarEventMutation` handle mutations and invalidate both `calendarEvents` and `dashboard` query keys on success.
