# 🚀 Hướng Dẫn Triển Khai & Vận Hành (Deployment Guide)

Tài liệu này hướng dẫn toàn bộ quy trình thiết lập môi trường phát triển local, đóng gói Docker, chạy tiến trình nền với PM2 và triển khai tự động CI/CD lên VPS qua Coolify với mô hình **Zero-File-Mount** (chỉ dùng biến môi trường & SQLite).

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản 20.x hoặc 22.x LTS.
- **NPM**: Phiên bản 10.x trở lên.
- **Docker & Docker Compose** (nếu chạy dạng container).
- **Tài khoản Google Cloud** đã kích hoạt Calendar API & Tasks API (và đã add Gmail của bạn bè vào mục _Test Users_).
- **Telegram Bot Token** tạo từ `@BotFather`.

---

## 2. Cấu Hình Biến Môi Trường (`.env`)

Tạo file `.env` tại thư mục gốc từ mẫu `.env.example`:

```bash
cp .env.example .env
```

Nội dung chi tiết các biến:

```env
APP_URL=https://telebot.example.com
WEB_ORIGIN=https://telebot.example.com
NEXT_PUBLIC_API_URL=https://telebot.example.com

TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_ADMIN_ID=123456789
GEMINI_API_KEY=replace-with-gemini-key
DATA_ENCRYPTION_KEY=64-hex-characters
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
DASHBOARD_ACCESS_TOKEN_SECRET=64-random-characters
DASHBOARD_REFRESH_TOKEN_SECRET=another-64-random-characters

# CallMe
TELEGRAM_API_ID=replace-with-telegram-api-id
TELEGRAM_API_HASH=replace-with-telegram-api-hash
TELEGRAM_SESSION=replace-with-telegram-session
```

> Bot mặc định nhận lệnh như `/help` bằng long polling. Chỉ thêm `TELEGRAM_LONG_POLLING_ENABLED=false` khi đã cấu hình webhook hoặc một worker polling riêng nhận update thay cho API này.

---

## 3. Quy Trình Đăng Nhập Google 100% Qua Telegram

Không cần chạy lệnh terminal `npm run auth` hay sinh file token thủ công:

1. Mở bot trên Telegram và gõ: `/login` (hoặc bấm nút **"🔗 Đăng nhập Google"**).
2. Đăng nhập Gmail trên trình duyệt và bấm **Cho phép (Allow)**.
3. Copy mã xác thực trả về và gửi lại cho bot:
   ```
   /code 4/0AQ...
   ```
4. Toàn bộ Token của **Admin** và **Bạn bè** được tự động lưu trữ và quản lý độc lập, bảo mật trong **Database SQLite (bảng `user_tokens`)**!

---

## 4. Chạy Ở Môi Trường Local

```bash
# Cài đặt dependencies
npm install

# Chạy chế độ watch (hot-reload khi sửa code)
npm run start:dev

# Kiểm tra lint & format
npm run lint
npm run format

# Build mã nguồn
npm run build

# Chạy bản build production
npm run start:prod
```

---

## 5. Triển Khai Với Docker & Docker Compose

### 1. Build & Khởi động Container

```bash
docker-compose up -d --build
```

### 2. Xem logs & trạng thái

```bash
# Xem log realtime của bot
docker logs -f telegram-assistant-bot

# Dừng container
docker-compose down
```

> [!NOTE] Trong `docker-compose.yml`, chỉ cần duy nhất một volume mount `./data:/app/data` để lưu trữ bền vững cơ sở dữ liệu SQLite (`data/telebot.sqlite`) chứa toàn bộ Users, Invites và Google Tokens.

---

## 6. Triển Khai Tự Động Với Coolify (Khuyên Dùng Cho Production)

Coolify cho phép triển khai dự án tự động thông qua GitHub App Webhook mỗi khi push code lên nhánh `main`.

### Các bước cấu hình trên Coolify (Cực kỳ đơn giản):

1. **Tạo Application mới**: Chọn **Public / Private Repository** và liên kết với repo GitHub của bạn.
2. **Chọn Build Pack**: Chọn **Dockerfile**.
3. **Cấu hình Environment Variables**:
   - Dán các biến từ `.env` vào mục **Environment Variables**. Đặt `APP_URL` và `WEB_ORIGIN` là runtime variables; đặt `NEXT_PUBLIC_API_URL` là build variable trước lần build Dashboard.
   - Không dùng `SERVICE_URL_TELEBOT`: Coolify dành tiền tố `SERVICE_URL_*` cho URL do nền tảng quản lý.
4. **Cấu hình Persistent Storage (Duy nhất 1 mục)**:
   - Vào mục **Storages** > **Add Volume / Persistent Storage**:
     - **Destination Path / Mount Path**: `/app/data`
     - _(Không cần cấu hình bất kỳ File Mount nào khác!)_
5. **Kích hoạt Auto Deploy**:
   - Bật Webhook trong Coolify.
   - Mỗi lần bạn thực hiện `git push origin main`, Coolify sẽ tự động build lại Docker image và cập nhật ứng dụng sau 10-20 giây!

---

## 7. Chạy Nền Với PM2 (Nếu Không Dùng Docker)

File cấu hình `ecosystem.config.cjs` đã được thiết lập sẵn:

```bash
# 1. Cài đặt PM2 global nếu chưa có
npm install -g pm2

# 2. Build dự án
npm run build

# 3. Khởi chạy với PM2
pm2 start ecosystem.config.cjs

# 4. Lưu danh sách tiến trình để tự khởi động khi server reboot
pm2 save
pm2 startup

# 5. Xem logs & giám sát
pm2 logs nestjs-telegram-assistant
pm2 monit
```

---

## 8. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

| Hiện tượng                                                 | Nguyên nhân                                           | Cách khắc phục                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Bot báo `Yêu cầu kết nối tài khoản Google`                 | Chưa đăng nhập Google OAuth.                          | Bấm nút **"🔗 Đăng nhập Google"** hoặc gõ `/login` rồi gửi `/code <mã>`. |
| Người lạ nhắn tin báo `Truy cập bị từ chối`                | Chưa được Admin mời qua link `/invite`.               | Admin gõ `/invite` lấy link gửi cho bạn, hoặc gõ `/allow <id>`.          |
| Lỗi `Google OAuth credentials chưa được cấu hình`          | Thiếu `GOOGLE_CLIENT_ID` hoặc `GOOGLE_CLIENT_SECRET`. | Kiểm tra lại các biến môi trường trên Coolify hoặc file `.env`.          |
| AI báo lỗi `Rate limit` hoặc `All model candidates failed` | Quota Gemini API Key bị hết hoặc sai Key.             | Kiểm tra biến `GEMINI_API_KEY` trên Google AI Studio.                    |
## PostgreSQL & Redis cutover

The Compose stack now includes PostgreSQL and Redis. Before switching an existing SQLite deployment, take a backup of `data/telebot.sqlite`, start only PostgreSQL, then run:

```bash
docker compose run --rm --no-deps -e MIGRATION_CREATE_SCHEMA=true api \
  node apps/api/scripts/migrate-sqlite-to-postgres.cjs
```

The command refuses a non-empty PostgreSQL target unless `MIGRATION_ALLOW_NONEMPTY=true` is explicitly supplied after reconciliation. After counts are verified, keep `TYPEORM_SYNCHRONIZE=false`, remove `MIGRATION_CREATE_SCHEMA`, and restart the API with `DATABASE_URL` and `REDIS_URL` configured. Do not run the migration against a live writer; pause the API first.
