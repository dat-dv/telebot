# Project Knowledge Base (Agent-Facing)

This directory is the canonical, agent-facing source of project knowledge. To optimize LLM token consumption (~30-40% savings) while preserving technical precision, ALL files under `.agents/knowledge/` are written strictly in **concise English**.

## Structure

```
.agents/knowledge/
├── README.md                              # Knowledge index and architectural mapping
├── project-overview.md                    # High-level project goals, business domain, and scope
├── global/                                # Project-wide business rules, global invariants, and architecture
│   └── README.md                          # System-wide business policies and global invariants
└── modules/                               # 📦 FEATURE MODULES (Exact Codebase Module Mirroring)
    ├── <module-name>/                     # Direct codebase module name (e.g. auth, checkout, billing)
    │   └── README.md                      # Module spec: Business Purpose & API rationale, Responsive UI/UX requirements, Business logic, Integration seams
```

## Guidelines

- **Token Optimization**: Write in **concise English** to save context window tokens when loaded into LLM prompts.
- **Exact Codebase Module Mirroring (`modules/<module-name>/`)**: Mirror exact module names from the codebase (`src/modules/auth/` -> `modules/auth/`). Do NOT invent alternate folder names.
- **Module Specification Requirements**: Each module document MUST specify:
  - **Business Purpose & API Rationale**: Why specific APIs exist and what business goals they achieve.
  - **UI/UX & Responsive Requirements**: Layout rules (desktop grid vs mobile stack), mandatory action buttons, dynamic interactive states.
  - **Business Logic & State Transitions**: Mandatory invariants, validation rules, state machines.
  - **Integration Seams**: Database schema, DTO contracts, hooks, and external events.
- **Keep Fresh**: Update canonical knowledge whenever intended business behavior, module UI requirements, or API contracts change.
