---
RequestFeedback: true
---

# Kế hoạch: cố định sidebar khi cuộn nội dung chính

## Mục tiêu

Trên giao diện desktop, thao tác cuộn chỉ diễn ra trong vùng nội dung chính. Sidebar điều hướng luôn giữ nguyên vị trí và không bị cuộn cùng nội dung trang.

## Phát hiện

- `apps/web/app/(private)/layout.tsx` đã tách hai vùng trực tiếp: `AppNavigation` và `section.app-content` trong `main.app-shell`.
- `apps/web/src/styles.css` hiện dùng sidebar `position: sticky`, nhưng vùng cuộn vẫn là toàn bộ trang (`body`), nên sidebar vẫn tham gia vào ngữ cảnh cuộn của trang.
- Ở breakpoint `<= 960px`, sidebar trở thành drawer `position: fixed`; cơ chế này cần được giữ nguyên.

## Phạm vi thay đổi

1. Điều chỉnh CSS desktop trong `apps/web/src/styles.css`:
   - Khóa chiều cao của application shell theo viewport và ngăn shell cuộn ở cấp ngoài.
   - Đặt `min-height: 0` cho grid item cần thiết và chỉ bật `overflow-y: auto` tại `.app-content`.
   - Bảo toàn cơ chế responsive hiện có, để mobile vẫn cuộn trang bình thường và navigation drawer vẫn hoạt động.
1. Đồng bộ mô tả quy tắc layout desktop trong:
   - `.agents/knowledge/global/web-ui-direction.md` (English)
   - `.agents/docs/global/web-ui-direction.md` (Vietnamese)
1. Kiểm tra lint, typecheck và build web sau khi sửa.

## Tiêu chí nghiệm thu

- Cuộn nội dung dài trong một route private không làm sidebar di chuyển.
- Nội dung chính vẫn cuộn đầy đủ và không gây tràn ngang ngoài ý muốn.
- Khi viewport `<= 960px`, mobile header và navigation drawer tiếp tục hoạt động như trước.
- Các kiểm tra lint, typecheck và build web hoàn tất thành công (hoặc lỗi có sẵn được báo rõ).

## Rủi ro và cách giảm thiểu

Rủi ro chính là việc giới hạn chiều cao desktop có thể cản nội dung cuộn nếu thiếu `min-height: 0`; thay đổi sẽ áp dụng đồng thời cho shell và vùng content, đồng thời giới hạn điều kiện ở breakpoint desktop để không tác động mobile.

## Kết quả thực hiện

- Đã giới hạn application shell desktop theo viewport và tắt cuộn ở lớp vỏ.
- Đã chuyển cuộn dọc vào `.app-content`, với `min-height: 0` để vùng grid có thể thu gọn đúng cách.
- Đã giữ riêng breakpoint `<= 960px`: shell và nội dung trở lại cuộn trang thông thường; mobile header và drawer không bị thay đổi hành vi.
- Đã cập nhật tài liệu UI dùng chung ở knowledge (English) và docs (Vietnamese).

## Xác minh

- `git diff --check`: thành công.
- `npm run lint`: thành công.
- `npm run typecheck`: thành công.
- `npm run build:web`: thành công.
