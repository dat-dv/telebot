---
owner: web
status: active
---

# Presentation Boundaries

Feature route adapters remain in `modules/<feature>/view` for consumer compatibility. UI implementations live in `modules/<feature>/presentation/components`. Feature panels, tables, editors, and dialogs are owned by their feature; only domain-agnostic primitives belong to `shared/ui`. Public component exports, query contracts, route URLs, table IDs, and persisted browser keys remain stable during moves.
