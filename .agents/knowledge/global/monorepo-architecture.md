# Monorepo Architecture

## Layout

- `apps/api`: NestJS Telegram and OAuth backend. It owns all private environment variables and the SQLite runtime.
- `apps/web`: Next.js App Router static export. It may consume only `NEXT_PUBLIC_*` environment variables and contains no server runtime.
- `packages/contracts`: framework-neutral routes and API TypeScript contracts.
- Root `data/`: persistent SQLite storage, shared by local API and its Docker container.

## Runtime Rules

- npm workspaces are the only package boundary. Build contracts before applications.
- API resolves `.env.local`, `.env`, credential files, and `data/` from the monorepo root, regardless of whether it runs from `apps/api` or a root Docker working directory.
- Never expose Telegram, Gemini, Google, encryption, or database secrets to the web package.
- The web app owns static UI routes while Nest remains the only API, OAuth, token, database, and Telegram runtime. The static dashboard calls Nest directly through `NEXT_PUBLIC_API_URL`.
- `TELEGRAM_LONG_POLLING_ENABLED` defaults to `true`. Exactly one runtime may enable long polling for a given bot token; API-only runtimes set it to `false` and retain outbound Telegram API access.
- Contract changes belong in `@telebot/contracts` before an API or web consumer is added.

## Telegram Dashboard

- The bot creates a five-minute browser entry URL from a user-specific HMAC signature and expiry.
- `GET /api/access` validates the Telegram exchange token, writes the refresh cookie, then redirects to `/reports`.
- The React dashboard requests `GET /api/dashboard` with its short-lived Bearer token. The API derives the user exclusively from that signed token; it never accepts a frontend `userId`.
- `SERVICE_URL_TELEBOT` is the canonical same-origin URL and CORS fallback. Set `WEB_ORIGIN` only when the static dashboard is deployed on a different origin.
- Dashboard access and refresh tokens are signed with the two private dashboard token secrets. During local tunnel development, Vite proxies dashboard API routes to the exposed API Docker port at `localhost:3000`.
- The frontend stores only the 15-minute dashboard access token. A rotated seven-day refresh token remains in an `HttpOnly` cookie and Axios uses it after a 401.
- The browser routes `/reports`, `/reports/statistics`, and `/reports/contacts` are exported as static files. UI ownership is split into `modules/auth`, `modules/dashboard`, `modules/contacts`, and reusable `shared/api` and `shared/ui` components.

## Commands

- `npm run dev` runs both API and Web concurrently. `npm run dev:api` and `npm run dev:web` run them individually; the Next dev server uses port 5173.
- `npm run build` is the root build entrypoint.
- `npm run lint` and `npm run format:check` are non-mutating quality checks. Use `npm run lint:fix` and `npm run format` only when edits are intended.
- API and static web images use `apps/api/Dockerfile` and `apps/web/Dockerfile` with the root as Docker build context.
