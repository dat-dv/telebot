# Chẩn đoán: pre-commit bị chặn do thiếu tài liệu dashboard

## Kết luận

Pre-commit bị chặn đúng theo quy tắc Documentation Drift: file staged `apps/web/src/modules/dashboard/view/calendar-screen.tsx` đã thay đổi hành vi dữ liệu lịch, nhưng cả tài liệu canonical và tài liệu lập trình viên của module `dashboard` chưa được cập nhật.

## Bằng chứng

- Lệnh `npm run agent-system:validate -- --check-changes --check-i18n` báo lỗi duy nhất cho module `dashboard`.
- Diff staged của `CalendarScreen` thay truy vấn lịch mặc định bằng phạm vi theo tháng lưới lịch (`getCalendarGridRange(currentMonth)`), bỏ fallback dữ liệu lịch từ dashboard và đổi invalidation sang toàn bộ cache lịch.
- `.agents/knowledge/modules/dashboard/README.md` và `.agents/docs/modules/dashboard/README.md` hiện chỉ mô tả giao diện Lịch, không mô tả phạm vi tải theo tháng, nguồn dữ liệu lịch trực tiếp và quy tắc refresh mới.

## Cách khắc phục tối thiểu

1. Cập nhật hai tài liệu module `dashboard` để phản ánh phạm vi tháng lưới lịch, nguồn dữ liệu chính từ calendar query và invalidation cache lịch.
2. Stage hai tệp tài liệu đó cùng thay đổi dashboard.
3. Chạy lại `npm run agent-system:validate -- --check-changes --check-i18n`, rồi commit lại.

## Phạm vi

Các thay đổi calendar và dashboard khác đang staged thuộc công việc khác; chẩn đoán này không sửa hoặc thay đổi chúng.
