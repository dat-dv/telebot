# Kế hoạch triển khai: Nâng cấp màn hình Phiên làm việc (Session Expired & Logged Out) và Luồng Đăng xuất

Tài liệu này mô tả chi tiết phương án xử lý vấn đề màn hình báo lỗi khi hết hạn phiên làm việc hoặc sau khi đăng xuất, đồng thời cung cấp các nút thao tác nhanh: **Quay lại Telegram Bot**, **Xóa phiên & Thử lại**, và **Xem trang giới thiệu**.

---

## 1. Bối cảnh & Vấn đề hiện tại

1. **Vòng lặp lỗi khi bấm "Thử lại"**: Khi token truy cập (`localStorage`) hết hạn hoặc refresh token cookie không còn hiệu lực (hoặc đã bị xóa khi logout), API trả về mã lỗi HTTP `401 Unauthorized`. Màn hình hiện tại chỉ có một nút "Thử lại" (`invalidateQueries`). Khi bấm thử lại, yêu cầu lại thất bại do không có thông tin xác thực mới, tạo thành vòng lặp vô tận.
2. **Thiếu liên kết mở lại Telegram Bot**: Người dùng cần mở lại bot Telegram để lấy link đăng nhập mới hoặc mở trực tiếp WebApp, nhưng hiện tại giao diện không có nút/liên kết dẫn về Telegram Bot.
3. **Màn hình sau khi Đăng xuất (Logout)**: Khi người dùng bấm nút "Đăng xuất" ở `WorkspaceHeader`, ứng dụng chuyển hướng về `/` và ngay lập tức hiển thị cảnh báo đỏ *"Không mở được trang - Phiên làm việc đã hết hạn"* thay vì một màn hình thông báo Đã đăng xuất trang trọng, thân thiện.
4. **Khả năng tương thích Telegram Mini App**: Khi người dùng mở Dashboard bên trong Telegram WebApp (`window.Telegram.WebApp`), cần hỗ trợ nút bấm đóng Mini App hoặc chuyển hướng về cuộc trò chuyện với bot.

---

## 2. Giải pháp kỹ thuật đề xuất

### 2.1. Bổ sung từ điển đa ngôn ngữ (`@telebot/contracts`)
Định nghĩa đầy đủ các translation key cho cả Tiếng Việt (`vi`) và Tiếng Anh (`en`) theo quy tắc `i18n-no-hardcoded-user-text.md`:
- `auth.loggedOut.title`: *"Đã đăng xuất thành công"* / *"Logged out successfully"*
- `auth.loggedOut.desc`: *"Phiên làm việc của bạn đã kết thúc an toàn. Hãy mở lại từ Telegram bot để bắt đầu phiên mới."* / *"Your session has ended securely. Please open again from the Telegram bot to start a new session."*
- `auth.sessionExpired.title`: *"Phiên làm việc đã hết hạn"* / *"Session expired"*
- `auth.sessionExpired.desc`: *"Phiên truy cập đã hết hạn hoặc không tìm thấy thông tin đăng nhập. Hãy mở lại từ Telegram bot."* / *"Your access session has expired or no credentials were found. Please open again from the Telegram bot."*
- `auth.openTelegramBot`: *"Mở Telegram Bot"* / *"Open Telegram Bot"*
- `auth.clearSessionAndRetry`: *"Xóa phiên & Thử lại"* / *"Clear session & retry"*
- `auth.backToAbout`: *"Xem trang giới thiệu"* / *"About Telebot"*
- `auth.closeMiniApp`: *"Đóng cửa sổ"* / *"Close window"*

### 2.2. Xây dựng Component `SessionStateScreen` (`apps/web/src/modules/auth/view/session-state-screen.tsx`)
Tạo component giao diện chuyên dụng để xử lý cả 2 trạng thái: `expired` (hoặc lỗi 401) và `logged_out`:
- **Thiết kế UI chuẩn Enterprise / Dark & Light Mode**: Sử dụng icon trực quan, bố cục căn giữa tinh tế, phân tách rõ ràng giữa Primary CTA và Secondary Actions.
- **Nút hành động chính (Primary Button)**:
  - Nút **"Mở Telegram Bot"**: Điều hướng tới Telegram URL (`process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL` hoặc `https://t.me/${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}` hoặc fallback `https://t.me`).
  - Nếu phát hiện môi trường Telegram WebApp (`window.Telegram?.WebApp`), cung cấp thêm nút **"Đóng cửa sổ"** (`Telegram.WebApp.close()`).
- **Nút hành động phụ (Secondary Button)**:
  - Nút **"Xóa phiên & Thử lại"**: Thực hiện `clearAccessToken()`, xóa bộ nhớ đệm QueryClient (`queryClient.clear()`), xóa các query param thừa và tải lại trang để thử lại một phiên hoàn toàn sạch sẽ.
