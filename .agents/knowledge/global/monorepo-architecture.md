# Monorepo Architecture

## Layout

- `apps/api`: NestJS Telegram and OAuth backend. It owns all private environment variables and the PostgreSQL runtime.
- `apps/web`: Next.js App Router static export. It may consume only `NEXT_PUBLIC_*` environment variables and contains no server runtime.
- `packages/contracts`: framework-neutral routes and API TypeScript contracts.
- PostgreSQL: the persistent system of record for the API, provisioned by Compose in container deployments.

## Runtime Rules

- npm workspaces are the only package boundary. Build contracts before applications.
- API resolves `.env.local`, `.env`, and `data/` from the monorepo root, regardless of whether it runs from `apps/api` or a root Docker working directory.
- Never expose Telegram, Gemini, Google, encryption, or database secrets to the web package.
- The web app owns static UI routes while Nest remains the only API, OAuth, token, database, and Telegram runtime. The static dashboard calls Nest directly through `NEXT_PUBLIC_API_URL`.
- `TELEGRAM_LONG_POLLING_ENABLED` is required. Exactly one runtime may enable long polling for a given bot token; API-only runtimes set it to `false` and retain outbound Telegram API access.
- Contract changes belong in `@telebot/contracts` before an API or web consumer is added.

## Telegram Dashboard

- The bot creates a five-minute browser entry URL from a user-specific HMAC signature and expiry.
- `GET /api/access` validates the Telegram exchange token, writes the refresh cookie, then redirects to `/` with `#dashboard_token=...`.
- The React dashboard requests `GET /api/dashboard` with its short-lived Bearer token. The API derives the user exclusively from that signed token; it never accepts a frontend `userId`.
- `APP_URL`, `WEB_ORIGIN`, and `NEXT_PUBLIC_API_URL` are required explicit URLs. `NEXT_PUBLIC_API_URL` is the public origin without `/api`, because contract route constants already include that prefix. Avoid `SERVICE_URL_*`: Coolify reserves that prefix for managed URLs. In single-origin deployments, Web Nginx proxies `/api/*` (including Swagger docs at `/api/docs` and OAuth callback at `/api/oauth2callback`) directly to the backend API container (`http://api:3000`) while serving static web files for other paths.
- `CORS_ALLOW_ALL` is required and must be explicitly set to `true` or `false`. Setting it to `true` reflects every request origin and permits credentials for temporary cross-origin local testing; it must be treated as an explicit security exception.
- Dashboard access and refresh tokens are signed with the two private dashboard token secrets. During local tunnel development, Vite proxies dashboard API routes to the exposed API Docker port at `localhost:3000`.
- The frontend stores only the 15-minute dashboard access token. A rotated seven-day refresh token remains in an `HttpOnly` cookie and Axios uses it after a 401.
- The browser routes `/`, `/transactions`, `/debts`, `/analytics`, `/calendar`, `/tasks`, `/reminders`, and `/contacts` are exported as static files inside route group `app/(private)/`. UI ownership is split into `modules/auth`, `modules/dashboard`, `modules/debts`, `modules/contacts`, and reusable `shared/api` and `shared/ui` components.

## Commands and Docker Build

- `npm run dev` runs both API and Web concurrently. `npm run dev:api` and `npm run dev:web` run them individually; the Next dev server uses port 5173.
- `npm run build` is the root build entrypoint.
- `npm run lint` and `npm run format:check` are non-mutating quality checks. Use `npm run lint:fix` and `npm run format` only when edits are intended.
- API and static web images use `apps/api/Dockerfile` and `apps/web/Dockerfile` with monorepo root as Docker build context.
- Docker builds utilize BuildKit (`# syntax=docker/dockerfile:1`) with `--mount=type=cache,target=/root/.npm` to eliminate redundant package downloads.
- `apps/api/Dockerfile` employs isolated multi-stage builds: C++ compilation (`whisper-server` pinned at `v1.7.4`) and Tesseract OCR model downloads (`tessdata-downloader`) are decoupled from TypeScript compilation, ensuring instant warm builds on Coolify when modifying application code.
- Root `.dockerignore` excludes `.git`, `node_modules`, `.next`, `dist`, logs, test artifacts, and `.env*` files to guarantee fast context transfer and prevent accidental cache invalidation.

