---
metadata:
  agent-artifact:
    id: docs-global-google-tasks
    type: documentation
    depends_on:
      - .agents/knowledge/global/google-tasks.md
---

# Google Tasks: tạo một hoặc nhiều việc

Bot yêu cầu xác nhận trước khi ghi Google Tasks.

- Một việc dùng `create_task`.
- Danh sách nhiều việc độc lập dùng `create_tasks`; bot hiển thị một xác nhận cho toàn bộ danh sách.
- Sau khi xác nhận, các mục được tạo tuần tự. Google Tasks không hỗ trợ transaction nhiều mục, nên nếu lỗi giữa chừng bot phải báo rõ mục nào đã tạo và mục nào chưa tạo được.

Người dùng có thể xem việc bằng cả `/tasks` và `/task`. Với câu như “mua cà phê và cam”, hệ thống phải coi đây là hai mục độc lập, không phải một task có tiêu đề ghép.

## Kiểm tra

1. Gửi yêu cầu hai việc, xác nhận, rồi dùng `/tasks`: phải thấy đủ hai mục.
2. Mô phỏng Google Tasks lỗi ở một mục giữa danh sách: phản hồi phải hiển thị thành công một phần.
3. Dùng cả `/task` và `/tasks`: hai lệnh phải trả cùng danh sách.
