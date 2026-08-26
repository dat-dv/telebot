---
metadata:
  agent-artifact:
    id: docs-module-finance
    type: documentation
    depends_on:
      - .agents/knowledge/modules/finance/README.md
---

# Module finance

Module `apps/api/src/finance` quản lý các giao dịch thu–chi, danh bạ công nợ, khoản nợ, danh mục và nơi chốn của từng người dùng.

## Nơi chốn/cửa hàng

- Bảng `finance_places` lưu riêng quán ăn, cửa hàng, địa điểm hoặc đối tác mua bán; không dùng `debt_contacts` cho dữ liệu này.
- Mỗi nơi chốn thuộc một người dùng và không thể trùng tên sau khi chuẩn hóa bỏ dấu/chữ hoa-thường.
- `finance_transactions.place_id` là liên kết tùy chọn. Xóa nơi chốn chỉ gỡ liên kết, không xóa phát sinh.
- API Nơi chốn: `GET/POST/PATCH/DELETE /api/places`. Tất cả endpoint đều xác thực dashboard token và giới hạn theo đúng người dùng sở hữu.
- API Báo cáo & Phân tích: `GET /api/finance/analytics` nhận tham số `startAt`, `endAt`, `grain` (`day`, `week`, `month`, `quarter`, `year`, `all`) để tính toán tổng hợp toàn bộ dữ liệu dòng tiền (Thu, Chi, Số dư, Tỷ lệ tích lũy %), chuỗi phân bổ theo mốc thời gian (Trend buckets), cơ cấu chi tiêu theo danh mục (Category breakdown %) và tình hình công nợ theo đối tác (Debt breakdown).
- Khi tạo hoặc sửa giao dịch qua `/api/transactions`, gửi `placeId` đã chọn hoặc `placeName` để hệ thống tìm/tạo nơi chốn. Gửi `placeId: null` để bỏ liên kết.

## Dashboard và Gemini

- Trang **Báo cáo & Phân tích** (`/analytics`) gọi `GET /api/finance/analytics` để trực quan hóa biểu đồ dòng tiền (Cashflow trend), cơ cấu chi tiêu (Category donut), và phân bổ công nợ (Debt structure).
- Bảng **Thu chi** có cột **Nơi chốn** và nút **🔗 Phân bổ công nợ** trên từng dòng.
- **Tính năng Phân bổ Giao dịch vào Công nợ**:
  * Cho phép người dùng gắn trực tiếp số tiền của một giao dịch thu/chi có sẵn vào một hoặc nhiều khoản công nợ đang mở (Thu phân bổ cho Phải thu, Chi phân bổ cho Phải trả).
  * Modal `DebtAllocationModal` hiển thị thông tin giao dịch nguồn, tính toán số dư chưa phân bổ real-time, danh sách khoản nợ ứng viên, hỗ trợ nút "Phân bổ tối đa" và kiểm soát chặt chẽ giới hạn số tiền.
  * API hỗ trợ: `GET /api/transactions/:id/candidate-debts`, `GET /api/transactions/:id/allocations`, `POST /api/transactions/:id/allocations`, `DELETE /api/transactions/:id/allocations/:allocationId`.
- Tìm kiếm giao dịch áp dụng cho danh mục, ghi chú và nơi chốn.
- **Tra cứu và phân bổ công nợ qua Gemini & Telegram**:
  * Khi người dùng yêu cầu gắn giao dịch vào nợ, Gemini gọi `list_candidate_debts` để tra cứu các khoản nợ phù hợp.
  * Gemini gọi `allocate_transaction_to_debts` để tạo xác nhận phân bổ công nợ hiển thị đầy đủ chi tiết số tiền và danh sách các khoản nợ được phân bổ.
- **Tra cứu và tạo nơi chốn của Gemini**:
  * Khi người dùng nhắc đến tên quán ăn/địa điểm, Gemini gọi công cụ `resolve_finance_place` để tra cứu danh sách nơi chốn đã có của người dùng, tránh tạo trùng lặp nơi chốn đã tồn tại.
  * Nếu nơi chốn đã có: Gemini truyền `placeId` vào payload cập nhật/ghi sổ giao dịch.
  * Nếu nơi chốn chưa có: Gemini truyền `createNewPlace: true` và `placeName`. Telegram UI hiển thị hộp thoại xác nhận đa thao tác (1. Tạo nơi chốn mới, 2. Ghi/cập nhật giao dịch) kèm toàn bộ khối JSON payload của từng thao tác gọi API để người dùng kiểm tra minh bạch trước khi bấm Xác nhận.
  * Tạo riêng địa điểm độc lập sử dụng `create_finance_place`.

## Kiểm thử

Chạy `npm run build --workspace @telebot/contracts`, `npm run typecheck`, `npm run lint` và `npm run test --workspace @telebot/api`. Nếu cơ sở dữ liệu chạy `TYPEORM_SYNCHRONIZE=true`, entity mới được đồng bộ khi API khởi động; môi trường production cần áp dụng migration/schema change tương ứng trước khi triển khai.

