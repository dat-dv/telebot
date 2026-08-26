# Báo Cáo Hoàn Thành: Cập Nhật Rules & Documentation về Skeleton Loading

Đã cập nhật đồng bộ toàn bộ hệ thống Rules, Canonical Knowledge (tiếng Anh) và Developer Documentation (tiếng Việt) nhằm thiết lập quy chuẩn bất biến về thiết kế và triển khai Skeleton Loading mô phỏng chính xác 1:1 với giao diện thực tế.

---

## 1. Chi Tiết Các Nội Dung Đã Cập Nhật

### 1.1. Agent System Rule (`common-data-tables.md`)

- Bổ sung **Mục 5: Quy Định Bắt Buộc Skeleton Loading Mô Phỏng 1:1 (Skeleton & Loading Full Fidelity Policy)**.
- Bảng đối chiếu 7 hành vi cấm vs hành vi chuẩn:
  1. _Ô Skeleton trong Bảng_: Bắt buộc có đủ `border-r border-b border-r-slate-50 border-b-slate-100 last:border-r-0 dark:border-r-slate-900/60 dark:border-b-slate-800`.
  2. _Độ rộng cột khi tải_: Bắt buộc gán `style={{ minWidth: column.minWidth, width: getColumnWidth(column) }}` trên từng ô `td`.
  3. _Căn chỉnh pulse_: Căn phải (`ml-auto`) đối với các cột `align === 'right'`.
  4. _Khối bao ngoài DataPanel_: Render đầy đủ khung `DataPanel` với viền `border border-slate-200`, header `border-b` và ô tìm kiếm.
  5. _Thanh lọc kỳ & Quick Links_: Giữ nguyên `PeriodFilterToolbar` và thanh `Quick Links` skeleton có viền bao.
  6. _Cấm text thô sơ_: Tuyệt đối không dùng `{isLoading ? <div>Đang tải...</div> : ...}`.
  7. _Không thêm header thừa_: Không render thẻ `<header>` trong skeleton của view vì layout đã có `WorkspaceHeader`.
- Đồng bộ sidecar explanation và hash sha256 tại `common-data-tables.md`.

### 1.2. Canonical Knowledge (`web-ui-direction.md` & `modules/dashboard/README.md`)

- Bổ sung tài liệu đặc tả chuẩn kỹ thuật bằng tiếng Anh cho AI Agent về **Skeleton & Loading State Full Fidelity**:
  - Cell-level border parity (`border-r`, `border-b`), column width retention, right-aligned pulse markers.
  - Outer container preservation (`DataPanel`, `PeriodFilterToolbar`, Quick Links bar, chart wireframes).
  - Explicit prohibition of raw text loading and duplicate view-level header elements.

### 1.3. Developer Documentation (`web-ui-direction.md` & `modules/dashboard/README.md`)

- Bổ sung hướng dẫn chi tiết bằng tiếng Việt về **Quy chuẩn Skeleton Loading mô phỏng chính xác giao diện thực tế (Full Fidelity)** nhằm định hướng cho lập trình viên khi thêm mới hoặc refactor component.

---

## 2. Kết Quả Xác Minh Hệ Thống (Quality Gates)

- **`npm run agent-system:validate`**: Passed toàn bộ 90 artifacts, 156 dependencies, 0 cyclic groups.
- **`npm run typecheck`**: Passed 100% không lỗi trên toàn bộ Monorepo.
- **`npm run lint`**: Passed 100% không có lỗi ESLint/formatting.
