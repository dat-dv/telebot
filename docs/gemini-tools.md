# 🤖 Gemini AI Core & Hướng Dẫn Tạo Tool (Function Calling)

Tài liệu này hướng dẫn chi tiết cách thức hoạt động của tầng AI trung tâm (`GeminiService`), cấu trúc Function Calling và danh sách toàn bộ các công cụ (Tools) tích hợp trong hệ thống.

---

## 1. Tổng Quan Về Tầng AI (`GeminiService`)

Trái tim của trợ lý AI nằm tại [`src/gemini/gemini.service.ts`](file:///Users/datdoan/Documents/projects/telebot/src/gemini/gemini.service.ts). Dịch vụ này đảm nhiệm các nhiệm vụ quan trọng:

1. **Khởi tạo SDK Google Generative AI**: Sử dụng API Key và Model được cấu hình qua biến môi trường (`GEMINI_API_KEY`, `GEMINI_MODEL`).
2. **Neo thời gian thực tế (Realtime Timestamp Anchor)**: Chèn thời gian hiện tại (`Asia/Ho_Chi_Minh`) vào System Instruction của mỗi phiên chat.
3. **Cung cấp Function Declarations**: Đăng ký danh sách 8 tool với Gemini để AI nhận biết khi nào cần kích hoạt.
4. **Vòng lặp Function Calling đa bước (Multi-turn Tool Loop)**: Nhận yêu cầu gọi tool từ AI, thực thi code TypeScript tương ứng và gửi kết quả trả lại để AI tổng hợp câu trả lời cuối cùng.
5. **Fallback Model thông minh**: Tự động chuyển đổi giữa danh sách model dự phòng nếu model chính gặp sự cố quota hoặc timeout.

---

## 2. Danh Sách 10 Công Cụ AI Đang Hoạt Động

| STT | Tên Tool (Function Name) | Class Triển Khai | Chức Năng & Quyền Hạn |
| :--- | :--- | :--- | :--- |
| 1 | `create_calendar_event` | `CreateCalendarTool` | Tạo lịch hẹn Google Calendar + 4 mốc chuông popup báo dồn dập `[60p, 30p, 10p, 0p]`. |
| 2 | `list_calendar_events` | `ListCalendarTool` | Tra cứu, xem danh sách sự kiện lịch trong ngày, tuần, tháng. |
| 3 | `delete_calendar_event` | `DeleteCalendarTool` | Tìm và xóa sự kiện trên Google Calendar. |
| 4 | `create_task` | `CreateTaskTool` | Tạo công việc To-Do mới trên Google Tasks có deadline. |
| 5 | `list_tasks` | `ListTasksTool` | Tra cứu danh sách việc cần làm (chưa hoàn thành / tất cả). |
| 6 | `complete_task` | `CompleteTaskTool` | Đánh dấu hoàn thành việc cần làm trên Google Tasks. |
| 7 | `login_google` | `LoginGoogleTool` | Tạo link xác thực Google OAuth cá nhân hóa cho người dùng khi họ hỏi cách đăng nhập. |
| 8 | `create_invite_link` | `InviteUserTool` | **(Admin Only)** Cho phép Admin ra lệnh bằng văn bản để AI tạo link mời bạn bè (`t.me/bot?start=invite_...`). |
| 9 | `list_users` | `ListUsersTool` | **(Admin Only)** Cho phép Admin hỏi AI danh sách thành viên/người dùng và trạng thái kết nối Google. |
| 10 | `ban_user` | `BanUserTool` | **(Admin Only)** Cho phép Admin ra lệnh cho AI khóa tài khoản và xóa token Google của một Telegram ID. |

---

## 3. Interface Chuẩn Của Một Tool (`GeminiTool`)

Mọi công cụ mà Gemini có thể gọi đều phải triển khai interface `GeminiTool` tại [`src/gemini/tools/tool.interface.ts`](file:///Users/datdoan/Documents/projects/telebot/src/gemini/tools/tool.interface.ts):

```typescript
import { FunctionDeclaration } from '@google/generative-ai';

export interface ToolExecutionContext {
  userId?: number;
}

export interface GeminiTool {
  readonly name: string;
  readonly declaration: FunctionDeclaration;
  execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>>;
}
```

---

## 4. Hướng Dẫn Từng Bước Tạo Tool Mới

Ví dụ: Chúng ta muốn tạo một công cụ **Gửi Email qua Gmail** (`send_email`).

### Bước 1: Tạo file Tool mới trong `src/gemini/tools/`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { GoogleGmailService } from '../../google/google-gmail.service';

@Injectable()
export class SendEmailTool implements GeminiTool {
  private readonly logger = new Logger(SendEmailTool.name);
  public readonly name = 'send_email';

  public readonly declaration: FunctionDeclaration = {
    name: 'send_email',
    description: 'Gửi email qua tài khoản Gmail của người dùng.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        to: { type: SchemaType.STRING, description: 'Địa chỉ email người nhận' },
        subject: { type: SchemaType.STRING, description: 'Tiêu đề email' },
        body: { type: SchemaType.STRING, description: 'Nội dung email' },
      },
      required: ['to', 'subject', 'body'],
    },
  };

  constructor(private readonly gmailService: GoogleGmailService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    const { to, subject, body } = args as { to: string; subject: string; body: string };
    const success = await this.gmailService.sendEmail(to, subject, body, context?.userId);
    return { success, message: `Đã gửi email thành công tới ${to}` };
  }
}
```

### Bước 2: Đăng ký Tool trong `GeminiModule` & `GeminiService`
1. Thêm `SendEmailTool` vào mảng `providers` của `GeminiModule`.
2. Inject `SendEmailTool` vào constructor của `GeminiService` và thêm vào mảng `tools`.
