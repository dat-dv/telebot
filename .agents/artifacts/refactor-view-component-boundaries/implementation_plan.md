---
RequestFeedback: true
Status: pending-approval
Risk: high
---

# Kế hoạch refactor component boundaries cho Web Views

## Mục tiêu

Đưa UI modules về cấu trúc tách lớp theo frontend-orchestration: route chỉ điều hướng, screen controller chỉ điều phối state/query, feature organisms tách riêng, và các dialog/workflow riêng biệt. Đồng thời loại bỏ các nguyên nhân trực tiếp làm view hiện tại trở thành component monolithic.

## Phạm vi đã xác nhận

- `apps/web/src/modules/{auth,calendar,contacts,dashboard,debts,expenses,settings}/view/`
- Các page private đang import trực tiếp các screen cũ.
- Shared UI chỉ được bổ sung khi ít nhất hai module dùng chung cùng một primitive; không thay đổi API backend, contracts, route URL hoặc database.

## Thiết kế đích

Mỗi feature chuyển sang cấu trúc sau, giữ alias `@/modules/<feature>/...`:

```text
modules/<feature>/
  presentation/
    views/        # screen controller, <100 dòng khi khả thi
    components/   # table columns, toolbar, metric/panel, inline editor
    modals/       # dialog hoặc confirm workflow thuộc riêng feature
  model/          # pure selectors, derived-list logic, edit-draft helpers
```

Route pages được cập nhật import sang `presentation/views`. Các component common hiện có chỉ được giữ hoặc mở rộng khi chúng là nguồn dùng chung thực sự (`DataTable`, `PeriodFilterToolbar`, common domain tables).

## Các bước thực hiện

1. Thiết lập component boundaries và di chuyển các screen entry-point.
   - Tạo `presentation/views`, `presentation/components`, và `presentation/modals` cho từng module có UI.
   - Cập nhật private route pages và consumer imports.
   - Duy trì exported screen public names trong barrel/compatibility export tạm thời nếu có consumer ngoài route layer.

2. Tách Dashboard thành feature organisms.
   - `DashboardHomeScreen`: tách overview metrics, attention/quick links, activity table, dashboard sections, và skeleton panels.
   - `AnalyticsScreen`: tách period-to-query adapter, summary/current-position panels, trend panel, chart/table switcher, và analytics skeleton.
   - `TransactionsScreen`, `TasksScreen`, `RemindersScreen`, `CalendarScreen`, `PlacesScreen`: tách toolbar/filter, edit-draft state helpers, mutation feedback, và panel shell.
   - Chia `TransactionsTable`, `TasksTable`, `RemindersTable`, `CalendarTable` thành column factories/cell editors/action cells, vẫn giữ một common-table public API để tránh schema duplication.

3. Tách Contacts, Debts, Expenses, Settings và Calendar.
   - Contacts: selection model, columns, row editor, bulk-combine toolbar, và combine dialog workflow.
   - Debts/Expenses/Settings: split table columns, edit/action cells, filter toolbar, metrics/summary, mutation handlers và form workflow.
   - Calendar: split month-grid cell, event chip, selected-day editor, month controls, và date helpers; chuyển phần pure date/data derivation ra `model/`.

4. Chuẩn hóa interaction boundary trong component mới.
   - Thay raw interactive tags trong feature modules bằng primitive được chia sẻ/được sở hữu rõ ràng; giữ keyboard, focus, label và i18n keys.
   - Thay phần tử không semantic có `onClick`/`onDoubleClick` bằng control keyboard-operable.
   - Tách mutation-error feedback thành component/state dùng lại, để failed mutation không bị nuốt bởi `catch` rỗng.
   - Sửa error predicates của Calendar/Reminders và bổ sung error state cho Transactions, không thay đổi business behavior.

5. Bảo toàn hành vi và tài liệu.
   - Giữ nguyên table ID/localStorage keys, query keys, filter URL contract, data sorting, money masking, i18n key usage, inline-edit keyboard behavior và shared table schemas.
   - Cập nhật `.agents/knowledge/modules/` (English) và `.agents/docs/modules/` (Vietnamese) cho các module bị thay đổi, cùng chỉ mục docs nếu cần.
   - Không tạo test mới trong đợt này vì frontend skill yêu cầu chấp thuận riêng trước khi khởi tạo test files; sẽ chạy các quality gate hiện hữu.

## Kiểm chứng sau khi refactor

- `npm run lint`
- `npm run typecheck`
- `npm run build:web`
- Rà soát tĩnh: không còn screen monolithic; feature components có ownership rõ ràng; không còn raw interactive tag trong feature presentation; không còn clickable non-semantic element.
- Smoke test browser cho Home, Analytics, Transactions, Calendar, Contacts, Debts, Expenses và Settings: loading/error/empty/success, inline edit, modal/drawer, keyboard Escape/Tab và responsive table scroll.

## Rủi ro và kiểm soát

- Đây là refactor đa-module, nên dễ phát sinh circular import hoặc thay đổi state do tách callback. Thực hiện theo từng module, xác nhận typecheck sau từng batch.
- Không đổi API/data contract để giữ rollback ở mức file/module.
- Các thay đổi hiện có trong worktree (finance, analytics, contracts và docs) là thay đổi của người dùng; chỉ tích hợp khi cần, không ghi đè.

## Tiêu chí hoàn thành

- Các route hoạt động với screen controller mỏng và feature organisms/modals tách riêng.
- Common table vẫn là nguồn schema duy nhất cho cùng entity.
- Các lỗi state/a11y trực tiếp đã audit được xử lý.
- Lint, typecheck, build web pass; docs/knowledge đồng bộ.
