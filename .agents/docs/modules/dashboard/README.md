---
metadata:
  agent-artifact:
    id: docs-module-dashboard
    type: documentation
    depends_on:
      - .agents/knowledge/modules/dashboard/README.md
---

# Module dashboard

`apps/web/src/modules/dashboard` hiển thị trang Tổng quan và Thống kê từ payload dashboard đã xác thực.

- API/cache: `getDashboard` gọi `API_ROUTES.dashboard`; `useDashboardQuery` là nguồn query key duy nhất, chấp nhận tùy chọn `{ enabled?: boolean }` để kiểm soát thời điểm kích hoạt truy vấn. Nút Làm mới phải invalidate key này và key `['finance-analytics']`.
- UI: Chuẩn **Flat Enterprise + Data-Dense B2B SaaS + Excel-lite interaction**, xây dựng 100% bằng Tailwind CSS utility classes, mở rộng 100% Fullscreen (không giới hạn container max-width), bo góc tối giản 2px–4px. Toàn bộ liên kết ngoài (như link sự kiện Google Calendar, tài liệu ngoại vi) mở trong tab mới an toàn (`target="_blank" rel="noopener noreferrer"`). Luôn giữ skeleton khi tải, trạng thái rỗng rõ ràng, cảnh báo có nút thử lại khi lỗi (sử dụng component `SessionStateScreen` với các nút Mở lại Telegram Bot, Xóa phiên & Thử lại hoặc Đóng Telegram Mini App), và các bảng dữ liệu dày khi thành công với header dính (`sticky table header`).
- Trang Báo cáo & Phân tích trực quan (`/analytics` - `AnalyticsScreen`):
  - Phân chia thành **5 Sub-tabs chuyên biệt** kèm đồng bộ URL query (`?tab=charts|cashflow|spending|debts|records`):
    - **Tổng quan biểu đồ (`charts`)**: 5 thẻ KPI tóm tắt (Tổng thu, Tổng chi, Tiết kiệm ròng, % Tích lũy, Vị thế nợ) + Lưới 3 biểu đồ chính (Dòng tiền 7 cột, Donut chi tiêu 5 cột, Cơ cấu nợ 5 cột).
    - **Xu hướng dòng tiền (`cashflow`)**: Không gian biểu đồ Dòng tiền 12 cột full-width cỡ lớn (chiều cao 260px) + 5 thẻ chỉ số tài chính (Tổng thu, Tổng chi, Thặng dư ròng, Thu nhập TB/ngày, Chi tiêu TB/ngày) + Bảng tổng hợp chi tiết dòng tiền theo từng mốc thời gian (`DataTable` gồm Mốc thời gian, Thu vào, Chi ra, Thặng dư/Thâm hụt).
    - **Cơ cấu chi tiêu (`spending`)**: Biểu đồ Donut chi tiêu lớn (240px) + Bảng phân bổ % theo nhóm danh mục và số tiền.
    - **Cơ cấu công nợ (`debts`)**: Biểu đồ cơ cấu nợ (Phải thu vs Phải trả) + Bảng danh sách công nợ đang mở với tìm kiếm và trả nợ nhanh.
    - **Dữ liệu chi tiết (`records`)**: Bảng giao dịch và công nợ chi tiết hỗ trợ tìm kiếm, sửa trực tiếp trên dòng (inline edit), xóa và ghi nhận thanh toán.
  - Tích hợp bộ lọc thời gian đa tầng `PeriodFilterToolbar` với `usePeriodFilter` (`day`, `week`, `month`, `quarter`, `year`, `all`), đồng bộ URL query parameters (`?period=...&ref=...`).
  - Gọi API `GET /api/finance/analytics` qua hook `useFinanceAnalyticsQuery({ startAt, endAt, grain })` để tổng hợp số liệu trực tiếp từ database.
  - Bộ ba biểu đồ Native SVG (cực nhẹ, tự điều chỉnh theo theme Dark/Light):
    - `CashflowTrendChart`: Biểu đồ cột kép Thu (xanh lam) / Chi (vàng cam) kết hợp đường xu hướng Số dư ròng (tím) và tooltip tương tác khi hover.
    - `CategoryDonutChart`: Biểu đồ Donut SVG phân bổ tỷ trọng chi tiêu từng danh mục (Top 5 danh mục nhiều nhất + nhóm Khác) kèm thanh tiến độ tỷ lệ % và số tiền.
    - `DebtStructureChart`: Biểu đồ thanh tỷ lệ đối sánh và cột ngang so sánh công nợ theo Top đối tác vay (Phải trả) và cho vay (Phải thu).
