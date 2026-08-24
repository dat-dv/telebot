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

Bot API nhận các lệnh như `/help` bằng long polling được điều phối qua `TelegramLauncherService` khi `TELEGRAM_LONG_POLLING_ENABLED=true`.

- **Quản lý xung đột Bot Instance (409 Conflict)**: Khi có nhiều instance chạy trùng bot token hoặc khởi động lại nhanh trước khi kết nối polling cũ hết hạn, `TelegramLauncherService` sẽ tự động bắt lỗi `409 Conflict`, ghi log cảnh báo và tạm hoãn polling để thử lại sau 15 giây mà **không làm crash toàn bộ server NestJS** (Web REST API, OAuth callbacks và Next.js proxy vẫn duy trì uptime 100%).
- **Tắt Polling**: Nếu đặt biến `TELEGRAM_LONG_POLLING_ENABLED=false`, phải có webhook hoặc worker polling riêng chuyển update vào bot; nếu không, Telegram không thể đến handler nên bot sẽ im lặng. Sau khi đổi biến môi trường, build và restart/redeploy đúng instance API, rồi kiểm tra log có dòng `Listening for messages and commands on Telegram (Long Polling)...`.

Lệnh kiểm tra hồi quy: `node apps/api/scripts/check-telegram-command-fallback.cjs`. Script xác minh `/start`, `/help` và `/dashboard` luôn trả lời kể cả khi tạo link dashboard thất bại, khi cấu hình URL là localhost, hoặc khi Telegram API từ chối inline markup.

Lệnh unit test chuẩn cho API là `npm run test --workspace @telebot/api`. Lệnh này phải chạy toàn bộ file `*.spec.ts` dưới `apps/api/src/`, kể cả test lồng trong `telegram/services/`, và dùng runner hiểu decorators của NestJS. Callback có thay đổi dữ liệu không được thực thi ngay: bot tạo yêu cầu xác nhận gắn với đúng người dùng; chỉ nút xác nhận của người đó mới thực thi thao tác.
