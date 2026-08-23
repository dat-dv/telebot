---
RequestFeedback: true
---

# Kế hoạch: quy tắc Local-First, hạn chế tiêu thụ token AI

## Mục tiêu

Đưa vào quy tắc dự án nguyên tắc bắt buộc **Local-First**: ưu tiên thư viện/dịch vụ chạy cục bộ cho các tác vụ xác định được (nhận diện giọng nói, OCR ảnh/tài liệu, trích xuất metadata, chuyển đổi tệp). AI chỉ được dùng ở bước hiểu ngữ nghĩa mà xử lý cục bộ không giải quyết được.

## Bằng chứng hiện trạng

- Voice đã tuân thủ Local-First: `whisper.cpp` được build trong Docker và phiên âm trước khi transcript đi tới Gemini.
- `tesseract.js` không có trong `package.json` hoặc `package-lock.json` hiện tại.
- Luồng ảnh mới đang gửi ảnh trực tiếp tới Gemini để đọc hoá đơn, nên không phù hợp với quy tắc mới nếu không bổ sung OCR cục bộ trước.

## Thay đổi dự kiến

1. Thêm rule `local-first-processing.md` trong `.agents/rules/`:
   - Phân loại tác vụ: local bắt buộc, local ưu tiên và AI được phép.
   - Với voice/OCR: bắt buộc dùng công cụ cục bộ đã có; không gửi file thô lên mô hình chỉ để lấy text.
   - AI chỉ nhận text OCR đã làm sạch, tối thiểu cần thiết, khi cần phân loại/ngữ cảnh/tóm tắt.
   - Mọi thao tác thay đổi dữ liệu tiếp tục cần xác nhận người dùng độc lập với kết quả OCR/AI.
   - Ngoại lệ phải nêu lý do kỹ thuật, giới hạn dữ liệu gửi, chi phí token và phương án fallback.
2. Cập nhật `agent-bootstrap.md`, `core.md` và registry tài liệu để quy tắc được tự động áp dụng trong các yêu cầu liên quan file/media.
3. Cập nhật canonical knowledge (English) và developer guide (Vietnamese) về chiến lược token, quyền riêng tư và luồng xử lý local-first.
4. Ghi nhận backlog bắt buộc: thay luồng ảnh trực tiếp Gemini bằng OCR cục bộ trước (Tesseract hoặc engine đã cài), sau đó chỉ đưa text OCR cho bước suy luận thu-chi khi cần. Việc cài thêm `tesseract.js`/language data chỉ thực hiện nếu anh xác nhận vì hiện dependency đó chưa có trong dự án.

## Quy tắc quyết định đề xuất

| Tác vụ | Xử lý bắt buộc trước | AI được phép dùng khi |
| --- | --- | --- |
| Voice | Whisper cục bộ | Người dùng đã duyệt transcript và cần hiểu ý định. |
| Ảnh hoá đơn/tài liệu | OCR cục bộ | Cần phân loại ngữ cảnh, chuẩn hoá danh mục, hoặc OCR thiếu cấu trúc. |
| Chuyển đổi/metadata tệp | Thư viện cục bộ | Không cần AI mặc định. |
| Câu hỏi tự nhiên, lập kế hoạch, tóm tắt | Không có equivalent local deterministic | AI là xử lý chính. |

## Rủi ro và kiểm soát

- OCR tiếng Việt cần bộ ngôn ngữ phù hợp: kiểm tra asset/model trong image Docker và báo rõ nếu thiếu.
- OCR cục bộ có thể không đọc được bill mờ: hỏi người dùng gửi ảnh rõ hơn, không tự gửi ảnh gốc sang AI nếu chưa có ngoại lệ được chấp thuận.
- Việc đổi luồng ảnh hiện tại là thay đổi hành vi độc lập, cần một kế hoạch triển khai riêng sau khi rule được áp dụng.

## Tiêu chí nghiệm thu

1. Quy tắc Local-First được load tự động và mô tả rõ thứ tự local → text tối thiểu → AI.
2. Tài liệu knowledge/docs phản ánh chính xác Whisper hiện có, tesseract chưa được khai báo trong dependency và quy trình xin chấp thuận khi cần cài thêm.
3. Không tự cài package hoặc thay đổi luồng OCR hiện tại trong hạng mục cập nhật rule này.
