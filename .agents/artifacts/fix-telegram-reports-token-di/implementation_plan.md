# Kế hoạch sửa lỗi `ReportsTokenService` trong Telegram

RequestFeedback: true

## Mục tiêu

Khôi phục khả năng khởi động NestJS API bằng cách làm cho `ReportsTokenService` khả dụng trong phạm vi `TelegramModule`.

## Bằng chứng chẩn đoán

- `TelegramUpdate` inject `ReportsTokenService`.
- `ReportsTokenService` được khai báo và export bởi `DashboardAuthModule`.
- `TelegramModule` hiện import `ReportsModule`; module này không export lại `DashboardAuthModule` hoặc `ReportsTokenService`.
- NestJS vì thế không thể resolve constructor dependency thứ 13 khi khởi tạo `TelegramUpdate`.

## Thay đổi dự kiến

1. Trong `apps/api/src/telegram/telegram.module.ts`, thay import `ReportsModule` bằng `DashboardAuthModule`.
2. Thay mục tương ứng trong mảng `imports` bằng `DashboardAuthModule`.

`TelegramUpdate` dùng dịch vụ xác thực/dashboard trực tiếp, nên phụ thuộc trực tiếp vào module sở hữu provider sẽ tránh việc truyền dependency gián tiếp qua `ReportsModule`.

## Phạm vi và rủi ro

- Chỉ thay đổi một NestJS module wiring; không thay đổi API, schema, hay logic token.
- Rủi ro thấp: các controller reports vẫn giữ `DashboardAuthModule` hiện có và không bị ảnh hưởng.

## Xác minh sau khi sửa

1. Đạt: typecheck API.
2. Đạt: lint API.
3. Đạt: build API và kiểm tra module graph xác nhận `TelegramModule` import trực tiếp `DashboardAuthModule`.
4. Khởi động API đã đi qua giai đoạn DI từng báo lỗi; tiến trình sau đó dừng vì môi trường không phân giải được `api.telegram.org` (`ENOTFOUND`), không còn lỗi resolve `ReportsTokenService`.
5. Giới hạn: hai script Telegram hiện có thất bại vì mock không cung cấp các dependency hiện hữu của `TelegramUpdate` (`ConfigService` và/hoặc token service). Việc cập nhật mock test nằm ngoài phạm vi kế hoạch đã duyệt.
