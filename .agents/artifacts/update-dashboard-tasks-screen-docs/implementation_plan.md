# Kế hoạch Cập nhật Tài liệu Module Dashboard (Khắc phục lỗi Documentation Drift)

Khắc phục lỗi kiểm tra `pre-commit` hook (`npm run agent-system:validate -- --check-changes --check-i18n`) do mã nguồn `apps/web/src/modules/dashboard/view/tasks-screen.tsx` trong module `dashboard` đã được cập nhật thêm tính năng (lọc trạng thái, chỉnh sửa trực tiếp inline, các cột thông tin mới) nhưng tài liệu chuẩn hóa chưa được cập nhật tương ứng.

## User Review Required

> [!IMPORTANT] Việc cập nhật tài liệu tuân thủ quy chuẩn song ngữ của hệ thống Agent System:
>
> - Canonical Knowledge (`.agents/knowledge/modules/dashboard/README.md`): Viết bằng **Tiếng Anh**.
> - Developer Documentation (`.agents/docs/modules/dashboard/README.md`): Viết bằng **Tiếng Việt**.

## Proposed Changes

### Module Documentation & Knowledge

#### [MODIFY] README.md

- Bổ sung chi tiết tính năng của màn hình Tasks (`tasks-screen.tsx`) vào mục `## UI and state`:
  - Bộ lọc trạng thái công việc (`statusFilter`: `all`, `needsAction`, `completed`).
  - Chỉnh sửa dữ liệu trực tiếp trên dòng (`inline editing` hỗ trợ double click, phím Enter/Escape, các trường `title`, `notes`, `dueAt`, và các thao tác Lưu/Hủy/Xóa).
  - Mở rộng các cột dữ liệu (`notes`, `updatedAt`, `actions`) cùng thông báo toast trực quan (`toastMessage`).

#### [MODIFY] README.md

- Cập nhật mô tả UI trong tài liệu nhà phát triển (Tiếng Việt) để phản ánh các thay đổi tương ứng của màn hình Công việc trong module Dashboard.

## Verification Plan

### Automated Tests

- Chạy lệnh kiểm tra tính toàn vẹn hệ thống và chống lệch tài liệu: `npm run agent-system:validate -- --check-changes --check-i18n`
- Chạy typecheck: `npm run typecheck`
