# 📚 Telebot Developer Documentation Hub

Chào mừng bạn đến với trung tâm tài liệu phát triển của dự án **NestJS Telegram AI Assistant (Telebot)**.

Hệ thống tài liệu được thiết kế theo dạng module độc lập (Modular Documentation) nhằm giúp lập trình viên và AI nắm bắt nhanh kiến trúc, quy chuẩn phát triển, cách thêm công cụ AI mới và quy trình vận hành hệ thống.

---

## 🗺️ Bản Đồ Tài Liệu (Documentation Map)

```text
docs/
├── README.md                 # [Bản đồ tài liệu] - Mục lục & Lộ trình tìm hiểu
├── architecture.md           # [Kiến trúc] - Sơ đồ hệ thống, SQLite Database & nguyên lý thiết kế
├── gemini-tools.md           # [AI & Tools] - 8 Function Declarations, System Instruction & viết Tool mới
├── google-integration.md     # [Google Workspace] - Full Scopes, OAuth2, Calendar, Tasks & lưu Token SQLite
├── telegram-bot.md           # [Telegram Bot] - Telegraf Update, Slash Commands, Typing & Private Auth Guard
├── deployment.md             # [DevOps & Deploy] - Zero-File-Mount, Docker, Coolify CI/CD, PM2 & Secrets
└── development-workflow.md   # [Quy chuẩn code] - TypeScript, ESLint/Prettier, Testing & Git
```

---

## 📑 Hướng Dẫn Nhanh Theo Nhu Cầu

| Bạn muốn... | Tài liệu cần đọc | Nội dung chính |
| :--- | :--- | :--- |
| **Hiểu tổng quan kiến trúc & SQLite** | [architecture.md](/docs/architecture.md) | Sơ đồ tuần tự, SQLite Database (`telebot.sqlite`), cô lập Token đa người dùng. |
| **Tìm hiểu 8 công cụ AI & viết Tool mới** | [gemini-tools.md](/docs/gemini-tools.md) | 8 Tools hiện có (Calendar, Tasks, Login, Invite), interface `GeminiTool`, `ToolExecutionContext`. |
| **Tích hợp thêm API Google (Gmail, Drive...)** | [google-integration.md](/docs/google-integration.md) | Trọn bộ Scopes Google Workspace đã cấp quyền, quản lý Token trong SQLite, Calendar / Tasks API. |
| **Thêm Slash Command hoặc tùy biến giao diện Bot** | [telegram-bot.md](/docs/telegram-bot.md) | Xử lý `Update`, `AuthGuard` (yêu cầu Google Login), Deep Link Invite `/invite`, Typing Heartbeat. |
| **Deploy lên VPS hoặc cấu hình Docker / Coolify** | [deployment.md](/docs/deployment.md) | Mô hình Zero-File-Mount trên Coolify (chỉ cần 1 volume `/app/data`), chạy Docker, PM2. |
| **Bắt đầu đóng góp code / Kiểm thử** | [development-workflow.md](/docs/development-workflow.md) | Coding conventions, TypeScript types, Husky pre-commit, kiểm thử lint/build. |

---

## ⚡ Lộ Trình Cho Developer Mới (Quick Onboarding)

1. **Bước 1**: Đọc [Kiến trúc hệ thống](/docs/architecture.md) để nắm được bức tranh tổng thể các tầng Module trong NestJS và SQLite.
2. **Bước 2**: Thiết lập môi trường Local theo hướng dẫn tại [Triển khai & Vận hành](/docs/deployment.md#4-chạy-ở-môi-trường-local).
3. **Bước 3**: Lấy key Telegram Bot, Google Client ID & Secret theo [Tích hợp Google Workspace](/docs/google-integration.md).
4. **Bước 4**: Thử tạo một tính năng mới theo hướng dẫn tại [AI & Function Calling](/docs/gemini-tools.md).
