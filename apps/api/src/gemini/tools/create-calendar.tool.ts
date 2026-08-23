import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool, ToolExecutionContext } from './tool.interface';
import { GoogleCalendarService } from '../../google/google-calendar.service';

export interface CreateCalendarArgs {
  summary: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  reminderMinutes?: number[];
}

export interface CreateCalendarResult extends Record<string, unknown> {
  success: boolean;
  message?: string;
  event?: {
    id?: string | null;
    summary?: string | null;
    start?: string | null;
    end?: string | null;
    location?: string | null;
    htmlLink?: string | null;
    reminders?: unknown;
  };
  error?: string;
}

@Injectable()
export class CreateCalendarTool implements GeminiTool {
  public readonly name = 'create_calendar_event';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Tạo sự kiện hoặc lịch hẹn mới trên Google Calendar. Sử dụng khi người dùng muốn lên lịch họp, hẹn, học, sự kiện có ngày giờ bắt đầu và kết thúc cụ thể.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        summary: {
          type: SchemaType.STRING,
          description:
            'Tiêu đề cuộc hẹn, sự kiện hoặc lịch họp (VD: "Họp team Dự án A", "Khám răng")',
        },
        startDateTime: {
          type: SchemaType.STRING,
          description:
            'Thời gian bắt đầu theo chuẩn ISO 8601 bao gồm múi giờ (VD: "2026-08-23T09:00:00+07:00")',
        },
        endDateTime: {
          type: SchemaType.STRING,
          description:
            'Thời gian kết thúc theo chuẩn ISO 8601 bao gồm múi giờ (VD: "2026-08-23T10:00:00+07:00"). Nếu không rõ thời lượng, mặc định 1 tiếng sau startDateTime.',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Mô tả chi tiết, nội dung cuộc họp hoặc ghi chú thêm',
        },
        location: {
          type: SchemaType.STRING,
          description: 'Địa điểm diễn ra sự kiện hoặc link Google Meet / Zoom',
        },
        reminderMinutes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.INTEGER,
          },
          description:
            'Danh sách số phút báo trước (VD: [60, 30, 10, 0]). Mặc định hệ thống tự động cài 4 mốc chuông dồn dập [60, 30, 10, 0] nếu bỏ trống.',
        },
      },
      required: ['summary', 'startDateTime', 'endDateTime'],
    },
  };

  constructor(private readonly calendarService: GoogleCalendarService) {}

  public async execute(
    args: Record<string, unknown>,
    context?: ToolExecutionContext,
  ): Promise<CreateCalendarResult> {
    try {
      const payload = args as unknown as CreateCalendarArgs;
      const event = await this.calendarService.createEvent(
        {
          summary: payload.summary,
          startDateTime: payload.startDateTime,
          endDateTime: payload.endDateTime,
          description: payload.description,
          location: payload.location,
          reminderMinutes: payload.reminderMinutes,
        },
        context?.userId,
      );

      return {
        success: true,
        message: `Đã tạo thành công sự kiện "${event.summary}" trên Google Calendar.`,
        event: {
          id: event.id,
          summary: event.summary,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          htmlLink: event.htmlLink,
          reminders: event.reminders,
        },
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'Không thể tạo sự kiện Google Calendar',
      };
    }
  }
}
