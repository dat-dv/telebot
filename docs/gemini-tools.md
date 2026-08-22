# 🤖 Gemini AI Core & Hướng Dẫn Tạo Tool (Function Calling)

Tài liệu này hướng dẫn chi tiết cách thức hoạt động của tầng AI trung tâm (`GeminiService`), cấu trúc Function Calling và quy trình từng bước để phát triển, tích hợp một công cụ (Tool) mới cho trợ lý ảo.

---

## 1. Tổng Quan Về Tầng AI (`GeminiService`)

Trái tim của trợ lý AI nằm tại [`src/gemini/gemini.service.ts`](/src/gemini/gemini.service.ts). Dịch vụ này đảm nhiệm các nhiệm vụ quan trọng:

1. **Khởi tạo SDK Google Generative AI**: Sử dụng API Key và Model được cấu hình qua biến môi trường (`GEMINI_API_KEY`, `GEMINI_MODEL`).
2. **Neo thời gian thực tế (Realtime Timestamp Anchor)**: Chèn thời gian hiện tại (`Asia/Ho_Chi_Minh`) vào System Instruction của mỗi phiên chat.
3. **Cung cấp Function Declarations**: Đăng ký danh sách toàn bộ các tool với Gemini để AI nhận biết khi nào cần kích hoạt.
4. **Vòng lặp Function Calling đa bước (Multi-turn Tool Loop)**: Nhận yêu cầu gọi tool từ AI, thực thi code TypeScript tương ứng và gửi kết quả trả lại để AI tổng hợp câu trả lời cuối cùng.
5. **Fallback Model thông minh**: Tự động chuyển đổi giữa danh sách model dự phòng nếu model chính gặp sự cố quota hoặc timeout.

---

## 2. Interface Chuẩn Của Một Tool (`GeminiTool`)

Mọi công cụ mà Gemini có thể gọi đều phải triển khai interface `GeminiTool` tại [`src/gemini/tools/tool.interface.ts`](/src/gemini/tools/tool.interface.ts):

