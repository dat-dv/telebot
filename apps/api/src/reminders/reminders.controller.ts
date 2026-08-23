import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { getDashboardUserId } from '../dashboard-auth/dashboard-user';
import { ReportsTokenService } from '../reports/reports-token.service';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly reminders: RemindersService,
    private readonly tokens: ReportsTokenService,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    return { data: await this.reminders.getUserUpcomingReminders(this.userId(req)) };
  }

  @Get(':id')
  async get(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.required(this.reminders.getUserReminder(this.userId(req), id)) };
  }

  @Post()
  async create(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return {
      data: await this.reminders.createReminder({
        userId: this.userId(req),
        title: this.text(body.title, 'title'),
        remindAt: this.date(body.remindAt),
        notifyType: this.notify(body.notifyType),
        repeatType: this.repeat(body.repeatType),
      }),
    };
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return {
      data: await this.required(
        this.reminders.updateReminder(this.userId(req), id, {
          title: body.title === undefined ? undefined : this.text(body.title, 'title'),
          remindAt: body.remindAt === undefined ? undefined : this.date(body.remindAt),
          notifyType: body.notifyType === undefined ? undefined : this.notify(body.notifyType),
          repeatType: body.repeatType === undefined ? undefined : this.repeat(body.repeatType),
        }),
      ),
    };
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    if (!(await this.reminders.deleteReminder(id, this.userId(req)))) throw new NotFoundException();
    return { data: { deleted: true } };
  }

  private userId(req: Request) {
    return getDashboardUserId(req, this.tokens);
  }
  private async required<T>(value: Promise<T | null>): Promise<T> {
    const result = await value;
    if (!result) throw new NotFoundException();
    return result;
  }
  private text(value: unknown, name: string) {
    if (typeof value !== 'string' || !value.trim())
      throw new BadRequestException(`${name} is required.`);
    return value.trim();
  }
  private date(value: unknown) {
    const parsed = new Date(this.text(value, 'remindAt'));
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException('remindAt is invalid.');
    return parsed;
  }
  private notify(value: unknown): 'text' | 'call' | undefined {
    if (value === undefined) return undefined;
    if (value === 'text' || value === 'call') return value;
    throw new BadRequestException('notifyType is invalid.');
  }
  private repeat(value: unknown): 'none' | 'daily' | 'weekly' | undefined {
    if (value === undefined) return undefined;
    if (value === 'none' || value === 'daily' || value === 'weekly') return value;
    throw new BadRequestException('repeatType is invalid.');
  }
}
