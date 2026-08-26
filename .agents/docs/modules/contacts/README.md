---
metadata:
  agent-artifact:
    id: docs-module-contacts
    type: documentation
    depends_on:
      - .agents/knowledge/modules/contacts/README.md
---

# Module danh bạ công nợ & địa chỉ đối tác (Contacts)

`apps/web/src/modules/contacts` hiển thị danh bạ công nợ và địa chỉ quán/đối tác của đúng người dùng đang đăng nhập.

- **API & Endpoints**:
  - `getContacts`: gọi `GET /api/contacts` (`API_ROUTES.contacts`) qua HTTP client đã xác thực.
  - `updateContact`: gọi `PATCH /api/contacts/:id` lưu thông tin sửa trực tiếp (Tên, Biệt danh, Địa chỉ quán/Ghi chú).
  - `combineContacts`: gọi `POST /api/contacts/combine` (`API_ROUTES.contactsCombine`) gộp các liên hệ nguồn vào liên hệ chính và di chuyển công nợ tương ứng.
- **Cache & Mutations**:
  - `useContactsQuery` quản lý query key danh bạ.
  - `useUpdateContactMutation` và `useCombineContactsMutation` tự động làm mới query key `contacts`, `debts`, và `dashboard`.
- **Giao diện & Thao tác (UI/UX)**:
  - Giao diện và dialog modal được chuẩn hóa 100% bằng Tailwind CSS utility classes, hỗ trợ chế độ dark mode (`dark:`) toàn diện. Toàn bộ liên kết ngoài (số điện thoại, địa chỉ Google Maps) mở trong tab mới với thuộc tính an toàn `target="_blank" rel="noopener noreferrer"`. Tiêu đề trang (tên trang, mô tả, nút Làm mới, nút Đăng xuất) do `WorkspaceHeader` trong common private layout cung cấp — `ContactsScreen` **không tự render header riêng**.
  - **Chỉnh sửa trực tiếp (Inline Edit)**: Nhấp đúp hoặc bấm nút Sửa trên từng dòng để sửa trực tiếp Tên, Biệt danh, Địa chỉ quán. Hỗ trợ phím `Enter` (Lưu), `Escape` (Hủy). Cột thao tác cố định `minWidth: 130px` với `flex-nowrap whitespace-nowrap` và nút bấm `shrink-0` chống rớt dòng khi chuyển đổi trạng thái sửa/xem.
  - **Scroll ngang (Horizontal Scroll)**: Cố định độ rộng tối thiểu cho các cột, đảm bảo hiển thị đẹp và cuộn ngang mượt mà trên mọi thiết bị.
  - **Gộp liên hệ (Combine Contacts)**: Tích chọn từ 2 liên hệ trở lên để mở cửa sổ dialog gộp liên hệ, chọn liên hệ đích, chỉnh sửa tên/địa chỉ gộp và xác nhận an toàn.
  - Giữ đủ 4 trạng thái loading skeleton, rỗng, thành công và lỗi kèm nút Thử lại, toast thông báo kết quả.
