import { Controller, Get, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { calendar_v3, tasks_v1 } from 'googleapis';
import { AuditService } from '../audit/audit.service';
import { FinanceService } from '../finance/finance.service';
import { GoogleAuthService } from '../google/google-auth.service';
import { GoogleCalendarService } from '../google/google-calendar.service';
import { GoogleTasksService } from '../google/google-tasks.service';
import { RemindersService } from '../reminders/reminders.service';
import { UsersService } from '../users/users.service';
import { ReportsTokenService } from './reports-token.service';

@Controller()
export class ReportsController {
  constructor(
    private readonly config: ConfigService,
    private readonly finance: FinanceService,
    private readonly audit: AuditService,
    private readonly googleAuth: GoogleAuthService,
    private readonly calendar: GoogleCalendarService,
    private readonly tasks: GoogleTasksService,
    private readonly reminders: RemindersService,
    private readonly users: UsersService,
    private readonly tokens: ReportsTokenService,
  ) {}

  @Get('access')
  public async access(@Query('token') token: string, @Res() res: Response): Promise<void> {
    const userId = await this.tokens.consumeExchangeToken(token);
    const access = this.tokens.issueAccessToken(userId);
    const refresh = this.tokens.issueRefreshToken(userId);
    this.setRefreshCookie(res, refresh.token);
    const webOrigin = this.config.get<string>('webOrigin', '').replace(/\/+$/, '');
    const appUrl = this.config.get<string>('appUrl', '').replace(/\/+$/, '');
    res.redirect(
      `${webOrigin || appUrl}/reports#dashboard_token=${encodeURIComponent(access.token)}`,
    );
  }

  @Get('dashboard')
  public async dashboard(@Req() req: Request) {
    const userId = this.getAccessUserId(req);
    const now = new Date();
    const startAt = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const googleConnected = this.googleAuth.isAuthorized(userId);
    const calendarPromise = this.getCalendarEvents(googleConnected, userId, now);
    const tasksPromise = this.getTasks(googleConnected, userId);
    const [summary, debts, reminders, activity, calendar, tasks] = await Promise.all([
      this.finance.getSummary(userId, startAt, endAt),
      this.finance.getActiveDebts(userId),
      this.reminders.getUserUpcomingReminders(userId),
      this.audit.listRecent(userId, 10),
      calendarPromise,
      tasksPromise,
    ]);
    const receivable = debts
      .filter((item) => item.direction === 'receivable')
      .reduce((total, item) => total + item.remainingAmount, 0);
    const payable = debts
      .filter((item) => item.direction === 'payable')
      .reduce((total, item) => total + item.remainingAmount, 0);
    const isAdmin = this.users.isAdmin(userId);
    return {
      data: {
        user: { name: userId.toString(), isAdmin, googleConnected },
        finance: {
          income: summary.income,
          expense: summary.expense,
          balance: summary.balance,
          receivable,
          payable,
        },
        transactions: summary.transactions.slice(0, 20).map((item) => ({
          id: item.id,
          type: item.type,
          category: item.category,
          note: item.note,
          amount: item.amount,
          occurredAt: item.occurredAt.toISOString(),
        })),
        debts: debts.map((item) => ({
          id: item.id,
          direction: item.direction,
          counterparty: item.counterparty,
          remainingAmount: item.remainingAmount,
          dueAt: item.dueAt?.toISOString(),
        })),
        calendar: calendar.map((item) => ({
          id: item.id || item.etag || item.summary || 'event',
          title: item.summary || 'Không có tiêu đề',
          startAt: item.start?.dateTime || item.start?.date || undefined,
        })),
        tasks: tasks.map((item) => ({
          id: item.id || item.title || 'task',
          title: item.title || 'Không có tiêu đề',
          dueAt: item.due || undefined,
        })),
        reminders: reminders.slice(0, 10).map((item) => ({
          id: item.id,
          title: item.title,
          remindAt: item.remindAt.toISOString(),
          notifyType: item.notifyType,
        })),
        activity: activity.map((item) => ({
          id: item.id,
          action: item.action,
          tableName: item.tableName,
          createdAt: item.createdAt.toISOString(),
        })),
        admin: isAdmin ? await this.getAdminSummary() : undefined,
      },
    };
  }

  @Get('contacts')
  public async contacts(@Req() req: Request) {
    const userId = this.getAccessUserId(req);
    const contacts = await this.finance.listContacts(userId);
    return {
      data: contacts.map((contact) => ({
        id: contact.id,
        displayName: contact.displayName,
        alias: contact.alias,
        descriptor: contact.descriptor,
        createdAt: contact.createdAt.toISOString(),
      })),
    };
  }

  @Get('debts')
  public async debts(@Req() req: Request) {
    const userId = this.getAccessUserId(req);
    const debts = await this.finance.getActiveDebts(userId);
    return {
      data: debts.map((debt) => ({
        id: debt.id,
        direction: debt.direction,
        counterparty: debt.counterparty,
        counterpartyAlias: debt.counterpartyAlias,
        originalAmount: debt.originalAmount,
        remainingAmount: debt.remainingAmount,
        note: debt.note || undefined,
        dueAt: debt.dueAt?.toISOString(),
        createdAt: debt.createdAt.toISOString(),
      })),
    };
  }

  @Get('expenses')
  public async expenses(@Req() req: Request) {
    const userId = this.getAccessUserId(req);
    const expenses = await this.finance.listExpenses(userId);
    return {
      data: expenses.map((expense) => ({
        id: expense.id,
        category: expense.category,
        note: expense.note,
        amount: expense.amount,
        occurredAt: expense.occurredAt.toISOString(),
      })),
    };
  }

  @Post('refresh')
  public refresh(@Req() req: Request, @Res() res: Response): void {
    const refreshToken = this.getCookie(req, 'reports_refresh');
    if (!refreshToken) throw new UnauthorizedException();
    const userId = this.tokens.verifyRefreshToken(refreshToken);
    const nextRefresh = this.tokens.issueRefreshToken(userId);
    const access = this.tokens.issueAccessToken(userId);
    this.setRefreshCookie(res, nextRefresh.token);
    res.json({ data: { accessToken: access.token, expiresAt: access.expiresAt } });
  }

  @Post('logout')
  public logout(@Res() res: Response): void {
    res.clearCookie('reports_refresh', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.status(204).send();
  }

  private async getAdminSummary(): Promise<{ userCount: number; googleConnectedCount: number }> {
    const users = await this.users.getUsers();
    return {
      userCount: users.length,
      googleConnectedCount: users.filter((user) => this.googleAuth.isAuthorized(Number(user.id)))
        .length,
    };
  }

  private async getCalendarEvents(
    googleConnected: boolean,
    userId: number,
    now: Date,
  ): Promise<calendar_v3.Schema$Event[]> {
    if (!googleConnected) return [];
    try {
      return await this.calendar.listEvents(
        { timeMax: new Date(now.getTime() + 7 * 86400000).toISOString(), maxResults: 10 },
        userId,
      );
    } catch {
      return [];
    }
  }

  private async getTasks(
    googleConnected: boolean,
    userId: number,
  ): Promise<tasks_v1.Schema$Task[]> {
    if (!googleConnected) return [];
    try {
      return await this.tasks.listTasks({ maxResults: 10 }, userId);
    } catch {
      return [];
    }
  }

  private getAccessUserId(req: Request): number {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return this.tokens.verifyAccessToken(token);
  }

  private getCookie(req: Request, name: string): string | undefined {
    return req.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('reports_refresh', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
