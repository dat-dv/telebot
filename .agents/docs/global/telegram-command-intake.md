---
metadata:
  agent-artifact:
    id: docs-global-telegram-command-intake
    type: documentation
    depends_on:
      - .agents/knowledge/global/telegram-command-intake.md
---

# Nhận lệnh Telegram

Hướng dẫn này ánh xạ trực tiếp với tri thức canonical [`telegram-command-intake.md`](../../knowledge/global/telegram-command-intake.md).

Bot API nhận các lệnh như `/help` bằng long polling khi `TELEGRAM_LONG_POLLING_ENABLED=true`. Chỉ duy trì **một** instance poll cho mỗi bot token.

Nếu đặt biến này thành `false`, phải có webhook hoặc worker polling riêng chuyển update vào bot; nếu không, Telegram không thể đến handler nên bot sẽ im lặng. Sau khi đổi biến môi trường, build và restart/redeploy đúng instance API, rồi kiểm tra log có dòng `Listening for messages and commands on Telegram (Long Polling)...`.

Lệnh kiểm tra hồi quy: `node apps/api/scripts/check-telegram-command-fallback.cjs`. Script xác minh `/start`, `/help` và `/dashboard` luôn trả lời kể cả khi tạo link dashboard thất bại, khi cấu hình URL là localhost, hoặc khi Telegram API từ chối inline markup.
