# Bàn giao: quy tắc Local-First

## Đã cập nhật

- Thêm rule luôn bật `local-first-processing.md` cho voice, OCR, file/media và trích xuất dữ liệu xác định được.
- Quy định thứ tự bắt buộc: xử lý cục bộ → làm sạch/kiểm tra cục bộ → chỉ gửi text tối thiểu sang AI để suy luận ngữ nghĩa.
- Cấm dùng AI chỉ để lấy text mà OCR/parser cục bộ có thể làm; raw media gửi sang AI phải có ngoại lệ được ghi nhận.
- Giữ nguyên yêu cầu xác nhận, phân quyền và validation trước mọi thay đổi dữ liệu.
- Đồng bộ bootstrap, core rule, sidecar review và cặp knowledge/docs Việt-Anh.
- Ghi nhận luồng ảnh trực tiếp Gemini là nợ kỹ thuật cần chuyển sang OCR cục bộ; không được mở rộng.

## Xác minh

- `npm run agent-system:validate`: đạt (71 artifacts, 128 dependencies, 53 pairs, 1 imports, 0 cyclic dependency groups).
- `git diff --check`: đạt.
