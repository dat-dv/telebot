# Kế hoạch khắc phục lỗi Git Pre-commit Validation (i18n Safety)

## Bối cảnh & Nguyên nhân lỗi

Khi chạy `git commit`, hook `agent-system:validate --check-changes --check-i18n` báo 15 lỗi fail:

1. **Hardcoded JSX Props (2 lỗi thực tế)**:
   - `apps/web/src/modules/dashboard/view/calendar-screen.tsx:200`: `aria-label="Previous month"`
   - `apps/web/src/modules/dashboard/view/calendar-screen.tsx:208`: `aria-label="Next month"`
   - Từ điển đa ngôn ngữ (`packages/contracts`) đã có sẵn key `calendar.nav.prev` và `calendar.nav.next`.
1. **False-Positive JSX Text trong Validator (13 lỗi giả)**:
   - Các file bảng (`calendar-table.tsx`, `reminders-table.tsx`, `tasks-table.tsx`, `transactions-table.tsx`, `debts-table.tsx`) khai báo interface TypeScript: `onSaveEdit?: (id: string) => void | Promise<void>;`
   - Regex kiểm tra JSX text trong `scripts/agent-system/validators/i18n-strings.ts` quét ký tự `>` trong toán tử arrow function `=>` và `<` trong generic `<void>`, dẫn tới chuỗi `void | Promise` bị nhận nhầm thành JSX text child nằm giữa thẻ mở và thẻ đóng.

---

## User Review Required

> [!NOTE] Không có thay đổi phá vỡ kiến trúc (breaking changes). Các key i18n `calendar.nav.prev` ("Previous Month" / "Tháng trước") và `calendar.nav.next` ("Next Month" / "Tháng sau") đã được định nghĩa đầy đủ trong `packages/contracts`.

---

## Proposed Changes

### 1. Web Dashboard View

#### [MODIFY] calendar-screen.tsx

- Cập nhật `aria-label="Previous month"` thành `aria-label={t('calendar.nav.prev')}`.
- Cập nhật `aria-label="Next month"` thành `aria-label={t('calendar.nav.next')}`.

---

### 2. Agent System Validator

#### [MODIFY] i18n-strings.ts

- Bổ sung cơ chế loại trừ cho các khai báo kiểu TypeScript (`type`, `interface`, `export type`, `export interface`).
- Tiền xử lý `sanitizedJsxLine` để loại bỏ các toán tử `=>`, `>=`, `<=`, `->` và generic types dạng `Identifier<...>` trước khi regex quét JSX tag text, ngăn chặn triệt để false-positive trên các chữ ký hàm TypeScript trong file `.tsx`.

#### [MODIFY] i18n-strings.test.ts

- Bổ sung test case kiểm tra file `.tsx` chứa type definition với `=> void | Promise<void>;` và generic type parameters không bị báo lỗi vi phạm `i18n-jsx-text`.

---

## Verification Plan

### Automated Tests

1. Chạy test bộ validator i18n:
   ```bash
   npx tsx --test scripts/agent-system/validators/i18n-strings.test.ts
   ```
1. Chạy toàn bộ hệ thống kiểm tra validation & i18n:
   ```bash
   npm run agent-system:validate -- --check-changes --check-i18n
   ```
