# Kế hoạch: chuẩn hoá ngữ cảnh thời gian cho agent

RequestFeedback: false

## Kết quả triển khai

- Đã thiết lập `Asia/Ho_Chi_Minh` (`UTC+07:00`) làm ngữ cảnh thời gian mặc định cho toàn bộ agent và sub-agent.
- Hướng dẫn yêu cầu giữ timezone được nêu rõ trong dữ liệu đầu vào và thông báo rõ khi chuyển đổi sang giờ Việt Nam.

## Mục tiêu

Thiết lập `Asia/Ho_Chi_Minh` (UTC+7, giờ Việt Nam) là quy ước thời gian mặc định cho toàn bộ agent làm việc trong workspace, bao gồm agent chính và sub-agent.

## Phạm vi

- Cập nhật `AGENTS.md` với quy ước bắt buộc khi diễn giải mốc thời gian, lập kế hoạch, log/artifact và trả lời người dùng.
- Cập nhật `.agents/rules/agent-bootstrap.md` để quy ước được nạp ngay từ adapter always-on.
- Không thay đổi timezone runtime, dữ liệu người dùng, biến môi trường hay logic ứng dụng.

## Cách thực hiện

1. Ghi rõ IANA timezone chuẩn là `Asia/Ho_Chi_Minh` và offset `UTC+07:00`.
2. Yêu cầu agent hiển thị/diễn giải thời gian theo giờ Việt Nam trừ khi người dùng chỉ định timezone khác; với mốc nhập có timezone riêng, phải giữ nguyên timezone đó và nêu rõ khi chuyển đổi.
3. Ghi nhận thời điểm của artifact, kế hoạch và báo cáo theo giờ Việt Nam khi cần nêu ngày/giờ.
4. Kiểm tra diff để bảo đảm chỉ thay đổi hướng dẫn agent.

## Rủi ro và hoàn tác

- Rủi ro rất thấp: chỉ thay đổi quy ước vận hành của agent trong workspace.
- Có thể hoàn tác bằng cách xóa hai đoạn hướng dẫn timezone.
