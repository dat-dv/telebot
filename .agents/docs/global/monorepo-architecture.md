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
- `apps/web`: Next.js App Router xuất static files; không dùng Next API Route hay Server Action.
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

Chỉ `NEXT_PUBLIC_API_URL` được phép đi vào bundle trình duyệt. Token Telegram, Gemini, Google OAuth và `DATA_ENCRYPTION_KEY` chỉ dùng cho `apps/api`.

Dashboard tổ chức theo DDD: `modules/auth` sở hữu token/session phía trình duyệt, `modules/dashboard` sở hữu tổng quan và thống kê, `modules/contacts` sở hữu danh bạ. Component tái sử dụng như `DataTable` và `DataPanel` nằm ở `shared/ui`; client HTTP và TanStack Query provider nằm ở `shared/api`/`shared/providers`. `packages/contracts` chỉ chứa route constants và DTO types, không chứa React component.

## Tránh xung đột bot Telegram

Telegram chỉ cho phép một tiến trình gọi long polling (`getUpdates`) với cùng một bot token. Biến `TELEGRAM_LONG_POLLING_ENABLED` mặc định là `true`; chỉ đặt `true` tại đúng một bot worker. Khi chạy local chỉ để dùng dashboard/API trong lúc production đang chạy bot, đặt `TELEGRAM_LONG_POLLING_ENABLED=false` trong `.env.local`. Instance này vẫn gửi được tin nhắn chủ động (ví dụ lời nhắc và thông báo OAuth) nhưng không nhận command hoặc update từ Telegram.

## Dashboard mở từ bot

1. Cấu hình `APP_URL` là URL public runtime của API/bot và đặt `WEB_ORIGIN` cùng giá trị khi Dashboard dùng chung domain.
2. Đặt `NEXT_PUBLIC_API_URL` cùng URL đó trước khi build Docker dashboard. Giá trị này được đóng gói vào static bundle; không được để Compose rơi về `http://localhost:3000`. Không dùng `SERVICE_URL_*` vì Coolify dành tiền tố này cho URL do nền tảng quản lý.
3. Bot hiển thị nút **Xem báo cáo**. Link chỉ dùng trong năm phút; API xác nhận token theo user Telegram, cấp session dashboard và chuyển sang `/reports` trên frontend.
4. Dashboard gọi `GET /api/dashboard` bằng access token; không truyền Telegram ID. Refresh token không đi vào JavaScript. Hai secret `DASHBOARD_ACCESS_TOKEN_SECRET` và `DASHBOARD_REFRESH_TOKEN_SECRET` chỉ nằm ở API.

Access token dashboard được lưu ở browser storage trong 15 phút theo yêu cầu UI. Refresh token sống 7 ngày, được xoay vòng ở cookie `HttpOnly`; Axios tự refresh sau `401`, còn TanStack Query quản lý cache và trạng thái dữ liệu.

Khi phát triển local, Next chạy tại `http://localhost:5173` và browser gọi API tại `http://localhost:3000`; API tự cho phép origin này ở non-production. Khi dashboard và API dùng cùng domain, đặt `APP_URL`, `WEB_ORIGIN` và `NEXT_PUBLIC_API_URL` cùng giá trị. Khi triển khai static web riêng, đặt `WEB_ORIGIN` là URL public của web; API dùng biến này cho CORS và redirect từ `/api/access`.

## Docker

Dùng `docker compose up --build` tại root. Compose build API và static web qua `apps/api/Dockerfile` và `apps/web/Dockerfile`; web được phục vụ bởi Nginx tại `WEB_PORT` (mặc định 3001), đồng thời Nginx tự động reverse proxy các route `/api/*` và `/oauth2callback` sang container API backend (`http://api:3000`), còn API mount `./data` để giữ SQLite. Với kiến trúc này, Cloudflare Tunnel chỉ cần trỏ vào duy nhất cổng Web (`localhost:3001`).
