# Chẩn đoán lỗi pre-commit: module documentation coverage

## Kết quả tái hiện

Lệnh `npm run agent-system:validate` tái hiện đúng bốn lỗi Module Coverage:

- Tài liệu khai báo module `ui` nhưng trong mã không có module cùng tên.
- Mã có ba module `auth`, `contacts`, `dashboard` nhưng chưa có thư mục tài liệu tương ứng trong `.agents/knowledge/modules/`.

## Nguyên nhân gốc

Trong thay đổi đang staged, frontend đã được tái cấu trúc sang `apps/web/src/modules/auth`, `contacts`, và `dashboard`. Tài liệu cũ vẫn được đặt tại `.agents/knowledge/modules/ui/` và `.agents/docs/modules/ui/`.

Validator `scripts/agent-system/validators/documentation-coverage.ts` bắt buộc tên thư mục tài liệu phải khớp chính xác với tên thư mục module thực tế. Vì vậy việc chuyển cấu trúc mã nhưng chưa chuyển/tách tài liệu đã làm pre-commit thất bại.

Đây không phải lỗi ESLint, Prettier, Husky hay `tsx`.

## Sửa tối thiểu đề xuất

1. Bỏ thư mục tài liệu `ui` không còn khớp mô hình module.
2. Tạo tài liệu mirror cho `auth`, `contacts`, `dashboard` ở cả `.agents/knowledge/modules/` (English) và `.agents/docs/modules/` (Vietnamese).
3. Phân bổ nội dung thiết kế dùng chung vào `dashboard` hoặc `global` theo phạm vi thực tế, đồng thời sửa liên kết chéo và chỉ mục `.agents/docs/README.md` nếu cần.
4. Chạy lại `npm run agent-system:validate`, sau đó thử commit lại.

## Phạm vi/rủi ro

Thay đổi chỉ thuộc tài liệu và liên kết markdown; không cần sửa sản phẩm. Tuy nhiên, không nên chỉ tạo thư mục rỗng để qua kiểm tra: tài liệu phải phản ánh đúng ba module frontend mới.
