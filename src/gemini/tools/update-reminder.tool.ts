import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { RemindersService } from '../../reminders/reminders.service';
import { GeminiTool, ToolExecutionContext } from './tool.interface';

@Injectable()
export class UpdateReminderTool implements GeminiTool {
  public readonly name = 'update_reminder';
  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description: 'Đổi hình thức hoặc hoãn một lời nhắc.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        reminderId: { type: SchemaType.STRING },
        action: { type: SchemaType.STRING },
        notifyType: { type: SchemaType.STRING },
        minutes: { type: SchemaType.INTEGER },
      },
      required: ['reminderId', 'action'],
    },
  };
  constructor(private readonly remindersService: RemindersService) {}
  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<Record<string, unknown>> {
    const userId = context?.userId;
    if (!userId) return { success: false, error: 'Không xác định được người dùng.' };
    const id = args.reminderId as string;
    if (args.action === 'snooze')
      return {
        success: Boolean(
          await this.remindersService.snoozeReminder(id, Number(args.minutes) || 15),
        ),
        reminderId: id,
      };
    const type = args.notifyType as 'text' | 'call';
    if (args.action === 'set_notify_type' && (type === 'text' || type === 'call'))
      return {
        success: Boolean(await this.remindersService.updateNotifyType(id, type)),
        reminderId: id,
        notifyType: type,
      };
    return { success: false, error: 'Payload cập nhật lời nhắc không hợp lệ.' };
  }
}
