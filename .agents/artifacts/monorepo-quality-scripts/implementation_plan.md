---
RequestFeedback: true
Task: monorepo-quality-scripts
Risk: medium
Status: awaiting-approval
---

# Kế hoạch bổ sung format và ESLint chung

## Hiện trạng

- Root đã có `lint`, nhưng lệnh này chạy các workspace có script riêng và chưa có lệnh `format` chung.
- API có Prettier và ESLint (`--fix`), web chỉ có ESLint và chưa có Prettier workspace script.
- Repository đã có cấu hình `.prettierrc` và `.eslintrc.js` cho backend; web dùng flat ESLint config riêng.

## Thay đổi đề xuất

1. Thêm root scripts:
   - `format`: chạy format cho API và web.
   - `format:check`: chỉ kiểm tra định dạng, không sửa file.
   - `lint:fix`: lệnh chủ động sửa lỗi lint ở từng workspace.
2. Thêm web scripts `format` và `format:check`, dùng Prettier từ dependency đã được hoist ở root workspace.
3. Thêm API scripts `format:check` và `lint:check` (không `--fix`) để CI/pre-commit có lệnh kiểm tra không làm thay đổi mã.
4. Đổi root `lint` sang các `lint:check` an toàn, giữ `lint:fix` cho việc sửa chủ động.
5. Cập nhật README/developer guide với các lệnh chuẩn.

## Tiêu chí hoàn thành

- `npm run format`, `npm run format:check`, `npm run lint`, `npm run lint:fix` dùng được từ root.
- Lệnh kiểm tra không thay đổi file.
- Build, typecheck và lint kiểm tra sau cấu hình đều chạy được.
