# Kế hoạch: ngữ cảnh giờ Việt Nam cho JSON do Gemini tạo

RequestFeedback: false

## Kết quả triển khai

- Đã bổ sung mốc giờ động theo `DEFAULT_TIMEZONE` vào prompt OCR sinh JSON trực tiếp.
- Đã giữ nguyên system prompt vốn đã truyền thời gian cho JSON tool-call và hoàn tác hướng dẫn Codex agent không thuộc runtime Gemini.
- Đã chạy thành công 53 API tests, `npm run typecheck`, `npm run lint` và `git diff --check`.

## Phát hiện

- Luồng chat/tool-call Gemini đã gọi `buildSystemInstruction(this.defaultTimeZone)` cho mỗi model invocation. Prompt này đã truyền thời điểm động từ `getCurrentTimeInfo`, nên JSON arguments của tool đã có mốc giờ theo `DEFAULT_TIMEZONE`.
- Luồng OCR (`analyzeReceiptText`) gọi Gemini trực tiếp để trả JSON và không dùng system instruction. Vì vậy, nếu OCR có ngày tương đối hoặc cần suy luận mốc thời gian, model không nhận được thời điểm hiện tại theo giờ Việt Nam.

## Mục tiêu

Đảm bảo mọi lời gọi Gemini sinh JSON nhận ngữ cảnh thời gian động theo `Asia/Ho_Chi_Minh` (UTC+7), dựa trên `DEFAULT_TIMEZONE` đang được cấu hình.

## Phạm vi

- Cập nhật `apps/api/src/gemini/gemini.service.ts` để chèn `nowText` và `nowIso` từ `getCurrentTimeInfo()` vào prompt OCR JSON.
- Giữ nguyên system prompt hiện có cho chat/tool calls, vì nó đã đáp ứng yêu cầu.
- Hoàn tác phần hướng dẫn thời gian cho Codex agent trong `AGENTS.md` và `.agents/rules/agent-bootstrap.md`, vì không thuộc ngữ cảnh của Gemini/JSON runtime mà anh yêu cầu.
- Cập nhật tài liệu Gemini/timezone nếu hợp đồng runtime cần được ghi nhận.

## Kiểm tra

1. Bổ sung hoặc cập nhật kiểm thử đơn vị để xác nhận prompt OCR chứa mốc thời gian hiện tại theo timezone cấu hình.
2. Chạy `npm run typecheck`, `npm run lint` và kiểm thử API liên quan.

## Rủi ro

- Rủi ro thấp: chỉ thêm bối cảnh cho lời gọi AI, không đổi schema JSON hoặc dữ liệu đã lưu.
