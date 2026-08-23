# Bàn giao: khắc phục lỗi Module Coverage

## Đã thay đổi

- Thay tài liệu module cũ `ui` bằng ba cặp knowledge/guide khớp `auth`, `contacts`, `dashboard`.
- Chuyển quy chuẩn UI dùng chung sang `global/web-ui-direction.md` ở cả knowledge và developer docs.
- Cập nhật các chỉ mục module/global, liên kết knowledge sang guide tiếng Việt và metadata đăng ký tài liệu.

## Xác minh

`npm run agent-system:validate` đã thành công:

`Agent system validation passed: 67 artifacts, 119 dependencies, 52 pairs, 1 imports, 0 cyclic dependency groups.`

`git diff --check` và `git diff --cached --check` không báo lỗi whitespace.
