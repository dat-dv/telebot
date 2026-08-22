import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthService } from './google-auth.service';

export interface CreateEventOptions {
  summary: string;
  description?: string;
  startDateTime: string; // ISO String (e.g. 2026-08-23T09:00:00+07:00)
  endDateTime: string; // ISO String (e.g. 2026-08-23T10:00:00+07:00)
  location?: string;
  reminderMinutes?: number[];
  timeZone?: string;
}

export interface ListEventsOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  query?: string;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly authService: GoogleAuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCalendarClient(): calendar_v3.Calendar {
    const auth = this.authService.getOAuth2Client();
    if (!auth || !this.authService.isAuthorized()) {
      throw new Error(
        'Google Calendar chưa được xác thực. Hãy đảm bảo bạn đã cung cấp gcp-oauth.keys.json và chạy "npm run auth".',
      );
    }
    return google.calendar({ version: 'v3', auth });
  }

  public async listEvents(options: ListEventsOptions = {}): Promise<calendar_v3.Schema$Event[]> {
    const calendar = this.getCalendarClient();
    const timeZone = this.configService.get<string>('timezone', 'Asia/Ho_Chi_Minh');

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax,
      maxResults: options.maxResults || 20,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone,
      q: options.query,
    });

    return res.data.items || [];
  }

  public async createEvent(options: CreateEventOptions): Promise<calendar_v3.Schema$Event> {
    const calendar = this.getCalendarClient();
    const defaultTimeZone = this.configService.get<string>('timezone', 'Asia/Ho_Chi_Minh');
    const timeZone = options.timeZone || defaultTimeZone;

    // Multi-Reminder 4 mốc: 60p, 30p, 10p, 0p
    const reminderMinutes =
      options.reminderMinutes && options.reminderMinutes.length > 0
        ? options.reminderMinutes
        : [60, 30, 10, 0];

    const overrides = reminderMinutes.map((minutes) => ({
      method: 'popup',
      minutes,
    }));

    const eventPayload: calendar_v3.Schema$Event = {
      summary: options.summary,
      description: options.description,
      location: options.location,
      start: {
        dateTime: options.startDateTime,
        timeZone,
      },
      end: {
        dateTime: options.endDateTime,
        timeZone,
      },
      reminders: {
        useDefault: false,
        overrides,
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventPayload,
    });

    this.logger.log(`Created Google Calendar event: "${options.summary}" (ID: ${res.data.id})`);
    return res.data;
  }

  public async deleteEvent(eventId: string): Promise<boolean> {
    const calendar = this.getCalendarClient();
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    this.logger.log(`Deleted Google Calendar event: ${eventId}`);
    return true;
  }

  public async getEvent(eventId: string): Promise<calendar_v3.Schema$Event> {
    const calendar = this.getCalendarClient();
    const res = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });
    return res.data;
  }
}
