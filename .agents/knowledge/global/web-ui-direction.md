# Web UI Direction

> Developer guide (Vietnamese): [`web-ui-direction.md`](../../docs/global/web-ui-direction.md)

The web app is an operational, data-dense personal dashboard. Prefer one flat workspace, subtle borders, compact controls, and semantic table markup over decorative cards or heavy shadows.

Shared UI primitives in `apps/web/src/shared/ui/` own reusable panel/table behavior. Tables keep semantic headers, right-align numeric data, provide loading, empty, and populated states, and may scroll horizontally on narrow screens. Views own domain columns, fetching, errors, and actions.

Interactive controls need visible keyboard focus, sufficient contrast, and clear error/retry affordances. Secondary actions should not dominate primary operational work.
