# Global System Knowledge

This directory contains system-wide business policies, cross-cutting architecture, and infrastructure standards.

## Global Topics

- [Monorepo Architecture](monorepo-architecture.md): npm workspaces, app boundaries, environment scoping, and build order.
- [Type Safety & Zero-Any Invariant](type-safety.md): System-wide zero-any policy and type safety requirements.
- [Route & Path Constants Architecture](route-constants.md): Centralized route and endpoint registry invariants and zero-hardcoding enforcement.
- [Local Voice Transcription](voice-transcription.md): Offline Whisper runtime, transcript review state, and Telegram integration.
- [Dashboard Session and Pages](dashboard-session.md): One-time Telegram exchange, access/refresh policy, contacts isolation, and web views.
- [Google Tasks Commands](google-tasks.md): Single and batch task creation, confirmation, and partial-failure behavior.
- [Web UI Direction](web-ui-direction.md): Shared data-dense dashboard and accessibility requirements.

## Consumer Project Adoption

Base Agents is a reusable framework, not an application template. A consumer project owns its domain model, application modules, data contracts, and runtime verification.

Before using Base Agents in a consumer project:

1. Install the base and select only plugins that match the project's stack and needs.
2. Replace project-overview placeholders with the project's purpose, users, domain terms, integrations, and architecture boundaries.
3. Create matching English knowledge and Vietnamese developer guides for every project-owned feature module.
4. Follow route and authority boundaries: research for discovery, investigate for diagnosis, and implement for approved changes.
5. Run `npm run agent-system:validate`, `npm run agent-system:test`, and `npm run agent-system:typecheck` after Base Agents changes; run the consumer project's own checks for application changes.
