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
- UI: luôn giữ skeleton khi tải, cảnh báo có nút thử lại khi lỗi, và các bảng dữ liệu dày khi thành công. Tổng quan có việc cần chú ý và link nhanh; Thống kê có số liệu thu–chi, công nợ và bảng chi tiết.
- Đăng xuất: gọi API logout, xóa token qua module `auth`, xóa cache rồi quay lại `/reports/`.

Khi dữ liệu dashboard sai hoặc rỗng, kiểm tra DTO/API trước khi sửa cột hiển thị. Các bảng dùng primitive trong `src/shared/ui`, không tạo lại primitive riêng trong module.
