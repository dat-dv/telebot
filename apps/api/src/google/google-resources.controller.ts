import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { type ITaskListItem } from '@telebot/contracts';
import { type tasks_v1 } from 'googleapis';
import { getDashboardUserId } from '../dashboard-auth/dashboard-user';
import { ReportsTokenService } from '../reports/reports-token.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleTasksService } from './google-tasks.service';

@ApiTags('Google Workspace (Calendar & Tasks)')
@ApiBearerAuth('bearer-jwt')
@Controller()
export class GoogleResourcesController {
  constructor(
    private readonly calendar: GoogleCalendarService,
    private readonly tasks: GoogleTasksService,
    private readonly tokens: ReportsTokenService,
  ) {}

  @Get('calendar/events')
  @ApiOperation({ summary: 'Lấy danh sách sự kiện Google Calendar' })
  async listEvents(@Req() req: Request, @Query() query: Record<string, string | undefined>) {
    return {
      data: await this.calendar.listEvents(
        {
          timeMin: query.timeMin,
          timeMax: query.timeMax,
          query: query.query,
          maxResults: query.maxResults ? this.limit(query.maxResults) : undefined,
        },
        this.userId(req),
      ),
    };
  }
  @Get('calendar/events/:id')
  async getEvent(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.calendar.getEvent(id, this.userId(req)) };
  }
  @Post('calendar/events')
  async createEvent(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return { data: await this.calendar.createEvent(this.eventInput(body), this.userId(req)) };
  }
  @Patch('calendar/events/:id')
  async updateEvent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.calendar.updateEvent(id, this.eventInput(body, true), this.userId(req)),
    };
  }
  @Delete('calendar/events/:id')
  async deleteEvent(@Req() req: Request, @Param('id') id: string) {
    await this.calendar.deleteEvent(id, this.userId(req));
    return { data: { deleted: true } };
  }

  @Get('tasks')
  async listTasks(@Req() req: Request, @Query() query: Record<string, string | undefined>) {
    const showCompleted = query.showCompleted === undefined ? true : query.showCompleted === 'true';
    const showHidden = query.showHidden === undefined ? showCompleted : query.showHidden === 'true';
    const items = await this.tasks.listTasks(
      {
        taskListId: query.taskListId,
        showCompleted,
        showHidden,
        dueMin: query.dueMin,
        dueMax: query.dueMax,
        maxResults: query.maxResults ? this.limit(query.maxResults) : 100,
      },
      this.userId(req),
    );
    return {
      data: items.map((item) => this.mapTaskToListItem(item)),
    };
  }
  @Get('tasks/:id')
  async getTask(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('taskListId') taskListId?: string,
  ) {
    const item = await this.tasks.getTask(id, taskListId, this.userId(req));
    return { data: this.mapTaskToListItem(item) };
  }
  @Post('tasks')
  async createTask(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const item = await this.tasks.createTask(this.taskInput(body), this.userId(req));
    return { data: this.mapTaskToListItem(item) };
  }
  @Patch('tasks/:id')
  async updateTask(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const item = await this.tasks.updateTask(
      id,
      this.taskInput(body, true),
      this.optional(body.taskListId),
      this.userId(req),
    );
    return {
      data: this.mapTaskToListItem(item),
    };
  }
  @Delete('tasks/:id')
  async deleteTask(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('taskListId') taskListId?: string,
  ) {
    await this.tasks.deleteTask(id, taskListId, this.userId(req));
    return { data: { deleted: true } };
  }

  private mapTaskToListItem(item: tasks_v1.Schema$Task): ITaskListItem {
    return {
      id: item.id || item.title || 'task',
      title: item.title || 'Không có tiêu đề',
      notes: item.notes || undefined,
      dueAt: item.due || undefined,
      status: (item.status as 'needsAction' | 'completed') || 'needsAction',
      updatedAt: item.updated || undefined,
      completedAt: item.completed || undefined,
    };
  }

  private userId(req: Request) {
    return getDashboardUserId(req, this.tokens);
  }
  private text(value: unknown, name: string) {
    if (typeof value !== 'string' || !value.trim())
      throw new BadRequestException(`${name} is required.`);
    return value.trim();
  }
  private optional(value: unknown) {
    return value === undefined || value === null ? undefined : this.text(value, 'value');
  }
  private date(value: unknown, name: string) {
    const result = this.text(value, name);
    if (Number.isNaN(new Date(result).getTime()))
      throw new BadRequestException(`${name} is invalid.`);
    return result;
  }
  private limit(value: string) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 100)
      throw new BadRequestException('maxResults is invalid.');
    return number;
  }
  private eventInput(body: Record<string, unknown>, partial = false) {
    return {
      summary:
        body.summary === undefined && partial ? undefined : this.text(body.summary, 'summary'),
      description: this.optional(body.description),
      startDateTime:
        body.startDateTime === undefined && partial
          ? undefined
          : this.date(body.startDateTime, 'startDateTime'),
      endDateTime:
        body.endDateTime === undefined && partial
          ? undefined
          : this.date(body.endDateTime, 'endDateTime'),
      location: this.optional(body.location),
      timeZone: this.optional(body.timeZone),
    };
  }
  private taskInput(body: Record<string, unknown>, partial = false) {
    return {
      title: body.title === undefined && partial ? undefined : this.text(body.title, 'title'),
      notes: this.optional(body.notes),
      due: body.due === undefined ? undefined : this.date(body.due, 'due'),
      taskListId: this.optional(body.taskListId),
      status: body.status === undefined ? undefined : this.status(body.status),
    };
  }
  private status(value: unknown): 'needsAction' | 'completed' {
    if (value === 'needsAction' || value === 'completed') return value;
    throw new BadRequestException('status is invalid.');
  }
}
