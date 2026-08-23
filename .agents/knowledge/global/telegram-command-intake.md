# Telegram Command Intake

The API instance receives Telegram commands through Telegraf long polling when `TELEGRAM_LONG_POLLING_ENABLED=true` (default). Exactly one instance per bot token may poll updates. When polling is disabled, a separately configured webhook or worker must deliver updates; otherwise commands such as `/help` cannot reach their handlers.

Direct command handlers must remain independently testable. The fallback harness verifies `/start` and `/help` still reply when dashboard-link issuance fails, when the origin is a localhost/loopback URL (omitting invalid inline URL buttons), and when Telegram API rejects invalid markup.
