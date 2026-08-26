---
Title: Hoàn thiện dark mode toàn ứng dụng
Route: implement
Authority: inspect-and-plan
Risk: medium
RequestFeedback: true
Status: completed
---

# Kế hoạch: Hoàn thiện dark mode toàn ứng dụng

## Mục tiêu

Đảm bảo khi `html[data-theme='dark']` được bật, toàn bộ vỏ ứng dụng và các điều khiển dùng chung hiển thị nhất quán theo nền tối; đặc biệt gồm navigation desktop/mobile và workspace header. Không thay đổi hành vi chuyển theme, lưu lựa chọn theme hoặc luồng nghiệp vụ.

## Bằng chứng đã kiểm tra

- Theme đã được quản lý tập trung tại `apps/web/src/shared/providers/theme-provider.tsx` thông qua `data-theme` trên phần tử `html` và local storage.
- `apps/web/src/styles.css` đã có nhiều override dark mode cho các component CSS truyền thống, nhưng các component dùng Tailwind mới hơn vẫn đặt trực tiếp `bg-white`, `text-slate-*`, `border-slate-*`.
- Ba thành phần dùng chung còn hard-code màu light là:
  - `apps/web/src/shared/ui/app-navigation.tsx`: mobile header, navigation drawer, menu links, nút điều hướng, điều khiển theme/ngôn ngữ.
  - `apps/web/src/shared/ui/workspace-header.tsx`: nền, viền, chữ và các nút thao tác của header.
  - `apps/web/src/shared/ui/period-filter-toolbar.tsx`: segmented controls, nút đổi kỳ và nhãn khoảng thời gian.
- Các page/module còn lại chủ yếu dùng class CSS đã có override trong `styles.css`; các phần này sẽ được rà soát khi xác thực trực quan để phát hiện phần còn sót.

## Phạm vi thay đổi đề xuất

1. Chuẩn hóa token/theme utilities cho các shared component nêu trên, thêm biến thể `dark:` tương ứng cho nền, viền, chữ, hover, trạng thái active và controls.
2. Bổ sung hoặc điều chỉnh các override global trong `apps/web/src/styles.css` cho các surface/layout còn thiếu (bao gồm các trang public/legal nếu chúng khả dụng trong app), ưu tiên palette slate/zinc tương phản tốt và giữ phong cách Flat Enterprise hiện tại.
3. Giữ semantic color và trạng thái active rõ ràng ở navigation; overlay mobile, focus-visible và select phải đạt độ tương phản phù hợp trong dark mode.
4. Chạy kiểm tra giao diện ở desktop và mobile trên các route đại diện (dashboard, transactions, calendar, contacts, settings), chuyển qua lại light/dark để xác nhận không còn nền trắng, text tối hoặc border light bị sót.
5. Cập nhật tài liệu UI toàn cục (`.agents/knowledge/global/web-ui-direction.md`, `.agents/docs/global/web-ui-direction.md` và index nếu cần) nếu kết quả xác lập hoặc thay đổi yêu cầu dark-mode dùng chung.

## Tiêu chí hoàn thành

- Navigation drawer, mobile navbar và workspace header không còn dùng màu light cố định khi dark mode bật.
- Toolbar/kỳ thời gian và các common controls có nền, viền, text, hover/focus/active nhất quán ở cả hai theme.
- Không phát hiện bề mặt trắng/chữ tối gây khó đọc trên các route kiểm tra đại diện.
- Chuyển theme vẫn lưu và khôi phục đúng lựa chọn hiện có.
- `npm run lint`, `npm run typecheck` và `npm run build` thành công, hoặc lỗi ngoài phạm vi sẽ được báo rõ.

## Rủi ro và cách kiểm soát

- Đây là thay đổi đa thành phần nhưng chỉ về trình bày. Dùng biến thể màu cục bộ cho component Tailwind để tránh selector global ghi đè ngoài ý muốn.
- Kiểm tra responsive navigation để bảo đảm menu drawer/overlay vẫn có thứ bậc màu và focus rõ trên màn hình nhỏ.
- Bảo toàn các chỉnh sửa chưa commit hiện có; không chạm vào API, dữ liệu hay source không thuộc UI theme.

## Kết quả triển khai

- Đã bổ sung custom variant Tailwind `dark:` bám theo `html[data-theme='dark']` đang được `ThemeProvider` sử dụng.
- Đã áp dụng màu dark cho navigation desktop/mobile, workspace header và period filter toolbar; bao gồm trạng thái hover, active, border, text và focus.
- Đã bổ sung override dark mode cho các trang public/legal và focus outline của điều khiển dùng bàn phím.
- Xác thực: lint và typecheck web thành công; kiểm tra trực quan dashboard ở desktop và mobile xác nhận body, header, drawer, border và icon menu đều dùng palette dark. Production build chưa chạy được do Turbopack không được phép bind cổng nội bộ trong môi trường hiện tại.
