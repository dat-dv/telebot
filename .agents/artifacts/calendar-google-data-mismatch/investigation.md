# Chẩn đoán: Calendar khác Google Calendar

## Quan sát

- Trang `/calendar` hiển thị lưới tháng và cho phép chuyển tháng.
- Dữ liệu trang lấy từ `GET /calendar/events`, với dự phòng từ payload Dashboard.
- Kỳ vọng: những sự kiện thuộc các ngày đang hiển thị trên lưới phải khớp Google Calendar của chính tài khoản đã liên kết.

## Điều kiện tái hiện tối thiểu

1. Có một sự kiện Google Calendar nằm ở ngày trước hiện tại hoặc ở tháng khác tháng hiện tại.
2. Mở trang Calendar và chuyển đến tháng chứa sự kiện đó.
3. Sự kiện không xuất hiện dù vẫn có trên Google Calendar.

## Tín hiệu xác thực

Từ mã hiện tại: browser gọi `GET /calendar/events` không có `timeMin`/`timeMax`; service mặc định `timeMin` thành thời điểm hiện tại. Vì vậy các sự kiện đã bắt đầu trước lúc tải trang không thể được trả về, và đổi tháng không thay đổi cửa sổ truy vấn.

## Kết luận

Nguyên nhân chính đã xác nhận bằng đường đi dữ liệu tĩnh:

1. `getCalendarEvents()` ở web không gửi tham số khoảng thời gian.
2. `GoogleCalendarService.listEvents()` thay `timeMin` bị thiếu bằng `new Date().toISOString()`.
3. Nút tháng trước/sau chỉ cập nhật `currentMonth`; query key cũng không phụ thuộc tháng, nên không thể có lần tải dữ liệu mới theo tháng.

Kết quả là lưới hiển thị một tháng bất kỳ nhưng chỉ có tối đa 100 sự kiện bắt đầu từ hiện tại trở đi. Toàn bộ sự kiện quá khứ, bao gồm các ngày trước trong tháng hiện tại, không thể xuất hiện.

## Các sai khác phụ đã xác nhận

- Khi Calendar endpoint trả mảng rỗng, UI dùng `dashboard.calendar`; nguồn dự phòng này chỉ gồm 7 ngày tới và tối đa 10 sự kiện. Một endpoint hợp lệ nhưng rỗng sẽ bị thay bằng tập dữ liệu khác, khiến nội dung không phản ánh query Calendar.
- Lưới chỉ gán sự kiện vào ô của `startAt`; sự kiện kéo dài nhiều ngày sẽ không hiện ở các ngày tiếp theo như Google Calendar.

## Độ tin cậy và giới hạn kiểm chứng

- Độ tin cậy nguyên nhân chính: cao, vì các điều kiện lọc được xác định ngay trên request path.
- Chưa thể chạy phép đối chiếu tài khoản thực: API cục bộ tại cổng 3000 không chạy trong phiên chẩn đoán; không dùng OAuth/token của người dùng trong artifact. Cần xác nhận sau khi sửa bằng một tài khoản có sự kiện quá khứ, tương lai và kéo dài nhiều ngày.

## Hướng khắc phục nhỏ nhất

1. Web tính biên đầu/cuối của 6 tuần lưới quanh `currentMonth`, truyền `timeMin`/`timeMax` vào query API và đưa các biên đó vào query key.
2. Xóa fallback Dashboard khi Calendar endpoint đã trả kết quả thành công, kể cả mảng rỗng.
3. Khi lập `eventsByDate`, mở rộng từng sự kiện qua mọi ngày từ start đến trước end (có xử lý all-day/timezone).
4. Thêm test cho chuyển tháng, sự kiện quá khứ, sự kiện vượt tháng và sự kiện kéo dài nhiều ngày.
