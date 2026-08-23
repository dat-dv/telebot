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

## Kiểm tra

1. Danh sách task có hai nút hoàn tất ngắn trên một hàng và mỗi nút vẫn trỏ đúng `complete_task:<id>`.
2. Kết quả hoàn thành task chỉ hiển thị trạng thái và tên việc, không in JSON kỹ thuật.
3. Mở Calendar hoặc Reminder trên điện thoại: các nút ngắn được ghép hàng nhưng vẫn đọc đủ nhãn.
4. Mở `/debts`, `/tasks`, `/status`, `/users` hoặc Dashboard/Báo cáo, bấm `❌ Đóng`: tin nhắn bị xóa hoặc không còn bàn phím inline nếu thao tác xóa bị Telegram từ chối.
5. Mở `/today` và `/week`: mỗi nút làm mới phải nêu đúng phạm vi và chỉ tải lại đúng báo cáo đó. Menu phải hiển thị `💳 Công nợ đang mở`.
6. Gửi phản hồi có `&#x20;` và URL chứa `\\&`: chat phải hiển thị khoảng trắng và dấu `&` bình thường.
