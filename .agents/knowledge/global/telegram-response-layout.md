# Telegram Response Layout

User-facing Telegram responses prioritize one compact heading, inline primary facts, and at most two lines per listed item. Repeated guidance and decorative separators are omitted when an action button already communicates the next step.

Short related inline actions may share one row. Long labels remain on their own row to avoid mobile overflow. Action labels must state their time or data scope when the same action exists in multiple scopes: today refresh and seven-day refresh use separate callbacks. Callback payloads and confirmation JSON fallbacks are otherwise unchanged.

AI-generated Markdown is normalized before delivery: HTML entities are decoded and escaped URL ampersands are restored so raw output such as `&#x20;` never reaches the chat.

Long-lived interactive list and information messages (today summary, task list, account status, admin user list, debt detail, and dashboard/report links) include a close action. It deletes the message when Telegram permits it; otherwise, it removes the inline keyboard so obsolete actions cannot be used. Confirmation dialogs retain cancel semantics, while reminder and calendar receipts retain their hide-controls action.
