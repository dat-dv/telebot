---
metadata:
  agent-artifact:
    id: docs-global-web-ui-direction
    type: documentation
    depends_on:
      - .agents/knowledge/global/web-ui-direction.md
---

# Định hướng UI web dùng chung

Web dashboard là giao diện tác vụ cá nhân, ưu tiên dữ liệu dễ quét và thao tác gọn: một workspace phẳng, viền nhẹ, control nhỏ gọn; tránh card trang trí hoặc shadow nặng. Tailwind CSS v4 là lớp styling chuẩn cho UI mới và phần đã chuyển đổi: dùng các nhóm utility class dễ đọc tại layout/view, tái sử dụng component dùng chung cho pattern lặp lại và không bổ sung selector global legacy mới.

Các primitive dùng chung trong `apps/web/src/shared/ui/` chịu trách nhiệm panel/bảng tái sử dụng. Trên desktop, bảng phải phủ hết chiều ngang bên trong panel; bảng dùng HTML semantic, căn phải số liệu, có trạng thái loading, rỗng và có dữ liệu. Trên màn hình di động hẹp, bảng hỗ trợ cuộn ngang mượt mà (`min-width: max-content` kết hợp `minWidth` của từng cột) để đảm bảo các thông tin quan trọng (Số tiền, Thời gian, Badge trạng thái) không bao giờ bị bóp méo hoặc cắt cụt.

Thành phần `DataTable` tích hợp sẵn nút Cài đặt cột (`TableColumnSettings`) với menu popover cho phép người dùng bật/tắt hiển thị từng cột và tự động lưu cấu hình vào `localStorage` (`telebot:table-columns:<id>`). Mỗi dòng bắt buộc có trường `id`: `DataTable` tự thêm hai cột bắt buộc `STT` (số thứ tự theo danh sách đang hiển thị) và `ID` trước các cột nghiệp vụ; người dùng không thể ẩn hai cột này, còn ID dùng chữ mono gọn để dễ quét. Bảng tự sắp xếp sau khi lọc theo thời gian phát sinh nghiệp vụ: dữ liệu lịch sử ưu tiên mới nhất (`occurredAt`, rồi `paymentDate`, rồi `createdAt`), còn lịch/nhắc việc/công việc ưu tiên mốc sắp tới (`remindAt`, `startAt`, `dueAt`); dòng không có hạn nằm cuối. Mọi bảng có `id` cũng cho phép kéo mép phải của header để đổi độ rộng cột, lưu riêng theo `telebot:table-widths:<id>` và tự khôi phục khi tải lại trang; khi cần, view có thể tắt bằng `allowColumnResize={false}`. Mỗi view tự quản lý danh sách cột nghiệp vụ, tải dữ liệu, lỗi và hành động.

Nút phải có focus rõ, độ tương phản đủ và lỗi phải kèm cách thử lại.

Tiêu đề không gian làm việc (`WorkspaceHeader`) tích hợp nút chuyển đổi `Ẩn số tiền` / `Hiện số tiền` (`useMoneyVisibility`), nút Làm mới dữ liệu và Đăng xuất. Mặt nạ che số tiền (`'••••••'`) áp dụng đồng bộ cho các khối KPI, bảng dữ liệu và tooltip biểu đồ mà không lưu bền vào trình duyệt; các ô input khi đang sửa trực tiếp trên dòng (inline edit) vẫn giữ số thực để phục vụ thao tác.

Thanh điều hướng dùng chung (`apps/web/src/shared/ui/app-navigation.tsx`) theo kiểu sidebar quản trị trên desktop: phân thành 4 nhóm nghiệp vụ rõ ràng (TỔNG QUAN, TÀI CHÍNH, KẾ HOẠCH, DỮ LIỆU), có dấu nhận diện sản phẩm, icon đi cùng chữ và tự động nhận diện trạng thái trang đang mở theo `usePathname()`. Desktop dùng app shell giới hạn theo viewport: chỉ vùng main content được cuộn, còn sidebar luôn đứng yên bên cạnh. Khi thêm mục mới, luôn giữ nhãn chữ hiển thị qua hệ thống i18n, SVG chỉ là phần hỗ trợ quét nhanh, và đặt `aria-current="page"` cho mục active.

Trên màn hình hẹp (<= 960px), shell trở lại cơ chế cuộn trang bình thường và giao diện tự động chuyển đổi thành Mobile Topbar sticky trên cùng kết hợp nút Hamburger Button. Khi bấm vào, Drawer Menu điều hướng trượt mượt mà từ bên trái kèm Backdrop làm mờ nền; tự động đóng khi chọn link, bấm backdrop hoặc bấm Escape.

Dark mode được kích hoạt bằng `html[data-theme='dark']`; mọi utility dark của Tailwind phải dùng đúng data attribute này. Các bề mặt dùng chung — navigation desktop/mobile, workspace header, period toolbar và trang public/legal — bắt buộc có màu nền, viền, chữ, hover, active và focus phù hợp ở theme tối. Giữ trạng thái mục đang chọn dễ nhận biết và focus bàn phím màu xanh nhạt, đủ tương phản.
