---
metadata:
  agent-artifact:
    id: docs-global-web-ui-direction
    type: documentation
    depends_on:
      - .agents/knowledge/global/web-ui-direction.md
---

# Định hướng UI web dùng chung

Web dashboard là giao diện tác vụ cá nhân, ưu tiên dữ liệu dễ quét và thao tác gọn: một workspace phẳng, viền nhẹ, control nhỏ gọn; tránh card trang trí hoặc shadow nặng.

Các primitive dùng chung trong `apps/web/src/shared/ui/` chịu trách nhiệm panel/bảng tái sử dụng. Trên desktop, bảng phải phủ hết chiều ngang bên trong panel; bảng dùng HTML semantic, căn phải số liệu, có trạng thái loading, rỗng và có dữ liệu. Trên màn hình di động hẹp, bảng hỗ trợ cuộn ngang mượt mà (`min-width: max-content` kết hợp `minWidth` của từng cột) để đảm bảo các thông tin quan trọng (Số tiền, Thời gian, Badge trạng thái) không bao giờ bị bóp méo hoặc cắt cụt.

Thành phần `DataTable` tích hợp sẵn nút Cài đặt cột (`TableColumnSettings`) với menu popover cho phép người dùng bật/tắt hiển thị từng cột và tự động lưu cấu hình vào `localStorage` (`telebot:table-columns:<id>`). Các cột nhận diện quan trọng được thiết lập `hideable: false` để bảo vệ ngữ cảnh dữ liệu. Mỗi view tự quản lý danh sách cột nghiệp vụ, tải dữ liệu, lỗi và hành động.

Nút phải có focus rõ, độ tương phản đủ và lỗi phải kèm cách thử lại.

Thanh điều hướng dùng chung (`apps/web/src/shared/ui/app-navigation.tsx`) theo kiểu sidebar quản trị trên desktop: phân thành 4 nhóm nghiệp vụ rõ ràng (TỔNG QUAN, TÀI CHÍNH, KẾ HOẠCH, DỮ LIỆU), có dấu nhận diện sản phẩm, icon đi cùng chữ và tự động nhận diện trạng thái trang đang mở theo `usePathname()`. Khi thêm mục mới, luôn giữ nhãn chữ hiển thị qua hệ thống i18n, SVG chỉ là phần hỗ trợ quét nhanh, và đặt `aria-current="page"` cho mục active.

Trên màn hình hẹp (<= 960px), giao diện tự động chuyển đổi thành Mobile Topbar sticky trên cùng kết hợp nút Hamburger Button. Khi bấm vào, Drawer Menu điều hướng trượt mượt mà từ bên trái kèm Backdrop làm mờ nền; tự động đóng khi chọn link, bấm backdrop hoặc bấm Escape.

