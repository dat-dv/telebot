# Kế hoạch sửa lỗi pre-commit Agent System

RequestFeedback: true

## Bối cảnh và nguyên nhân

Hook `.husky/pre-commit` chạy `npm run agent-system:precommit`. Khi có tệp ảnh hưởng Agent System được staged, cấu hình `scripts/agent-system/precommit/lint-staged.config.mjs` gọi `npm run agent-system:validate`. Tuy nhiên `package.json` gốc chưa khai báo script này, dù entry point `scripts/agent-system/validate.ts` đã tồn tại và `tsx` đã được cung cấp bởi workspace `apps/api`.

Tái hiện xác định được: chạy `npm run agent-system:validate` ở root hiện trả về `Missing script: "agent-system:validate"`.

## Phạm vi

- Sửa duy nhất `package.json` ở root để khai báo `agent-system:validate` bằng `tsx scripts/agent-system/validate.ts`.
- Không chỉnh sửa mã ứng dụng, cấu hình lint-staged, hook Husky hoặc các thay đổi đang staged của người dùng.

## Các bước thực hiện

1. Thêm script `agent-system:validate` vào nhóm scripts tại root.
2. Chạy trực tiếp `npm run agent-system:validate` để xác nhận lỗi thiếu script biến mất và ghi nhận mọi lỗi kiểm tra thực tế còn lại (nếu có).
3. Chạy `npm run agent-system:precommit` với trạng thái staged hiện tại để xác nhận hook gọi được validator.
4. Kiểm tra diff để bảo đảm chỉ thay đổi `package.json` và artifact kế hoạch.

## Rủi ro và hoàn tác

Rủi ro thấp: thay đổi chỉ bổ sung alias CLI cho file validator đã có sẵn. Có thể hoàn tác bằng cách xoá đúng một script vừa thêm.

## Tiêu chí hoàn thành

- `npm run agent-system:validate` không còn báo `Missing script`.
- Pre-commit tiếp tục đến kết quả validator thực tế thay vì dừng vì lỗi cấu hình npm.
