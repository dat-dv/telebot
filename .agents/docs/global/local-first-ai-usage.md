---
metadata:
  agent-artifact:
    id: docs-global-local-first-ai-usage
    type: documentation
    depends_on:
      - .agents/knowledge/global/local-first-ai-usage.md
      - .agents/rules/local-first-processing.md
---

# Quy tắc xử lý cục bộ trước AI

Mục tiêu của quy tắc này là tiết kiệm token, giảm dữ liệu gửi ra ngoài và giữ hệ thống ổn định. Khi xử lý voice, ảnh, tài liệu hoặc file, lập trình viên phải ưu tiên công cụ chạy cục bộ trước.

## Thứ tự bắt buộc

1. Dùng thư viện, model, CLI hoặc dịch vụ nội bộ đã cài.
2. Làm sạch và kiểm tra kết quả tại chỗ.
3. Chỉ gửi phần text tối thiểu cho AI nếu cần hiểu ngữ cảnh, phân loại hoặc tóm tắt.
4. Chỉ gửi file/ảnh gốc cho AI khi xử lý cục bộ không đáp ứng, có lý do được ghi nhận và người dùng đã chấp thuận nếu tăng chi phí hoặc phạm vi dữ liệu gửi ra ngoài.

## Áp dụng thực tế

- Voice phải dùng Whisper cục bộ trước; Gemini chỉ nhận transcript đã được người dùng duyệt.
- OCR ảnh, hoá đơn và tài liệu phải dùng engine OCR cục bộ trước. AI chỉ dùng phần text OCR cần thiết để suy luận danh mục hay ngữ cảnh.
- Chuyển đổi file, đọc metadata, checksum, parse dữ liệu và trích xuất text không được gọi AI mặc định.
- Kết quả OCR hoặc AI không được tự ghi dữ liệu. Các nút xác nhận, phân quyền và validation hiện có vẫn bắt buộc.

## Ngoại lệ và backlog

Mọi ngoại lệ phải ghi rõ: công cụ cục bộ nào thiếu/không đáp ứng, phần dữ liệu tối thiểu gửi ra ngoài, chi phí dự kiến và fallback. Không tự cài package, tải model ngôn ngữ hoặc đổi Docker image nếu chưa có kế hoạch được duyệt.

Luồng ảnh hoá đơn dùng Tesseract OCR cục bộ trước. Gemini chỉ nhận text OCR đã làm sạch để hiểu ngữ cảnh thu-chi.
