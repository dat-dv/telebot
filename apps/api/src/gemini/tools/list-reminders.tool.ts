import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { RemindersService } from '../../reminders/reminders.service';

@Injectable()
export class ListRemindersTool implements GeminiTool {
  private readonly logger = new Logger(ListRemindersTool.name);
  public readonly name = 'list_reminders';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Xem danh sách các lời nhắc nhở tự động đang chờ kích hoạt của người dùng trên Telegram. Dùng khi người dùng hỏi: "Xem danh sách lời nhắc", "Anh có lời nhắc nào không?", "Kiểm tra reminder".',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  };

  constructor(private readonly remindersService: RemindersService) {}

  public async execute(
    _args: Record<string, unknown>,
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
      const reminders = await this.remindersService.getUserUpcomingReminders(userId);

      const formattedList = reminders.map((r) => {
        const formattedTime = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          weekday: 'short',
        }).format(new Date(r.remindAt));

        return {
          id: r.id,
          title: r.title,
          remindAt: formattedTime,
          repeat: r.repeatType !== 'none' ? r.repeatType : undefined,
        };
      });

      return {
        success: true,
        count: formattedList.length,
        reminders: formattedList,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to list reminders for user ${userId}: ${error.message}`);
      return {
        success: false,
        error: `Lỗi khi lấy danh sách lời nhắc: ${error.message}`,
      };
    }
  }
}
