# Google Tasks Web Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/tasks/README.md)

## Purpose

`apps/web/src/modules/tasks` provides the web dashboard client API, TanStack Query integration, and full inline editing data table for Google Tasks.

## UI and Inline Editing

- **Table Columns**:
  - `status`: Interactive completion checkbox + status badge (`needsAction` vs `completed`).
  - `title`: Primary title with double-click inline text editing (`Enter` to save, `Escape` to cancel).
  - `notes`: Detailed task notes with double-click inline editing.
  - `dueAt`: Localized due date with inline date picker input.
  - `updatedAt`: Localized timestamp of last update.
  - `actions`: Inline Save/Cancel buttons when editing; Edit and Delete buttons in view mode.
- **Controls & Filters**:
  - Quick status filter tabs (`all`, `needsAction`, `completed`).
  - Instant client search by title and notes.
  - Toast notifications confirming saved edits and deletions.

## State and Integration Seams

- **API & Hooks**: `tasks-api.ts` (`getTasks`, `updateTask`, `deleteTask`) and `tasks-query.ts` (`useTasksQuery`, `useUpdateTaskMutation`, `useDeleteTaskMutation`).
- **Contracts**: Shared DTOs `ITaskListItem` and `IUpdateTaskRequest` from `@telebot/contracts`.
- **Cache Invalidation**: Mutations automatically invalidate `['tasks']` and `['dashboard']` TanStack query caches.
