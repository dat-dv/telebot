# Kế hoạch: Co gọn Workspace Header và hiển thị dấu ba chấm

RequestFeedback: true

## Mục tiêu

Khi vùng hiển thị của header bị thu hẹp, phần tiêu đề và mô tả không làm tràn bố cục. Văn bản dài sẽ được cắt một dòng và hiển thị dấu `…`, trong khi các nút thao tác vẫn giữ kích thước sử dụng được.

## Phạm vi đã khảo sát

- `apps/web/src/shared/ui/workspace-header.tsx` là header dùng chung cho các màn hình dashboard, giao dịch, lịch, nhắc việc, công nợ, liên hệ, chi phí và cài đặt.
- Container nội dung của layout riêng đã có `min-w-0`; nhưng khối text bên trong `WorkspaceHeader` chưa được phép co, và các phần title/subtitle chưa thiết lập ellipsis.
- Các cell dữ liệu bảng hiện đã dùng `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`; thay đổi này chỉ áp dụng cho text trong header, không thay đổi dữ liệu bảng hay API.

## Thay đổi đề xuất

1. Cập nhật `WorkspaceHeader` để khối title/subtitle có thể co trong hàng flex (`min-w-0`, chiếm phần không gian còn lại).
2. Áp dụng kiểu một dòng, cắt tràn và dấu `…` cho tiêu đề và subtitle; giữ nguyên toàn bộ nội dung thông qua thuộc tính `title` để người dùng có thể xem đầy đủ khi rê chuột.
3. Giữ cụm action không co ngoài ý muốn; tại breakpoint hiện có (`<=960px`), header vẫn xuống hàng như thiết kế đang dùng để các nút không bị chật.

## Rủi ro và khả năng hoàn tác

- Rủi ro thấp: chỉ thay đổi trình bày của một component dùng chung, không tác động state, API, dữ liệu hay điều hướng.
- Có thể hoàn tác bằng cách khôi phục các class của khối text trong `workspace-header.tsx`.

## Kiểm chứng sau khi thực hiện

1. Chạy `npm run lint` và `npm run typecheck`.
2. Kiểm tra giao diện ở desktop hẹp và dưới 960px: text dài hiện `…`, header không tạo cuộn ngang, và nút Làm mới/Đăng xuất vẫn thao tác được.

## Tài liệu

Không cần cập nhật knowledge/docs: thay đổi chỉ sửa cách hiển thị responsive, không thay đổi yêu cầu nghiệp vụ, kiến trúc hoặc quy trình vận hành.

## Kết quả triển khai

- Đã cập nhật `apps/web/src/shared/ui/workspace-header.tsx`.
- Khối text có `min-w-0 flex-1`; cụm action có `shrink-0`.
- Title và subtitle dùng `truncate`, đồng thời có thuộc tính `title` để xem nội dung đầy đủ bằng tooltip mặc định của trình duyệt.
- Đã chạy thành công `npm run lint`, `npm run typecheck` và kiểm tra định dạng diff.
