# 🤖 Telebot Monorepo (NestJS, React, SQLite & Google Workspace)

## Cấu trúc Monorepo

```text
apps/api/          NestJS Telegram bot và OAuth backend
apps/web/          Next.js Static Export dashboard
packages/contracts/ Kiểu và route constants dùng chung
data/              SQLite runtime data
```

Chạy cả API và React: `npm run dev` · Chạy riêng API: `npm run dev:api` · Chạy riêng React: `npm run dev:web` · Build toàn bộ: `npm run build`.

Dashboard mở từ bot cần `SERVICE_URL_TELEBOT`, `NEXT_PUBLIC_API_URL`, `DASHBOARD_ACCESS_TOKEN_SECRET` và `DASHBOARD_REFRESH_TOKEN_SECRET`. `NEXT_PUBLIC_API_URL` được đóng gói vào static output khi build. Chỉ thêm `WEB_ORIGIN` khi dashboard dùng domain khác `SERVICE_URL_TELEBOT`. Bot tạo link exchange dùng một lần cho từng người dùng; access token có hạn 1 ngày và refresh token có hạn 7 ngày.

Trợ lý ảo cá nhân thông minh hoạt động 24/7 trên Telegram, được xây dựng bằng **NestJS**, tích hợp **Google Gemini AI (`gemini-3.5-flash-lite`)** với cơ chế Function Calling tự động 8 công cụ, lưu trữ **Database SQLite (TypeORM)** và hỗ trợ **Đa Người Dùng (Multi-User Isolation)** kết nối độc lập với toàn bộ hệ sinh thái **Google Workspace**.

---

## 🌟 Tính Năng Nổi Bật

- **Mô Hình Đa Người Dùng & Database SQLite Chuẩn ACID**:
  - Lưu trữ bền vững toàn bộ Users, Invites và Google Tokens trong 1 file duy nhất: `data/telebot.sqlite`.
  - Admin tạo link mời 1 lần `/invite` gửi cho bạn bè/người thân kích hoạt ngay lập tức mà không cần restart bot.
  - Mỗi người dùng tự kết nối tài khoản Google riêng qua lệnh `/login` & `/code` (hoặc AI tự gọi tool `login_google`).
  - Dữ liệu Calendar & Tasks của từng người được cô lập và bảo mật 100%.
- **8 Công Cụ AI Function Calling Tự Động**:
  - `create_calendar_event`: Tạo lịch hẹn có 4 mốc chuông popup báo dồn dập `[60p, 30p, 10p, 0p]`.
  - `list_calendar_events`: Tra cứu lịch trình theo ngày, tuần, tháng.
  - `delete_calendar_event`: Xóa sự kiện Google Calendar.
  - `create_task`: Thêm việc cần làm (To-Do) có hạn chót.
  - `list_tasks`: Tra cứu danh sách việc cần làm.
  - `complete_task`: Đánh dấu hoàn thành việc cần làm.
  - `login_google`: **(MỚI)** AI tự tạo link đăng nhập Google cá nhân hóa khi người dùng hỏi.
  - `create_invite_link`: **(MỚI - Admin Only)** AI tự tạo link mời bạn bè khi Admin ra lệnh.
- **Trọn Bộ Google Workspace Scopes Đã Cấp Quyền Sẵn**:
  - Hỗ trợ toàn bộ: Calendar, Tasks, Gmail, Drive, Sheets, Docs, Contacts/People API.
- **Private Guard Yêu Cầu Đăng Nhập Google Bắt Buộc**:
  - Chặn người lạ, chỉ cho phép người dùng trong danh sách trắng / được mời.
  - Bắt buộc đăng nhập Google mới được sử dụng các tính năng chat thông thường.
  - Tự động hiển thị nút bấm Inline "🔗 Đăng nhập Google" cho người dùng chưa kết nối.
