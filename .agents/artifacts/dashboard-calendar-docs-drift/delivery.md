# Bàn giao: gỡ chặn pre-commit do thiếu tài liệu dashboard

## Đã thực hiện

- Cập nhật tri thức canonical của module dashboard để mô tả truy vấn lịch theo phạm vi lưới tháng, không fallback lịch từ dashboard và refresh toàn bộ cache lịch.
- Cập nhật hướng dẫn tiếng Việt cùng hợp đồng UI/cache.
- Đã stage hai tài liệu dashboard cùng thay đổi mã đang staged.

## Kiểm chứng

- `npm run agent-system:validate -- --check-changes --check-i18n` — đạt.
- `git diff --cached --check` — đạt.
