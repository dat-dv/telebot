# Chẩn đoán: Danh mục Transactions chưa là select autocomplete

## Quan sát

Trong chế độ sửa dòng giao dịch, trường **Danh mục** chưa cung cấp một combobox/select autocomplete điều khiển được. Người dùng chỉ có thể dùng ô nhập văn bản với gợi ý tùy thuộc trình duyệt.

## Vòng lặp tái hiện

Đã chạy kiểm tra mã nguồn sau:

```bash
node -e "const fs=require('fs'); const p='apps/web/src/modules/dashboard/view/transactions-screen.tsx'; const s=fs.readFileSync(p,'utf8'); const usesNativeDatalist=/<input[\\s\\S]*?list=\\\"transaction-categories-autocomplete\\\"[\\s\\S]*?<\\/input>|<input[\\s\\S]*?list=\\\"transaction-categories-autocomplete\\\"/.test(s) && /<datalist id=\\\"transaction-categories-autocomplete\\\"/.test(s); const usesControlledCombobox=/CategoryAutocomplete|Combobox/.test(s); console.log(JSON.stringify({usesNativeDatalist,usesControlledCombobox})); if (usesNativeDatalist || !usesControlledCombobox) process.exit(1);"
```

Kết quả (đỏ):

```text
{"usesNativeDatalist":true,"usesControlledCombobox":false}
```

## Nguyên nhân gốc

`apps/web/src/modules/dashboard/view/transactions-screen.tsx` dùng `<input list="transaction-categories-autocomplete">` kết hợp `<datalist>`. `datalist` là gợi ý native do trình duyệt tự hiển thị, không phải select autocomplete/combobox có danh sách mở được, tìm kiếm/lọc và điều hướng bàn phím do ứng dụng kiểm soát.

Tìm kiếm toàn bộ giao diện dùng chung cũng không tìm thấy `Combobox`, `Autocomplete`, `listbox` hay `Command` có thể tái sử dụng. Vì vậy đây không phải lỗi CSS hoặc thiếu dữ liệu danh mục.

## Phạm vi ảnh hưởng

- Trực tiếp: `apps/web/src/modules/dashboard/view/transactions-screen.tsx`.
- Mẫu kỹ thuật tương tự còn tồn tại ở `apps/web/src/modules/expenses/view/expenses-screen.tsx`, phần danh mục; có thể cân nhắc dùng cùng component để tránh lệch hành vi.

## Đề xuất khắc phục

Tạo một combobox autocomplete dùng chung, có khả năng mở danh sách bằng click, lọc theo văn bản nhập, chọn bằng click/Enter và đóng bằng Escape/click ngoài; sau đó thay trường Danh mục trong Transactions bằng component này. Nguồn gợi ý hiện hữu (danh mục mặc định, danh mục cấu hình và lịch sử theo loại thu/chi) được giữ nguyên.

## Chiến lược chống hồi quy

Thêm kiểm tra component/render xác nhận trường Danh mục có `role="combobox"`, danh sách tùy chỉnh với các lựa chọn tương ứng, và đổi Loại giao dịch sẽ đổi nhóm gợi ý.
