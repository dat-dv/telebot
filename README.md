# 🤖 NestJS Telegram AI Assistant (Google Calendar & Google Tasks)

Trợ lý ảo cá nhân thông minh hoạt động 24/7 trên Telegram, được xây dựng bằng **NestJS**, tích hợp **Google Gemini AI (`gemini-2.0-flash`)** với cơ chế Function Calling tự động, đồng bộ trực tiếp hai chiều với **Google Calendar** và **Google Tasks**.

---

## 🌟 Tính Năng Nổi Bật

- **AI Gemini 2.0 Flash + Function Calling**: Tự động phân tích ngôn ngữ tự nhiên tiếng Việt, tự động chọn và gọi tool Calendar / Tasks phù hợp.
- **Neo Thời Gian Thực Tế (Realtime Timestamp Injection)**: Luôn chèn mốc thời gian hiện tại (`Asia/Ho_Chi_Minh`) vào mỗi lượt tương tác giúp AI suy luận chính xác các mốc thời gian tương đối như "tối mai 8h", "thứ 5 tuần sau", "3 ngày nữa".
- **Cơ chế Multi-Reminder (Chuông báo ting dồn dập)**: Mặc định cài 4 mốc popup reminder `[60 phút, 30 phút, 10 phút, 0 phút]` khi tạo sự kiện Calendar.
- **Phân Biệt Rõ Ràng Calendar vs Tasks**:
  - Cuộc hẹn/họp/học có mốc giờ cụ thể -> **Google Calendar**.
  - Việc cần làm / To-Do / Mua sắm / Checklist -> **Google Tasks**.
- **Hệ Thống Slash Commands**:
  - `/today`: Tổng hợp toàn bộ lịch trình & việc cần làm hôm nay.
  - `/week`: Xem tổng quan 7 ngày tới.
  - `/calendar <nội dung>`: Lên lịch hẹn nhanh.
  - `/task <nội dung>`: Tạo to-do nhanh.
  - `/help`: Xem hướng dẫn chi tiết.
- **Bảo Mật Quyền Truy Cập (Auth Guard)**: Giới hạn quyền sử dụng bot thông qua danh sách Telegram User ID (`TELEGRAM_ALLOWED_USER_IDS`).
- **Sẵn Sàng Chạy 24/7 với PM2**: File `ecosystem.config.cjs` cấu hình sẵn sàng cho production.

---

## 📁 Cấu Trúc Dự Án

```
src/
├── app.module.ts                   # Root module kết nối Config, Schedule, Telegram, Gemini, Google
├── main.ts                         # Entrypoint khởi động NestJS Application Context
├── config/
│   └── configuration.ts            # Load & validate biến môi trường .env
│
├── telegram/
│   ├── telegram.module.ts          # TelegrafModule.forRootAsync()
│   ├── telegram.update.ts          # Xử lý Slash commands (@Start, @Help, @Command, @On('text'))
│   └── guards/
│       └── auth.guard.ts           # Chặn người dùng lạ nếu có TELEGRAM_ALLOWED_USER_IDS
│
├── gemini/
│   ├── gemini.module.ts
│   ├── gemini.service.ts           # System Instruction, Neo giờ thực tế, Function Calling Loop
│   └── tools/
│       ├── tool.interface.ts       # Interface chuẩn cho Gemini Tools
│       ├── create-calendar.tool.ts # Tool tạo sự kiện Google Calendar
│       ├── list-calendar.tool.ts   # Tool xem/tìm kiếm sự kiện Calendar
│       ├── delete-calendar.tool.ts # Tool xóa sự kiện Calendar
│       ├── create-task.tool.ts     # Tool tạo To-Do trên Google Tasks
│       ├── list-tasks.tool.ts      # Tool xem danh sách Tasks
│       └── complete-task.tool.ts   # Tool đánh dấu hoàn thành Task
│
└── google/
    ├── google.module.ts
    ├── google-auth.service.ts      # Quản lý OAuth2Client & tự động refresh token
    ├── google-calendar.service.ts  # Tương tác Google Calendar API + 4 mốc chuông báo
    └── google-tasks.service.ts     # Tương tác Google Tasks API
```

---

## ⚙️ Cài Đặt & Cấu Hình

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Biến Môi Trường (`.env`)

Tạo file `.env` tại thư mục gốc của dự án:

```env
# 1. TELEGRAM BOT
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ALLOWED_USER_IDS=

# 2. GEMINI AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash

# 3. TIMEZONE
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh

# 4. GOOGLE OAUTH
GOOGLE_OAUTH_CREDENTIALS=./gcp-oauth.keys.json
GOOGLE_CALENDAR_MCP_TOKEN_PATH=./.gcp-saved-tokens.json
```

