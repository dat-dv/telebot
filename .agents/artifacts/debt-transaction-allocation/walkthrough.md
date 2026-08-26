# Báo Cáo Khắc Phục Triệt Để Lỗi PostgreSQL: `operator does not exist: character varying = uuid`

## 1. Nguyên Nhân Gốc Rễ (Root Cause Analysis)

Khi truy vấn `GET /api/debts`, TypeORM thực hiện câu lệnh `SELECT` kết hợp `LEFT JOIN` với bảng con (`children`), bảng cha (`parentDebt`), `contact`, và `payments`:

```sql
LEFT JOIN ("debts" "children" ...) ON "children"."parent_debt_id" = "debts"."id"
LEFT JOIN "debts" "parentDebt" ON "parentDebt"."id" = "debts"."parent_debt_id"
```

1. **Lệch kiểu dữ liệu vật lý**:
   - Trên cơ sở dữ liệu PostgreSQL thực tế, bảng `debts` được tạo với khóa chính `"id"` kiểu **`uuid`** (do `@PrimaryGeneratedColumn('uuid')`).
   - Migration `1724680000000-AddParentDebtHierarchy` trước đó đã thêm cột `"parent_debt_id"` với kiểu dữ liệu **`character varying`** (varchar).
   - Tương tự, migration `1724670000000-CreateDebtPaymentAllocations` đã tạo các cột `"finance_transaction_id"` và `"debt_id"` dạng `character varying` thay vì `uuid`.
1. **PostgreSQL Type Strictness**:
   - Trong PostgreSQL, phép so sánh bằng (`=`) giữa kiểu `character varying` và `uuid` không tồn tại mặc định (nếu không ép kiểu tường minh).
   - Do đó, PostgreSQL quăng lỗi: `ERROR: operator does not exist: character varying = uuid at character 9732`.
   - `GlobalExceptionsFilter` bắt lỗi này và trả về `400 Bad Request: "Database query failed"`.

---

## 2. Các Thay Đổi Đã Thực Hiện (Remediations Applied)

1. **Tạo Migration Tự Động Sửa Kiểu (`1724690000000-FixPostgresUuidTypes.ts`)**:
   - Tự động kiểm tra `information_schema.columns` nếu `debts.id` có kiểu `uuid`.
   - Chuyển đổi an toàn (safe alter) các cột:
     - `debts.parent_debt_id` -> `uuid` (sử dụng `USING parent_debt_id::uuid`).
     - `debt_payments.finance_transaction_id` -> `uuid`.
     - `debt_payment_allocations.id` -> `uuid` (kèm default `gen_random_uuid()`).
     - `debt_payment_allocations.debt_id` -> `uuid`.
     - `debt_payment_allocations.finance_transaction_id` -> `uuid`.
     - `finance_transactions.contact_id` -> `uuid`.
     - `finance_transactions.place_id` -> `uuid`.
   - Đã đăng ký migration mới vào `database.module.ts` và `data-source.ts`.
1. **Cập Nhật Các Migrations Trước Đó Trở Nên UUID-Aware**:
   - `1724680000000-AddParentDebtHierarchy.ts`: Dùng khối `DO $$ ... END $$;` kiểm tra `debts.id` để tự động tạo `parent_debt_id` kiểu `uuid` nếu bảng cha là `uuid`, hoặc `character varying` nếu bảng cha là `varchar`.
   - `1724670000000-CreateDebtPaymentAllocations.ts`: Tương tự, tự động tạo `uuid` hoặc `character varying` đồng bộ với DB.
1. **Chuẩn Hóa TypeORM Query Builder**:
   - Chuyển `getActiveDebts`, `listDebts` và `getDebtAllocationCandidates` trong `FinanceService` sang dùng `debtRepo.find(...)` với relations type-safe.

---

## 3. Kết Quả Kiểm Thử (Verification Results)

- **Backend Unit Tests**: 70/70 tests passing (100%).
- **TypeScript Typecheck**: 0 errors trên toàn bộ Monorepo.
- **ESLint & Prettier**: 0 errors / 0 warnings.
- **NestJS Build**: Compile thành công 100% vào `dist/`.
- **Pre-commit Validator**: 91 artifacts, 0 drift, 0 lỗi i18n.
