---
metadata:
  agent-artifact:
    id: docs-module-auth
    type: documentation
    depends_on:
      - .agents/knowledge/modules/auth/README.md
---

# Module xác thực dashboard

`apps/web/src/modules/auth` quản lý access token ngắn hạn của dashboard sau khi người dùng mở link từ Telegram.

- `captureDashboardToken` đọc `dashboard_token` trong URL fragment, lưu vào localStorage rồi xóa fragment khỏi thanh địa chỉ.
- `clearAccessToken` được gọi khi đăng xuất hoặc khi refresh phiên thất bại.
- Không để view dashboard tự đọc/ghi token; HTTP client dùng module này để gắn Authorization header.

Khi lỗi 401, kiểm tra endpoint refresh phiên và luồng mở link từ Telegram trước khi kiểm tra UI.