> **Lưu ý về `TELEGRAM_ALLOWED_USER_IDS`**:
>
> - Lấy ID của bạn từ bot `@userinfobot` trên Telegram.
> - Phân tách nhiều ID bằng dấu phẩy, ví dụ: `12345678,87654321`.
> - Để trống nếu muốn cho phép bot chạy ở chế độ public.

---

## 🔑 Xác Thực Google OAuth 2.0 (Lần đầu tiên)

1. Truy cập [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Tạo hoặc chọn Google Cloud Project.
3. Bật **Google Calendar API** và **Google Tasks API** trong **API & Services > Library**.
4. Vào **Credentials** > **Create Credentials** > **OAuth client ID** (chọn Application type là **Desktop App**).
5. Tải file JSON vừa tạo, đổi tên thành `gcp-oauth.keys.json` và lưu vào thư mục gốc của project.
6. Chạy script xác thực tự động:

```bash
npm run auth
```

1. Mở đường link hiển thị trên terminal bằng trình duyệt, đăng nhập tài khoản Google của bạn và nhấn Cho phép. File `.gcp-saved-tokens.json` sẽ tự động được tạo.

---

## 🚀 Khởi Động Ứng Dụng

### Chế độ Development (Tự động reload khi sửa code)

```bash
npm run start:dev
```

### Build & Chạy Production

```bash
npm run build
npm run start:prod
```

### Chạy nền 24/7 với Docker Compose (Khuyên dùng cho Production/VPS)

```bash
# Đảm bảo đã chạy npm run auth trên máy trước để có file .gcp-saved-tokens.json
docker-compose up -d --build
```

### Chạy nền 24/7 với PM2

```bash
# Cài PM2 nếu chưa có: npm i -g pm2
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 💬 Ví Dụ Tương Tác Với Bot Trên Telegram

- **Lên lịch họp**:

  > _"Mai 14h họp kickoff dự án tại phòng họp 302 nhé"_ ➜ Bot tạo Calendar Event với 4 mốc chuông [60p, 30p, 10p, 0p].

- **Tạo việc cần làm**:

  > _"Nhắc tớ soạn thảo hợp đồng gửi đối tác trước chiều thứ 6"_ ➜ Bot tạo To-Do trên Google Tasks có hạn chót.

- **Xem lịch & To-Do**:

  > Gõ `/today` hoặc nhắn _"Hôm nay tớ có lịch gì và cần làm gì không?"_ ➜ Bot tổng hợp toàn diện cả Calendar và Tasks.

- **Đánh dấu hoàn thành**:

  > _"Tớ đã làm xong việc mua quà sinh nhật rồi"_ ➜ Bot tìm task tương ứng và đánh dấu `completed`.

---

## 📚 Tài Liệu & Hướng Dẫn Phát Triển

Dự án có bộ tài liệu module chi tiết tại thư mục [`docs/`](/docs/README.md):

- 🗺️ **[Documentation Hub](file:///Users/datdoan/Documents/projects/telebot/docs/README.md)**: Bản đồ & lộ trình tra cứu toàn bộ tài liệu dự án.
- 🏛️ **[Kiến trúc hệ thống](file:///Users/datdoan/Documents/projects/telebot/docs/architecture.md)**: Sơ đồ luồng dữ liệu, sequence diagram và nguyên lý thiết kế.
- 🤖 **[Gemini AI & Function Calling](file:///Users/datdoan/Documents/projects/telebot/docs/gemini-tools.md)**: Hướng dẫn chi tiết cách viết và đăng ký Tool mới cho Gemini.
- 📅 **[Tích hợp Google Workspace](file:///Users/datdoan/Documents/projects/telebot/docs/google-integration.md)**: Cơ chế OAuth2, Calendar, Tasks & mở rộng Gmail/Drive.
- 💬 **[Giao diện Telegram Bot](file:///Users/datdoan/Documents/projects/telebot/docs/telegram-bot.md)**: Xử lý Slash Commands, Auth Guard & tối ưu trải nghiệm (UX).
- 🚀 **[Triển khai & Vận hành](file:///Users/datdoan/Documents/projects/telebot/docs/deployment.md)**: Cấu hình Docker, PM2, triển khai tự động CI/CD với Coolify.
- 🛠️ **[Quy chuẩn phát triển](file:///Users/datdoan/Documents/projects/telebot/docs/development-workflow.md)**: Coding conventions, ESLint/Prettier, Husky hooks & quy trình kiểm thử.
