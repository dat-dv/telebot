# Authentication Module

> Developer guide (Vietnamese): [`README.md`](../../../docs/modules/auth/README.md)

## Purpose

`apps/web/src/modules/auth` stores the short-lived dashboard access token after the Telegram exchange flow. It keeps the browser session usable without exposing token handling to report views.

## UI and state

On load, `captureDashboardToken` reads `dashboard_token` from the URL fragment, persists it in local storage, and removes the fragment from the address bar. Logout or an unrecoverable authentication failure clears the token.

## Integration seams

`shared/api/http-client` reads this module's token for the Authorization header, refreshes once after a 401 response, and clears it if refresh fails. The token lifecycle must remain compatible with the dashboard session API.
