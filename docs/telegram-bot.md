# 💬 Giao Diện Telegram Bot & Xử Lý Tin Nhắn

Tài liệu này giải thích chi tiết tầng giao tiếp Telegram (`TelegramModule`, `TelegramUpdate`), hệ thống bảo mật Guard, cơ chế xử lý Slash Commands và các tối ưu trải nghiệm người dùng (UX) trên Telegram.

---

## 1. Tầng Telegram Bot (`TelegramModule`)

Dự án sử dụng thư viện `nestjs-telegraf` để tích hợp Telegram Bot API vào vòng đời của NestJS.
File vị trí:
- Module: [`src/telegram/telegram.module.ts`](file:///Users/datdoan/Documents/projects/telebot/src/telegram/telegram.module.ts)
- Handler & Controller: [`src/telegram/telegram.update.ts`](file:///Users/datdoan/Documents/projects/telebot/src/telegram/telegram.update.ts)

---

## 2. Phân Quyền & Bảo Mật (`AuthGuard`)

Tất cả các tin nhắn và lệnh gửi đến bot đều được kiểm soát bởi `AuthGuard` tại [`src/telegram/guards/auth.guard.ts`](file:///Users/datdoan/Documents/projects/telebot/src/telegram/guards/auth.guard.ts).

### Cơ chế hoạt động:
1. Đọc biến môi trường `TELEGRAM_ALLOWED_USER_IDS` (ví dụ: `12345678,87654321`).
2. Nếu biến này **trống**: Bot hoạt động ở chế độ Public (ai cũng có thể dùng).
3. Nếu biến có danh sách ID: Bot kiểm tra `ctx.from?.id`.
   - Nếu ID nằm trong danh sách: Cho phép xử lý.
   - Nếu ID lạ: Chặn truy cập và gửi thông báo từ chối kèm Telegram ID của người đó.

---

## 3. Hệ Thống Slash Commands

Các lệnh tắt bắt đầu bằng dấu `/` được định nghĩa trong `TelegramUpdate`:

| Lệnh | Handler | Chức Năng |
| :--- | :--- | :--- |
| `/start` | `@Start()` | Gửi tin nhắn chào mừng, giới thiệu các tính năng và hướng dẫn cơ bản. |
| `/help` | `@Help()`, `@Command('help')` | Cung cấp tài liệu mẫu câu và cách tương tác chi tiết. |
| `/today` | `@Command('today')` | Kích hoạt AI tổng hợp toàn bộ lịch hẹn & to-do trong ngày hôm nay. |
| `/week` | `@Command('week')` | Kích hoạt AI tổng hợp lịch trình và việc cần làm trong 7 ngày tới. |
| `/calendar <nội dung>` | `@Command('calendar')` | Lên lịch hẹn nhanh (VD: `/calendar Họp team lúc 15h chiều mai`). |
| `/task <nội dung>` | `@Command('task')` | Tạo to-do nhanh (VD: `/task Mua đồ siêu thị`). |

---

## 4. Xử Lý Ngôn Ngữ Tự Nhiên (`@On('text')`)

Khi người dùng nhắn bất kỳ tin nhắn tự nhiên nào không phải Slash Command, decorator `@On('text')` sẽ tiếp nhận:

```typescript
@On('text')
public async onTextMessage(@Ctx() ctx: Context): Promise<void> {
  const message = ctx.message;
  const text = message && 'text' in message ? message.text : '';
  if (!text) return;

  this.logger.log(`Received text message from ${ctx.from?.id}: "${text}"`);

  // Bọc qua withTyping để AI suy luận và gửi phản hồi an toàn
  const response = await this.withTyping(ctx, () => this.geminiService.chat(text));
  await this.sendSafeReply(ctx, response);
}
```

---

## 5. Tối Ưu Trải Nghiệm Người Dùng (UX Enhancements)

### 1. Trạng thái "Đang soạn tin..." liên tục (`withTyping`)
Telegram tự động tắt trạng thái `typing` sau 5 giây. Nếu Gemini AI hoặc Google API mất 5–10 giây để xử lý, người dùng sẽ tưởng bot bị treo.

Hàm `withTyping` tự động gửi action `typing` lặp lại mỗi **4 giây** bằng `setInterval` cho đến khi toàn bộ tác vụ hoàn tất:

```typescript
private async withTyping<T>(ctx: Context, action: () => Promise<T>): Promise<T> {
  ctx.sendChatAction('typing').catch(() => {});
  const interval = setInterval(() => {
    ctx.sendChatAction('typing').catch(() => {});
  }, 4000);

  try {
    return await action();
  } finally {
    clearInterval(interval);
  }
}
```

### 2. Gửi phản hồi an toàn & Chia nhỏ tin nhắn (`sendSafeReply`)
Hàm `sendSafeReply` giải quyết 2 lỗi phổ biến nhất của Telegram Bot:

1. **Giới hạn độ dài (Telegram Character Limit)**: Telegram giới hạn tối đa 4096 ký tự mỗi tin nhắn. `sendSafeReply` tự động chia nhỏ văn bản ở các vị trí xuống dòng (`\n`) hợp lý nếu độ dài vượt quá 4000 ký tự.
2. **Lỗi Parse Markdown**: Khi AI tạo ra câu trả lời chứa các ký tự đặc biệt chưa được escape (`_`, `*`, `[`...), Telegram sẽ ném lỗi `Bad Request: can't parse entities`. `sendSafeReply` tự động bắt lỗi và fallback gửi dạng plain-text ngay lập tức.

---

## 6. Hướng Dẫn Thêm Slash Command Mới

Ví dụ: Thêm lệnh `/note <nội dung>`:

1. Mở [`src/telegram/telegram.update.ts`](file:///Users/datdoan/Documents/projects/telebot/src/telegram/telegram.update.ts).
2. Thêm phương thức mới:

```typescript
@Command('note')
public async onNote(@Ctx() ctx: Context): Promise<void> {
  const message = ctx.message;
  const text = message && 'text' in message ? message.text : '';
  const content = text.replace(/^\/note(@\w+)?\s*/i, '').trim();

  if (!content) {
    await ctx.reply('ℹ️ Vui lòng nhập nội dung ghi chú sau lệnh:\n`/note Mua bánh mì`', {
      parse_mode: 'Markdown',
    });
    return;
  }

  const prompt = `Ghi chú nội dung sau: "${content}"`;
  const response = await this.withTyping(ctx, () => this.geminiService.chat(prompt));
  await this.sendSafeReply(ctx, response);
}
```
3. Cập nhật thông báo trong `@Help()` và `@Start()` để người dùng nhìn thấy lệnh mới.
