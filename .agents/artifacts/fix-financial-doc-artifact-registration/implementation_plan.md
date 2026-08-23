---
RequestFeedback: true
---

# Kế hoạch sửa pre-commit: đăng ký tài liệu báo cáo tài chính

## Chẩn đoán

Đã tái hiện bằng `npm run agent-system:validate`: validator báo đúng sáu lỗi, ba knowledge file chưa được guide liên kết và ba guide chưa là artifact hợp lệ.

Nguyên nhân là các file vừa thêm thiếu YAML frontmatter `metadata.agent-artifact`; vì thế validator không đưa guide vào registry. Khi guide không được đăng ký, knowledge tương ứng cũng không thể có liên kết human-facing hợp lệ.

## Thay đổi

1. Thêm metadata `agent-artifact` kiểu `documentation`, ID duy nhất và `depends_on` tới knowledge tương ứng vào:
   - `.agents/docs/global/financial-report-contracts.md`
   - `.agents/docs/modules/debts/README.md`
   - `.agents/docs/modules/expenses/README.md`
2. Thêm liên kết Markdown trực tiếp từ mỗi guide tới canonical knowledge cùng cặp:
   - `financial-report-contracts.md`
   - `modules/debts/README.md`
   - `modules/expenses/README.md`
3. Chạy lại `npm run agent-system:validate` và `git diff --check`.

## Không thay đổi

- Không sửa mã API/web, dữ liệu, contract hoặc hành vi Dashboard.
- Không đụng các thay đổi tài chính khác đang nằm trong worktree.

## Rủi ro

Rủi ro thấp và có thể hoàn tác độc lập: chỉ thêm metadata/lien kết nội bộ cho tài liệu đã tồn tại.

## Kết quả thực hiện

- Hoàn thành ngày 2026-08-23: đã đăng ký ba guide báo cáo tài chính và thêm liên kết đến canonical knowledge tương ứng.
- `npm run agent-system:validate` đã chạy xanh: 76 artifacts, 135 dependencies, 53 pairs, 1 imports, 0 cyclic dependency groups.
- `git diff --check` chạy xanh.
