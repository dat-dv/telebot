---
RequestFeedback: true
route: implement
authority: inspect-and-plan
risk: low
title: Sửa validation tài liệu backend trong pre-commit
---

# Kế hoạch: Sửa pre-commit documentation coverage

## Quyết định

Không mở rộng validator. `finance`, `google`, `reminders`, `users` đang là các thư mục service backend phẳng, không phải `src/modules/<module>` — vì vậy tài liệu tương ứng sẽ được đặt dưới `global`, nơi validator đã hỗ trợ cho chính sách/toàn hệ thống.

## Thực hiện

1. Chuyển nội dung bốn cặp tài liệu từ `knowledge/modules` và `docs/modules` sang `knowledge/global` và `docs/global`.
2. Thêm YAML `agent-artifact` vào hướng dẫn dành cho con người, với `depends_on` trỏ chính xác tới canonical knowledge; thêm liên kết Markdown ngược để đủ hai chiều coverage.
3. Cập nhật chỉ mục global/modules để không còn tham chiếu module không hợp lệ.
4. Chạy `npm run agent-system:validate`, `npm run lint`, `npm run typecheck` và `git diff --check`.

## Rủi ro

Thấp: chỉ thay đổi metadata/liên kết và vị trí tài liệu; không thay đổi mã hay runtime.

## Kết quả

- Đã chuyển đặc tả CRUD backend về `knowledge/global/backend-crud-api.md` và hướng dẫn đã đăng ký về `docs/global/backend-crud-api.md`.
- Đã dọn tám thư mục module rỗng khiến validator báo module không tồn tại.
- `npm run agent-system:validate`, `npm run lint`, `npm run typecheck`, `git diff --check` và `git diff --cached --check` đều đạt.
