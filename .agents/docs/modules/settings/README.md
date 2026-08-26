---
metadata:
  agent-artifact:
    id: docs-module-settings
    type: documentation
    depends_on:
      - .agents/knowledge/modules/settings/README.md
---

# Module Cài Đặt & Danh Mục

Tài liệu này ánh xạ trực tiếp với tri thức canonical [`README.md`](../../../knowledge/modules/settings/README.md).

Module `apps/web/src/modules/settings` cung cấp giao diện quản lý danh mục thu/chi và các tùy chọn cá nhân hóa cho người dùng dashboard.

- API: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` thao tác với `API_ROUTES.categories`. Các hooks TanStack Query (`useCategoriesQuery`, `useCreateCategoryMutation`, `useUpdateCategoryMutation`, `useDeleteCategoryMutation`) quản lý cache và tự động làm mới `categoriesQueryKeys.all`.
- UI: Màn hình `SettingsScreen` được xây dựng 100% bằng Tailwind CSS utility classes (hỗ trợ dark mode `dark:`) và gồm 2 tab chính:
  - Tab **Danh mục** (`categories`): Hai bảng `DataPanel` quản lý danh mục chi (`expense`) và danh mục thu (`income`). Hỗ trợ tìm kiếm theo tên, thêm nhanh danh mục mới, chỉnh sửa trực tiếp (inline edit) và xóa có xác nhận; các nút thao tác được cấu hình `flex-nowrap whitespace-nowrap` và `shrink-0` chống rớt dòng khi chuyển đổi trạng thái sửa/xem.
  - Tab **Tùy chọn** (`preferences`): Hiển thị thông tin ngôn ngữ (Tiếng Việt / English) và chủ đề giao diện (Sáng / Tối).
- Hỗ trợ đầy đủ 4 trạng thái giao diện: Đang tải, Rỗng, Thành công và Lỗi có nút thử lại.

Kiểm thử bằng `npm run typecheck`, `npm run lint` và `npm run build` tại thư mục gốc.
