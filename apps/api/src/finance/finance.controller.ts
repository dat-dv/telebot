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
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { getDashboardUserId } from '../dashboard-auth/dashboard-user';
import { ReportsTokenService } from '../reports/reports-token.service';
import { FinanceService } from './finance.service';

type RecordBody = Record<string, unknown>;

@Controller()
export class FinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly tokens: ReportsTokenService,
  ) {}

  @Get('transactions')
  async listTransactions(@Req() req: Request, @Query('type') type?: 'income' | 'expense') {
    return { data: await this.finance.listTransactions(this.userId(req), type) };
  }

  @Get('transactions/:id')
  async getTransaction(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.required(this.finance.getTransaction(this.userId(req), id)) };
  }

  @Post('transactions')
  async createTransaction(@Req() req: Request, @Body() body: RecordBody) {
    return {
      data: await this.finance.createTransaction({
        ...this.transactionInput(body),
        userId: this.userId(req),
      }),
    };
  }

  @Patch('transactions/:id')
  async updateTransaction(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.required(
        this.finance.updateTransaction(this.userId(req), id, this.transactionInput(body, true)),
      ),
    };
  }

  @Delete('transactions/:id')
  async deleteTransaction(@Req() req: Request, @Param('id') id: string) {
    if (!(await this.finance.deleteTransaction(this.userId(req), id)))
      throw new NotFoundException();
    return { data: { deleted: true } };
  }

  @Get('contacts/:id')
  async getContact(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.required(this.finance.getContact(this.userId(req), id)) };
  }

  @Post('contacts')
  async createContact(@Req() req: Request, @Body() body: RecordBody) {
    return {
      data: await this.finance.createContact(
        this.userId(req),
        this.string(body.displayName, 'displayName'),
        this.optionalString(body.alias),
      ),
    };
  }

  @Patch('contacts/:id')
  async updateContact(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.finance.updateContact(
        this.userId(req),
        id,
        this.string(body.displayName, 'displayName'),
        this.optionalString(body.alias),
      ),
    };
  }

  @Delete('contacts/:id')
  async deleteContact(@Req() req: Request, @Param('id') id: string) {
    if (!(await this.finance.deleteContact(this.userId(req), id))) throw new NotFoundException();
    return { data: { deleted: true } };
  }

  @Get('debts/:id')
  async getDebt(@Req() req: Request, @Param('id') id: string) {
    return { data: await this.required(this.finance.getDebt(this.userId(req), id)) };
  }

  @Post('debts')
  async createDebt(@Req() req: Request, @Body() body: RecordBody) {
    const direction = this.enum(body.direction, ['receivable', 'payable'] as const, 'direction');
    return {
      data: await this.finance.createDebt({
        userId: this.userId(req),
        direction,
        counterparty: this.string(body.counterparty, 'counterparty'),
        counterpartyAlias: this.optionalString(body.counterpartyAlias),
        contactId: this.optionalString(body.contactId),
        createNewContact: body.createNewContact === true,
        amount: this.number(body.amount, 'amount'),
        note: this.optionalString(body.note),
        dueAt: this.optionalString(body.dueAt),
      }),
    };
  }

  @Patch('debts/:id')
  async updateDebt(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.required(
        this.finance.updateDebt(this.userId(req), id, {
          direction:
            body.direction === undefined
              ? undefined
              : this.enum(body.direction, ['receivable', 'payable'] as const, 'direction'),
          amount: body.amount === undefined ? undefined : this.number(body.amount, 'amount'),
          note: this.optionalString(body.note),
          dueAt: this.optionalString(body.dueAt),
        }),
      ),
    };
  }

  @Post('debts/:id/payments')
  async recordPayment(@Req() req: Request, @Param('id') id: string, @Body() body: RecordBody) {
    return {
      data: await this.finance.recordDebtPayment(
        this.userId(req),
        id,
        this.number(body.amount, 'amount'),
      ),
    };
  }

  @Delete('debts/:id')
  async deleteDebt(@Req() req: Request, @Param('id') id: string) {
    if (!(await this.finance.deleteDebt(this.userId(req), id))) throw new NotFoundException();
    return { data: { deleted: true } };
  }

  private userId(req: Request): number {
    return getDashboardUserId(req, this.tokens);
  }
  private async required<T>(result: Promise<T | null>): Promise<T> {
    const value = await result;
    if (!value) throw new NotFoundException();
    return value;
  }
  private string(value: unknown, name: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new BadRequestException(`${name} is required.`);
    return value.trim();
  }
  private optionalString(value: unknown): string | undefined {
    return value === undefined || value === null ? undefined : this.string(value, 'value');
  }
  private number(value: unknown, name: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0)
      throw new BadRequestException(`${name} must be a positive number.`);
    return parsed;
  }
  private enum<T extends readonly string[]>(value: unknown, values: T, name: string): T[number] {
    if (typeof value !== 'string' || !values.includes(value))
      throw new BadRequestException(`${name} is invalid.`);
    return value;
  }
  private transactionInput(body: RecordBody, partial = false) {
    return {
      type:
        body.type === undefined && partial
          ? undefined
          : this.enum(body.type, ['income', 'expense'] as const, 'type'),
      amount: body.amount === undefined && partial ? undefined : this.number(body.amount, 'amount'),
      category: this.optionalString(body.category),
      note: body.note === undefined && partial ? undefined : this.string(body.note, 'note'),
      occurredAt: this.optionalString(body.occurredAt),
    };
  }
}
