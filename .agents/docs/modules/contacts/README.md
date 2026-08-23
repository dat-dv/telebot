---
metadata:
  agent-artifact:
    id: docs-module-contacts
    type: documentation
    depends_on:
      - .agents/knowledge/modules/contacts/README.md
---

# Module danh bạ công nợ

`apps/web/src/modules/contacts` hiển thị danh bạ công nợ của đúng người dùng đang đăng nhập.

- API: `getContacts` gọi `API_ROUTES.contacts` qua HTTP client đã xác thực.
- Cache: `useContactsQuery` quản lý query key và hủy request khi cần; nút Làm mới invalidate key này.
- UI: Bảng có tên, biệt danh, mô tả và ngày tạo (format đa ngôn ngữ theo locale); hỗ trợ thanh tìm kiếm nhanh tức thì theo tên và ghi chú; giữ đủ 4 trạng thái loading, rỗng, thành công và lỗi có thể thử lại.
- Trên desktop, canvas báo cáo và bảng trải hết chiều ngang còn lại sau thanh điều hướng; trên màn hình hẹp bảng cuộn ngang bên trong panel.

Nếu danh bạ tải thất bại, kiểm tra phiên dashboard và phản hồi API trước; không thêm token trực tiếp vào component.
