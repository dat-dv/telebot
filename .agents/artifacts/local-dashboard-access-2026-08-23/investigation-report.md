# Báo cáo chẩn đoán: không mở được link Dashboard local

## Quan sát

- URL được kiểm tra là `http://localhost:5173/api/access/?token=<đã-che>`.
- Hai lần thử HTTP tại thời điểm điều tra đều nhận lỗi kết nối (`HTTP 000`): không kết nối được tới cổng 5173 từ môi trường kiểm tra.
- Không có tiến trình lắng nghe cổng API `3000`; cổng `5173` được một tiến trình Node chiếm.

## Bằng chứng cấu hình và mã nguồn

- `.env.local` đặt `APP_URL=http://localhost:3000`, `WEB_ORIGIN=http://localhost:5173`, và `NEXT_PUBLIC_API_URL=http://localhost:3000`.
- NestJS lắng nghe `PORT` (mặc định `3000`) và gắn tiền tố toàn cục `/api`, nên endpoint đúng của backend local là `http://localhost:3000/api/access`.
- `apps/web` chạy Next dev ở cổng `5173`, với static export và không khai báo rewrite/proxy `/api/*`; proxy đó chỉ xuất hiện trong Nginx production.

## Kết luận

Link tại cổng `5173` không thể phục vụ API trong local: đó là cổng frontend, không phải NestJS API và không có dev proxy. Đồng thời API local hiện không chạy ở cổng `3000`. Đây là nguyên nhân trực tiếp khiến không vào được, chưa có bằng chứng token bị lỗi.

## Khắc phục đề xuất

1. Khởi động API local bằng `npm run dev:api`.
2. Mở URL exchange qua `http://localhost:3000/api/access?token=...`; endpoint sẽ redirect sang dashboard ở `http://localhost:5173/reports`.
3. Nếu muốn giữ URL `/api/*` ở cổng 5173 khi dev, cần bổ sung Next rewrite/proxy trong một thay đổi mã nguồn riêng, rồi kiểm thử exchange-token một lần.

## Lưu ý

Token exchange có tính một lần; sau một request thành công cần tạo link mới nếu truy cập lại.