```typescript
import { FunctionDeclaration } from '@google/generative-ai';

export interface GeminiTool {
  /**
   * Tên duy nhất của công cụ (nên dùng snake_case).
   * Ví dụ: 'create_calendar_event', 'send_email', 'search_drive'.
   */
  readonly name: string;

  /**
   * Định nghĩa JSON Schema mô tả mục đích của tool và danh sách tham số.
   */
  readonly declaration: FunctionDeclaration;

  /**
   * Phương thức thực thi logic thực tế khi AI kích hoạt tool.
   * @param args Tham số do AI truyền vào dựa trên schema declaration.
   */
  execute(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

---

## 3. Hướng Dẫn Từng Bước Tạo Tool Mới

Ví dụ: Chúng ta muốn tạo một công cụ **Gửi Email qua Gmail** (`send_email`).

### Bước 1: Tạo file Tool mới

Tạo file [`src/gemini/tools/send-email.tool.ts`](/src/gemini/tools/send-email.tool.ts):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool } from './tool.interface';
// import { GoogleGmailService } from '../../google/google-gmail.service';

export interface SendEmailArgs {
  recipient: string;
  subject: string;
  body: string;
}

export interface SendEmailResult extends Record<string, unknown> {
  success: boolean;
  message?: string;
  error?: string;
}

@Injectable()
export class SendEmailTool implements GeminiTool {
  private readonly logger = new Logger(SendEmailTool.name);
  public readonly name = 'send_email';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description: 'Gửi email cho một hoặc nhiều người nhận thông qua Gmail.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        recipient: {
          type: SchemaType.STRING,
          description: 'Địa chỉ email người nhận (VD: "nguyenvana@gmail.com")',
        },
        subject: {
          type: SchemaType.STRING,
          description: 'Tiêu đề email ngắn gọn, rõ ràng',
        },
        body: {
          type: SchemaType.STRING,
          description: 'Nội dung chi tiết của email cần gửi',
        },
      },
      required: ['recipient', 'subject', 'body'],
    },
  };

  constructor(
    // Inject service thực thi vào đây, ví dụ:
    // private readonly gmailService: GoogleGmailService,
  ) {}

  public async execute(args: Record<string, unknown>): Promise<SendEmailResult> {
    try {
      const payload = args as unknown as SendEmailArgs;
      this.logger.log(`Executing tool "${this.name}" to: ${payload.recipient}`);

      // Thực thi logic nghiệp vụ (gọi Google Gmail Service)
      // await this.gmailService.sendEmail(payload.recipient, payload.subject, payload.body);

      return {
        success: true,
        message: `Đã gửi email thành công tới ${payload.recipient} với tiêu đề "${payload.subject}".`,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error in ${this.name}: ${err.message}`, err.stack);
      return {
        success: false,
        error: err.message || 'Không thể gửi email do lỗi hệ thống.',
      };
    }
  }
}
```

### Bước 2: Đăng ký Tool trong `GeminiModule`

Mở [`src/gemini/gemini.module.ts`](/src/gemini/gemini.module.ts) và thêm `SendEmailTool` vào danh sách `providers` và `exports`:

```typescript
@Module({
  imports: [ConfigModule, GoogleModule],
  providers: [
    GeminiService,
    CreateCalendarTool,
    ListCalendarTool,
    DeleteCalendarTool,
    CreateTaskTool,
    ListTasksTool,
    CompleteTaskTool,
    SendEmailTool, // <-- Thêm vào đây
  ],
  exports: [GeminiService, SendEmailTool],
})
export class GeminiModule {}
```

### Bước 3: Đăng ký Tool trong `GeminiService`

Mở [`src/gemini/gemini.service.ts`](/src/gemini/gemini.service.ts):

1. Inject tool vào `constructor`:

```typescript
constructor(
  private readonly configService: ConfigService,
  // ... các tool hiện có
  private readonly sendEmailTool: SendEmailTool, // <-- Inject mới
) {
  // ...
  const tools: GeminiTool[] = [
    this.createCalendarTool,
    this.listCalendarTool,
    this.deleteCalendarTool,
    this.createTaskTool,
    this.listTasksTool,
    this.completeTaskTool,
    this.sendEmailTool, // <-- Thêm vào mảng khởi tạo
  ];

  for (const tool of tools) {
    this.toolsMap.set(tool.name, tool);
  }
}
```

2. (Tùy chọn) Bổ sung quy tắc nghiệp vụ vào `buildSystemInstruction()` nếu cần AI phân biệt tình huống gọi:

```typescript
=== NGUYÊN TẮC GỬI EMAIL ===
- Chỉ kích hoạt tool send_email khi người dùng chỉ định rõ email người nhận và nội dung cần gửi.
- Luôn xác nhận lại địa chỉ email người nhận trước khi gửi nếu có điểm mơ hồ.
```

---

## 4. Danh Sách Các Tool Hiện Có (Existing Tools)

| Tên Tool (`name`)       | File Implementation                                                    | Chức Năng                                                                   |
| :---------------------- | :--------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `create_calendar_event` | [`create-calendar.tool.ts`](/src/gemini/tools/create-calendar.tool.ts) | Tạo sự kiện Google Calendar mới kèm 4 mốc chuông popup.                     |
| `list_calendar_events`  | [`list-calendar.tool.ts`](/src/gemini/tools/list-calendar.tool.ts)     | Tra cứu lịch hẹn theo khoảng thời gian (`timeMin`, `timeMax`) hoặc từ khóa. |
| `delete_calendar_event` | [`delete-calendar.tool.ts`](/src/gemini/tools/delete-calendar.tool.ts) | Xóa sự kiện Calendar theo `eventId`.                                        |
| `create_task`           | [`create-task.tool.ts`](/src/gemini/tools/create-task.tool.ts)         | Tạo công việc To-Do mới trên Google Tasks, hỗ trợ gán deadline `due`.       |
| `list_tasks`            | [`list-tasks.tool.ts`](/src/gemini/tools/list-tasks.tool.ts)           | Liệt kê các việc cần làm chưa hoàn thành hoặc đã hoàn thành.                |
| `complete_task`         | [`complete-task.tool.ts`](/src/gemini/tools/complete-task.tool.ts)     | Đánh dấu task là đã xong (`status: completed`).                             |

---

## 5. Kinh Nghiệm & Best Practices Khi Viết Tool

> [!TIP]
> **1. Mô tả Parameters càng chi tiết, AI gọi càng chính xác**  
> Hãy cung cấp ví dụ cụ thể ngay trong trường `description` của schema. Ví dụ: `description: 'Thời gian bắt đầu theo định dạng ISO 8601 kèm múi giờ +07:00 (VD: "2026-08-23T14:00:00+07:00")'`.

> [!IMPORTANT]
> **2. Error Boundary an toàn**  
> Hàm `execute()` luôn luôn phải bọc trong khối `try...catch` và trả về `{ success: false, error: err.message }` thay vì `throw error`. Điều này giúp Gemini nhận diện được lỗi và giải thích một cách lịch sự, dễ hiểu cho người dùng trên Telegram.

> [!NOTE]
> **3. Độc Lập Dữ Liệu**  
> Tool chỉ đóng vai trò là "Cầu nối Dịch Schema". Toàn bộ logic tương tác API bên thứ 3 nên được đóng gói vào các Service chuyên trách trong thư mục `src/google/` hoặc các module tương ứng.