- **Liên kết phụ (Tertiary Link)**:
  - Link dẫn về trang Giới thiệu [`APP_ROUTES.about`](file:///Users/datdoan/Documents/projects/telebot/apps/web/app/about/page.tsx).

### 2.3. Cải thiện luồng Đăng xuất trong `WorkspaceHeader` (`apps/web/src/shared/ui/workspace-header.tsx`)
- Khi người dùng bấm "Đăng xuất":
  1. Gửi request `POST /api/logout` để xóa cookie `reports_refresh` phía server.
  2. Thực hiện `clearAccessToken()`.
  3. Xóa sạch React Query cache (`queryClient.clear()`).
  4. Điều hướng tới `/?status=logged_out` (sử dụng `window.location.assign(`${APP_ROUTES.home}?status=logged_out`)`).

### 2.4. Tích hợp `SessionStateScreen` vào các trang giao diện (`apps/web`)
- **`DashboardHomeScreen` (`apps/web/src/modules/dashboard/view/dashboard-home-screen.tsx`)**:
  - Kiểm tra query param `status === 'logged_out'` để hiển thị ngay màn hình Đã đăng xuất (tránh phát sinh request không cần thiết).
  - Khi `dashboard.isError` (mã 401 hoặc lỗi tải dữ liệu), render `SessionStateScreen` với chế độ `expired`.
- **`AnalyticsScreen` (`apps/web/src/modules/dashboard/view/analytics-screen.tsx`)**:
  - Tương tự, khi `isError` xảy ra, render `SessionStateScreen` thay vì alert đỏ đơn giản.
- **Các màn hình danh sách khác (`DebtsScreen`, `ExpensesScreen`, `ContactsScreen`, `CalendarScreen`, `TasksScreen`, `RemindersScreen`, `SettingsScreen`)**:
  - Đảm bảo hiển thị nhất quán với liên kết mở lại bot và nút xóa phiên/thử lại.

### 2.5. Cấu hình & Biến môi trường
- Cập nhật `.env.example` với các biến public tùy chọn:
  - `NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/` (hoặc `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=`)

---

## 3. Danh sách các file dự kiến thay đổi

### Component 1: Gói dùng chung Contract & i18n (`packages/contracts`)
#### [MODIFY] [index.ts](file:///Users/datdoan/Documents/projects/telebot/packages/contracts/src/index.ts)
- Bổ sung translation keys cho `auth.loggedOut.*`, `auth.sessionExpired.*`, `auth.openTelegramBot`, `auth.clearSessionAndRetry`, `auth.backToAbout`, `auth.closeMiniApp` cho cả `vi` và `en`.

---

### Component 2: Frontend Web App (`apps/web`)
#### [NEW] [session-state-screen.tsx](file:///Users/datdoan/Documents/projects/telebot/apps/web/src/modules/auth/view/session-state-screen.tsx)
- Tạo component `SessionStateScreen` xử lý hiển thị trạng thái đăng xuất và hết hạn phiên, có nút mở Telegram Bot, nút Xóa phiên & Thử lại, và hỗ trợ Telegram WebApp close.

#### [MODIFY] [workspace-header.tsx](file:///Users/datdoan/Documents/projects/telebot/apps/web/src/shared/ui/workspace-header.tsx)
- Cập nhật hàm `handleLogout` chuyển hướng về `/?status=logged_out`.

#### [MODIFY] [dashboard-home-screen.tsx](file:///Users/datdoan/Documents/projects/telebot/apps/web/src/modules/dashboard/view/dashboard-home-screen.tsx)
- Tích hợp `SessionStateScreen` khi có `status=logged_out` hoặc khi `isError`.

#### [MODIFY] [analytics-screen.tsx](file:///Users/datdoan/Documents/projects/telebot/apps/web/src/modules/dashboard/view/analytics-screen.tsx)
- Tích hợp `SessionStateScreen` khi `isError`.

#### [MODIFY] [.env.example](file:///Users/datdoan/Documents/projects/telebot/.env.example)
- Bổ sung mô tả cho `NEXT_PUBLIC_TELEGRAM_BOT_URL` / `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.

---

### Component 3: Tài liệu & Knowledge Sync
#### [MODIFY] [.agents/knowledge/modules/auth/README.md](file:///Users/datdoan/Documents/projects/telebot/.agents/knowledge/modules/auth/README.md) (English)
- Cập nhật tài liệu kỹ thuật về Session State Screen, Logout flow, và Telegram Bot redirection.

#### [MODIFY] [.agents/docs/modules/auth/README.md](file:///Users/datdoan/Documents/projects/telebot/.agents/docs/modules/auth/README.md) (Vietnamese)
- Cập nhật tài liệu hướng dẫn phát triển về luồng đăng xuất và xử lý hết hạn phiên.

---

## 4. Kế hoạch kiểm thử & Xác minh

### Automated Quality Gates
1. `npm run agent-system:validate`: Kiểm tra tính toàn vẹn hệ thống và liên kết tài liệu.
2. `npm run typecheck`: Đảm bảo 100% strict type safety và Zero-Any.
3. `npm run lint`: Đảm bảo quy chuẩn code style và format.
4. `npm run build`: Kiểm tra build tĩnh Next.js thành công.

### Manual Verification Flows
1. **Kiểm tra luồng Hết hạn phiên (Session Expired)**:
   - Xóa `localStorage` và cookie `reports_refresh` trong DevTools rồi mở trang chủ `/`.
   - Xác nhận màn hình "Phiên làm việc đã hết hạn" hiển thị đẹp mắt, rõ ràng.
   - Bấm nút "Mở Telegram Bot" -> xác nhận link mở đúng Telegram bot.
   - Bấm nút "Xóa phiên & Thử lại" -> xác nhận xóa cache sạch sẽ và tải lại trang.
2. **Kiểm tra luồng Đăng xuất chủ động (Logout)**:
   - Khi đang đăng nhập, bấm nút "Đăng xuất" trên thanh Workspace Header.
   - Xác nhận ứng dụng chuyển đến màn hình "Đã đăng xuất thành công".
   - Xác nhận không còn báo lỗi đỏ "Không mở được trang".
