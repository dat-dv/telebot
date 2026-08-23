# Kế hoạch: căn sidebar report sát mép trái

RequestFeedback: true

## Mục tiêu

Chỉnh riêng shell full-width của các trang `contacts`, `debts` và `expenses` để sidebar là một vùng điều hướng bám mép trái viewport, thay vì là một cột nằm bên trong canvas có padding; phần bảng vẫn tận dụng hết chiều ngang còn lại.

## Phát hiện

- Ba report đã dùng `workspace--full` để bảng vượt giới hạn 1240px.
- Quy tắc `.workspace` vẫn thêm `padding: 28px 24px 40px`, khiến sidebar bị thụt vào 24px từ mép trái dù canvas đã full width.
- Dashboard hiện không dùng `workspace--full`; các thay đổi đang có tại dashboard, `next-env` và một số tài liệu là thay đổi ngoài phạm vi và sẽ được giữ nguyên.

## Phạm vi thay đổi

1. Trong `apps/web/src/styles.css`, tinh chỉnh riêng `.workspace--full` thành shell hai cột chạm mép viewport:
   - bỏ padding ngoài của full-width shell;
   - duy trì khoảng đệm có chủ đích bên trong sidebar;
   - chuyển spacing đầu trang và gutter sang `.app-content`, để tiêu đề và table vẫn thoáng, dễ đọc;
   - giữ breakpoint mobile hiện có: sidebar trở thành hàng ngang full-bleed và content vẫn có padding 14px.
2. Không đổi data table, API, route, query, hay dashboard.
3. Đồng bộ mô tả layout desktop/mobile vào knowledge và developer docs của `contacts`, `debts`, `expenses`.

## Cách kiểm chứng

1. Chạy `npm run lint`, `npm run typecheck`, `npm run build` và `git diff --check`.
2. Ở desktop: sidebar có mép trái của shell sát viewport, vạch ngăn sidebar thẳng hàng, phần table chiếm toàn bộ không gian còn lại.
3. Ở mobile: nav vẫn full-bleed theo hàng ngang, bảng chỉ cuộn ngang trong panel, không làm tràn toàn trang.

## Rủi ro và rollback

- Rủi ro thấp, chỉ áp dụng selector dưới `workspace--full`; dashboard và các canvas thường không bị ảnh hưởng.
- Có thể rollback bằng cách xóa các CSS selector của full-width shell.
