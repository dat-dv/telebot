# Kế hoạch: Bảng dữ liệu dùng toàn bộ chiều rộng

RequestFeedback: true

## Trạng thái triển khai

Đã được phê duyệt và triển khai theo đúng phạm vi nêu dưới đây.

## Mục tiêu

Các bảng trong dashboard và các trang báo cáo phải phủ hết chiều ngang của `DataPanel` trên desktop, thay vì chỉ chiếm 65% diện tích khả dụng.

## Phát hiện

- Component dùng chung `DataTable` đã được mọi bảng dashboard, danh bạ, khoản chi và công nợ dùng lại.
- Trong `apps/web/src/styles.css`, selector `.data-table` hiện có `width: 65%`; đây là nguyên nhân trực tiếp làm bảng bị co hẹp.
- Wrapper vẫn có `overflow-x: auto` và breakpoint mobile đặt `min-width: 460px`, nên có thể giữ nguyên cơ chế cuộn ngang khi không đủ chỗ.
- Workspace chính giới hạn tối đa 1240px để đọc dễ trên màn hình lớn; thay đổi này không mở rộng canvas toàn trang mà làm bảng lấp đầy chính panel của nó.

## Thay đổi dự kiến

1. Đổi chiều rộng `.data-table` từ `65%` thành `100%` trong `apps/web/src/styles.css`.
2. Không thay đổi cấu trúc React, cột dữ liệu, spacing, hoặc breakpoint mobile.
3. Kiểm tra bằng build/lint hoặc kiểm tra giao diện để xác nhận desktop phủ đủ panel và mobile vẫn cuộn ngang.

## Rủi ro và phạm vi

- Rủi ro thấp: một CSS selector dùng chung, không tác động API hay dữ liệu.
- Ảnh hưởng có chủ đích: toàn bộ bảng sử dụng `DataTable` trong web app sẽ rộng hết panel.

## Tiêu chí hoàn tất

- Mỗi bảng desktop phủ kín bề ngang bên trong viền panel.
- Không gây tràn ngang toàn trang trên mobile; cuộn ngang chỉ nằm trong vùng bảng.
- Không sửa các thay đổi đang có của anh trong worktree.
