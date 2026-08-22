# 🤖 NestJS Telegram AI Assistant (Multi-User, Google Calendar & Tasks)

Trợ lý ảo cá nhân thông minh hoạt động 24/7 trên Telegram, được xây dựng bằng **NestJS**, tích hợp **Google Gemini AI (`gemini-3.5-flash-lite`)** với cơ chế Function Calling tự động, hỗ trợ **Đa Người Dùng (Multi-User Isolation)** kết nối độc lập với **Google Calendar** và **Google Tasks**.

---

## 🌟 Tính Năng Nổi Bật

- **Mô Hình Đa Người Dùng (Multi-User Invite & Data Isolation)**:
  - Admin tạo link mời 1 lần `/invite` gửi cho bạn bè/người thân kích hoạt ngay lập tức mà không cần restart bot.
  - Mỗi người dùng tự kết nối tài khoản Google riêng qua lệnh `/login` & `/code`.
  - Dữ liệu Calendar & Tasks của từng người được cô lập và bảo mật 100%.
- **AI Gemini 3.5 Flash Lite + Function Calling**:
  - Hạn mức **500 lượt gọi/ngày hoàn toàn miễn phí**.
  - Tự động phân tích ngôn ngữ tự nhiên tiếng Việt, tự động chọn và gọi tool Calendar / Tasks phù hợp.
  - Chuỗi Fallback Model dự phòng tự động (`gemini-3.5-flash-lite` ➔ `gemini-3.5-flash` ➔ `gemini-3.6-flash`).
- **Neo Thời Gian Thực Tế (Realtime Timestamp Injection)**: Luôn chèn mốc thời gian hiện tại (`Asia/Ho_Chi_Minh`) vào mỗi lượt tương tác giúp AI suy luận chính xác các mốc thời gian tương đối như "tối mai 8h", "thứ 5 tuần sau", "3 ngày nữa".
- **Cơ chế Multi-Reminder (Chuông báo ting dồn dập)**: Mặc định cài 4 mốc popup reminder `[60 phút, 30 phút, 10 phút, 0 phút]` khi tạo sự kiện Calendar.
- **Phòng Thủ Rate Limit 4 Lớp**:
  - Cooldown 2s chống spam xả tin nhắn liên tục.
  - Phân bổ hạn mức ngày (Admin 500 tin, Member 100 tin/ngày).
- **Hệ Thống Slash Commands**:
  - `/today`: Tổng hợp toàn bộ lịch trình & việc cần làm hôm nay.
  - `/week`: Xem tổng quan 7 ngày tới.
  - `/calendar <nội dung>`: Lên lịch hẹn nhanh.
  - `/task <nội dung>`: Tạo to-do nhanh.
  - `/login`: Kết nối tài khoản Google cá nhân.
  - `/code <mã>`: Nhập mã xác thực Google.
  - `/usage`: Xem thống kê số lượt gọi còn lại trong ngày.
  - `/invite`: (Admin) Tạo link mời người dùng mới.
  - `/users`: (Admin) Xem danh sách người dùng.
- **Bảo Mật Quyền Truy Cập (Auth Guard)**: Chặn người lạ, chỉ cho phép người dùng trong danh sách trắng hoặc kích hoạt qua link mời.

---

## 📁 Cấu Trúc Dự Án

