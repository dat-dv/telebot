# Backend CRUD API

The REST CRUD surface covers transactions, debt contacts, debts, debt payments, reminders, allowlisted users/invites, Google Calendar events, and Google Tasks. It is a cross-cutting backend capability because the current API source has service folders rather than `src/modules/<feature>` feature directories.

Dashboard access tokens identify the caller. Local records are always scoped to that identity; user and invitation management requires the admin role. OAuth credentials and audit records are not exposed. Calendar and task operations act only on the caller's linked Google account.

Debt payment is a dedicated action backed by `DebtPaymentEntity` (`debt_payments` table). Payment records store `debt_id`, `user_id`, `amount`, `payment_date`, and `note`. When recorded via `POST /api/debts/:id/payments`, a payment entry is saved, `remainingAmount` decreases, and when reduced to zero, the debt status transitions to `'settled'` with `settledAt` populated. Full repayment history is retrievable via `GET /api/debts/:id/payments`. Contacts support `phoneNumber`, `bankAccountNumber`, `bankCode`, `bankName`, and `avatarUrl`. Finance transactions support `paymentMethod`, `currency`, `receiptUrl`, and `contactId`. Reminder entities track `status`, `snoozeCount`, `snoozedUntil`, and `completedAt`.

