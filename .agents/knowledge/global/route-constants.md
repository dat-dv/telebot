---
metadata:
  agent-artifact:
    id: global-route-constants-knowledge
    type: documentation
    depends_on:
      - .agents/knowledge/global/README.md
      - .agents/knowledge/README.md
---

# Global Route & Path Constants Architecture

## Purpose
Enforces centralized route and endpoint management, eliminating hardcoded string literals across all tiers (Presentation, Application, Infrastructure, Shared Contracts). Guarantees single source of truth, prevents dead links and contract drift, and maximizes type-safety.

## Invariants & Strict Rules

1. **Zero Hardcoded Route & Endpoint Literals**:
   - String literals for navigation paths (`'/login'`, `'/dashboard'`) and API endpoints (`'/api/v1/users'`) are strictly prohibited in application code and agent examples.
2. **Centralized Registries**:
   - **`APP_ROUTES`**: Manages all frontend navigation paths, page routes, modal routes, and redirects in `src/shared/constants/routes.ts` or `@shared/contracts`.
   - **`API_ROUTES` / `API_ENDPOINTS`**: Manages all backend API endpoints and proxy targets in `src/shared/constants/api-routes.ts` or `@shared/contracts`.
   - **`PROXY_ROUTES`**: Manages BFF proxy gateway routes (`BASE: '/api/proxy'`).
3. **Dynamic Segment Builders**:
   - Parameterized routes MUST be defined as typed pure functions: `DETAIL: (id: string | number) => `/users/${id}``.
4. **Cross-Tier Consumers**:
   - **UI Links**: `<Link href={APP_ROUTES.USERS.DETAIL(user.id)} />`.
   - **Router Hooks**: `router.push(APP_ROUTES.AUTH.LOGIN)`, `router.replace(APP_ROUTES.DASHBOARD.HOME)`.
   - **Server Redirects**: `redirect(APP_ROUTES.AUTH.LOGIN)`.
   - **Next.js Revalidation**: `revalidatePath(APP_ROUTES.DASHBOARD.USERS)`.
   - **HTTP Repositories**: `proxyHttpClient.get(API_ROUTES.USERS.LIST)`.
   - **Middleware & Guards**: Array of `APP_ROUTES` constants instead of inline string arrays.
