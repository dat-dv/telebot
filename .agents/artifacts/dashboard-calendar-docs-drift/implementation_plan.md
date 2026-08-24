# Kế hoạch xử lý pre-commit: thiếu đồng bộ tài liệu dashboard

RequestFeedback: true

## Mục tiêu

Khôi phục khả năng commit bằng cách đồng bộ tài liệu cho thay đổi đã staged tại `apps/web/src/modules/dashboard/view/calendar-screen.tsx`.

## Bằng chứng

- Pre-commit báo Documentation Drift cho module `dashboard`.
- Diff đã staged chuyển CalendarScreen sang tải dữ liệu theo phạm vi lưới tháng (`timeMin`/`timeMax`), dùng cache key theo tham số và làm mới toàn bộ các biến thể cache lịch.
- `dashboard` là module sở hữu `CalendarScreen`; hai tài liệu dashboard hiện chưa mô tả cơ chế tải lịch theo tháng này.

## Phạm vi thay đổi dự kiến

1. Cập nhật `.agents/knowledge/modules/dashboard/README.md` (English) để mô tả CalendarScreen yêu cầu dữ liệu theo phạm vi đầy đủ của lưới tháng, không dùng dữ liệu calendar tóm tắt của dashboard làm fallback, và quy tắc invalidation cache.
2. Cập nhật `.agents/docs/modules/dashboard/README.md` (Vietnamese) với cùng hợp đồng UI/cache, kèm hướng dẫn kiểm tra khi lịch trống hoặc bị cũ.
3. Chạy `npm run agent-system:validate -- --check-changes --check-i18n` và kiểm tra staged diff. Không sửa các thay đổi staged không liên quan.

## Rủi ro và tiêu chí hoàn thành

Rủi ro thấp: chỉ bổ sung tài liệu, không đổi mã hay API. Hoàn thành khi kiểm tra thay đổi và i18n của agent-system đều pass, loại bỏ lỗi Documentation Drift của module `dashboard`.

## Xác nhận phạm vi

Kế hoạch đã được rà lại theo diff staged hiện tại: chỉ hai tệp tài liệu dashboard cần cập nhật; không stage lại, sửa hoặc loại bỏ thay đổi của lịch, calendar hay module khác.
