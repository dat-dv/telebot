# Web UI Direction

> Developer guide (Vietnamese): [`web-ui-direction.md`](../../docs/global/web-ui-direction.md)

The web app is an operational, data-dense personal dashboard. Prefer one flat workspace, subtle borders, compact controls, and semantic table markup over decorative cards or heavy shadows.

Shared UI primitives in `apps/web/src/shared/ui/` own reusable panel/table behavior. Tables fill their containing data panel on desktop, keep semantic headers, right-align numeric data, provide loading, empty, and populated states, and may scroll horizontally within their own wrapper on narrow screens. Views own domain columns, fetching, errors, and actions.

Interactive controls need visible keyboard focus, sufficient contrast, and clear error/retry affordances. Secondary actions should not dominate primary operational work.

The shared reports navigation is an admin-style sidebar on desktop: product mark, concise section label, icon-and-text links, and a semantic active state. It stays sticky beside the workspace and must retain visible text plus `aria-current` for the active route. On narrow screens it becomes a horizontally scrollable navigation row; do not collapse it into an icon-only or multi-level menu.
