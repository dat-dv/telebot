---
metadata:
  agent-artifact:
    id: global-type-safety-knowledge
    type: documentation
    depends_on:
      - .agents/knowledge/global/README.md
      - .agents/knowledge/README.md
---

# Global Type Safety & Zero-Any Invariant

## Purpose
Enforces absolute type safety and zero-tolerance for `any` across all TypeScript modules and tool chains. Prevents runtime exceptions, implicit type decay, and unvetted type bypasses.

## Invariants & Strict Rules

1. **Zero-Any Prohibition**:
   - `any`, `as any`, `<any>`, `any[]`, `Record<string, any>`, `Array<any>`, `Promise<any>` are strictly prohibited.
2. **No Type Check Bypasses**:
   - `// @ts-ignore`, `// @ts-nocheck`, and `eslint-disable ... no-explicit-any` are forbidden.
3. **Safe Replacements**:
   - **Unknown Inputs**: Use `unknown` + runtime validator (e.g., Zod `.safeParse()`) or explicit type predicate (`(x: unknown): x is T`).
   - **Generics**: Use parameterized types `<T>` or bounded generics `<T extends Record<string, unknown>>`.
   - **Dynamic Objects**: Use `Record<string, unknown>` instead of unconstrained objects.
   - **Error Handling**: Use `catch (error: unknown)` with type narrowing (`error instanceof Error ? error.message : String(error)`).
4. **Automated Enforcement**:
   - Blocked dynamically at Tool Call level by `type-safety-guard` hook.
   - Verified statically by system validator and pre-commit hooks.
