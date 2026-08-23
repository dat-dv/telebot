# Kế hoạch: mở rộng bảng công nợ, khoản chi và liên lạc

RequestFeedback: true

## Mục tiêu

Cho ba trang báo cáo `debts`, `expenses` và `contacts` sử dụng hết chiều ngang viewport khả dụng trên desktop; trên màn hình nhỏ vẫn giữ padding hiện có và cuộn ngang nội bộ của bảng.

## Phát hiện

- Cả ba view đã dùng `content-grid--wide` (một cột) và `DataPanel`/`DataTable` đều có `width: 100%`.
- Nút thắt nằm ở `.workspace`, đang giới hạn toàn bộ canvas ở `max-width: 1240px`.
- Không cần đổi API, query, dữ liệu hay cấu trúc cột.

## Phạm vi thay đổi

1. Thêm modifier class dành riêng cho canvas báo cáo vào ba view:
   - `apps/web/src/modules/debts/view/debts-screen.tsx`
   - `apps/web/src/modules/expenses/view/expenses-screen.tsx`
   - `apps/web/src/modules/contacts/view/contacts-screen.tsx`
2. Bổ sung CSS modifier trong `apps/web/src/styles.css` để bỏ giới hạn `max-width` chỉ với ba canvas trên. Sidebar, gutter và hành vi responsive hiện có được giữ nguyên.
3. Đồng bộ yêu cầu UI responsive vào tài liệu module:
   - `.agents/knowledge/modules/debts/README.md`, `.agents/knowledge/modules/expenses/README.md`, `.agents/knowledge/modules/contacts/README.md`
   - `.agents/docs/modules/debts/README.md`, `.agents/docs/modules/expenses/README.md`, `.agents/docs/modules/contacts/README.md`

## Cách kiểm chứng

1. Chạy lint và typecheck của workspace.
2. Mở ba route báo cáo ở desktop để xác nhận data panel trải hết vùng ngang sau sidebar.
3. Kiểm tra viewport hẹp: bảng vẫn cuộn ngang bên trong panel, không làm tràn toàn trang.

## Rủi ro và rollback

- Rủi ro thấp: thay đổi chỉ là layout CSS, được giới hạn bằng modifier class cho đúng ba trang.
- Có thể rollback bằng cách gỡ modifier class và quy tắc CSS tương ứng.

## Kết quả triển khai

- Đã thêm `workspace--full` cho ba màn hình báo cáo và CSS bỏ `max-width` riêng cho modifier này.
- Đã cập nhật tri thức canonical và hướng dẫn lập trình viên của ba module để ghi rõ quy tắc responsive.
- `npm run lint`, `npm run typecheck` và `git diff --check` đã đạt.
