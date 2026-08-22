# 🚀 Hướng Dẫn Triển Khai & Vận Hành (Deployment Guide)

Tài liệu này hướng dẫn toàn bộ quy trình thiết lập môi trường phát triển local, đóng gói Docker, chạy tiến trình nền với PM2 và triển khai tự động CI/CD lên VPS qua Coolify.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản 20.x hoặc 22.x LTS.
- **NPM**: Phiên bản 10.x trở lên.
- **Docker & Docker Compose** (nếu chạy dạng container).
- **Tài khoản Google Cloud** đã kích hoạt Calendar API & Tasks API (và đã add Gmail của bạn bè vào mục *Test Users*).
- **Telegram Bot Token** tạo từ `@BotFather`.

---

## 2. Cấu Hình Biến Môi Trường (`.env`)

Tạo file `.env` tại thư mục gốc từ mẫu `.env.example`:

```bash
cp .env.example .env
```

Nội dung chi tiết các biến:

```env
# 3 BIẾN CỐT LÕI BẮT BUỘC
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ  # Token từ @BotFather
TELEGRAM_ADMIN_ID=12345678                              # Telegram ID của Quản trị viên (lấy từ @userinfobot)
GEMINI_API_KEY=AIzaSyD...                               # API Key từ Google AI Studio (aistudio.google.com)

# TÙY CHỌN (Mặc định đã tự cấu hình tối ưu trong code)
# GEMINI_MODEL=gemini-3.5-flash-lite
# DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

---

## 3. Xác Thực Google OAuth Lần Đầu (Dành Cho Admin)

1. Tải file JSON OAuth Client ID (loại Desktop App) từ Google Cloud Console và lưu tại thư mục gốc với tên `gcp-oauth.keys.json`.
2. Chạy lệnh xác thực tự động:
   ```bash
   npm run auth
   ```
3. Terminal sẽ hiển thị đường link xác thực. Mở link trên trình duyệt, cấp quyền cho ứng dụng.
4. File `.gcp-saved-tokens.json` sẽ tự động được tạo.

*(Đối với bạn bè/khách mời, họ chỉ cần gõ `/login` và gửi `/code` trực tiếp trên Telegram mà không cần chạy lệnh `npm run auth`)*.

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
# Đảm bảo đã có .env, gcp-oauth.keys.json và .gcp-saved-tokens.json
docker-compose up -d --build
```

### 2. Xem logs & trạng thái
```bash
# Xem log realtime của bot
docker logs -f telegram-assistant-bot

# Dừng container
docker-compose down
```

> [!NOTE]
> Trong `docker-compose.yml`, thư mục `./data` và các file token được mount dạng volume vào container để lưu trữ bền vững cơ sở dữ liệu người dùng (`data/users.json`) và token riêng của từng người (`data/tokens/`).

---

## 6. Triển Khai Tự Động Với Coolify (Khuyên Dùng Cho Production)

Coolify cho phép triển khai dự án tự động thông qua GitHub App Webhook mỗi khi push code lên nhánh `main`.

### Các bước cấu hình trên Coolify:

1. **Tạo Application mới**: Chọn **Public / Private Repository** và liên kết với repo GitHub của bạn.
2. **Chọn Build Pack**: Chọn **Dockerfile** (Coolify sẽ tự động nhận diện `Dockerfile` multi-stage đã tối ưu).
3. **Cấu hình Environment Variables**:
   - Thêm đầy đủ các biến môi trường từ `.env` vào mục **Environment Variables** trên Dashboard Coolify (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `DEFAULT_TIMEZONE`...).
4. **Cấu hình Persistent Storage / File Mounts (Cực kỳ quan trọng)**:
   - Vào mục **Storages** > **Persistent Directories / File Mounts** trên Coolify:
     - Tạo mount thư mục `/app/data` (để lưu dữ liệu người dùng & token khách).
     - Tạo mount file `/app/gcp-oauth.keys.json` với nội dung từ file `gcp-oauth.keys.json`.
     - Tạo mount file `/app/.gcp-saved-tokens.json` với nội dung từ file `.gcp-saved-tokens.json`.
5. **Kích hoạt Auto Deploy**:
   - Bật Webhook trong Coolify.
   - Mỗi lần bạn thực hiện `git push origin main`, Coolify sẽ tự động build lại Docker image và cập nhật ứng dụng sau 10-20 giây mà không làm gián đoạn bot!

---

## 7. Chạy Nền Với PM2 (Nếu Không Dùng Docker)

File cấu hình [`ecosystem.config.cjs`](file:///Users/datdoan/Documents/projects/telebot/ecosystem.config.cjs) đã được thiết lập sẵn:

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

| Hiện tượng | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| Bot không phản hồi tin nhắn | Sai `TELEGRAM_BOT_TOKEN` hoặc Telegram Polling bị đè bởi instance khác. | Kiểm tra log, đảm bảo chỉ có 1 container/process bot đang chạy. |
| Bạn bè nhắn tin báo `Truy cập bị từ chối` | Bạn chưa được Admin mời qua link `/invite`. | Admin gõ `/invite` lấy link gửi cho bạn, hoặc gõ `/allow <id>`. |
| Bạn bè tạo lịch báo lỗi `Chưa kết nối Google` | Bạn chưa đăng nhập tài khoản Google. | Bảo bạn gõ `/login` và làm theo hướng dẫn nhập `/code`. |
| AI báo lỗi `Rate limit` hoặc `All model candidates failed` | Quota Gemini API Key bị hết hoặc sai Key. | Kiểm tra biến `GEMINI_API_KEY` trên Google AI Studio. |
