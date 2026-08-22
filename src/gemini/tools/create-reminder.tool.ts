import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { RemindersService } from '../../reminders/reminders.service';

export interface CreateReminderArgs {
  title: string;
  remindAt: string; // ISO 8601 string (e.g. 2026-08-23T14:30:00+07:00)
  repeatType?: 'none' | 'daily' | 'weekly';
}

@Injectable()
export class CreateReminderTool implements GeminiTool {
  private readonly logger = new Logger(CreateReminderTool.name);
  public readonly name = 'create_reminder';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Cài đặt lời nhắc nhở tự động trực tiếp trên Telegram. Bot sẽ chủ động "Ting Ting" gửi tin nhắn cho người dùng vào đúng ngày giờ được yêu cầu. Dùng khi người dùng nói: "15 phút nữa nhắc anh tắt bếp", "8h tối nay nhắc anh gọi cho mẹ", "Nhắc tớ lúc 9h sáng mai uống thuốc".',
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

      const reminder = await this.remindersService.createReminder({
        userId,
        title: payload.title,
        remindAt: targetDate,
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

      this.logger.log(
        `Created reminder "${reminder.title}" for user ${userId} at ${formattedTime}`,
      );

      return {
        success: true,
        reminderId: reminder.id,
        title: reminder.title,
        remindAt: reminder.remindAt.toISOString(),
        formattedTime,
        message: `Đã cài đặt lời nhắc "${reminder.title}" thành công. Bot sẽ chủ động nhắn tin cho bạn vào lúc ${formattedTime}.`,
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
