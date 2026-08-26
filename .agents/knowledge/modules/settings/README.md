# Settings Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/settings/README.md)

## Purpose

`apps/web/src/modules/settings` provides user management for income and expense transaction categories and workspace preferences.

## UI and state

`SettingsScreen` is built with 100% Tailwind CSS utility classes and provides tab navigation between `categories` and `preferences`. The `categories` view presents two distinct `DataPanel` widgets for expense and income categories. Each panel includes live search filtering, inline item addition (`addExpense` / `addIncome`), inline name editing on double-click or edit action, and deletion with confirmation. State is managed via TanStack Query hooks (`useCategoriesQuery`, `useCreateCategoryMutation`, `useUpdateCategoryMutation`, `useDeleteCategoryMutation`) under the `categories` query key namespace.

## Integration seams

`getCategories`, `createCategory`, `updateCategory`, and `deleteCategory` interact with `API_ROUTES.categories` using authenticated access tokens. Mutations invalidate `categoriesQueryKeys.all` on success.
