# Bàn giao: Select autocomplete cho Danh mục Transactions

## Đã thay đổi

- Thêm `CategoryAutocomplete` dùng chung với combobox/listbox truy cập được.
- Thay input kèm `<datalist>` trong `TransactionsScreen` bằng component mới.
- Danh sách gợi ý vẫn kết hợp danh mục mặc định theo loại Thu/Chi, danh mục cấu hình và lịch sử giao dịch.
- Menu được render nổi phía trên vùng cuộn của bảng; hỗ trợ click/focus để mở, gõ để lọc, mũi tên + Enter để chọn, Escape để đóng rồi hủy sửa ở lần tiếp theo.
- Cập nhật tài liệu Dashboard bằng tiếng Anh và tiếng Việt.

## Xác thực

- Kiểm tra UI tĩnh: xác nhận Transactions không còn `<datalist>` và có combobox/listbox: đạt.
- `npm run lint`: đạt.
- `npm run typecheck`: đạt.
- `npm run build:web`: đạt.
- `npm run agent-system:validate`: đạt (87 artifacts, 151 dependencies, 54 pairs, 1 imports, không có vòng phụ thuộc).

## Phạm vi không thay đổi

- Không thay đổi API, schema, dữ liệu giao dịch hoặc các màn hình Expenses/Debts/Analytics.
