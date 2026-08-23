# Kế hoạch khắc phục lỗi Module Coverage của pre-commit

RequestFeedback: true

## Mục tiêu

Đồng bộ tài liệu module với cấu trúc frontend hiện tại để `npm run agent-system:validate` không còn chặn commit.

## Phạm vi

- Chuyển nội dung tài liệu đang gắn với module cũ `ui` sang các module thực tế `auth`, `contacts`, `dashboard`.
- Cập nhật cả knowledge (English) và developer docs (Vietnamese), cùng liên kết/chỉ mục bị ảnh hưởng.
- Không thay đổi mã ứng dụng, cấu hình runtime hoặc hành vi sản phẩm.

## Các bước thực hiện

1. Đọc phần trách nhiệm thực tế của ba thư mục `apps/web/src/modules/auth`, `contacts`, `dashboard` để phân bổ tài liệu chính xác.
2. Tạo tài liệu mirror cho `auth`, `contacts`, `dashboard` trong `.agents/knowledge/modules/`, viết tiếng Anh ngắn gọn theo đúng trách nhiệm module.
3. Tạo tài liệu tương ứng trong `.agents/docs/modules/`, viết tiếng Việt và cập nhật liên kết chéo sang knowledge.
4. Di chuyển hoặc thay thế tài liệu `ui` cũ: các quy ước thiết kế dùng chung được đưa vào `global` nếu thật sự dùng chung; phần gắn trực tiếp dashboard được đặt vào `dashboard`. Sau đó loại bỏ tài liệu module `ui` để không vi phạm quy tắc mirror.
5. Cập nhật `.agents/docs/README.md` nếu chỉ mục có thay đổi.
6. Chạy `npm run agent-system:validate` và xác nhận bốn lỗi Module Coverage đã hết.

## Rủi ro và cách kiểm soát

- Rủi ro: phân bổ nhầm quy ước UI dùng chung vào một module cụ thể. Kiểm soát bằng cách đối chiếu nơi các shared UI primitives đang nằm và chỉ đưa các quy ước toàn cục vào `global`.
- Rủi ro: tạo đủ thư mục nhưng nội dung không phản ánh kiến trúc. Kiểm soát bằng cách mô tả rõ trách nhiệm, seam tích hợp và trạng thái UI của từng module.

## Tiêu chí hoàn tất

- Không còn `ui` trong `.agents/knowledge/modules/` hoặc `.agents/docs/modules/` nếu mã không còn module đó.
- Có tài liệu khớp cho `auth`, `contacts`, `dashboard` ở cả hai cây tài liệu.
- `npm run agent-system:validate` chạy thành công.
