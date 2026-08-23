# Đánh giá chuyển dashboard sang Next.js Static Export

## Kết luận

Không nên chuyển ở thời điểm hiện tại. `apps/web` là client-side dashboard riêng tư; Vite đã phù hợp với mô hình này và Next.js Static Export không mang lại SSR, SEO hay server-side capability cho các trang dashboard.

## Bằng chứng từ repository

- Web là Vite + React SPA, dùng proxy `/api` khi phát triển.
- Mọi dữ liệu dashboard và contacts được gọi từ browser qua Axios/TanStack Query sau khi render.
- Xác thực bắt đầu từ redirect `/reports#dashboard_token=...`; access token nằm ở local storage và refresh token là cookie HttpOnly do API phát hành.
- Các route app hiện là `/reports`, `/reports/statistics`, `/reports/contacts` và được điều hướng bằng History API trong một component React.
- API đã là backend độc lập; không có nhu cầu Next.js route handlers, Server Actions, SSR hoặc SSG data fetching trong dashboard.

## Hệ quả

Next.js Static Export vẫn cần client-side API calls và cùng cơ chế token hiện tại. Việc di chuyển sẽ thêm framework, thay bộ build/routing và cần cấu hình publish đúng cho các deep-link `/reports/*`, nhưng không cải thiện đáng kể tải dashboard hay bảo mật.

## Khi nên cân nhắc

- Cần landing page công khai, SEO, social metadata hoặc nội dung marketing.
- Cần dashboard có SSR/streaming/BFF; khi đó Static Export không còn là mục tiêu phù hợp, nên cân nhắc Next.js server runtime.
- Muốn chuẩn hoá đội ngũ trên Next.js vì nhiều ứng dụng khác, chấp nhận chi phí migration.

## Khuyến nghị

Giữ Vite cho dashboard. Nếu cần một website public, tạo một static site/Next.js app độc lập bên cạnh `apps/web`, không migration dashboard đang hoạt động.
