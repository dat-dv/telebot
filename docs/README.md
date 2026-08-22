# 📚 Telebot Developer Documentation Hub

Chào mừng bạn đến với trung tâm tài liệu phát triển của dự án **NestJS Telegram AI Assistant (Telebot)**.

Hệ thống tài liệu được thiết kế theo dạng module độc lập (Modular Documentation) nhằm giúp lập trình viên và AI nắm bắt nhanh kiến trúc, quy chuẩn phát triển, cách thêm công cụ AI mới và quy trình vận hành hệ thống.

---

## 🗺️ Bản Đồ Tài Liệu (Documentation Map)

```text
docs/
├── README.md                 # [Bản đồ tài liệu] - Mục lục & Lộ trình tìm hiểu
├── architecture.md           # [Kiến trúc] - Sơ đồ hệ thống, luồng dữ liệu & nguyên lý thiết kế
├── gemini-tools.md           # [AI & Tools] - Function Calling, System Instruction & viết Tool mới
├── google-integration.md     # [Google Workspace] - OAuth2, Calendar, Tasks & mở rộng API
├── telegram-bot.md           # [Telegram Bot] - Telegraf Update, Slash Commands, Typing & Auth Guard
├── deployment.md             # [DevOps & Deploy] - Docker, Coolify CI/CD, PM2 & Quản lý Secrets
└── development-workflow.md   # [Quy chuẩn code] - TypeScript, ESLint/Prettier, Testing & Git
```

---

## 📑 Hướng Dẫn Nhanh Theo Nhu Cầu

| Bạn muốn...                                        | Tài liệu cần đọc                                         | Nội dung chính                                                                                                |
| :------------------------------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Hiểu tổng quan hệ thống**                        | [architecture.md](/docs/architecture.md)                 | Sơ đồ tuần tự từ tin nhắn Telegram đến Google API, cơ chế Neo giờ thực tế, quản lý state.                     |
| **Tạo Tool Function Calling mới cho AI**           | [gemini-tools.md](/docs/gemini-tools.md)                 | Triển khai `GeminiTool`, định nghĩa JSON Schema, error boundary, fallback model.                              |
| **Tích hợp thêm API Google (Gmail, Drive...)**     | [google-integration.md](/docs/google-integration.md)     | Quản lý Google OAuth2, Scope, cơ chế refresh token, cấu hình Calendar / Tasks.                                |
| **Thêm Slash Command hoặc tùy biến giao diện Bot** | [telegram-bot.md](/docs/telegram-bot.md)                 | Xử lý `Update`, `AuthGuard`, cơ chế giữ trạng thái typing liên tục (`withTyping`), chia nhỏ tin nhắn an toàn. |
| **Deploy lên VPS hoặc cấu hình Docker / Coolify**  | [deployment.md](/docs/deployment.md)                     | Triển khai tự động với Coolify Webhook, chạy PM2, cấu hình `.gcp-saved-tokens.json`.                          |
| **Bắt đầu đóng góp code / Kiểm thử**               | [development-workflow.md](/docs/development-workflow.md) | Coding conventions, TypeScript types, Husky pre-commit, viết Unit/E2E test.                                   |

---

## ⚡ Lộ Trình Cho Developer Mới (Quick Onboarding)

1. **Bước 1**: Đọc [Kiến trúc hệ thống](/docs/architecture.md) để nắm được bức tranh tổng thể các tầng Module trong NestJS.
2. **Bước 2**: Thiết lập môi trường Local theo hướng dẫn tại [Triển khai & Vận hành](/docs/deployment.md#1-chạy-môi-trường-local).
3. **Bước 3**: Lấy key Telegram Bot và xác thực Google OAuth (`npm run auth`) theo [Tích hợp Google Workspace](/docs/google-integration.md#1-vòng-đời-google-oauth-20).
4. **Bước 4**: Thử tạo một tính năng mới theo hướng dẫn tại [AI & Function Calling](/docs/gemini-tools.md).