- Tất cả bảng dữ liệu tác nghiệp—bao gồm Thu chi (`TransactionsScreen`), Công việc (`TasksScreen`), Lịch (`CalendarScreen`), Nhắc nhở (`RemindersScreen`), và các bảng phân tích (`AnalyticsScreen` gồm giao dịch và công nợ)—đều sử dụng các component **Common Table dùng chung** (`TransactionsTable`, `DebtsTable`, `TasksTable`, `RemindersTable`, `CalendarTable`) để đảm bảo tính nhất quán và hiển thị đầy đủ số hàng, số cột trên mọi trang. Các bảng hỗ trợ chỉnh sửa trực tiếp trên dòng (`inline row editing`) khi nhấp đúp chuột hoặc bấm nút Sửa (✎), tích hợp menu gợi ý danh mục tự động (`<datalist>` thông minh kết hợp danh mục cấu hình người dùng từ `useCategoriesQuery()` và lịch sử giao dịch thích ứng theo Loại giao dịch: Thu/Chi), đi kèm cột thao tác (`actions` có `minWidth: 130px`, `flex-nowrap whitespace-nowrap` và nút bấm `shrink-0` chống rớt dòng), nút Lưu/Hủy/Xóa/Trả nợ nhanh, phím tắt `Enter`/`Escape` và thông báo toast phản hồi thao tác. Màn hình Lịch (`CalendarScreen`) hỗ trợ nút chuyển đổi chế độ xem linh hoạt giữa ma trận Lịch tháng trực quan (`CalendarGrid` với huy hiệu sự kiện, chọn ngày nhanh, sửa/xóa sự kiện tại chỗ) và dạng bảng cô đọng (`CalendarTable`), đi kèm cụm điều hướng tháng (Trước/Sau/Hôm nay) và tìm kiếm tức thì. Ở dạng bảng, cột **Mô tả** mặc định gọn, tự xuống hàng; người dùng kéo mép header để đổi độ rộng cột và mỗi bảng ghi nhớ độ rộng theo `DataTable` id trên trình duyệt. Khi đổi tháng, màn hình lấy trực tiếp toàn bộ khoảng dữ liệu của lưới tháng đang xem; không dùng dữ liệu lịch tóm tắt từ dashboard làm dự phòng. Nút làm mới phải xóa mọi biến thể cache lịch theo khoảng thời gian và cache dashboard để dữ liệu không bị cũ. Tất cả bảng dữ liệu đều có thanh công cụ tìm kiếm nhanh (Search toolbar), bộ lọc tức thì và hỗ trợ cấu hình ẩn/hiện cột có ghi nhớ trạng thái (Column visibility persistence với `id="transactions"`, `id="analytics-transactions"`, `id="analytics-debts"` và `id="tasks"`), độ rộng tối thiểu cột `minWidth` và thanh tiến độ trực quan theo tỷ lệ tiền tệ. Số liệu tài chính định dạng `tabular-nums`. Trên desktop, thanh điều hướng là Sidebar quản trị cố định bên trái; trên màn hình nhỏ (<= 960px), giao diện chuyển đổi linh hoạt thành Mobile Topbar dính trên đầu cùng nút Hamburger Button mở rộng Navigation Drawer trượt từ bên trái với Backdrop làm mờ nền. Không hiển thị nhãn trạng thái kết nối Google cố định ở sidebar hoặc tiêu đề; trạng thái này chỉ dùng để chọn thông điệp rỗng phù hợp cho Lịch và Việc cần làm. Màu xanh/vàng/đỏ chỉ biểu thị số liệu tốt/cần theo dõi/âm. Cuối sidebar/drawer có nút đổi giao diện sáng/tối và chuyển đổi ngôn ngữ (Tiếng Việt/English); lựa chọn được lưu trong trình duyệt, lần đầu sẽ theo cài đặt hệ thống.
- Ẩn/hiện số tiền nhạy cảm toàn ứng dụng: Component `WorkspaceHeader` được render **một lần duy nhất** trong common private layout (`apps/web/app/(private)/layout.tsx`), tích hợp nút `Ẩn số tiền` / `Hiện số tiền` (`MoneyVisibilityProvider`). **Các screen file trong từng module tuyệt đối không tự render `<WorkspaceHeader>` riêng.** Trạng thái mặc định là **Ẩn (`false`)** khi mới truy cập để bảo vệ quyền riêng tư, và tùy chọn của người dùng được lưu trong `localStorage` (`telebot-money-visibility`). Khi bật chế độ ẩn, các số tiền ở thẻ KPI, cột bảng, footer tổng kết và tooltip biểu đồ được che bằng mặt nạ `'••••••'`; riêng các ô input khi đang sửa trực tiếp (inline edit) vẫn giữ số thực để người dùng thao tác bình thường.
- Đăng xuất: gọi API logout, xóa token qua module `auth`, xóa cache query rồi chuyển hướng về `${APP_ROUTES.home}?status=logged_out` để hiển thị màn hình Đã đăng xuất thành công qua `SessionStateScreen`.

