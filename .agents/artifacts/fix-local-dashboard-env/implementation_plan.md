# Kế hoạch sửa cấu hình Dashboard ở môi trường local

RequestFeedback: true

## Mục tiêu

Để link Dashboard tạo từ API dev truy cập NestJS ở `localhost:3000`, rồi chuyển người dùng về giao diện web dev ở `localhost:5173`.

## Phạm vi thay đổi

1. Sửa root `.env.local` (được `apps/api` nạp trực tiếp):
   - `APP_URL=http://localhost:3000`
   - `WEB_ORIGIN=http://localhost:5173`
   - `NEXT_PUBLIC_API_URL=http://localhost:3000`
2. Sửa `apps/web/.env.local` để Next dev gọi API local:
   - `NEXT_PUBLIC_API_URL=http://localhost:3000`

## Không thay đổi

- Không sửa `.env` production.
- Không sửa source code, proxy, hay API contract.
- Giữ nguyên các biến secret và `CORS_ALLOW_ALL` hiện có.

## Kiểm chứng sau khi sửa

1. Khởi động lại API và web dev để nạp lại biến môi trường.
2. Tạo một dashboard link mới.
3. Mở `http://localhost:3000/api/access?token=<token-moi>` và xác nhận phản hồi redirect 302 sang `http://localhost:5173/reports#dashboard_token=...`.
4. Xác nhận dashboard tải dữ liệu qua API local.

## Rủi ro và rollback

- Phạm vi chỉ là file env local, không được commit; rollback bằng cách khôi phục ba giá trị URL hiện tại.
- Link/token cũ có thể đã hết hạn hoặc chỉ dùng một lần, cần tạo link mới để kiểm chứng.
