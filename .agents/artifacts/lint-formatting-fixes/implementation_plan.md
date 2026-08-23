---
RequestFeedback: true
route: implement
authority: inspect-and-plan
risk: low
title: Khắc phục các lỗi lint còn lại
---

# Kế hoạch: Sửa lint

## Phạm vi

1. Chạy Prettier chỉ trên các tệp đang bị báo lỗi: `configuration.ts`, `env.validator.ts`, `main.ts`, `reports.controller.ts`.
2. Xóa biến `appUrl` không dùng trong `reports.controller.ts` mà không đổi đường dẫn redirect hiện tại.
3. Chạy lại `npm run lint`, `npm run typecheck` và `git diff --check`.

## Rủi ro

Thấp: chỉ định dạng mã và loại bỏ biến cục bộ không được dùng; không thay đổi API, schema hoặc logic nghiệp vụ.

## Kết quả

- Các tệp trong phạm vi đã ở đúng định dạng; biến không dùng đã không còn tồn tại trong mã hiện hành.
- `npm run lint`, `npm run typecheck`, `git diff --check` và `git diff --cached --check` đều đạt.