## Nơi chốn trong bảng Thu chi & Trang Quản lý Nơi chốn (/places)

- **Cột Nơi chốn trên bảng Thu chi**: Bảng Thu chi có cột **Nơi chốn** để hiển thị quán ăn, cửa hàng hoặc địa điểm của phát sinh. Trường sửa nhanh dùng combobox lấy danh sách `/api/places`, vẫn cho phép gõ tên mới để backend tạo/tái sử dụng nơi chốn. Tìm kiếm bảng bao gồm cả tên nơi chốn. Khi xóa nội dung trường này rồi lưu, client gửi `placeId: null` để chỉ gỡ liên kết, không xóa giao dịch hay lịch sử nơi chốn.
- **Trang Quản lý Nơi chốn & Địa điểm (`/places` - `PlacesScreen`)**:
  - Cung cấp màn hình quản lý độc lập cho danh mục địa điểm, quán ăn, cửa hàng và bệnh viện.
  - Bảng dữ liệu sử dụng `DataTable` (`id="places"`), tự động tích hợp 2 cột hệ thống bắt buộc `STT` và `ID`, đi cùng các cột nghiệp vụ: `Tên nơi chốn / Địa điểm` (hỗ trợ double-click inline edit, phím tắt `Enter`/`Escape`), `Thời gian tạo`, `Hoạt động` (Sửa, Xóa).
  - Hỗ trợ thêm nhanh nơi chốn mới qua nút `+ Thêm nơi chốn` trên toolbar, tìm kiếm theo thời gian thực và xác nhận xóa an toàn 2 bước inline.
  - Tích hợp vào thanh điều hướng Sidebar dưới mục **DỮ LIỆU** (`nav.section.data`) với icon định vị chuẩn.
- **Cơ chế Migration chuyển đổi dữ liệu cũ**:
  - Script migration TypeORM `1724660000000-MigrateLegacyPlaceContacts.ts` tự động chạy khi khởi động backend (`migrationsRun: true`).
  - Tự động backfill các địa điểm cũ từ `debt_contacts` sang `finance_places` (xử lý trùng lặp bằng `DISTINCT ON` và `UNIQUE INDEX`), chuyển đổi `place_id` cho `finance_transactions` và dọn dẹp các bản ghi địa điểm thừa khỏi `debt_contacts` để trả lại danh bạ cá nhân sạch sẽ.

## Cấu hình production

## Combobox Danh mục Thu chi

Khi sửa trực tiếp một giao dịch, trường **Danh mục** dùng combobox autocomplete thay cho `<datalist>`. Click hoặc focus để mở danh sách; gõ để lọc; dùng `ArrowUp`/`ArrowDown` và `Enter` để chọn. `Escape` đầu tiên đóng danh sách, `Escape` tiếp theo hủy sửa dòng. Danh sách lấy danh mục mặc định theo Thu/Chi, danh mục do người dùng cấu hình và lịch sử giao dịch; vẫn cho phép nhập danh mục mới. Menu được render nổi để không bị cắt bởi vùng cuộn của bảng.

- `NEXT_PUBLIC_API_URL=https://telebot.datintech.site`, không thêm `/api`, vì hằng `API_ROUTES` đã có tiền tố này.
- Static export không có API route của Next.js. Nginx phải chuyển `https://telebot.datintech.site/api/*` sang NestJS và trả `apps/web/out` cho mọi route khác.
- Khi thay đổi `NEXT_PUBLIC_API_URL`, build lại image/web bundle vì biến này được đóng gói tại build-time.
- Nút Dashboard trong `/help` và `/start` là callback: mỗi lần bấm, bot cấp link dùng một lần mới trong tin nhắn phản hồi. Người dùng bấm link mới để mở dashboard; không bấm lại URL cũ.

## Chạy local và xử lý lỗi link

- Chạy đồng thời `npm run dev:api` (cổng `3000`) và `npm run dev:web` (cổng `5173`). Khi dev, Next chuyển `/api/*` từ `http://localhost:5173` sang `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:3000`), nên link Dashboard local có thể dùng cùng origin `5173`.
- Link exchange hợp lệ redirect sang `/` (kèm `#dashboard_token=...`). Link thiếu token, hết hạn hoặc đã dùng trả trang HTML tiếng Việt với HTTP `401`, hướng dẫn bấm lại nút Dashboard trên Telegram.
- Nếu API cổng `3000` đang tắt, Next rewrite không thể tự dựng trang `503`; hãy khởi động `npm run dev:api`. Production dùng Nginx để proxy API và không dùng rewrite của Next.

Khi dữ liệu dashboard sai hoặc rỗng, kiểm tra DTO/API trước khi sửa cột hiển thị. Các bảng dùng primitive trong `src/shared/ui`, không tạo lại primitive riêng trong module.
