# Web UI Direction

> Developer guide (Vietnamese): [`web-ui-direction.md`](../../docs/global/web-ui-direction.md)

The web app is an operational, data-dense personal dashboard. Prefer one flat workspace, subtle borders, compact controls, and semantic table markup over decorative cards or heavy shadows.

Shared UI primitives in `apps/web/src/shared/ui/` own reusable panel/table behavior. Tables fill their containing data panel on desktop, keep semantic headers, right-align numeric data, provide loading, empty, and populated states, and support smooth horizontal scrolling within their own wrapper on narrow mobile screens (`min-width: max-content` with column-level `minWidth` definitions to prevent data squashing).

DataTable includes a built-in Column Visibility Settings popover (`TableColumnSettings`) allowing users to toggle column display, reset defaults, and persist their custom column preferences in `localStorage` (`telebot:table-columns:<id>`). Every row must provide a string `id`: DataTable prepends mandatory `STT` (the current displayed-row ordinal) and `ID` columns before domain columns. They cannot be hidden, and ID values use a compact monospace treatment. Tables with an `id` also expose header-edge drag resizing and persist valid column widths separately in `localStorage` (`telebot:table-widths:<id>`); consumers can opt out with `allowColumnResize={false}`. Views own domain columns, fetching, errors, and actions.

Interactive controls need visible keyboard focus, sufficient contrast, and clear error/retry affordances. Secondary actions should not dominate primary operational work.

The shared reports navigation is an admin-style sidebar on desktop: product mark, concise section label, icon-and-text links, and a semantic active state. It stays sticky beside the workspace and must retain visible text plus `aria-current` for the active route. On narrow screens (<= 960px), it transitions to a sticky mobile topbar with a brand mark and an accessible hamburger button that opens a smooth slide-out navigation drawer with backdrop overlay.
