# Feature Modules & Bounded Contexts

This directory contains specifications and domain knowledge organized by feature module / Bounded Context boundaries.

## Module Structure

Each subfolder under `modules/` represents a single feature module (e.g. `auth`, `homepage`, `platform-accounts`).

Each module document covers:
1. **Business Purpose & API Rationale**: Why specific APIs exist and what business problems they solve.
2. **Product & UI/UX Requirements**: Screen layout, responsive behavior (e.g. mobile drawer vs desktop buttons, required action triggers).
3. **Data Flow & Technical Seams**: Local state, DTO payload contracts, and integration points.

## Modules Index
- [UI & Enterprise Design System](ui/design-direction.md): Flat Enterprise, data-dense B2B SaaS, and Excel-lite interaction standards.
