# Kế Hoạch Cập Nhật Rules & Documentation về Quy Chuẩn Skeleton Loading (Full Fidelity)

Tài liệu này xác lập quy chuẩn kỹ thuật bắt buộc và lộ trình cập nhật hệ thống Rules, Canonical Knowledge (tiếng Anh) và Developer Documentation (tiếng Việt) đối với việc thiết kế, triển khai và bảo trì các trạng thái Skeleton Loading trên toàn bộ ứng dụng Web.

---

## 1. Nguyên Tắc Cốt Lõi Cần Bổ Sung Vào Rules & Docs

1. **Skeleton Structural Fidelity (Mô phỏng cấu trúc 1:1)**:
   - Skeleton loading không chỉ là một khối vạch nhấp nháy chung chung mà **BẮT BUỘC phải mô phỏng chính xác khung xương và phân bố không gian của giao diện thực tế** (1:1 Layout & Spatial Match).
   - Phải giữ nguyên toàn bộ các đường viền bao ngoài: khung `DataPanel` (`border border-slate-200`), viền ngăn cách header (`border-b`), thanh điều hướng Quick Links, và thanh bộ lọc kỳ (`PeriodFilterToolbar`).

2. **Table Cell-Level Border & Column Width Parity (Đồng bộ viền và độ rộng ô bảng)**:
   - Trong bảng `DataTable`: Các ô skeleton `td` bắt buộc phải có đầy đủ đường viền ngăn cách dọc (`border-r border-r-slate-50 last:border-r-0 dark:border-r-slate-900/60`), viền đáy (`border-b border-b-slate-100 dark:border-b-slate-800`), và `style={{ minWidth: column.minWidth, width: getColumnWidth(column) }}` để cố định chính xác độ rộng cột trong lúc tải, triệt tiêu hiện tượng co giật layout (layout shift) khi nạp xong dữ liệu.
   - Vạch `animate-pulse` phải căn phải (`ml-auto`) đối với các cột số liệu, ngày giờ hoặc thao tác (`align === 'right'`).

3. **Zero Raw Text Loading Policy (Cấm text loading thô sơ)**:
   - Tuyệt đối KHÔNG render text thô sơ như `<div className="...">Đang tải dữ liệu...</div>` thay thế cho cấu trúc trang. Luôn luôn duy trì khung vỏ hoàn chỉnh (App Shell + Period Toolbar + Summary Strip + DataPanels + Skeleton Tables).

4. **Zero Duplicate / Shifting Headers (Không thêm header thừa)**:
   - Layout chung (`PrivateLayout`) đã render sẵn `<WorkspaceHeader />`. Do đó, Skeleton của từng trang tuyệt đối không được tự ý render thêm thẻ `<header>` chứa tiêu đề loading gây giật vị trí hoặc nhân đôi header.

---

## 2. Các File Sẽ Được Cập Nhật

### [Component 1] Agent System Rules
#### [MODIFY] [common-data-tables.md](file:///Users/datdoan/Documents/projects/telebot/.agents/rules/common-data-tables.md)
- Bổ sung Mục 5: **Quy Định Bắt Buộc Skeleton Loading Mô Phỏng 1:1 (Skeleton & Loading Full Fidelity Policy)**.
- Bổ sung bảng đối chiếu hành vi cấm vs chuẩn cho trạng thái Skeleton/Loading.

---

### [Component 2] Canonical Knowledge (English for AI Agent)
#### [MODIFY] [web-ui-direction.md](file:///Users/datdoan/Documents/projects/telebot/.agents/knowledge/global/web-ui-direction.md)
- Bổ sung quy định chi tiết về **Skeleton & Loading State Full Fidelity**:
  - Cell-level border parity (`border-r`, `border-b`, minWidth/width style preservation).
  - Component wrapper preservation (`DataPanel` headers, period toolbars, quick link pills, chart skeletons).
  - Prohibition of raw text loading and redundant header elements.
#### [MODIFY] [README.md](file:///Users/datdoan/Documents/projects/telebot/.agents/knowledge/modules/dashboard/README.md)
- Cập nhật đặc tả chi tiết về `DashboardHomeSkeleton` và `AnalyticsSkeleton` (đầy đủ 6 DataPanels, Quick Links bar, Cashflow trend skeleton, và 2 chart panels).

---

### [Component 3] Developer Documentation (Vietnamese for Developers)
#### [MODIFY] [web-ui-direction.md](file:///Users/datdoan/Documents/projects/telebot/.agents/docs/global/web-ui-direction.md)
- Bổ sung mục hướng dẫn **Quy chuẩn thiết kế Skeleton Loading đồng bộ đường viền và cấu trúc giao diện**.
- Minh hoạ code mẫu chuẩn cho DataTable skeleton và Dashboard/Analytics skeleton.
#### [MODIFY] [README.md](file:///Users/datdoan/Documents/projects/telebot/.agents/docs/modules/dashboard/README.md)
- Cập nhật tài liệu module Dashboard về cấu trúc Skeleton chuẩn hóa.

---

## 3. Kế Hoạch Xác Minh (Verification Plan)

### Automated Tests
- Chạy `npm run agent-system:validate` để xác nhận liên kết và tính hợp lệ của toàn bộ hệ thống rules và docs.
- Chạy `npm run typecheck` và `npm run lint` để đảm bảo hệ thống mã nguồn không bị ảnh hưởng.