- **Mô Hình Zero-File-Mount (Cực Kỳ Dễ Deploy Lên Coolify)**:
  - Client ID & Secret cấu hình qua biến môi trường (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
  - Không cần mount file `gcp-oauth.keys.json` hay `.gcp-saved-tokens.json` phức tạp, chỉ cần duy nhất 1 volume `/app/data`.

---

## 📁 Cấu Trúc Dự Án

```text
src/
├── app.module.ts                   # Root module kết nối Config, Schedule, Database, Users, Telegram, Gemini, Google
├── main.ts                         # Entrypoint khởi động NestJS Application Context
├── config/
│   └── configuration.ts            # Load & validate biến môi trường .env
│
├── database/                       # TẦNG CƠ SỞ DỮ LIỆU SQLITE (TYPEORM)
│   ├── database.module.ts          # TypeOrmModule (data/telebot.sqlite)
│   └── entities/                   # UserEntity, InviteEntity, UserTokenEntity
│
├── users/                          # QUẢN LÝ NGƯỜI DÙNG
│   ├── users.service.ts            # TypeORM Repositories, In-Memory Cache, Cooldown
│   └── users.module.ts
│
├── telegram/                       # GIAO DIỆN TELEGRAM BOT
│   ├── telegram.module.ts          # TelegrafModule.forRootAsync()
│   ├── telegram.update.ts          # Xử lý Slash commands (/start, /invite, /login, /code, /status...)
│   └── guards/
│       └── auth.guard.ts           # Kiểm tra Whitelist động, Deep-link & Yêu cầu Google Login
│
├── gemini/                         # TẦNG TRÍ TUỆ NHÂN TẠO (8 TOOLS)
│   ├── gemini.module.ts
│   ├── gemini.service.ts           # System Instruction, Neo giờ thực tế, Function Calling Loop
│   └── tools/
│       ├── tool.interface.ts       # Interface chuẩn GeminiTool & ToolExecutionContext
│       ├── create-calendar.tool.ts
│       ├── list-calendar.tool.ts
│       ├── delete-calendar.tool.ts
│       ├── create-task.tool.ts
│       ├── list-tasks.tool.ts
│       ├── complete-task.tool.ts
│       ├── login-google.tool.ts
│       └── invite-user.tool.ts
│
└── google/                         # TÍCH HỢP GOOGLE WORKSPACE (MULTI-TENANT)
    ├── google.module.ts
    ├── google-auth.service.ts      # Quản lý OAuth2 per-user trong SQLite (user_tokens)
    ├── google-calendar.service.ts  # Tương tác Google Calendar API per-user
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
TELEGRAM_ADMIN_ID=your_telegram_user_id_here

# 2. GEMINI AI
GEMINI_API_KEY=your_gemini_api_key_here

# 3. GOOGLE OAUTH CREDENTIALS (ZERO-FILE-MOUNT)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 4. BẢO MẬT VÀ DASHBOARD
DATA_ENCRYPTION_KEY=64_hex_characters
DASHBOARD_ACCESS_TOKEN_SECRET=64_random_characters
DASHBOARD_REFRESH_TOKEN_SECRET=another_64_random_characters

# 5. URL PUBLIC (NEXT_PUBLIC_API_URL được dùng khi build dashboard)
SERVICE_URL_TELEBOT=https://telebot.example.com
NEXT_PUBLIC_API_URL=https://telebot.example.com

# 6. CALLME
TELEGRAM_API_ID=your_telegram_api_id
TELEGRAM_API_HASH=your_telegram_api_hash
TELEGRAM_SESSION=your_telegram_session
```

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
- 🏛️ **[Kiến trúc hệ thống](file:///Users/datdoan/Documents/projects/telebot/docs/architecture.md)**: Sơ đồ luồng dữ liệu, SQLite Database và nguyên lý thiết kế đa người dùng.
- 🤖 **[Gemini AI & 8 Function Tools](file:///Users/datdoan/Documents/projects/telebot/docs/gemini-tools.md)**: Hướng dẫn chi tiết 8 công cụ và cách đăng ký Tool mới cho Gemini.
- 📅 **[Tích hợp Google Workspace](file:///Users/datdoan/Documents/projects/telebot/docs/google-integration.md)**: Full Scopes, quản lý Token trong SQLite & mở rộng Gmail/Drive/Sheets.
- 💬 **[Giao diện Telegram Bot](file:///Users/datdoan/Documents/projects/telebot/docs/telegram-bot.md)**: Deep Link Invite, Slash Commands, Private Guard & tối ưu UX.
- 🚀 **[Triển khai & Vận hành](file:///Users/datdoan/Documents/projects/telebot/docs/deployment.md)**: Cấu hình Zero-File-Mount trên Coolify, Docker, PM2 & Persistent Storage.
- 🛠️ **[Quy chuẩn phát triển](file:///Users/datdoan/Documents/projects/telebot/docs/development-workflow.md)**: Coding conventions, ESLint/Prettier, Husky hooks & kiểm thử.
