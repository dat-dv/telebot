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
- UI: luôn giữ skeleton khi tải, trạng thái rỗng rõ ràng, cảnh báo có nút thử lại khi lỗi, và các bảng dữ liệu dày khi thành công. Tổng quan có việc cần chú ý và link nhanh; Thống kê có số liệu thu–chi, công nợ và bảng chi tiết. Màu xanh/vàng/đỏ chỉ biểu thị số liệu tốt/cần theo dõi/âm; sidebar desktop giữ icon kèm chữ, còn mobile cuộn ngang.
- Đăng xuất: gọi API logout, xóa token qua module `auth`, xóa cache rồi quay lại `/reports/`.

## Cấu hình production

- `NEXT_PUBLIC_API_URL=https://telebot.datintech.site`, không thêm `/api`, vì hằng `API_ROUTES` đã có tiền tố này.
- Static export không có API route của Next.js. Nginx phải chuyển `https://telebot.datintech.site/api/*` sang NestJS và trả `apps/web/out` cho mọi route khác.
- Khi thay đổi `NEXT_PUBLIC_API_URL`, build lại image/web bundle vì biến này được đóng gói tại build-time.
- Nút Dashboard trong `/help` và `/start` là callback: mỗi lần bấm, bot cấp link dùng một lần mới trong tin nhắn phản hồi. Người dùng bấm link mới để mở dashboard; không bấm lại URL cũ.

Khi dữ liệu dashboard sai hoặc rỗng, kiểm tra DTO/API trước khi sửa cột hiển thị. Các bảng dùng primitive trong `src/shared/ui`, không tạo lại primitive riêng trong module.
