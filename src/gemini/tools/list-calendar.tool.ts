import { Injectable } from '@nestjs/common';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { GeminiTool } from './tool.interface';
import { GoogleCalendarService } from '../../google/google-calendar.service';

export interface ListCalendarArgs {
  timeMin?: string;
  timeMax?: string;
  query?: string;
  maxResults?: number;
}

export interface CalendarEventItem {
  id?: string | null;
  summary: string;
  description?: string | null;
  location?: string | null;
  start?: string | null;
  end?: string | null;
  htmlLink?: string | null;
}

export interface ListCalendarResult extends Record<string, unknown> {
  success: boolean;
  count?: number;
  events?: CalendarEventItem[];
  error?: string;
}

@Injectable()
export class ListCalendarTool implements GeminiTool {
  public readonly name = 'list_calendar_events';

  public readonly declaration: FunctionDeclaration = {
    name: this.name,
    description:
      'Xem danh sách sự kiện, cuộc hẹn trên Google Calendar trong một khoảng thời gian nhất định (ví dụ: hôm nay, ngày mai, tuần này) hoặc tìm kiếm theo từ khóa.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        timeMin: {
          type: SchemaType.STRING,
          description:
            'Thời điểm bắt đầu tìm kiếm theo chuẩn ISO 8601 (VD: "2026-08-23T00:00:00+07:00"). Mặc định là thời điểm hiện tại.',
        },
        timeMax: {
          type: SchemaType.STRING,
          description:
            'Thời điểm kết thúc tìm kiếm theo chuẩn ISO 8601 (VD: "2026-08-23T23:59:59+07:00").',
        },
        query: {
          type: SchemaType.STRING,
          description:
            'Từ khóa tìm kiếm trong tiêu đề, mô tả hoặc địa điểm của sự kiện (tùy chọn).',
        },
        maxResults: {
          type: SchemaType.INTEGER,
          description: 'Số lượng sự kiện tối đa cần lấy (mặc định 20).',
        },
      },
    },
  };

  constructor(private readonly calendarService: GoogleCalendarService) {}

  public async execute(args: Record<string, unknown>): Promise<ListCalendarResult> {
    try {
      const payload = args as unknown as ListCalendarArgs;
      const items = await this.calendarService.listEvents({
        timeMin: payload.timeMin,
        timeMax: payload.timeMax,
        query: payload.query,
        maxResults: payload.maxResults || 20,
      });

      const events: CalendarEventItem[] = items.map((item) => ({
        id: item.id,
        summary: item.summary || '(Không có tiêu đề)',
        description: item.description,
        location: item.location,
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        htmlLink: item.htmlLink,
      }));

      return {
        success: true,
        count: events.length,
        events,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'Không thể lấy danh sách sự kiện Google Calendar',
      };
    }
  }
}
