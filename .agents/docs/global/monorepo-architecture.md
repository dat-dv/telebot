---
metadata:
  agent-artifact:
    id: docs-global-monorepo-architecture
    type: documentation
    depends_on:
      - .agents/knowledge/global/monorepo-architecture.md
---

# Kiến trúc Monorepo

Tài liệu này hướng dẫn cấu trúc tổ chức dự án monorepo và quy trình vận hành hệ thống, ánh xạ trực tiếp với tri thức canonical [`monorepo-architecture.md`](../../knowledge/global/monorepo-architecture.md).

## Cấu trúc

- `apps/api`: NestJS backend, Telegram bot và OAuth Google.
- `apps/web`: React + Vite, hiện là shell quản trị sẵn sàng tích hợp API.
- `packages/contracts`: Kiểu dữ liệu và hằng số route dùng chung.
- `data/`: SQLite tại root, không chuyển vào app con để giữ dữ liệu khi chạy Docker.

## Chạy dự án

1. Sao chép `.env.example` thành `.env.local` ở root và điền các biến server.
2. Chạy cả API và Web cùng lúc bằng `npm run dev` (hoặc chạy riêng từng app bằng `npm run dev:api` / `npm run dev:web`).
3. Chạy `npm run build` trước khi phát hành; lệnh này build contracts, API rồi web.

## Kiểm tra chất lượng

- `npm run lint` và `npm run format:check` chỉ kiểm tra, không sửa mã nguồn.
- `npm run lint:fix` và `npm run format` chủ động sửa lỗi lint/format trên toàn monorepo.

## Bảo mật biến môi trường

Chỉ `VITE_API_URL` được phép đi vào bundle trình duyệt. Token Telegram, Gemini, Google OAuth và `DATA_ENCRYPTION_KEY` chỉ dùng cho `apps/api`.

## Tránh xung đột bot Telegram

Telegram chỉ cho phép một tiến trình gọi long polling (`getUpdates`) với cùng một bot token. Biến `TELEGRAM_LONG_POLLING_ENABLED` mặc định là `true`; chỉ đặt `true` tại đúng một bot worker. Khi chạy local chỉ để dùng dashboard/API trong lúc production đang chạy bot, đặt `TELEGRAM_LONG_POLLING_ENABLED=false` trong `.env.local`. Instance này vẫn gửi được tin nhắn chủ động (ví dụ lời nhắc và thông báo OAuth) nhưng không nhận command hoặc update từ Telegram.

## Dashboard mở từ bot

1. Cấu hình `SERVICE_URL_TELEBOT` là URL public duy nhất của frontend/tunnel.
2. Tạo `REPORT_ACCESS_TOKEN` dài, ngẫu nhiên và chỉ lưu ở `.env.local`/production secret.
3. Bot hiển thị nút **Xem báo cáo**. Link chỉ dùng trong năm phút; API xác nhận chữ ký theo user Telegram, cấp session dashboard và chuyển sang `/reports` trên frontend.
4. Dashboard gọi `GET /api/dashboard` bằng access token; không truyền Telegram ID. Refresh token không đi vào JavaScript.

Access token dashboard được lưu ở browser storage trong 15 phút theo yêu cầu UI. Refresh token sống 7 ngày, được xoay vòng ở cookie `HttpOnly`; Axios tự refresh sau `401`, còn TanStack Query quản lý cache và trạng thái dữ liệu.

Khi phát triển qua tunnel, trỏ tunnel vào Vite tại `localhost:5173`. Vite proxy các endpoint dashboard sang API Docker tại `localhost:3000`; browser không gọi Docker network trực tiếp.

## Docker

Dùng `docker compose up --build` tại root. Compose build `apps/api/Dockerfile` với root làm build context và mount `./data` vào `/app/data`.
