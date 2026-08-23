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

Các nút ngắn, liên quan trực tiếp có thể cùng một hàng. Nút dài phải để hàng riêng để không bị tràn trên điện thoại. Không đổi callback data và không đổi JSON fallback của hộp xác nhận.

## Kiểm tra

1. Danh sách task có hai nút hoàn tất ngắn trên một hàng và mỗi nút vẫn trỏ đúng `complete_task:<id>`.
2. Kết quả hoàn thành task chỉ hiển thị trạng thái và tên việc, không in JSON kỹ thuật.
3. Mở Calendar hoặc Reminder trên điện thoại: các nút ngắn được ghép hàng nhưng vẫn đọc đủ nhãn.
