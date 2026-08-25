# Kế hoạch: đồng bộ tài liệu Dashboard cho Calendar List View

RequestFeedback: false

## Kết quả triển khai

- Đã đồng bộ tài liệu Dashboard bằng tiếng Anh và tiếng Việt cho Calendar List View, mô tả đa dòng và resize cột có ghi nhớ.
- Đã chạy thành công `npm run agent-system:validate -- --check-changes --check-i18n` và `git diff --check`.

## Mục tiêu

Loại bỏ lỗi documentation drift khi pre-commit phát hiện thay đổi `CalendarScreen` trong module `dashboard`.

## Phạm vi

- `.agents/knowledge/modules/dashboard/README.md`: bổ sung yêu cầu List View Calendar có cột Mô tả đa dòng, độ rộng mặc định gọn và resize cột từ header được lưu theo `DataTable` id.
- `.agents/docs/modules/dashboard/README.md`: bổ sung cùng quy ước bằng tiếng Việt.
- Không thay đổi mã nguồn, API, dữ liệu hoặc thay đổi staged khác.

## Kiểm tra

Chạy `npm run agent-system:validate -- --check-changes --check-i18n` để xác nhận validator không còn yêu cầu tài liệu Dashboard.