```text
src/
├── app.module.ts                   # Root module kết nối Config, Schedule, Users, Telegram, Gemini, Google
├── main.ts                         # Entrypoint khởi động NestJS Application Context
├── config/
│   └── configuration.ts            # Load & validate biến môi trường .env
│
├── users/                          # QUẢN LÝ NGƯỜI DÙNG & RATE LIMIT
│   ├── user.entity.ts              # Schema User, InviteCode, UserUsage
│   ├── users.service.ts            # Lưu data/users.json, Invite link, Quota limiter
│   └── users.module.ts
│
├── telegram/                       # GIAO DIỆN TELEGRAM BOT
│   ├── telegram.module.ts          # TelegrafModule.forRootAsync()
│   ├── telegram.update.ts          # Xử lý Slash commands (/start, /invite, /login, /code, /usage...)
│   └── guards/
│       └── auth.guard.ts           # Kiểm tra Whitelist động, Deep-link & Rate limit
│
├── gemini/                         # TẦNG TRÍ TUỆ NHÂN TẠO (AI CORE)
│   ├── gemini.module.ts
│   ├── gemini.service.ts           # System Instruction, Neo giờ thực tế, Function Calling Loop
│   └── tools/
│       ├── tool.interface.ts       # Interface chuẩn cho Gemini Tools (kèm User Context)
│       ├── create-calendar.tool.ts # Tool tạo sự kiện Google Calendar
│       ├── list-calendar.tool.ts   # Tool xem/tìm kiếm sự kiện Calendar
│       ├── delete-calendar.tool.ts # Tool xóa sự kiện Calendar
│       ├── create-task.tool.ts     # Tool tạo To-Do trên Google Tasks
│       ├── list-tasks.tool.ts      # Tool xem danh sách Tasks
│       └── complete-task.tool.ts   # Tool đánh dấu hoàn thành Task
│
└── google/                         # TÍCH HỢP GOOGLE WORKSPACE (MULTI-TENANT)
    ├── google.module.ts
    ├── google-auth.service.ts      # Quản lý OAuth2 per-user (data/tokens/<userId>.json)
    ├── google-calendar.service.ts  # Tương tác Google Calendar API per-user + 4 mốc chuông báo
    └── google-tasks.service.ts     # Tương tác Google Tasks API per-user
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
TELEGRAM_ALLOWED_USER_IDS=12345678
TELEGRAM_ADMIN_ID=12345678

# 2. GEMINI AI (500 LƯỢT MIỄN PHÍ MỖI NGÀY)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# 3. TIMEZONE
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh

# 4. GOOGLE OAUTH
GOOGLE_OAUTH_CREDENTIALS=./gcp-oauth.keys.json
GOOGLE_CALENDAR_MCP_TOKEN_PATH=./.gcp-saved-tokens.json
```

---

## 🔑 Xác Thực Google OAuth 2.0 (Lần đầu cho Admin)

1. Truy cập [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Bật **Google Calendar API** và **Google Tasks API**. Thêm email của bạn bè vào mục **OAuth Consent Screen > Test Users**.
3. Tạo **OAuth client ID** (Application type: **Desktop App**), tải về và đổi tên thành `gcp-oauth.keys.json` lưu vào thư mục gốc.
4. Chạy script xác thực cho Admin:

```bash
npm run auth
```

*(Đối với bạn bè, họ chỉ cần gõ `/login` và gửi `/code` trực tiếp trên Telegram!)*

---

## 🚀 Khởi Động Ứng Dụng

### Chế độ Development (Hot-Reload):
```bash
npm run start:dev
```

### Chạy nền 24/7 với Docker Compose:
```bash
docker-compose up -d --build
```

### Chạy nền 24/7 với PM2:
```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 📚 Bộ Tài Liệu Phát Triển Chi Tiết

Dự án có bộ tài liệu module độc lập tại thư mục [`docs/`](/docs/README.md):

- 🗺️ **[Documentation Hub](file:///Users/datdoan/Documents/projects/telebot/docs/README.md)**: Bản đồ & lộ trình tra cứu toàn bộ tài liệu dự án.
- 🏛️ **[Kiến trúc hệ thống](file:///Users/datdoan/Documents/projects/telebot/docs/architecture.md)**: Sơ đồ luồng dữ liệu, sequence diagram và nguyên lý thiết kế đa người dùng.
- 🤖 **[Gemini AI & Function Calling](file:///Users/datdoan/Documents/projects/telebot/docs/gemini-tools.md)**: Hướng dẫn chi tiết cách viết và đăng ký Tool mới cho Gemini.
- 📅 **[Tích hợp Google Workspace](file:///Users/datdoan/Documents/projects/telebot/docs/google-integration.md)**: Cơ chế OAuth2 per-user, Calendar, Tasks & mở rộng Gmail/Drive.
- 💬 **[Giao diện Telegram Bot](file:///Users/datdoan/Documents/projects/telebot/docs/telegram-bot.md)**: Xử lý Deep Link Invite, Slash Commands, Auth Guard & tối ưu UX.
- 🚀 **[Triển khai & Vận hành](file:///Users/datdoan/Documents/projects/telebot/docs/deployment.md)**: Cấu hình Docker, Coolify CI/CD, PM2 & Persistent Storage.
- 🛠️ **[Quy chuẩn phát triển](file:///Users/datdoan/Documents/projects/telebot/docs/development-workflow.md)**: Coding conventions, ESLint/Prettier, Husky hooks & kiểm thử.
