---
metadata:
  agent-artifact:
    id: docs-global-receipt-image-analysis
    type: documentation
    depends_on:
      - .agents/knowledge/global/receipt-image-analysis.md
---

# Phân tích ảnh hoá đơn và thu-chi

Bot nhận ảnh hoá đơn, bill hoặc ảnh chụp giao dịch từ Telegram. Ảnh được xử lý trong bộ nhớ ở lượt hiện tại, không lưu vào cơ sở dữ liệu và không ghi URL/nội dung ảnh vào log.

## Luồng xử lý

1. Người dùng gửi ảnh.
2. Bot chọn bản ảnh có độ phân giải cao nhất, kiểm tra giới hạn dung lượng rồi tải từ Telegram.
3. Gemini đọc ảnh và trả một trong ba trạng thái: đủ thông tin, thiếu thông tin, hoặc không phải giao dịch.
4. Khi đủ loại thu/chi, số tiền VND và mô tả, bot hiển thị thẻ **Xác nhận/Hủy**.
5. Chỉ sau khi người dùng bấm **Xác nhận**, giao dịch mới được ghi vào sổ thu-chi.

## Cấu hình và xử lý sự cố

- `RECEIPT_IMAGE_MAX_BYTES`: giới hạn dung lượng ảnh, mặc định 10 MB.
- `RECEIPT_IMAGE_TIMEOUT_MS`: thời gian tải và xử lý, mặc định 45 giây.
- Nếu ảnh mờ hoặc thiếu số tiền/loại giao dịch, bot hỏi lại; không tự đoán và không tạo giao dịch.
- Nếu không tải được ảnh, kiểm tra kết nối Telegram và gửi lại ảnh rõ hơn, nhỏ hơn 10 MB.
