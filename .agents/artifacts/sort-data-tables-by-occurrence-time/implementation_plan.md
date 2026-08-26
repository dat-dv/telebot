# Kế hoạch: sắp xếp các bảng theo thời gian phát sinh

RequestFeedback: true

## Mục tiêu

Mọi bảng hiển thị dữ liệu được sắp theo **mốc thời gian nghiệp vụ** của bản ghi, không suy diễn từ `createdAt`. Thứ tự mặc định là mới nhất trước (`DESC`) đối với dữ liệu lịch sử; riêng các danh sách cần hành động theo lịch sẽ là sớm nhất trước (`ASC`) để ưu tiên việc sắp diễn ra.

## Phát hiện hiện tại

- Thu–chi và chi tiêu đã có `occurredAt`; API hiện truy vấn theo trường này.
- Nhắc việc dùng `remindAt`, lịch dùng `startAt`, công việc dùng `dueAt`.
- Lịch Google đã yêu cầu API Google sắp theo `startTime`.
- Khoản nợ hiện chỉ lưu `createdAt`, `dueAt`, `settledAt`; chưa có ngày phát sinh nên một khoản nợ nhập muộn sẽ không thể sắp đúng theo yêu cầu.
- Danh bạ, danh mục và nhật ký thao tác không có một thời điểm phát sinh độc lập: `createdAt` chính là thời điểm của bản ghi / hành động, nên tiếp tục dùng nó với ý nghĩa này.

## Phạm vi thay đổi

1. Bổ sung `occurredAt` cho khoản nợ xuyên suốt entity, migration, DTO/contract, tạo/cập nhật và phản hồi API; các dữ liệu cũ sẽ được backfill từ `createdAt` để không có giá trị rỗng.
2. Đổi truy vấn danh sách nợ và các bảng nợ/tổng quan để sắp theo `occurredAt DESC` (có tiêu chí phụ ổn định khi trùng thời điểm).
3. Chuẩn hoá DataTable dùng bộ so sánh thời gian nghiệp vụ được khai báo rõ tại từng nơi gọi, không dựa vào vị trí API trả về:
   - Thu–chi, chi tiêu, thanh toán nợ: `occurredAt` / `paymentDate`, mới nhất trước.
   - Khoản nợ: `occurredAt`, mới nhất trước.
   - Nhắc việc: `remindAt`, sớm nhất trước.
   - Lịch: `startAt`, sớm nhất trước.
   - Công việc: `dueAt`, sớm nhất trước; việc không có hạn đứng sau.
   - Nhật ký hoạt động, danh bạ, danh mục: `createdAt`, mới nhất trước vì đó là mốc nghiệp vụ duy nhất.
4. Áp dụng cùng quy tắc cho các bảng tóm tắt ở trang Dashboard và Analytics, sau khi lọc/tìm kiếm để mọi màn hình nhất quán.
5. Cập nhật tài liệu nghiệp vụ/triển khai về quy ước “thời gian phát sinh” và kiểm tra lint, typecheck; thêm kiểm thử chỉ khi anh phê duyệt riêng theo quy định dự án.

## Ảnh hưởng và rủi ro

- Có migration cơ sở dữ liệu cho `debts.occurred_at`; đây là thay đổi tương thích ngược nhờ backfill.
- Các màn hình lịch, nhắc việc, công việc sẽ sắp theo thứ tự thao tác thực tế (việc gần nhất cần xử lý hiện trước), thay vì mặc định có thể thay đổi theo nguồn dữ liệu.
- Dữ liệu lịch sử của nợ không thể khôi phục ngày phát sinh thực tế nếu trước đây không lưu; sẽ tạm dùng `createdAt` cho các bản ghi cũ.

## Tiêu chí nghiệm thu

- Một giao dịch hoặc khoản nợ được nhập hôm nay nhưng có ngày phát sinh hôm qua xuất hiện đúng vị trí theo ngày hôm qua.
- Không có bảng nào dùng `createdAt` thay cho mốc nghiệp vụ khi đã tồn tại mốc đó.
- Các bảng lịch/nhắc việc/công việc hiển thị mốc gần nhất ở đầu; bảng lịch sử hiển thị mốc mới nhất ở đầu.
- `npm run lint` và `npm run typecheck` chạy đạt.

## Kết quả triển khai

- Đã bổ sung `debts.occurredAt` dạng nullable để tương thích dữ liệu hiện hữu; API trả về `createdAt` làm fallback cho bản ghi cũ.
- `DataTable` tự xác định và sắp theo mốc nghiệp vụ của mỗi hàng sau khi dữ liệu đã được lọc: `occurredAt`, `paymentDate`, `remindAt`, `startAt`, `dueAt`, rồi mới đến `createdAt`.
- Đã xác minh `npm run typecheck`, `npm run lint` và `git diff --check` đều đạt. Không chạy `npm run build:shared` vì repository không khai báo script này.
