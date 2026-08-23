---
metadata:
  agent-artifact:
    id: ui-design-direction-knowledge
    type: documentation
    depends_on:
      - .agents/knowledge/modules/README.md
      - .agents/plugins/enterprise-ui/skills/SKILL.md
---

# UI/UX Design Direction: Flat Enterprise & Data-Dense B2B SaaS

> Developer Guide (Vietnamese): [`design-direction.md`](../../../docs/modules/ui/design-direction.md)

## 1. Architectural Role & Master Constraint

The `enterprise-ui` plugin operates under a mandatory **Project Design Profile** constraint:
- **Core Paradigm**: Flat Enterprise + Data-Dense B2B SaaS + Excel-lite interaction.
- **Application Scope**: Operational workspaces, dashboards, admin tools, data tables, telemetry monitors, logs, and configuration views.
- **Orchestration Constraint**: Upstream skills (`frontend-design-principles`, `ui-design`, `ui-audit`, `web-design-guidelines`) must be filtered through this profile. Marketing, landing page, creative, and bento grid branches are strictly rejected.

---

## 2. Core Priorities & Anti-Patterns

### Mandatory Priorities
- **Data First & Dense**: Information density prioritized for rapid multi-record scanning and operation.
- **Flat Single Canvas**: Seamless workspace structure (`Page -> Header -> Toolbar -> Main Data Surface -> Footer`) without unnecessary nested container cards.
- **1px Subtle Borders over Shadows**: 1px subtle borders (`border-border`) over heavy drop shadows or glassmorphism blur. `shadow-sm` reserved strictly for popovers/dropdowns.
- **Small Radius**: `rounded-md` or `rounded-sm` for data controls and table rows. Large radii (`rounded-2xl`, `rounded-3xl`) are forbidden.
- **Excel-lite Table Interaction**:
  - Header: 36–40px, light neutral background, subtle border, small uppercase text, zero emojis.
  - Rows: 40–48px compact rows with subtle dividers and light hover state.
  - Editable Cells: Idle state must render transparent (looks like plain text); hover reveals subtle border; focus displays distinct ring.
- **Actions Noise Reduction**: More actions consolidated into `...` dropdown menus to minimize per-row visual clutter.
- **Status Representation**: Neutral base (`slate`/`zinc`) with semantic colors (Green = nominal, Amber = warning, Red = error, Blue = active/selected). Uses text hierarchy + status dot (`●`) instead of badge-pill spam.

---

## 3. Four-State Coverage & a11y Standards

| UI State | Behavioral & Visual Requirements |
| :--- | :--- |
| **Loading** | Dense skeleton loader matching exact row/container dimensions without CLS (`aria-busy="true"`). |
| **Error** | Compact alert box with clear explanation, error code, and Retry CTA (`role="alert"`). |
| **Empty** | Minimal explanation with targeted Call-to-Action, omitting oversized decorative cartoons. |
| **Success / Nominal** | Full data rendering with active status indicators and clear data alignment. |

### Accessibility (a11y) Conformance
- **WCAG 2.1 Contrast**: Minimum 4.5:1 for standard body text, 3.0:1 for large text and interactive borders across both Light and Dark modes.
- **Focus Indicators**: Explicit focus rings (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`) across all interactive elements.
- **Touch & Click Targets**: Minimum 44px for primary controls; compact 32px toolbars supported with precise hit areas.

## Telebot Dashboard Table Contract

`apps/web/src/components/data-table.tsx` owns the reusable `DataPanel` and `DataTable` primitives for dashboard collections. Each collection supplies semantic column labels and cell renderers; data fetching and domain formatting remain in its view.

- Table headers are neutral, 38px high, text-only, and use semantic `th`/`td` markup.
- Standard rows are 44px high, horizontally divided, and lightly highlighted on hover. Numeric values are right-aligned.
- On narrow screens the table keeps its columns and scrolls horizontally; it does not become a card list.
- The primitive covers loading skeleton, empty and successful data states. The dashboard-level query error remains a compact `role="alert"` with retry action.

## Telebot Page Shell

The web dashboard uses a compact navigation shell for Home, Statistics, and Contacts. Desktop keeps a narrow left navigation rail; mobile moves it above content as a horizontally scrollable control. Pages share a dashboard query and retain the same data-dense table treatment.
