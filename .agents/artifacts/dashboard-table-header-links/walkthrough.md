# Walkthrough: Gắn Liên Kết Chuyển Trang Tại Tiêu Đề Các Bảng Trên Trang Chủ

## Các thay đổi đã thực hiện

### 1. Thành phần `DataPanel` (`data-table.tsx`)

- Bổ sung prop tùy chọn `titleHref?: string`.
- Khi `titleHref` được truyền vào, tiêu đề bảng `<h2>` sẽ được bọc bởi component `Link` của Next.js với hiệu ứng hover màu xanh (`hover:text-sky-600 dark:hover:text-sky-400`) và ký hiệu mũi tên `→` (`aria-hidden="true"`) trượt nhẹ sang phải khi di chuột.

### 2. Trang chủ Dashboard (`dashboard-home-screen.tsx`)

- **Giao diện nội dung (`DashboardHomeContent`)**:
  - `DataPanel` Việc cần làm: `titleHref={APP_ROUTES.tasks}` (dẫn tới `/tasks`)
  - `DataPanel` Nhắc nhở: `titleHref={APP_ROUTES.reminders}` (dẫn tới `/reminders`)
  - `DataPanel` Lịch sự kiện: `titleHref={APP_ROUTES.calendar}` (dẫn tới `/calendar`)
  - `DataPanel` Giao dịch gần đây: `titleHref={APP_ROUTES.transactions}` (dẫn tới `/transactions`)
  - `DataPanel` Công nợ đang theo dõi: `titleHref={APP_ROUTES.debts}` (dẫn tới `/debts`)
  - `DataPanel` Nhật ký hoạt động: giữ nguyên dạng văn bản thuần (do chưa có trang riêng)
- **Giao diện tải (`DashboardHomeSkeleton`)**:
  - Đồng bộ `titleHref` tương tự cho các `DataPanel` để đảm bảo trải nghiệm 1:1 Full Fidelity giữa skeleton và dữ liệu thực tế.

### 3. Đồng bộ tài liệu hệ thống

- Cập nhật `knowledge/modules/dashboard/README.md` (English).
- Cập nhật `docs/modules/dashboard/README.md` (Tiếng Việt).

---

## Kết quả kiểm thử & Quality Gates

| Lệnh kiểm tra                   | Kết quả   | Ghi chú                                           |
| ------------------------------- | --------- | ------------------------------------------------- |
| `npm run typecheck`             | ✅ PASSED | Toàn bộ monorepo (API, Web, Contracts) 0 lỗi type |
| `npm run lint`                  | ✅ PASSED | 0 lỗi lint                                        |
| `npm run agent-system:validate` | ✅ PASSED | 91 artifacts, 157 dependencies, 0 cyclic groups   |
