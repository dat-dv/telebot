# Dashboard Session and Pages

The Telegram dashboard link uses a random one-time exchange token. Only its SHA-256 hash is persisted in `dashboard_exchange_tokens`; the raw token appears only in the short-lived URL.

- `GET /api/access?token=...` atomically consumes a valid, unused exchange token and redirects with an access token in the URL fragment.
- Access tokens expire after 24 hours. Refresh tokens expire after 7 days, rotate on refresh, and are stored only in an HTTP-only cookie.
- `GET /reports/contacts` authenticates from the access token and returns at most 200 `debt_contacts` belonging to that token's user. No contact mutation is exposed through the web app.
- The web app has client-side Home (`/reports`), Statistics (`/reports/statistics`), and Contacts (`/reports/contacts`) views. All use the shared dashboard session and `DataTable` primitive.
