import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { RemindersService } from '../../reminders/reminders.service';

export interface CreateReminderArgs {
  title: string;
  remindAt: string; // ISO 8601 string (e.g. 2026-08-23T14:30:00+07:00)
  notifyType?: 'text' | 'call';
  repeatType?: 'none' | 'daily' | 'weekly';
}

@Injectable()
export class CreateReminderTool implements GeminiTool {
  private readonly logger = new Logger(CreateReminderTool.name);
  public readonly name = 'create_reminder';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Cài đặt lời nhắc nhở tự động trực tiếp trên Telegram hỗ trợ 2 chế độ: Nhắn tin (text) hoặc Gọi nhá máy (call). Dùng khi người dùng nói: "15 phút nữa nhắc anh tắt bếp", "8h tối nay gọi điện nhắc anh uống thuốc", "Gọi nhá máy nhắc tớ sau 30 phút".',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: 'Nội dung lời nhắc (VD: "Tắt bếp", "Gọi cho mẹ", "Uống thuốc")',
        },
        remindAt: {
          type: SchemaType.STRING,
          description:
            'Mốc thời gian cần nhắc theo định dạng ISO 8601 kèm múi giờ (VD: "2026-08-23T14:30:00+07:00")',
        },
        notifyType: {
          type: SchemaType.STRING,
          description:
            'Hình thức nhắc nhở: "text" (gửi tin nhắn văn bản, mặc định) hoặc "call" (gọi điện nhá máy đổ chuông Telegram).',
        },
        repeatType: {
          type: SchemaType.STRING,
          description: 'Lặp lại lời nhắc: "none", "daily", "weekly" (mặc định "none")',
        },
      },
      required: ['title', 'remindAt'],
    },
  };

  constructor(private readonly remindersService: RemindersService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    const userId = context?.userId;
    if (!userId) {
      return {
        success: false,
        error: 'Không xác định được danh tính người dùng Telegram.',
      };
    }

    try {
      const payload = args as unknown as CreateReminderArgs;
      const targetDate = new Date(payload.remindAt);

      if (isNaN(targetDate.getTime())) {
        return {
          success: false,
          error: `Mốc thời gian "${payload.remindAt}" không hợp lệ.`,
        };
      }

      if (targetDate.getTime() < Date.now() - 60000) {
        return {
          success: false,
          error: 'Thời gian nhắc nhở phải ở trong tương lai.',
        };
      }

      const notifyType = payload.notifyType === 'call' ? 'call' : 'text';

      const reminder = await this.remindersService.createReminder({
        userId,
        title: payload.title,
        remindAt: targetDate,
        notifyType,
        repeatType: payload.repeatType || 'none',
      });

      const formattedTime = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        weekday: 'short',
      }).format(targetDate);

      const typeLabel =
        notifyType === 'call' ? 'Gọi điện nhá máy (CallMe)' : 'Gửi tin nhắn (TextMe)';

      this.logger.log(
        `Created reminder "${reminder.title}" [${notifyType.toUpperCase()}] for user ${userId} at ${formattedTime}`,
      );

      return {
        success: true,
        reminderId: reminder.id,
        title: reminder.title,
        remindAt: reminder.remindAt.toISOString(),
        notifyType,
        formattedTime,
        message: `Đã cài đặt lời nhắc "${reminder.title}" (${typeLabel}) thành công. Bot sẽ nhắc bạn vào lúc ${formattedTime}.`,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to create reminder: ${error.message}`);
      return {
        success: false,
        error: `Lỗi khi cài đặt lời nhắc: ${error.message}`,
      };
    }
  }
}
