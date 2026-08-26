# Kế hoạch: Tách kết quả theo kỳ và tình hình tài chính hiện tại

RequestFeedback: true

## Mục tiêu đã chốt

Trang **Báo cáo & Phân tích** hiển thị hai nhóm số liệu có ngữ nghĩa tách biệt:

1. **Kết quả trong kỳ đang lọc**: Tổng thu, Tổng chi, Tiết kiệm ròng, Tỷ lệ tích lũy. Tất cả thay đổi theo Tuần/Tháng/Quý/Năm/Toàn bộ.
2. **Tình hình tài chính hiện tại**: Số dư dòng tiền tích lũy, Phải thu còn lại, Phải trả còn lại, Tài sản ròng. Các số này luôn tính từ toàn bộ lịch sử đến hiện tại và không bị thay đổi bởi kỳ lọc.

## Hiện trạng

- `GET /api/finance/analytics` đã tính đúng `summary` theo `startAt`/`endAt` cho Thu, Chi, Tiết kiệm ròng, Tỷ lệ tích lũy.
- Cùng response đó lại tính `debts` từ toàn bộ công nợ đang mở, nên KPI “Chênh lệch vay nợ” không thuộc kỳ lọc nhưng đang nằm chung trong dải KPI của kỳ lọc.
- Frontend `AnalyticsScreen` hiển thị năm KPI trong một dải, khiến số công nợ hiện tại dễ bị hiểu là số của năm đang chọn.
- Chưa có số dư dòng tiền toàn lịch sử trong response analytics. Hệ thống hiện không quản lý số dư đầu kỳ/tài khoản ngân hàng riêng, nên số này được gọi chính xác là **số dư dòng tiền theo sổ thu–chi** (`toàn bộ thu - toàn bộ chi`), không phải số dư ngân hàng thực tế.

## Thiết kế API và shared contract

1. Giữ `summary` là dữ liệu **trong kỳ**: `income`, `expense`, `balance`, `netSavingsRate`.
2. Thêm nhóm `currentPosition` vào `IFinanceAnalyticsResponse`:
   - `cashflowBalance`: toàn bộ thu trừ toàn bộ chi đến hiện tại.
   - `receivable`: tổng các khoản cho vay còn mở.
   - `payable`: tổng các khoản đi vay còn mở.
   - `netWorth`: `cashflowBalance + receivable - payable`.
3. Giữ `debts` cho biểu đồ cơ cấu công nợ hiện tại và danh sách đối tác; không dùng nó làm KPI của kỳ lọc.
4. API lấy summary trong kỳ và summary toàn lịch sử theo các truy vấn độc lập, tránh làm thay đổi logic trend/cơ cấu chi tiêu hiện có.

## Thiết kế giao diện

1. Đặt tiêu đề **Kết quả trong kỳ** ngay dưới bộ lọc, kèm mô tả động theo phạm vi đã chọn; giữ bốn KPI hiện tại trong nhóm này.
2. Bổ sung `DataPanel` **Tình hình tài chính hiện tại** ngay sau đó, gồm bốn KPI: Số dư dòng tiền theo sổ, Phải thu còn lại, Phải trả còn lại, Tài sản ròng.
3. Chuyển chênh lệch vay nợ khỏi dải KPI của kỳ lọc. Biểu đồ/lưới **Cơ cấu công nợ** được gắn nhãn “hiện tại” để thống nhất ngữ nghĩa.
4. Bổ sung các translation key Việt/Anh; không thêm text cứng trong TSX. Mobile xếp KPI theo cột; desktop giữ lưới dày, dễ quét số liệu.

## Phạm vi tệp dự kiến

| Khu vực                                                                                                               | Thay đổi                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/index.ts`                                                                                     | Shared interface analytics và i18n Việt/Anh cho hai nhóm KPI.                                                 |
| `apps/api/src/finance/finance.service.ts`                                                                             | Tính nhóm `currentPosition` từ toàn bộ lịch sử và công nợ đang mở.                                            |
| `apps/api/src/finance/finance.service.spec.ts`                                                                        | Regression test: filter rỗng vẫn có current position đúng, và summary trong kỳ không bị lẫn công nợ hiện tại. |
| `apps/web/src/modules/dashboard/view/analytics-screen.tsx`                                                            | Tách dải KPI theo kỳ khỏi panel tình hình hiện tại; dùng contract mới.                                        |
| `apps/web/src/modules/dashboard/api/*`                                                                                | Điều chỉnh kiểu tiêu thụ response nếu cần, giữ cache key theo filter hiện có.                                 |
| `.agents/knowledge/modules/dashboard/README.md`, `.agents/docs/modules/dashboard/README.md`, `.agents/docs/README.md` | Đồng bộ ngữ nghĩa chỉ số, API seam và hành vi responsive.                                                     |

## Tiêu chí nghiệm thu

- Chọn năm 2027 không có giao dịch: bốn KPI **Kết quả trong kỳ** đều bằng 0.
- Cùng lúc, panel **Tình hình tài chính hiện tại** vẫn hiển thị đúng số dư dòng tiền, phải thu, phải trả và tài sản ròng của toàn bộ lịch sử.
- Chọn năm/tháng/quý khác chỉ làm thay đổi nhóm trong kỳ, biểu đồ dòng tiền và cơ cấu chi tiêu; không làm thay đổi nhóm hiện tại.
- Không có thay đổi schema hay migration: mọi số liệu dùng `finance_transactions` và `debts` hiện hữu.
- `npm run typecheck`, `npm run lint`, test API finance và `npm run build` đạt.

## Rủi ro và giới hạn

- “Số dư dòng tiền theo sổ” không phải số dư ngân hàng/ví thực tế vì hệ thống chưa có số dư đầu kỳ hoặc module quản lý tài khoản. Nhãn UI sẽ thể hiện rõ giới hạn này.
- Đây là thay đổi contract API và UI ở mức medium risk; không ảnh hưởng dữ liệu lịch sử hoặc migration.
