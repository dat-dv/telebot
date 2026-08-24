# Kế hoạch Nâng Cấp Giao Diện UI Telegram Bot (Đầy Đủ Tool Calls)

## 1. Mục tiêu & Bối cảnh

- Nâng cấp toàn diện giao diện UI, bảng menu nút bấm (Inline Keyboards), danh sách lệnh (`setMyCommands`) và nội dung hướng dẫn (`/help`, `/start`) của Bot Telegram.
- Đảm bảo hiển thị đầy đủ, trực quan và dễ bấm cho **tất cả 6 nhóm công cụ (Tool Calls)** của trợ lý AI:
  1. 📅 **Lịch trình (Google Calendar)**: Tạo lịch, xem lịch hôm nay/7 ngày, xóa lịch.
  2. 📝 **Công việc (Google Tasks)**: Thêm to-do list (đơn/hàng loạt), tick xong 1-chạm.
  3. 💰 **Thu chi & Tài chính (Finance & Receipt OCR)**: Ghi chép chi tiêu bằng text/voice/ảnh hóa đơn, xem thống kê hôm nay/tháng.
  4. 💳 **Công nợ & Danh bạ (Debts & Contacts)**: Ghi nợ, cho vay, trả nợ từng phần, quản lý danh bạ.
  5. ⏰ **Lời nhắc & Gọi điện (Reminders & Flash-Call)**: Hẹn giờ nhắc nhở qua tin nhắn & gọi nhá máy Telegram.
  6. 📊 **Dashboard & Quản trị**: Mở Web Dashboard trực quan, quản lý thành viên (`/invite`, `/users`, `/ban`).

---

## 2. Các thay đổi dự kiến

### Component: Telegram Menu Catalog (`apps/api/src/telegram/telegram-menu.catalog.ts`)

#### [MODIFY] telegram-menu.catalog.ts

- Bổ sung mục `reminders` (`command: 'reminders'`, `label: '⏰ Lời nhắc'`, `callbackData: 'action:view_reminders'`) vào danh mục menu chính (`PRIMARY_MENU_ITEMS`).
- Cập nhật icon và mô tả lệnh chuẩn hóa cho Telegram Command Menu.

---

### Component: Telegram UI Service (`apps/api/src/telegram/services/telegram-ui.service.ts`)

#### [MODIFY] telegram-ui.service.ts

- Bổ sung `buildRemindersMarkup(reminders)`: Hiển thị danh sách lời nhắc kèm nút bấm hủy/xóa lời nhắc 1-chạm.
- Bổ sung `buildToolCategoriesMarkup()`: Bảng nút phân loại tính năng (Lịch trình, Việc cần làm, Thu chi, Công nợ, Lời nhắc, Dashboard).
- Cập nhật `buildMainMenuInlineMarkup()` sắp xếp các nút bấm đẹp mắt, đối xứng (2 cột) bao gồm tất cả các nhóm công cụ.

---

### Component: Telegram Update Handlers (`apps/api/src/telegram/telegram.update.ts`)

#### [MODIFY] telegram.update.ts

- Bổ sung `@Command('reminders')` / `@Command('reminder')` và handler `onRemindersList()`: Lấy danh sách lời nhắc sắp tới của người dùng và hiển thị giao diện kèm nút bấm.
- Bổ sung Action Handler `@Action('action:view_reminders')` và `@Action('action:refresh_reminders')`.
- Nâng cấp nội dung hiển thị của `@Command('help')` và `@Command('start')` với đầy đủ ví dụ câu lệnh mẫu cho từng Tool Call (ghi âm giọng nói, gửi ảnh hóa đơn, nhắc nợ, đặt lịch...).

---

## 3. Kế hoạch Kiểm tra (Verification Plan)

### Automated Verification

- Chạy kiểm tra typecheck, linting và build API:
  ```bash
  npm run typecheck
  npm run lint
  npm run build:api
  npm run agent-system:validate
  ```

### Manual Verification

- Khởi động backend API.
- Trên Telegram:
  - Gõ `/start` và `/help` để xác nhận menu hiển thị đầy đủ 6 nhóm công cụ cùng dàn nút bấm đẹp mắt.
  - Bấm vào nút `⏰ Lời nhắc`, `💰 Thu chi`, `💳 Vay & cho vay`, `📝 Việc cần làm`, `📅 Lịch hôm nay`, `📊 Tổng quan` để kiểm tra phản hồi tức thì.
