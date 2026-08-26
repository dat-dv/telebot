# Kế hoạch: Chuẩn hóa Analytics bằng Common UI components

RequestFeedback: true

## Mục tiêu

Chuẩn hóa toàn bộ phần UI của màn **Báo cáo & Phân tích** vừa liên quan đến KPI và controls theo Common UI, tránh lặp markup KPI và không dùng thẻ tương tác HTML raw trong feature module.

## Hiện trạng đã xác nhận

- Route `/analytics` dùng `apps/web/src/modules/dashboard/presentation/components/analytics-screen.tsx` qua file export `view/analytics-screen.tsx`.
- Màn này đang render trực tiếp cả dải KPI bằng markup lặp (`article`, `span`, `strong`) và hai raw `<button>` để đổi chế độ Biểu đồ/Bảng.
- Thư mục `apps/web/src/shared/ui/` đã có `DataPanel`, `DataTable`, `PeriodFilterToolbar` và các biểu đồ common, nhưng chưa có primitive `Button` hoặc component KPI/stat card dùng chung.
- Quy tắc frontend cho phép layout tags, nhưng cấm raw interactive tags trong feature modules; Common primitives phải là điểm dùng chung. Component lớn cũng phải được tách thành các phần nhỏ, một trách nhiệm.
- Cấu trúc `view/analytics-screen.tsx` là re-export; implementation đúng nằm trong `presentation/components/analytics-screen.tsx`.

## Thay đổi đề xuất

1. Tạo Common `Button` ở `apps/web/src/shared/ui/` với các variants đủ dùng (`default`, `outline`, `ghost`), trạng thái active/disabled và focus-visible rõ ràng.
2. Tạo Common `MetricCard`/`MetricGrid` nhận danh sách metric `{ label, value, tone }`, dùng cho KPI tài chính hiện tại lẫn skeleton tương ứng; không chứa business logic dashboard.
3. Tách AnalyticsScreen thành các feature organisms:
   - `AnalyticsPeriodResults`: kết quả trong kỳ lọc.
   - `AnalyticsCurrentPosition`: tình hình tài chính hiện tại.
   - `AnalyticsCashflowPanel`: biểu đồ/bảng dòng tiền và control đổi chế độ bằng Common Button.
4. Chuyển toàn bộ raw `<button>` trong Analytics sang Common `Button`; giữ `DataPanel`, `DataTable`, `PeriodFilterToolbar` và common charts hiện hữu.
5. Chuyển phần KPI từ markup lặp sang Common `MetricGrid`; giữ semantic colors, mật độ hiển thị và responsive grid của dashboard hiện tại.
6. Rà lại loading skeleton để mô phỏng cả hai vùng KPI sau khi tách, không tạo layout shift.
7. Đồng bộ mô tả kiến trúc Common UI/analytics trong knowledge và docs dashboard.

## Phạm vi dự kiến

| Khu vực                                                                                     | Thay đổi                                                                                        |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web/src/shared/ui/button.tsx`                                                         | Primitive Button dùng chung.                                                                    |
| `apps/web/src/shared/ui/metric-grid.tsx`                                                    | KPI card/grid dùng chung, không gắn domain.                                                     |
| `apps/web/src/modules/dashboard/presentation/components/analytics-*`                        | Feature organisms cho KPI, dòng tiền và skeleton; giảm AnalyticsScreen xuống screen controller. |
| `apps/web/src/modules/dashboard/presentation/components/analytics-screen.tsx`               | Lắp các common/feature components; xóa raw interactive markup.                                  |
| `packages/contracts/src/index.ts`                                                           | Chỉ thêm key i18n nếu Common UI cần aria/label mới.                                             |
| `.agents/knowledge/modules/dashboard/README.md`, `.agents/docs/modules/dashboard/README.md` | Cập nhật seam Common UI, 4 trạng thái, và cấu trúc hai phần KPI.                                |

## Tiêu chí nghiệm thu

- `/analytics` không còn raw `<button>`, `<input>`, `<select>`, hoặc `<textarea>` trong feature module.
- Dải **Kết quả trong kỳ** và **Tình hình tài chính hiện tại** đều dùng cùng Common MetricGrid.
- Chart/table toggle vẫn hoạt động và có focus indicator/ARIA đúng.
- Loading, error, empty, success giữ đầy đủ; skeleton phản ánh hai vùng KPI.
- Không đổi công thức API, dữ liệu hay ý nghĩa KPI đã chốt.
- Typecheck, lint và production build đạt; kiểm tra trực quan desktop/mobile không có tràn chữ hoặc layout shift.

## Rủi ro

- Đây là refactor UI medium risk: cần tránh làm mất các pattern tương tác đang có và giữ nguyên thay đổi dashboard chưa commit của anh.
- Chỉ chuẩn hóa màn Analytics và Common components liên quan; không mở rộng refactor toàn bộ ứng dụng trong lần này.
