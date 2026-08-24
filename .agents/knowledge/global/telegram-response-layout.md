# Telegram Response Layout

User-facing Telegram responses prioritize one compact heading, inline primary facts, and at most two lines per listed item. Repeated guidance and decorative separators are omitted when an action button already communicates the next step.

Short related inline actions may share one row. Long labels remain on their own row to avoid mobile overflow. Action labels must state their time or data scope when the same action exists in multiple scopes: today refresh and seven-day refresh use separate callbacks. Callback payloads and confirmation JSON fallbacks are otherwise unchanged.

AI-generated Markdown is normalized before delivery: HTML entities are decoded and escaped URL ampersands are restored so raw output such as `&#x20;` never reaches the chat.

Long-lived interactive list and information messages (today summary, task list, account status, admin user list, debt detail, and dashboard/report links) include a close action. It deletes the message when Telegram permits it; otherwise, it removes the inline keyboard so obsolete actions cannot be used. Confirmation dialogs retain cancel semantics, while reminder and calendar receipts retain their hide-controls action.

Every confirmation card displays an escaped, formatted JSON preview (`<pre><code class="language-json">...</code></pre>`) of the final action payload before any mutation. This applies to finance, debts, tasks, calendar, reminders, invite/admin actions, and debt deletion. UI-only `duplicateWarnings` are excluded because they are not sent to the executing tool.

Finance transaction confirmations (`create_finance_transaction`, `create_finance_transactions`) present structured fields (type, formatted VND amount, category, note, place name, and occurred/issued date) alongside that JSON preview and confirmation buttons before mutating records.

Debt confirmations and results (`create_debt`, `record_debt_payment`, `update_debt_contact`) present user-facing structured cards with the common escaped JSON preview:
- `create_debt` confirmation states direction clearly (*Cho vay (Người khác nợ bạn)* vs *Đi vay (Bạn nợ người khác)*), counterparty, alias, formatted VND amount, note, due date, and new contact notice before confirmation. Its JSON preview contains `direction`, `counterparty`, `amount`, `note`, and supplied optional values (`counterpartyAlias`, `dueAt`, `createNewContact`). The result card displays `Đã ghi khoản cho vay` or `Đã ghi khoản vay` with counterparty, alias, formatted amount, and note.
- `record_debt_payment` confirmation displays payment amount, and result card shows remaining balance or settled status (*Đã tất toán*).
- `update_debt_contact` confirmation and result cards display updated name and alias.
