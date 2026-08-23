# Global System Knowledge

This directory contains system-wide business policies, cross-cutting architecture, and infrastructure standards.

## Global Topics

- [Monorepo Architecture](monorepo-architecture.md): npm workspaces, app boundaries, environment scoping, and build order.
- [Environment Guard](environment-guard.md): fail-fast configuration contract for API startup and dashboard builds.
- [Type Safety & Zero-Any Invariant](type-safety.md): System-wide zero-any policy and type safety requirements.
- [Route & Path Constants Architecture](route-constants.md): Centralized route and endpoint registry invariants and zero-hardcoding enforcement.
- [Local Voice Transcription](voice-transcription.md): Offline Whisper runtime, transcript review state, and Telegram integration.
- [Local-First AI Usage](local-first-ai-usage.md): Token-conserving local extraction and minimal AI interpretation policy.
- [Dashboard Session and Pages](dashboard-session.md): One-time Telegram exchange, access/refresh policy, contacts isolation, and web views.
- [Google Tasks Commands](google-tasks.md): Single and batch task creation, confirmation, and partial-failure behavior.
- [Telegram Response Layout](telegram-response-layout.md): Compact response hierarchy and mobile-safe inline action rows.
- [Telegram Command Intake](telegram-command-intake.md): Long-polling ownership and command-response fallback checks.
- [Receipt Image Analysis](receipt-image-analysis.md): In-memory image analysis and confirmation-gated finance proposals.
- [Web UI Direction](web-ui-direction.md): Shared data-dense dashboard and accessibility requirements.
- [Backend CRUD API](backend-crud-api.md): Ownership-safe REST operations for finance, reminders, users, invites, Calendar, and Tasks.

## Consumer Project Adoption

Base Agents is a reusable framework, not an application template. A consumer project owns its domain model, application modules, data contracts, and runtime verification.

Before using Base Agents in a consumer project:

1. Install the base and select only plugins that match the project's stack and needs.
2. Replace project-overview placeholders with the project's purpose, users, domain terms, integrations, and architecture boundaries.
3. Create matching English knowledge and Vietnamese developer guides for every project-owned feature module.
4. Follow route and authority boundaries: research for discovery, investigate for diagnosis, and implement for approved changes.
5. Run `npm run agent-system:validate`, `npm run agent-system:test`, and `npm run agent-system:typecheck` after Base Agents changes; run the consumer project's own checks for application changes.
