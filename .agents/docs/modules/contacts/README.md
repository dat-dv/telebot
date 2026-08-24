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
  - **Chỉnh sửa trực tiếp (Inline Edit)**: Nhấp đúp hoặc bấm nút Sửa trên từng dòng để sửa trực tiếp Tên, Biệt danh, Địa chỉ quán. Hỗ trợ phím `Enter` (Lưu), `Escape` (Hủy).
  - **Scroll ngang (Horizontal Scroll)**: Cố định độ rộng tối thiểu cho các cột, đảm bảo hiển thị đẹp và cuộn ngang mượt mà trên mọi thiết bị.
  - **Gộp liên hệ (Combine Contacts)**: Tích chọn từ 2 liên hệ trở lên để mở cửa sổ dialog gộp liên hệ, chọn liên hệ đích, chỉnh sửa tên/địa chỉ gộp và xác nhận an toàn.
  - Giữ đủ 4 trạng thái loading skeleton, rỗng, thành công và lỗi kèm nút Thử lại, toast thông báo kết quả.

