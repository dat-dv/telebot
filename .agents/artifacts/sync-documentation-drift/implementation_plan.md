# Kế hoạch đồng bộ tài liệu (Documentation Drift Sync)

## Mô tả bài toán

Lệnh `git commit` bị chặn bởi pre-commit hook do `npm run agent-system:validate -- --check-changes --check-i18n` phát hiện lỗi **Documentation Drift**: Mã nguồn của 4 module (`contacts`, `dashboard`, `expenses`, `settings`) trên web frontend đã được chỉnh sửa (chuẩn hóa mở liên kết ngoài trong tab mới an toàn `target="_blank" rel="noopener noreferrer"`, cố định `minWidth: 130px`, và thêm `flex-nowrap whitespace-nowrap shrink-0` chống rớt dòng cho các nút bấm thao tác), nhưng tài liệu canonical knowledge (`.agents/knowledge/modules/`) và developer documentation (`.agents/docs/modules/`) chưa được cập nhật tương ứng.

## Đánh giá rủi ro

- **Mức độ rủi ro**: THẤP (LOW RISK) - Chỉ cập nhật tài liệu markdown, không thay đổi logic runtime hay code hệ thống.

---

## Thay đổi đề xuất

### 1. Module Contacts

#### [MODIFY] .agents/knowledge/modules/contacts/README.md

- Bổ sung đặc tả UI: Các liên kết ngoài (địa chỉ, số điện thoại) mở trong tab mới với `target="_blank" rel="noopener noreferrer"`.
- Bổ sung cấu hình cột thao tác: `minWidth: 130px` kết hợp `flex-nowrap whitespace-nowrap` và nút bấm `shrink-0` chống rớt dòng.

#### [MODIFY] .agents/docs/modules/contacts/README.md

- Cập nhật hướng dẫn tiếng Việt: Liên kết ngoài mở tab mới an toàn và cột thao tác cố định `minWidth: 130px`, `flex-nowrap whitespace-nowrap`, nút `shrink-0`.

---

### 2. Module Dashboard

#### [MODIFY] .agents/knowledge/modules/dashboard/README.md

- Bổ sung đặc tả UI: Các liên kết ngoài (Google Calendar, link ngoại vi) mở trong tab mới (`target="_blank" rel="noopener noreferrer"`).
- Bổ sung đặc tả bảng dữ liệu: Cột thao tác trên các bảng Transactions, Tasks, Reminders, Analytics được cấu hình `minWidth: 130px` với `flex-nowrap whitespace-nowrap` và nút bấm `shrink-0` chống tràn/rớt dòng.

#### [MODIFY] .agents/docs/modules/dashboard/README.md

- Cập nhật hướng dẫn tiếng Việt về mở tab mới cho liên kết ngoài và chuẩn hóa cột thao tác chống rớt dòng trên các bảng giao dịch, công việc, thống kê.

---

### 3. Module Expenses

#### [MODIFY] .agents/knowledge/modules/expenses/README.md

- Bổ sung đặc tả UI: Nút bấm hành động (Sửa, Xóa, Lưu, Hủy) được bọc trong container `flex-nowrap whitespace-nowrap` với `shrink-0` để đảm bảo không bị rớt dòng khi co giãn bảng.

#### [MODIFY] .agents/docs/modules/expenses/README.md

- Cập nhật hướng dẫn tiếng Việt về bố cục nút thao tác chống rớt dòng trong bảng chi tiêu.

---

### 4. Module Settings

#### [MODIFY] .agents/knowledge/modules/settings/README.md

- Bổ sung đặc tả UI: Nút hành động trong các DataPanel danh mục (Sửa, Xóa, Lưu, Hủy) sử dụng `flex-nowrap whitespace-nowrap` và `shrink-0` chống vỡ layout.

#### [MODIFY] .agents/docs/modules/settings/README.md

- Cập nhật hướng dẫn tiếng Việt về bố cục nút thao tác danh mục trong tab Cài đặt.

---

## Kế hoạch kiểm thử & xác minh

### Automated Validation

1. Chạy xác thực agent system:

   ```bash
   npm run agent-system:validate -- --check-changes --check-i18n
   ```

   Yêu cầu: Không còn lỗi Documentation Drift, exit code 0.

1. Kiểm tra type check & linter:
   ```bash
   npm run typecheck
   ```
