# Kế hoạch: proxy local Dashboard và phản hồi lỗi rõ ràng

RequestFeedback: true

## Mục tiêu

Khi mở link Dashboard trên local qua `http://localhost:5173/api/access?...`, frontend dev chuyển tiếp request đến NestJS local (`http://localhost:3000/api/access?...`) thay vì hiện trang trống/không truy cập được. Các lỗi do token không hợp lệ hoặc hết hạn cần có phản hồi người dùng đọc được.

## Bằng chứng và giới hạn

- `apps/web` đang chạy Next dev ở cổng `5173`; NestJS ở cổng `3000` và gắn prefix `/api`.
- `apps/web/next.config.ts` đang dùng `output: 'export'`; static export production không hỗ trợ Next rewrites. Production đã có Nginx proxy `/api/*` sang NestJS.
- Vì vậy proxy Next chỉ được bật trong development. Production vẫn giữ Nginx, không đổi routing public hiện có.
- Next rewrite có thể chuyển tiếp request thành công nhưng không thể tự render trang 503 khi tiến trình NestJS tắt: lỗi kết nối xảy ra trước khi ứng dụng API trả response. Với tình huống này cần một dev proxy có xử lý lỗi riêng nếu anh muốn một trang 503 thay vì lỗi mạng của trình duyệt.

## Thay đổi đề xuất

1. Cập nhật `apps/web/next.config.ts` để, chỉ khi `next dev`, rewrite `/api/:path*` tới `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:3000`), giữ nguyên path/query string. Khi build production, không khai báo rewrite để tương thích static export/Nginx.
2. Cập nhật `apps/api/src/reports/reports.controller.ts` để endpoint exchange-token trả về trang lỗi HTML tối giản, dễ đọc và có HTTP status phù hợp cho trường hợp token thiếu/không hợp lệ/hết hạn (401 hoặc 400), thay vì một response JSON/trắng khi người dùng mở link bằng trình duyệt.
3. Bổ sung regression tests cho cấu hình rewrite development và phản hồi lỗi của endpoint access, nếu test harness hiện có phù hợp; nếu chưa có test seam, thực hiện kiểm chứng HTTP thủ công có lặp lại.
4. Cập nhật tài liệu vận hành local và kiến thức module dashboard vì local routing/error contract thay đổi.

## Tiêu chí nghiệm thu

- API đang chạy: link `localhost:5173/api/access?token=...` chuyển tiếp thành công và redirect đến `/reports`.
- Token không hợp lệ/đã dùng/hết hạn: trình duyệt nhận trang giải thích có status 401/400 thay vì màn hình trống.
- API không chạy: proxy không thể tạo trang 503 chỉ bằng rewrite; trình duyệt sẽ báo không kết nối/Next dev error. Nếu cần bắt buộc trang 503 ở case này, sẽ cần phạm vi bổ sung: dev reverse-proxy riêng có error handler, hoặc chạy Nginx local giống production.
- `npm run typecheck`, lint liên quan và kiểm tra HTTP pass.

## Rủi ro và rollback

- Rủi ro trung bình vì chạm ranh giới frontend/backend và luồng token một lần. Không log hoặc lưu token trong test/tài liệu.
- Rollback là gỡ rewrite development và khôi phục response endpoint; production Nginx không bị ảnh hưởng.
