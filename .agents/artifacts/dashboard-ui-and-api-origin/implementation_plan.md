# Kế hoạch: cải thiện Dashboard và chuẩn hoá domain API

RequestFeedback: true

## Bối cảnh đã xác nhận

- Dashboard Next.js được xuất tĩnh tại `apps/web/out`; không có Next.js API Route, Route Handler hoặc BFF.
- NestJS là API duy nhất và đã đặt global prefix `/api`.
- `https://telebot.datintech.site` là origin chung. Nginx ở tầng web server quyết định route: `/api/*` được chuyển thẳng sang NestJS; các route còn lại được trả từ static Next.js output.
- Vì vậy `NEXT_PUBLIC_API_URL` là `https://telebot.datintech.site` (không có `/api`). Các API route dùng sẵn tiền tố `/api`, nên request thực tế là `https://telebot.datintech.site/api/...` và không tạo `/api/api/...`.

## Mục tiêu

1. Làm mới dashboard theo phong cách B2B vận hành: gọn, ưu tiên dữ liệu, dễ quét trên desktop và vẫn sử dụng tốt trên điện thoại.
2. Cố định rõ hợp đồng URL production: domain mặc định là frontend; browser gọi `/api/*` cùng origin và Nginx định tuyến request đó sang NestJS.
3. Giữ nguyên session qua Telegram, API contract, dữ liệu và luồng đăng xuất hiện có.

## Phạm vi thay đổi dự kiến

### 1. Cấu hình endpoint frontend và deployment

- Cập nhật `apps/web/src/shared/api/http-client.ts` để chuẩn hoá public origin (loại bỏ slash cuối) và ngăn cấu hình `NEXT_PUBLIC_API_URL` kết thúc bằng `/api`; các `API_ROUTES` hiện hữu giữ nguyên tiền tố `/api`.
- Cập nhật `.env.example`, `apps/web/.env.local.example`, `docker-compose.yml`, `README.md`, và tài liệu kiến trúc để ghi rõ:
  - `APP_URL` và `WEB_ORIGIN`: `https://telebot.datintech.site`.
  - `NEXT_PUBLIC_API_URL`: `https://telebot.datintech.site`.
  - Không sử dụng API route của Next.js: Nginx chuyển `/api/*` sang NestJS, còn các URL khác phục vụ static frontend.
- Giữ và bổ sung kiểm tra cho rule Nginx `/api/ -> api:3000/api/`; đây là biên định tuyến bắt buộc, không phải API route của Next.js.

### 2. Làm mới UI dashboard

- Chỉnh `dashboard-screen.tsx`, shared navigation/table và stylesheet để tạo một workspace phẳng, data-dense:
  - header rõ trạng thái kết nối Google, nút làm mới và đăng xuất có thứ bậc;
  - thanh truy cập nhanh đồng nhất với navigation và hỗ trợ trạng thái hover/focus;
  - chỉ số tài chính thành một dải thông tin dễ so sánh, dùng màu ngữ nghĩa cho số dư/cần thu/cần trả;
  - bảng giữ mật độ cao, cột dễ quét, empty/loading/error state gọn và có CTA;
  - responsive: thanh điều hướng cuộn ngang, action dễ chạm, bảng tiếp tục cuộn ngang thay vì biến thành card.
- Không thay đổi DTO, endpoint hay business logic trong dashboard.

### 3. Đồng bộ tài liệu bắt buộc

- Cập nhật `.agents/knowledge/modules/dashboard/README.md` bằng tiếng Anh: yêu cầu UI, quy tắc API origin và seam reverse-proxy.
- Cập nhật `.agents/docs/modules/dashboard/README.md` bằng tiếng Việt và `.agents/docs/README.md`: hướng dẫn cấu hình/kiểm tra production.

## Kiểm thử và nghiệm thu

1. `npm run lint --workspace @telebot/web`
2. `npm run typecheck --workspace @telebot/web`
3. `npm run build --workspace @telebot/web` để đảm bảo static export vẫn hợp lệ và bundle nhận đúng public origin.
4. Kiểm tra bản build/preview ở desktop và mobile: navigation, focus keyboard, loading/error/empty/success, cùng URL request đúng dạng `https://telebot.datintech.site/api/...` và không bị lặp `/api/api`.

## Rủi ro và cách kiểm soát

- `NEXT_PUBLIC_API_URL` là biến build-time: sau khi đổi production config cần build/redeploy lại bundle static web.
- Không thay đổi trực tiếp `.env` hoặc `.env.local` vì đây là cấu hình runtime có thể chứa bí mật; hướng dẫn và template sẽ được cập nhật, còn server production cần nhập đúng giá trị khi deploy.
- `APP_URL` phải tiếp tục là frontend origin để backend tự tạo link Telegram `.../api/access`, không được thêm `/api` vào biến này.

## Cần anh xác nhận

Anh duyệt kế hoạch này, em sẽ triển khai UI dashboard và chuẩn hoá tài liệu/cấu hình theo quy ước origin ở trên.

## Kết quả triển khai

- Hoàn tất: chuẩn hoá API origin ở HTTP client, UI dashboard, template cấu hình production, ghi chú Nginx và tài liệu dashboard/kiến trúc.
- Không thay đổi DTO, API contract hoặc session flow.
- Đã kiểm tra: `git diff --check`, `npm run lint --workspace @telebot/web`, `npm run typecheck --workspace @telebot/web`, và `npm run build --workspace @telebot/web` đều thành công; 7 route web được xuất static.

## Bổ sung: callback OAuth có prefix `/api`

RequestFeedback: true

- Bỏ ngoại lệ `oauth2callback` khỏi NestJS global prefix để callback chính thức là `https://telebot.datintech.site/api/oauth2callback`.
- Đổi URL callback mặc định trong cấu hình OAuth sang `${APP_URL}/api/oauth2callback`.
- Để Nginx định tuyến callback theo cùng rule `/api/*` sang NestJS; gỡ location `/oauth2callback` riêng để không còn public route không prefix.
- Cập nhật tài liệu và test/check script liên quan; Google Cloud Console phải khai báo chính xác `https://telebot.datintech.site/api/oauth2callback` trong Authorized redirect URIs.
- Xác minh bằng typecheck/test phù hợp cho API và Nginx config/diff review.

## Bổ sung: mở CORS cho development từ mọi origin

RequestFeedback: true

- Đổi cấu hình CORS NestJS sang phản chiếu origin request (`origin: true`) khi `CORS_ALLOW_ALL=true`; cách này tương thích `credentials: true`, khác với `origin: '*'` vốn bị browser từ chối khi dùng cookie.
- Giữ mặc định production an toàn theo `WEB_ORIGIN`; chỉ bật mở toàn bộ khi biến `CORS_ALLOW_ALL=true` được đặt rõ ràng.
- Thêm `CORS_ALLOW_ALL=false` vào template ENV và hướng dẫn: dùng `true` tạm thời để web local `http://localhost:5173` gọi remote API; tắt lại sau khi thử nghiệm.
- Xác minh typecheck API và kiểm tra cấu hình CORS không làm thay đổi route `/api/*` hoặc redirect OAuth.
