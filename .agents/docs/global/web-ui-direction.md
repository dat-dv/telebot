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

Các primitive dùng chung trong `apps/web/src/shared/ui/` chịu trách nhiệm panel/bảng tái sử dụng. Trên desktop, bảng phải phủ hết chiều ngang bên trong panel; bảng dùng HTML semantic, căn phải số liệu, có trạng thái loading, rỗng và có dữ liệu. Trên màn hình hẹp, chỉ vùng bảng được phép cuộn ngang. Mỗi view tự quản lý cột nghiệp vụ, tải dữ liệu, lỗi và hành động.

Nút phải có focus rõ, độ tương phản đủ và lỗi phải kèm cách thử lại.

Thanh điều hướng báo cáo dùng chung (`apps/web/src/shared/ui/reports-navigation.tsx`) theo kiểu sidebar quản trị trên desktop: có dấu nhận diện sản phẩm, nhãn nhóm ngắn, icon đi cùng chữ và trạng thái trang đang mở. Khi thêm mục mới, luôn giữ nhãn chữ hiển thị, SVG chỉ là phần hỗ trợ quét nhanh, và đặt `aria-current="page"` cho mục active.

Trên màn hình hẹp, sidebar chuyển thành dải điều hướng cuộn ngang. Không đổi thành menu chỉ icon hoặc nhiều tầng; cần kiểm tra rằng mục active, hover và focus bàn phím vẫn dễ nhận biết, không làm tràn viewport.
