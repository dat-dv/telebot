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

Các primitive dùng chung trong `apps/web/src/shared/ui/` chịu trách nhiệm panel/bảng tái sử dụng. Bảng phải dùng HTML semantic, căn phải số liệu, có trạng thái loading, rỗng và có dữ liệu; màn hình hẹp được phép cuộn ngang. Mỗi view tự quản lý cột nghiệp vụ, tải dữ liệu, lỗi và hành động.

Nút phải có focus rõ, độ tương phản đủ và lỗi phải kèm cách thử lại.
