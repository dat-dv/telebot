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

- API/cache: `getDashboard` gọi `API_ROUTES.dashboard`; `useDashboardQuery` là nguồn query key duy nhất. Nút Làm mới phải invalidate key này.
- UI: Chuẩn **Flat Enterprise + Data-Dense B2B SaaS + Excel-lite interaction**, mở rộng 100% Fullscreen (không giới hạn container max-width), bo góc tối giản 2px–4px. Luôn giữ skeleton khi tải, trạng thái rỗng rõ ràng, cảnh báo có nút thử lại khi lỗi, và các bảng dữ liệu dày khi thành công với header dính (`sticky table header`). Màn hình giao dịch và thống kê tích hợp bộ lọc chu kỳ linh hoạt (`PeriodFilterToolbar` với các mốc tuần/tháng/quý/năm/tất cả) cùng thanh tổng quan xu hướng (`TrendSummaryStrip` kết hợp `MicroBarChart`). Tất cả bảng dữ liệu tác nghiệp—bao gồm Thu chi (`TransactionsScreen`), Công việc (`TasksScreen`), và các bảng phân tích (`AnalyticsScreen` gồm giao dịch và công nợ)—đều hỗ trợ chỉnh sửa trực tiếp trên dòng (`inline row editing`) khi nhấp đúp chuột hoặc bấm nút Sửa (✎), tích hợp menu gợi ý danh mục tự động (`<datalist>` thông minh kết hợp danh mục cấu hình người dùng từ `useCategoriesQuery()` và lịch sử giao dịch thích ứng theo Loại giao dịch: Thu/Chi), đi kèm cột thao tác (`actions`), nút Lưu/Hủy/Xóa/Trả nợ nhanh, phím tắt `Enter`/`Escape` và thông báo toast phản hồi thao tác. Màn hình Lịch (`CalendarScreen`) hỗ trợ nút chuyển đổi chế độ xem linh hoạt giữa ma trận Lịch tháng trực quan (`CalendarGrid` với huy hiệu sự kiện, chọn ngày nhanh, sửa/xóa sự kiện tại chỗ) và dạng bảng cô đọng (`DataTable`), đi kèm cụm điều hướng tháng (Trước/Sau/Hôm nay) và tìm kiếm tức thì. Khi đổi tháng, màn hình lấy trực tiếp toàn bộ khoảng dữ liệu của lưới tháng đang xem; không dùng dữ liệu lịch tóm tắt từ dashboard làm dự phòng. Nút làm mới phải xóa mọi biến thể cache lịch theo khoảng thời gian và cache dashboard để dữ liệu không bị cũ. Tất cả bảng dữ liệu đều có thanh công cụ tìm kiếm nhanh (Search toolbar), bộ lọc tức thì và hỗ trợ cấu hình ẩn/hiện cột có ghi nhớ trạng thái (Column visibility persistence với `id="transactions"`, `id="analytics-transactions"`, `id="analytics-debts"` và `id="tasks"`), độ rộng tối thiểu cột `minWidth` và thanh tiến độ trực quan theo tỷ lệ tiền tệ. Số liệu tài chính định dạng `tabular-nums`. Trên desktop, thanh điều hướng là Sidebar quản trị cố định bên trái; trên màn hình nhỏ (<= 960px), giao diện chuyển đổi linh hoạt thành Mobile Topbar dính trên đầu cùng nút Hamburger Button mở rộng Navigation Drawer trượt từ bên trái với Backdrop làm mờ nền. Không hiển thị nhãn trạng thái kết nối Google cố định ở sidebar hoặc tiêu đề; trạng thái này chỉ dùng để chọn thông điệp rỗng phù hợp cho Lịch và Việc cần làm. Màu xanh/vàng/đỏ chỉ biểu thị số liệu tốt/cần theo dõi/âm. Cuối sidebar/drawer có nút đổi giao diện sáng/tối và chuyển đổi ngôn ngữ (Tiếng Việt/English); lựa chọn được lưu trong trình duyệt, lần đầu sẽ theo cài đặt hệ thống.
- Đăng xuất: gọi API logout, xóa token qua module `auth`, xóa cache rồi quay lại `APP_ROUTES.home`.

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
