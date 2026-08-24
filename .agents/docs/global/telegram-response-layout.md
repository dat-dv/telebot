---
metadata:
  agent-artifact:
    id: docs-global-telegram-response-layout
    type: documentation
    depends_on:
      - .agents/knowledge/global/telegram-response-layout.md
---

# Bố cục phản hồi Telegram

Hướng dẫn này ánh xạ trực tiếp với tri thức canonical [`telegram-response-layout.md`](../../knowledge/global/telegram-response-layout.md).

Response Telegram cần ưu tiên nội dung người dùng cần quyết định hoặc đọc ngay: một tiêu đề ngắn, số liệu chính cùng dòng và từng mục tối đa hai dòng. Không thêm đường phân cách hoặc hướng dẫn lặp lại khi nút bên dưới đã thể hiện hành động kế tiếp.

Các nút ngắn, liên quan trực tiếp có thể cùng một hàng. Nút dài phải để hàng riêng để không bị tràn trên điện thoại. Khi có cùng một hành động ở nhiều phạm vi, nhãn phải nói rõ phạm vi: làm mới lịch hôm nay và làm mới lịch 7 ngày dùng hai callback riêng. Không đổi callback data và không đổi JSON fallback của hộp xác nhận, trừ callback mới cần thiết cho một phạm vi mới.

Trước khi gửi Markdown do AI tạo, bot giải mã HTML entity và bỏ escape thừa trước dấu `&` trong URL. Vì vậy chuỗi như `&#x20;` hoặc `\\&ctz` không được xuất hiện nguyên văn trong chat.

Các tin nhắn danh sách/thông tin có nút thao tác dài hạn — tổng kết hôm nay, danh sách việc, trạng thái tài khoản, danh sách người dùng, chi tiết công nợ và liên kết Dashboard/Báo cáo — phải có nút `❌ Đóng`. Khi bấm, bot ưu tiên xóa tin nhắn; nếu Telegram không cho phép xóa thì gỡ toàn bộ bàn phím inline để không còn thao tác cũ. Hộp xác nhận vẫn dùng `Hủy`; biên nhận Reminder và Calendar giữ `Ẩn nút` để không làm mất lịch sử thao tác.

Hộp xác nhận thu–chi (`create_finance_transaction`, `create_finance_transactions`) hiển thị thẻ thông tin giao dịch trực quan (loại, số tiền VND, danh mục, nội dung, ngày phát sinh) cùng khối JSON payload xem trước (`<pre><code class="language-json">...</code></pre>`) để người dùng đối chiếu trước khi bấm Xác nhận. Mặc định mốc phát sinh là thời điểm hiện tại, trừ khi người dùng chỉ định thời gian quá khứ (input muộn).

Hộp xác nhận và kết quả công nợ (`create_debt`, `record_debt_payment`, `update_debt_contact`) hiển thị thẻ giao diện trực quan thay vì in JSON kỹ thuật thô:
- Hộp xác nhận `create_debt`: Nêu rõ chiều công nợ (*Cho vay (Người khác nợ bạn)* hoặc *Đi vay (Bạn nợ người khác)*), tên đối tác, biệt danh, số tiền format VND, ghi chú, hạn trả và ghi chú thêm người mới vào danh bạ (nếu có).
- Thẻ kết quả `create_debt`: Hiển thị rõ `Đã ghi khoản cho vay` hoặc `Đã ghi khoản vay` kèm đối tác, biệt danh, số tiền và ghi chú.
- Hộp xác nhận & kết quả `record_debt_payment`: Thể hiện số tiền trả, đối tác và trạng thái còn lại hoặc tất toán (*Đã tất toán*).
- Hộp xác nhận & kết quả `update_debt_contact`: Thể hiện tên và biệt danh mới được cập nhật.

## Kiểm tra

1. Danh sách task có hai nút hoàn tất ngắn trên một hàng và mỗi nút vẫn trỏ đúng `complete_task:<id>`.
2. Kết quả hoàn thành task chỉ hiển thị trạng thái và tên việc, không in JSON kỹ thuật.
3. Hộp xác nhận thu–chi hiển thị thẻ tóm tắt, ngày phát sinh và khối JSON preview đầy đủ các trường `type`, `amount`, `category`, `note`, `occurredAt`.
4. Hộp xác nhận công nợ `create_debt` hiển thị rõ chiều công nợ, đối tác, số tiền, ghi chú, không in raw JSON string. Kết quả hiển thị đúng định dạng khoản vay/cho vay.
5. Mở Calendar hoặc Reminder trên điện thoại: các nút ngắn được ghép hàng nhưng vẫn đọc đủ nhãn.
6. Mở `/debts`, `/tasks`, `/status`, `/users` hoặc Dashboard/Báo cáo, bấm `❌ Đóng`: tin nhắn bị xóa hoặc không còn bàn phím inline nếu thao tác xóa bị Telegram từ chối.
7. Mở `/today` và `/week`: mỗi nút làm mới phải nêu đúng phạm vi và chỉ tải lại đúng báo cáo đó. Menu phải hiển thị `💳 Công nợ đang mở`.
8. Gửi phản hồi có `&#x20;` và URL chứa `\\&`: chat phải hiển thị khoảng trắng và dấu `&` bình thường.


