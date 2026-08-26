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
- Bảng **Thu chi** có cột **Nơi chốn**. Khi sửa nhanh, có thể chọn từ gợi ý hoặc gõ tên mới; xóa nội dung rồi lưu sẽ bỏ nơi chốn của giao dịch.
- Tìm kiếm giao dịch áp dụng cho danh mục, ghi chú và nơi chốn.
- Gemini truyền `placeName` cho dịch vụ thu–chi; tên này được lưu vào `finance_places`, không tạo liên hệ công nợ.

## Kiểm thử

Chạy `npm run build --workspace @telebot/contracts`, `npm run typecheck`, `npm run lint` và `npm run test --workspace @telebot/api`. Nếu cơ sở dữ liệu chạy `TYPEORM_SYNCHRONIZE=true`, entity mới được đồng bộ khi API khởi động; môi trường production cần áp dụng migration/schema change tương ứng trước khi triển khai.
