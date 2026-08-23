# Backend CRUD API

The REST CRUD surface covers transactions, debt contacts, debts, reminders, allowlisted users/invites, Google Calendar events, and Google Tasks. It is a cross-cutting backend capability because the current API source has service folders rather than `src/modules/<feature>` feature directories.

Dashboard access tokens identify the caller. Local records are always scoped to that identity; user and invitation management requires the admin role. OAuth credentials and audit records are not exposed. Calendar and task operations act only on the caller's linked Google account.

Debt payment is a dedicated action. A debt's original amount cannot be reduced below its paid amount, and it settles only when its remaining amount is zero. Reminder trigger state is owned by the scheduler, not REST clients.
