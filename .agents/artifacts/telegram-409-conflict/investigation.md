# Điều tra lỗi Telegram 409 Conflict

## Quan sát

- API khởi động thành công, sau đó Telegraf thất bại ở `getUpdates` với `409 Conflict: terminated by other getUpdates request`.
- `apps/api/src/telegram/telegram.module.ts` khởi tạo `TelegrafModule` với token và không có điều kiện tắt polling.
- `apps/api/src/main.ts` cũng ghi rõ ứng dụng đang lắng nghe bằng long polling.

## Bằng chứng runtime

- Kiểm tra tiến trình ngày 2026-08-23 cho thấy một tiến trình Nest watch của workspace (PID 71654) và một tiến trình Vite; không thấy bản Nest/Telegraf local thứ hai.

## Kết luận

Nguyên nhân gốc rất có khả năng là một deployment hoặc máy khác đang dùng cùng bot token và gọi `getUpdates`. Telegram cho phép đúng một long-poll consumer cho một bot token, nên consumer mới làm consumer còn lại nhận lỗi 409. Đây không phải lỗi định tuyến API hay GramJS.

## Phạm vi ảnh hưởng

- `apps/api/src/telegram/telegram.module.ts`: polling luôn được kích hoạt.
- Mọi môi trường cùng dùng `TELEGRAM_BOT_TOKEN` đều xung đột nếu cùng chạy API.

## Đề xuất khắc phục

1. Dừng deployment/bot instance còn lại trước khi chạy local nếu chỉ cần test bot.
2. Hoặc dùng bot token riêng cho local.
3. Với môi trường cùng tồn tại, bổ sung biến cấu hình để chỉ một môi trường kích hoạt long polling; các API-only instance không khởi tạo Telegraf polling.
4. Nếu production dùng webhook, chuyển hẳn production sang webhook và đảm bảo local không long-poll cùng token.

## Xác minh sau khi khắc phục

Khởi động API khi không còn consumer khác; log phải tiếp tục sau dòng khởi động mà không có `TelegramError: 409`, và lệnh bot phải nhận được phản hồi.
