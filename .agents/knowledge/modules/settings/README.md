# Settings Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/settings/README.md)

## Purpose

`apps/web/src/modules/settings` provides user management for income and expense transaction categories and workspace preferences.

## UI and state

`SettingsScreen` (`apps/web/src/modules/settings/presentation/components/settings-screen.tsx`, re-exported via `view/settings-screen.tsx`) is built with 100% Tailwind CSS utility classes and provides tab navigation between `categories` and `preferences`. The page header (title, subtitle, Refresh, Logout) is rendered by the common private layout `WorkspaceHeader` — `SettingsScreen` does not render its own header. The `categories` view presents two distinct `DataPanel` widgets for expense and income categories. Each panel includes live search filtering, inline item addition (`addExpense` / `addIncome`), inline name editing on double-click or edit action, action buttons configured with `flex-nowrap whitespace-nowrap` and `shrink-0` to prevent wrapping, and deletion with confirmation. State is managed via TanStack Query hooks (`useCategoriesQuery`, `useCreateCategoryMutation`, `useUpdateCategoryMutation`, `useDeleteCategoryMutation`) under the `categories` query key namespace.

## Integration seams

`getCategories`, `createCategory`, `updateCategory`, and `deleteCategory` interact with `API_ROUTES.categories` using authenticated access tokens. Mutations invalidate `categoriesQueryKeys.all` on success.
