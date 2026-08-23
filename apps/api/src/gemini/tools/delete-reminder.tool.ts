import { Injectable, Logger } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { RemindersService } from '../../reminders/reminders.service';

export interface DeleteReminderArgs {
  reminderId?: string;
  query?: string;
}

@Injectable()
export class DeleteReminderTool implements GeminiTool {
  private readonly logger = new Logger(DeleteReminderTool.name);
  public readonly name = 'delete_reminder';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Hủy hoặc xóa một lời nhắc nhở tự động trên Telegram. Dùng khi người dùng nói: "Hủy lời nhắc tắt bếp", "Xóa reminder uống thuốc", "Hủy nhắc nhở lúc 8h".',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        reminderId: {
          type: SchemaType.STRING,
          description: 'ID của lời nhắc cần xóa (nếu biết)',
        },
        query: {
          type: SchemaType.STRING,
          description: 'Từ khóa tìm kiếm tiêu đề lời nhắc cần xóa (VD: "tắt bếp", "uống thuốc")',
        },
      },
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
      const payload = args as unknown as DeleteReminderArgs;

      // 1. If reminderId provided directly
      if (payload.reminderId) {
        const deleted = await this.remindersService.deleteReminder(payload.reminderId, userId);
        return {
          success: deleted,
          message: deleted
            ? 'Đã hủy lời nhắc thành công.'
            : `Không tìm thấy lời nhắc với ID "${payload.reminderId}".`,
        };
      }

      // 2. If query keyword provided, find matching reminder
      const query = (payload.query || '').toLowerCase().trim();
      const userReminders = await this.remindersService.getUserUpcomingReminders(userId);

      const matched = userReminders.find((r) => r.title.toLowerCase().includes(query));
      if (!matched) {
        return {
          success: false,
          error: `Không tìm thấy lời nhắc nào khớp với từ khóa "${query}".`,
        };
      }

      const deleted = await this.remindersService.deleteReminder(matched.id, userId);
      return {
        success: deleted,
        message: `Đã hủy lời nhắc "${matched.title}" thành công.`,
      };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to delete reminder: ${error.message}`);
      return {
        success: false,
        error: `Lỗi khi hủy lời nhắc: ${error.message}`,
      };
    }
  }
}
