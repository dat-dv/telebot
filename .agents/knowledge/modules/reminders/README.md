# Reminders Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/reminders/README.md)

## Purpose

`apps/web/src/modules/reminders` manages scheduled user reminders, status updates, and reminder deletions.

## UI and state

The module is built with 100% Tailwind CSS utility classes and renders scheduled reminders with title, trigger time, status, notify type badges, and target metadata. Data fetching and mutations are managed via TanStack Query custom hooks (`useRemindersQuery`, `useUpdateReminderMutation`, `useDeleteReminderMutation`).

## Integration seams

`getReminders`, `updateReminder`, and `deleteReminder` call `API_ROUTES.reminders` (`/api/reminders`). On mutation success, `reminders` and `dashboard` query caches are automatically invalidated.
