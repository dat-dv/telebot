import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool } from './tool.interface';
import { GoogleCalendarService } from '../../google/google-calendar.service';

export interface DeleteCalendarArgs {
  eventId: string;
}

export interface DeleteCalendarResult extends Record<string, unknown> {
  success: boolean;
  message?: string;
  error?: string;
}

@Injectable()
export class DeleteCalendarTool implements GeminiTool {
  public readonly name = 'delete_calendar_event';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Xóa một sự kiện hoặc lịch hẹn trên Google Calendar bằng eventId. Nếu chưa có eventId, hãy gọi list_calendar_events trước để tìm đúng eventId cần xóa.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        eventId: {
          type: SchemaType.STRING,
          description: 'Mã định danh duy nhất (ID) của sự kiện trên Google Calendar cần xóa.',
        },
      },
      required: ['eventId'],
    },
  };

  constructor(private readonly calendarService: GoogleCalendarService) {}

  public async execute(args: Record<string, unknown>): Promise<DeleteCalendarResult> {
    try {
      const payload = args as unknown as DeleteCalendarArgs;
      await this.calendarService.deleteEvent(payload.eventId);
      return {
        success: true,
        message: `Đã xóa thành công sự kiện có ID: ${payload.eventId}`,
      };
    } catch (error) {
      const err = error as Error;
      const eventIdStr = typeof args['eventId'] === 'string' ? args['eventId'] : '';
      return {
        success: false,
        error: err.message || `Không thể xóa sự kiện có ID: ${eventIdStr}`,
      };
    }
  }
}
